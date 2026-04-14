import { Worker, Job } from 'bullmq';
import { redis } from '../../config/redis.js';
import { logger } from '../../lib/logger.js';
import { fetchTCGPlayerPrices } from '../../services/tcgplayer.js';
import { fetchEbayPrices } from '../../services/ebay.js';

if (!redis) {
  logger.info('Redis not available — price worker disabled');
}

const connection = redis ? { host: redis.options.host, port: redis.options.port } : undefined;

/**
 * Price update job handler.
 * Fetches prices from TCGPlayer and eBay for a given tier (hot, warm, cold).
 * Processes in parallel for efficiency.
 */
export const priceWorker = connection
  ? new Worker('price-updates', async (job: Job) => {
      const { tier } = job.data;
      const startTime = Date.now();

      logger.info({ jobId: job.id, tier }, 'Starting price update job');

      try {
        // Fetch from both sources in parallel with error isolation
        const [tcgResults, ebayResults] = await Promise.allSettled([
          fetchTCGPlayerPrices(tier).catch((error) => {
            logger.error({ tier, error }, 'TCGPlayer price fetch failed');
            throw error;
          }),
          fetchEbayPrices(tier).catch((error) => {
            logger.error({ tier, error }, 'eBay price fetch failed');
            throw error;
          }),
        ]);

        // Count successes, treat failures as 0
        const tcgCount = tcgResults.status === 'fulfilled' ? tcgResults.value : 0;
        const ebayCount = ebayResults.status === 'fulfilled' ? ebayResults.value : 0;

        // If both sources failed, throw error so job retries
        if (tcgCount === 0 && ebayCount === 0) {
          const tcgError = tcgResults.status === 'rejected' ? tcgResults.reason : null;
          const ebayError = ebayResults.status === 'rejected' ? ebayResults.reason : null;

          if (tcgError || ebayError) {
            const error = new Error(
              `Both price sources failed. TCGPlayer: ${tcgError?.message || 'ok'}, eBay: ${ebayError?.message || 'ok'}`
            );
            throw error;
          }
        }

        const duration = Date.now() - startTime;
        logger.info({ jobId: job.id, tier, tcgCount, ebayCount, duration }, 'Price update complete');

        return {
          tcgCount,
          ebayCount,
          duration,
          success: true,
        };
      } catch (error) {
        logger.error(
          {
            jobId: job.id,
            tier,
            error: error instanceof Error ? error.message : String(error),
          },
          'Price update job failed'
        );
        throw error;
      }
    }, { connection, concurrency: 2 })
  : null;

if (priceWorker) {
  priceWorker.on('failed', (job, err) => {
    logger.error(
      {
        jobId: job?.id,
        tier: job?.data?.tier,
        attemptsMade: job?.attemptsMade,
        error: err.message,
      },
      'Price worker job failed'
    );
  });

  priceWorker.on('completed', (job, result) => {
    logger.info(
      {
        jobId: job.id,
        tier: job.data?.tier,
        result,
      },
      'Price worker job completed successfully'
    );
  });

  logger.info('Price worker initialized');
}
