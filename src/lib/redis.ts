import Redis from "ioredis";

let redisInstance: Redis | null = null;

export function getRedis(): Redis {
  if (!redisInstance) {
    redisInstance = new Redis(process.env.REDIS_URL!, {
      maxRetriesPerRequest: null, // Required for BullMQ
      lazyConnect: true,
    });
  }
  return redisInstance;
}

// BullMQ requires its own ioredis instance (it bundles its own version).
// Pass connection options object instead of a Redis instance to avoid type conflicts.
export function createRedisConnection(): { url: string; maxRetriesPerRequest: null; lazyConnect: boolean } {
  return {
    url: process.env.REDIS_URL!,
    maxRetriesPerRequest: null,
    lazyConnect: true,
  };
}

export const redis = getRedis();
