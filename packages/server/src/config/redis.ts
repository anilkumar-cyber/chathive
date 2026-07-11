import Redis from "ioredis";
import { env, isTest } from "./env";
import { logger } from "./logger";

let client: Redis | null = null;

export function getRedis(): Redis | null {
  if (isTest || !env.REDIS_URL) return null;
  if (!client) {
    client = new Redis(env.REDIS_URL, { maxRetriesPerRequest: 3, lazyConnect: true });
    client.on("error", (err) => logger.error(`Redis error: ${err.message}`));
    client.connect().catch((err) => logger.warn(`Redis connect failed, continuing without cache: ${err.message}`));
  }
  return client;
}
