import { FastifyInstance } from 'fastify';
import { checkDatabaseConnection } from '../config/database.js';
import { checkRedisConnection } from '../config/redis.js';

/** Register health check endpoints */
export async function healthRoutes(app: FastifyInstance) {
  app.get('/health', async (_request, reply) => {
    const [dbOk, redisOk] = await Promise.all([
      checkDatabaseConnection(),
      checkRedisConnection(),
    ]);

    const status = dbOk && redisOk ? 'ok' : 'degraded';

    return reply.status(dbOk && redisOk ? 200 : 503).send({
      status,
      timestamp: new Date().toISOString(),
      uptime: process.uptime(),
      services: {
        database: dbOk ? 'connected' : 'error',
        redis: redisOk ? 'connected' : 'error',
      },
    });
  });
}
