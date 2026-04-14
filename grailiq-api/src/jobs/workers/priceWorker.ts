import { Worker, Job } from 'bullmq';
import { redis } from '../../config/redis.js';
import { logger } from '../../lib/logger.js';
import { fetchTCGPlayerPrices } from '../../services/tcgplayer.js';
import { fetchEbayPrices } from '../../services/ebay.js';

if (!redis) {
  logger.info('Redis not available — price worker disabled');
}

const connection = redis ? { host: redis.options.host, port: redis.options.port } : undefined;

/** Process price update jobs */
export const priceWorker = connection
  ? new Worker('price-updates', async (job: Job) => {
      const { tier } = job.data;
      const startTime = Date.now();

      logger.info({ jobId: job.id, tier }, 'Starting price update job');

      try {
        // Fetch from both sources
        const [tcgResults, ebayResults] = await Promise.allSettled([
          fetchTCGPlayerPrices(tier),
          fetchEbayPrices(tier),
        ]);

        const tcgCount = tcgResults.status === 'fulfilled' ? tcgResults.value : 0;
        const ebayCount = ebayResults.status === 'fulfilled' ? ebayResults.value : 0;

        const duration = Date.now() - startTime;
        logger.info({ jobId: job.id, tier, tcgCount, ebayCount, duration }, 'Price update complete');

        return { tcgCount, ebayCount, duration };
      } catch (error) {
        logger.error({ jobId: job.id, error }, 'Price update job failed');
        throw error;
      }
    }, { connection, concurrency: 2 })
  : null;

if (priceWorker) {
  priceWorker.on('failed', (job, err) => {
    logger.error({ jobId: job?.id, error: err.message }, 'Price worker job failed');
  });
}
