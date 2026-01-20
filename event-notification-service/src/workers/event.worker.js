import { Worker } from "bullmq";
import redis from "../config/redis.js";
import dotenv from "dotenv";
import connectDB from "../config/db.js";
import Event from "../modules/events/events.model.js";
import Notification from "../modules/notifications/notification.model.js";
import UserPreferences from "../modules/userPreferences/userPreferences.model.js";
import DeliveryLog from "../modules/deliveryLogs/deliveryLog.model.js";
import { getNotificationContent } from "../utils/notificationTemplates.js";

dotenv.config();
await connectDB();

const eventWorker = new Worker(
  "eventQueue",
  async (job) => {
    if (job.name !== "processEvent") return; // Ignore unknown jobs
    const { eventId } = job.data;
    const event = await Event.findById(eventId);
    if (!event) throw new Error(`Event ${eventId} not found`);
    const { eventType, payload, userId } = event;
    // 1️ Fetch preferences
    const preferences =
      (await UserPreferences.findOne({ userId })) ||
      (await UserPreferences.create({ userId }));
    // 2️ Event type enabled?
    const isEventEnabled = preferences.eventTypes.get(eventType) ?? true; // Default to true
    if (!isEventEnabled) // Skip processing
    {
      event.status = "PROCESSED";
      await event.save();
      return;
    }
    // 3️ Notification content
    const { title, message } = getNotificationContent(eventType, payload);
    // 4️ Channels
    const channels = [];
    if (preferences.channels.inApp) channels.push("IN_APP");
    if (preferences.channels.email) channels.push("EMAIL");
    if (preferences.channels.push) channels.push("PUSH");

    let successfulChannels = 0;
    // 5️ Create notifications + delivery logs
    for (const channel of channels) {
      try {
        const notification = await Notification.create({
          userId,
          eventId,
          title,
          message,
          channel,
        });
        await DeliveryLog.create({
          notificationId: notification._id,
          channel,
          status: "SUCCESS",
          attemptCount: job.attemptsMade + 1, // BullMQ attempts start from 0
        });
        successfulChannels++; // Count successful channels
      } catch (error) {
        await DeliveryLog.create({
          notificationId: null, // Notification creation failed
          channel,
          status: "FAILED",
          attemptCount: job.attemptsMade + 1,
          errorMessage: error.message,
        });
      }
    }
    // 6️ Retry if ALL channels failed
    if (successfulChannels === 0) {
      throw new Error("All notification channels failed");
    }
    // 7️ Mark event processed
    event.status = "PROCESSED";
    await event.save();
  },
  {
    connection: redis,
    attempts: 3,
    backoff: {
      type: "exponential",
      delay: 2000,
    },
  },
);

eventWorker.on("completed", (job) => {
  console.log(`Job ${job.id} completed`);
});

eventWorker.on("failed", async (job, err) => {
  console.error(`Job ${job.id} failed: ${err.message}`);
  if (job.attemptsMade >= job.opts.attempts) {
    const event = await Event.findById(job.data.eventId);
    if (event) {
      event.status = "FAILED";
      await event.save();
    }
  }
});

export default eventWorker;
