import { Queue } from 'bullmq';
import { redis } from '../config/redis.js';
import { logger } from '../lib/logger.js';

// Queues are only initialized if Redis is available
let priceUpdateQueue: Queue | null = null;
let restockCheckQueue: Queue | null = null;
let notificationQueue: Queue | null = null;
let scoreQueue: Queue | null = null;
let digestQueue: Queue | null = null;
let priceTargetQueue: Queue | null = null;
let dailyGrailSelectionQueue: Queue | null = null;

if (redis) {
  const connection = { host: redis.options.host, port: redis.options.port };

  /** Queue for fetching prices from TCGPlayer and eBay */
  priceUpdateQueue = new Queue('price-updates', {
    connection,
    defaultJobOptions: {
      removeOnComplete: 100,
      removeOnFail: 500,
      attempts: 3,
      backoff: { type: 'exponential', delay: 5000 },
    },
  });

  /** Queue for restock alert checking */
  restockCheckQueue = new Queue('restock-checks', {
    connection,
    defaultJobOptions: {
      removeOnComplete: 50,
      removeOnFail: 200,
      attempts: 2,
      backoff: { type: 'fixed', delay: 10000 },
    },
  });

  /** Queue for sending notifications (push + email) */
  notificationQueue = new Queue('notifications', {
    connection,
    defaultJobOptions: {
      removeOnComplete: 200,
      removeOnFail: 500,
      attempts: 3,
      backoff: { type: 'exponential', delay: 3000 },
    },
  });

  /** Queue for weekly score recalculation */
  scoreQueue = new Queue('score-calculations', {
    connection,
    defaultJobOptions: {
      removeOnComplete: 10,
      removeOnFail: 50,
      attempts: 2,
    },
  });

  /** Queue for weekly market-intelligence digest emails (Investor tier) */
  digestQueue = new Queue('digests', {
    connection,
    defaultJobOptions: {
      removeOnComplete: 20,
      removeOnFail: 50,
      attempts: 2,
      backoff: { type: 'exponential', delay: 30000 },
    },
  });

  /** Queue for watchlist price-target checks */
  priceTargetQueue = new Queue('price-targets', {
    connection,
    defaultJobOptions: {
      removeOnComplete: 50,
      removeOnFail: 100,
      attempts: 2,
    },
  });

  /** Queue for daily grail selection */
  dailyGrailSelectionQueue = new Queue('daily-grail-selection', {
    connection,
    defaultJobOptions: {
      removeOnComplete: 7,
      removeOnFail: 30,
      attempts: 2,
    },
  });

  logger.info('BullMQ queues initialized');
} else {
  logger.info('Redis not available — BullMQ queues disabled');
}

export {
  priceUpdateQueue,
  restockCheckQueue,
  notificationQueue,
  scoreQueue,
  digestQueue,
  priceTargetQueue,
  dailyGrailSelectionQueue,
};
