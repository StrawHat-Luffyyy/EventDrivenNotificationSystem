import { Worker } from "bullmq";
import redis from "../config/redis.js";
import Event from "../modules/events/events.model.js";
import connectDB from "../config/db.js";
import { getNotificationContent } from "../utils/notificationTemplates.js";
import UserPreferences from "../modules/userPreferences/userPreferences.model.js";
import DeliveryLog from "../modules/deliveryLogs/deliveryLog.model.js";
import dotenv from "dotenv";

dotenv.config();

await connectDB();
const eventWorker = new Worker(
  "eventQueue",
  async (job) => {
    if (job.name !== "processEvent") return;
    const { eventId } = job.data;
    const event = await Event.findById(eventId);
    if (!event) {
      throw new Error(`Event with ID ${eventId} not found`);
    }
    const { eventType, payload, userId } = event;
    // fetch preferences
    const preferences =
      (await UserPreferences.findOne({ userId })) ||
      (await UserPreferences.create({ userId }));
    //check is event type is enabled
    const isEventEnabled = preferences.eventTypes.get(eventType) ?? true;
    if (!isEventEnabled) {
      console.log(`Event ${eventType} is disabled for user ${userId}.`);
      event.status = "PROCESSED";
      await event.save();
      return;
    }
    // Notification content
    const { title, message } = getNotificationContent(eventType, payload);
    //channels to send
    const channels = [];
    if (preferences.channels.inApp) channels.push("IN_APP");
    if (preferences.channels.email) channels.push("EMAIL");
    if (preferences.channels.push) channels.push("PUSH");

    let successfulChannels = 0;
    // create notifications + logs
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
          attemptCount: 1,
        });
      } catch (error) {
        await DeliveryLog.create({
          eventId,
          channel,
          status: "FAILED",
          attemptCount: job.attemptsMade + 1,
          error: error.message,
        });
      }
    }
    //  If ALL channels failed → retry job
    if (successfulChannels === 0) {
      throw new Error("All notification channels failed");
    }
    //Marked as processed
    event.status = "PROCESSED";
    await event.save();
  },
  // Worker options
  {
    connection: redis,
    attempts: 3, // Retry up to 3 times on failure
    backoff: {
      type: "exponential",
      delay: 2000, // Initial delay of 2 seconds
    },
  },
);

eventWorker.on("completed", (job) => {
  console.log(`Job with ID ${job.id} has been completed`);
});

eventWorker.on("failed", (job, err) => {
  console.error(`Job with ID ${job.id} has failed with error: ${err.message}`);
});

export default eventWorker;
