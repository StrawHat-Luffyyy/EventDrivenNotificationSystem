import { Queue } from "bullmq";
import redis from "../config/redis.js";

export const eventQueue = new Queue("eventQueue", {
  connection: redis,
  defaultJobOptions: {
    attempts: 10,
    backoff: {
      type: "exponential",
      delay: 2000,
    },
    removeOnComplete: {
      age: 3600, // Keep completed jobs for 1 hour
      count: 1000, // Keep last 1000 completed jobs
    },
    removeOnFail: {
      age: 86400, // Keep failed jobs for 24 hours
    },
  },
});

// Add queue event listeners
eventQueue.on("error", (error) => {
  console.error("Queue error:", error);
});

eventQueue.on("waiting", (jobId) => {
  console.log(`Job ${jobId} is waiting`);
});

// Add cleanup scheduler (optional)
export const cleanupOldJobs = async () => {
  try {
    await eventQueue.clean(3600000, 1000, "completed"); // Clean completed jobs older than 1 hour
    await eventQueue.clean(86400000, 1000, "failed"); // Clean failed jobs older than 24 hours
    console.log("Queue cleanup completed");
  } catch (error) {
    console.error("Queue cleanup error:", error);
  }
};

// Run cleanup every hour
setInterval(cleanupOldJobs, 3600000);