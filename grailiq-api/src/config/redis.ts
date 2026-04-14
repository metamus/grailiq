import IORedis from 'ioredis';
import { env } from './env.js';
import { logger } from '../lib/logger.js';

const Redis = IORedis.default ?? IORedis;

/** Whether Redis is configured and available */
export let redisAvailable = false;

/** Redis client for caching and BullMQ (null if not configured) */
export let redis: InstanceType<typeof Redis> | null = null;

if (env.REDIS_URL) {
  try {
    redis = new Redis(env.REDIS_URL, {
      maxRetriesPerRequest: null, // Required for BullMQ
      enableReadyCheck: false,
      lazyConnect: true,
      retryStrategy(times: number) {
        if (times > 5) {
          logger.warn('Redis max retries reached, stopping reconnection');
          return null; // Stop retrying
        }
        const delay = Math.min(times * 50, 2000);
        return delay;
      },
    });

    redis.on('connect', () => {
      redisAvailable = true;
      logger.info('Redis connected');
    });

    redis.on('error', (err) => {
      redisAvailable = false;
      logger.warn(`Redis error: ${err.message}`);
    });

    redis.on('close', () => {
      redisAvailable = false;
    });

    // Attempt connection but don't block startup
    redis.connect().catch((err) => {
      logger.warn(`Redis connection failed: ${err.message}. Running without Redis.`);
      redisAvailable = false;
    });
  } catch (err) {
    logger.warn(`Redis initialization failed. Running without Redis.`);
    redis = null;
  }
} else {
  logger.info('REDIS_URL not configured. Running without Redis (queues disabled).');
}

/** Check Redis connectivity */
export async function checkRedisConnection(): Promise<boolean> {
  if (!redis) return false;
  try {
    const pong = await redis.ping();
    return pong === 'PONG';
  } catch {
    return false;
  }
}
