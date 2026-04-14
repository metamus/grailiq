import Fastify from 'fastify';
import cors from '@fastify/cors';
import helmet from '@fastify/helmet';
import rateLimit from '@fastify/rate-limit';
import swagger from '@fastify/swagger';
import swaggerUi from '@fastify/swagger-ui';
import { env } from './config/env.js';
import { logger } from './lib/logger.js';
import { healthRoutes } from './routes/health.js';
import { productRoutes } from './routes/products.js';
import { setRoutes } from './routes/sets.js';
import { portfolioRoutes } from './routes/portfolio.js';
import { alertRoutes } from './routes/alerts.js';
import { adminRoutes } from './routes/admin.js';
import { pushRoutes } from './routes/push.js';
import { stripeRoutes } from './routes/stripe.js';
import { watchlistRoutes } from './routes/watchlist.js';
import { meRoutes } from './routes/me.js';
import { eventsRoutes } from './routes/events.js';
import { pool } from './config/database.js';
import { redis } from './config/redis.js';
import { initJobs } from './jobs/init.js';

/** Build and configure the Fastify application */
async function buildApp() {
  const app = Fastify({
    logger: {
      level: env.NODE_ENV === 'production' ? 'info' : 'debug',
      transport:
        env.NODE_ENV === 'development'
          ? { target: 'pino-pretty', options: { colorize: true } }
          : undefined,
    },
  });

  // Security & middleware
  await app.register(cors, {
    origin: env.NODE_ENV === 'production'
        ? ['https://grailiq.com', 'https://grailiq-web.pages.dev']
        : true,
    credentials: true,
  });
  await app.register(helmet);
  await app.register(rateLimit, {
    max: 100,
    timeWindow: '1 minute',
  });

  // API documentation
  await app.register(swagger, {
    openapi: {
      info: {
        title: 'GrailIQ API',
        description: 'Pokemon TCG Price Intelligence Platform',
        version: '0.1.0',
      },
    },
  });
  await app.register(swaggerUi, { routePrefix: '/docs' });

  // Routes
  await app.register(healthRoutes);
  await app.register(productRoutes, { prefix: '/api/v1' });
  await app.register(setRoutes, { prefix: '/api/v1' });
  await app.register(portfolioRoutes, { prefix: '/api/v1' });
  await app.register(alertRoutes, { prefix: '/api/v1' });
  await app.register(adminRoutes, { prefix: '/api/v1' });
  await app.register(pushRoutes, { prefix: '/api/v1' });
  await app.register(stripeRoutes, { prefix: '/api/v1' });
  await app.register(watchlistRoutes, { prefix: '/api/v1' });
  await app.register(meRoutes, { prefix: '/api/v1' });
  await app.register(eventsRoutes, { prefix: '/api/v1' });

  return app;
}

/** Start the server with graceful shutdown */
async function start() {
  // Initialize job system (workers and scheduler)
  await initJobs();

  const app = await buildApp();

  // Graceful shutdown
  const shutdown = async (signal: string) => {
    logger.info(`Received ${signal}. Shutting down gracefully...`);
    await app.close();
    await pool.end();
    if (redis) redis.disconnect();
    process.exit(0);
  };

  process.on('SIGINT', () => shutdown('SIGINT'));
  process.on('SIGTERM', () => shutdown('SIGTERM'));

  try {
    await app.listen({ port: env.PORT, host: '0.0.0.0' });
    logger.info(`GrailIQ API running at http://localhost:${env.PORT}`);
    logger.info(`API docs at http://localhost:${env.PORT}/docs`);
  } catch (err) {
    logger.error(err);
    process.exit(1);
  }
}

start();

export { buildApp };
