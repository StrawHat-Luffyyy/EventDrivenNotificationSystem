import { Queue } from "bullmq";
import redis from "../config/redis.js";

export const eventQueue = new Queue("eventQueue", {
  connection: redis,
});

