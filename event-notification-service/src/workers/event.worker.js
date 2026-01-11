import { Worker } from "bullmq";
import redis from "../config/redis.js";
import Event from "../modules/events/events.model.js";
import connectDB from "../config/db.js";
import dotenv from "dotenv";

dotenv.config();

await connectDB();
const eventWorker = new Worker(
  "eventQueue",
  async (job) => {
    const { eventId } = job.data;
    const event = await Event.findById(eventId);
    if (!event) {
      throw new Error(`Event with ID ${eventId} not found`);
    }
    // Simulate processing the event (e.g., sending notifications)
    console.log(
      `Processing event: ${event.eventType} for the user ${event.userId}`
    );
    // Simulate a failure for demonstration purposes
    if (event.eventType === "FAIL_TEST") {
      throw new Error("Intentional failure");
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
  }
);

eventWorker.on("completed", (job) => {
  console.log(`Job with ID ${job.id} has been completed`);
});

eventWorker.on("failed", (job, err) => {
  console.error(`Job with ID ${job.id} has failed with error: ${err.message}`);
});

export default eventWorker;
