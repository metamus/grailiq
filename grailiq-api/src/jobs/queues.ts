import { Queue } from 'bullmq';
import { redis } from '../config/redis.js';
import { logger } from '../lib/logger.js';

// Connection config reused across all queues
const connection = { host: redis.options.host, port: redis.options.port };

/** Queue for fetching prices from TCGPlayer and eBay */
export const priceUpdateQueue = new Queue('price-updates', {
  connection,
  defaultJobOptions: {
    removeOnComplete: 100,
    removeOnFail: 500,
    attempts: 3,
    backoff: { type: 'exponential', delay: 5000 },
  },
});

/** Queue for restock alert checking */
export const restockCheckQueue = new Queue('restock-checks', {
  connection,
  defaultJobOptions: {
    removeOnComplete: 50,
    removeOnFail: 200,
    attempts: 2,
    backoff: { type: 'fixed', delay: 10000 },
  },
});

/** Queue for sending notifications (push + email) */
export const notificationQueue = new Queue('notifications', {
  connection,
  defaultJobOptions: {
    removeOnComplete: 200,
    removeOnFail: 500,
    attempts: 3,
    backoff: { type: 'exponential', delay: 3000 },
  },
});

/** Queue for weekly score recalculation */
export const scoreQueue = new Queue('score-calculations', {
  connection,
  defaultJobOptions: {
    removeOnComplete: 10,
    removeOnFail: 50,
    attempts: 2,
  },
});

logger.info('BullMQ queues initialized');
