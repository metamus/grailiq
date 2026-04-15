/**
 * Job system initialization
 * Imports all workers (which auto-initialize when imported) and sets up the scheduler
 */

import { logger } from '../lib/logger.js';
import { initScheduler } from './scheduler.js';

// Import all workers (they self-initialize when imported)
import './workers/priceWorker.js';
import './workers/restockWorker.js';
import './workers/scoreWorker.js';
import './workers/notificationWorker.js';
import './workers/digestWorker.js';
import './workers/priceTargetWorker.js';
import './workers/daily-grail-selection.js';

/** Initialize the job system */
export async function initJobs() {
  try {
    logger.info('Initializing job system...');
    await initScheduler();
    logger.info('Job system initialized successfully');
  } catch (error) {
    logger.error({ error }, 'Failed to initialize job system');
    // Non-fatal error — API can still function without jobs
  }
}
