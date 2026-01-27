import { Worker } from "bullmq";
import redis from "../config/redis.js";
import dotenv from "dotenv";
import connectDB from "../config/db.js";
import Event from "../modules/events/events.model.js";
import Notification from "../modules/notifications/notification.model.js";
import UserPreferences from "../modules/preferences/preference.model.js";
import DeliveryLog from "../modules/deliveryLogs/deliveryLog.model.js";
import { getNotificationContent } from "../utils/notificationTemplates.js";
import { getIO } from "../socket.js";

dotenv.config();
await connectDB();

const eventWorker = new Worker(
  "eventQueue",
  async (job) => {
    if (job.name !== "processEvent") return;

    const { eventId } = job.data;

    // Validate eventId
    if (!eventId) {
      throw new Error("eventId is required in job data");
    }

    const event = await Event.findById(eventId);
    if (!event) {
      throw new Error(`Event ${eventId} not found`);
    }

    const { eventType, payload, userId } = event;

    // Fetch preferences
    const preferences =
      (await UserPreferences.findOne({ userId })) ||
      (await UserPreferences.create({ userId }));

    // Event type enabled?
    const isEventEnabled = preferences.eventTypes.get(eventType) ?? true;
    if (!isEventEnabled) {
      event.status = "PROCESSED";
      await event.save();
      console.log(
        `Event ${eventId} skipped - event type ${eventType} disabled for user ${userId}`,
      );
      return;
    }

    // Notification content
    const { title, message } = getNotificationContent(eventType, payload);

    // Channels
    const channels = [];
    if (preferences.channels.inApp) channels.push("IN_APP");
    if (preferences.channels.email) channels.push("EMAIL");
    if (preferences.channels.push) channels.push("PUSH");

    // Check if any channels are enabled
    if (channels.length === 0) {
      event.status = "PROCESSED";
      await event.save();
      console.log(
        `Event ${eventId} skipped - no channels enabled for user ${userId}`,
      );
      return;
    }

    let successfulChannels = 0;
    const errors = []; // Collect errors for logging

    // Create notifications + delivery logs
    for (const channel of channels) {
      try {
        // Create notification first
        const notification = await Notification.create({
          userId,
          eventId,
          title,
          message,
          channel,
        });

        // Then create delivery log
        await DeliveryLog.create({
          notificationId: notification._id,
          channel,
          status: "SUCCESS",
          attemptCount: job.attemptsMade + 1,
        });

        successfulChannels++;

        // Real-time notification only for In-App channel
        if (channel === "IN_APP") {
          try {
            const io = getIO();
            if (io) {
              io.to(userId.toString()).emit("new_notification", {
                notificationId: notification._id,
                title,
                message,
                channel,
                createdAt: notification.createdAt,
              });
              console.log(`Socket notification sent to user ${userId}`);
            }
          } catch (socketError) {
            console.error(
              `Socket emit error for user ${userId}:`,
              socketError.message,
            );
            // Don't fail the job if socket emission fails
          }
        }

        // TODO: Add actual email/push notification sending here
        // if (channel === "EMAIL") {
        //   await sendEmail(userId, title, message);
        // }
        // if (channel === "PUSH") {
        //   await sendPushNotification(userId, title, message);
        // }
      } catch (error) {
        console.error(
          `Failed to create notification for channel ${channel}:`,
          error,
        );
        errors.push({ channel, error: error.message });

        // Create failed delivery log (no notificationId since creation failed)
        try {
          await DeliveryLog.create({
            notificationId: null,
            channel,
            status: "FAILED",
            attemptCount: job.attemptsMade + 1,
            errorMessage: error.message,
          });
        } catch (logError) {
          console.error(`Failed to create delivery log:`, logError);
        }
      }
    }

    // Retry if ALL channels failed
    if (successfulChannels === 0) {
      const errorMsg = `All notification channels failed: ${JSON.stringify(errors)}`;
      console.error(errorMsg);
      throw new Error(errorMsg);
    }

    // Log partial success
    if (successfulChannels < channels.length) {
      console.warn(
        `Event ${eventId}: ${successfulChannels}/${channels.length} channels succeeded. Errors:`,
        errors,
      );
    }

    // Mark event processed
    event.status = "PROCESSED";
    await event.save();
    console.log(
      `Event ${eventId} processed successfully (${successfulChannels}/${channels.length} channels)`,
    );
  },
  {
    connection: redis,
    concurrency: 10, // Process up to 10 jobs concurrently
    limiter: {
      max: 100, // Max 100 jobs
      duration: 60000, // Per minute
    },
  },
);

eventWorker.on("completed", (job) => {
  console.log(`Job ${job.id} completed successfully`);
});

eventWorker.on("failed", async (job, err) => {
  console.error(`Job ${job.id} failed: ${err.message}`);

  // Mark event as failed only after all retries exhausted
  if (job.attemptsMade >= 10) {
    // Match the attempts in queue options
    try {
      const event = await Event.findById(job.data.eventId);
      if (event) {
        event.status = "FAILED";
        await event.save();
        console.error(
          `Event ${job.data.eventId} marked as FAILED after ${job.attemptsMade} attempts`,
        );
      }
    } catch (dbError) {
      console.error(`Failed to mark event as FAILED:`, dbError);
    }
  } else {
    console.log(
      `Job ${job.id} will retry (attempt ${job.attemptsMade + 1}/10)`,
    );
  }
});

// Handle worker errors
eventWorker.on("error", (error) => {
  console.error("Worker error:", error);
});

// Graceful shutdown
process.on("SIGTERM", async () => {
  console.log("SIGTERM received, closing worker...");
  await eventWorker.close();
  process.exit(0);
});

export default eventWorker;
