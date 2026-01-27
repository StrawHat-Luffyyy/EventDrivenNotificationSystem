import { Redis } from "ioredis";

const redis = new Redis(process.env.REDIS_URL, {
  maxRetriesPerRequest: null,
  retryStrategy(times) {
    const delay = Math.min(times * 50, 2000);
    return delay;
  },
  enableReadyCheck: true,
  lazyConnect: false,
});

redis.on("connect", () => {
  console.log("Connected to Redis successfully");
});
redis.on("error", (error) => {
  console.error("Redis connection error:", error);
});

export default redis;
