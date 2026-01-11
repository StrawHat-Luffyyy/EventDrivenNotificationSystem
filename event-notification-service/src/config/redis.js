import { Redis } from "ioredis";

const redis = new Redis(process.env.REDIS_URL , {
  maxRetriesPerRequest: null,
});

redis.on("connect", () => {
  console.log("Connected to Redis successfully");
});
redis.on("error", (error) => {
  console.error("Redis connection error:", error);
});

export default redis;
