import Redis from "ioredis";
import { logger } from "../utils/logger";

const REDIS_URL = process.env.REDIS_URL ?? "redis://localhost:6379";

const redis = new Redis(REDIS_URL, {
  maxRetriesPerRequest: 2,
  enableOfflineQueue: false,   // fail fast if Redis is down — never block the app
  lazyConnect: true,
});

redis.on("connect", () => logger.info("redis", "Connected"));
redis.on("error", (err) => logger.warn("redis", "Connection error — cache disabled", { message: err.message }));

// Attempt connection but don't crash if Redis is unavailable
redis.connect().catch(() => {
  logger.warn("redis", "Could not connect — running without cache");
});

export default redis;
