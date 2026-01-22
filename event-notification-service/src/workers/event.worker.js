import { Worker } from "bullmq";
import redis from "../config/redis.js";
import dotenv from "dotenv";
import connectDB from "../config/db.js";
import Event from "../modules/events/events.model.js";
import Notification from "../modules/notifications/notification.model.js";
import UserPreferences from "../modules/preferences/preference.model.js";
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
  // Worker options
  {
    connection: redis,
    attempts: 10,
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


/*
Flow Explanation:
We are importing Worker from bullmq and other necessary modules like mongoose models and config files.
We are configuring dotenv and connecting to the database.
Now we are creating a new Worker named eventWorker which listens to the eventQueue
first check if that eventtype is processEvent then we will proceed further or we'll return
then take eventId from job.data
check if eventID is present or not if not we'll throw an error
Now we'll check if userPref is there or not from eventId if not  we'll create a new pref
So now if preference is there so that we'll check that if that event is Enabled or not 
if not then we'll save that event as processes and we'll save it and return 
so now if the event is enabled we'll send a notification
so we'll destructure title and message from getNotificationtemplate(eventType , payload)
we'll create a empty array of channels
Now we'll check if (preference.channels.InApp) channels.push("IN_APP") similarly for the other channels too.
Now we'll create a for loop[const channel from channels] in which we'll create Notifications and DeliveryLogs
we'll start inside the loop with a variable named successfulChannels which is initialzed from 0 to keep the count of how many channels are successfully executed and this is outside the trycatch block.
Now we'll wrap it with trycatch because of the db operation
first we'll create Notification followed by DeliveryLogs in the try block and after the creation of the deliveylog we'll increase the value of the successfulChannels++
and in the catch block we'll do DeliveryLog with a status FAILED
and now we are out of the trycatch and loop and we'll check if successfulChannels === 0 then we'll return a Error mesaage saying all the channels failed to create the notification
Now we'll marked the event as PROCESSED and save it in and return
Now we'll configure worker options like connection , attempts and backoff{ type-exponential and delay }
Now we are out of the eventWorker and we'll handle what to do when the job succeeds or fails 
if it succeeds we'll do a console log job completed with job id
if it fails we'll do console.log Job failed 
and If it fails too many times → mark the related event as FAILED in the database  
*/