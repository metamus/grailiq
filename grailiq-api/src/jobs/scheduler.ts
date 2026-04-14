import { priceUpdateQueue, restockCheckQueue, scoreQueue } from './queues.js';
import { logger } from '../lib/logger.js';

/** Initialize all repeatable job schedules */
export async function initScheduler() {
  if (!priceUpdateQueue || !restockCheckQueue || !scoreQueue) {
    logger.warn('Redis not available — job scheduler disabled');
    return;
  }

  logger.info('Initializing job scheduler...');

  // Price updates: every 15 min for hot products, every 2 hours for stable
  await priceUpdateQueue.add('fetch-prices-hot', { tier: 'hot' }, {
    repeat: { pattern: '*/15 * * * *' }, // every 15 minutes
  });

  await priceUpdateQueue.add('fetch-prices-stable', { tier: 'stable' }, {
    repeat: { pattern: '0 */2 * * *' }, // every 2 hours
  });

  // Restock checks: every 60 seconds for all monitored retailers
  await restockCheckQueue.add('check-restock', {}, {
    repeat: { pattern: '* * * * *' }, // every minute
  });

  // Score recalculation: daily at 2 AM UTC. Hot-tier price updates also
  // enqueue on-demand recalculations so fresh prices get fresh signals.
  await scoreQueue.add('recalculate-scores-daily', {}, {
    repeat: { pattern: '0 2 * * *' },
  });

  logger.info('Job scheduler initialized with repeatable jobs');
}
