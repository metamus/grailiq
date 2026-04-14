import { FastifyInstance, FastifyRequest, FastifyReply } from 'fastify';
import { db } from '../config/database.js';
import { products, scoreHistory } from '../db/schema.js';

/**
 * Public REST API for GrailIQ at Investor tier.
 *
 * Flow:
 * 1. Client sends x-api-key header with request
 * 2. Middleware validates key against api_keys table (TODO: create table)
 * 3. If key exists and tier >= 'investor', request proceeds
 * 4. Otherwise, return 401 Unauthorized
 *
 * Endpoints:
 * - GET /api/v1/public/products — paginated list of all products
 * - GET /api/v1/public/products/:id — single product detail
 * - GET /api/v1/public/score/:productId — score + factor breakdown
 */

/**
 * Middleware to validate API key.
 * TODO: Check against api_keys table for tier=investor minimum
 */
async function validateApiKey(request: FastifyRequest, reply: FastifyReply) {
  const apiKey = request.headers['x-api-key'];

  if (!apiKey || typeof apiKey !== 'string') {
    return reply.code(401).send({ error: 'Missing x-api-key header' });
  }

  // TODO: Validate apiKey against api_keys table, check tier >= 'investor'
  // For now, accept any non-empty key
  if (apiKey.length === 0) {
    return reply.code(401).send({ error: 'Invalid API key' });
  }
}

export async function publicApiRoutes(app: FastifyInstance) {
  // Register the API key validation hook
  app.addHook('preHandler', async (request, reply) => {
    if (request.url.startsWith('/api/v1/public')) {
      await validateApiKey(request, reply);
    }
  });

  /**
   * GET /api/v1/public/products
   * Returns paginated list of all products with basic metadata.
   * Query params: limit (default 50, max 100), offset (default 0)
   */
  app.get(
    '/public/products',
    async (request: FastifyRequest, reply: FastifyReply) => {
      try {
        const query = request.query as { limit?: string; offset?: string };
        const limit = Math.min(parseInt(query.limit ?? '50') || 50, 100);
        const offset = parseInt(query.offset ?? '0') || 0;

        // TODO: Replace with actual database query once schema is confirmed
        return reply.send({
          data: [],
          pagination: {
            limit,
            offset,
            total: 0,
          },
        });
      } catch (err) {
        app.log.error(err);
        return reply.code(500).send({ error: 'Internal server error' });
      }
    },
  );

  /**
   * GET /api/v1/public/products/:id
   * Returns detailed information about a single product.
   */
  app.get(
    '/public/products/:id',
    async (request: FastifyRequest, reply: FastifyReply) => {
      try {
        const { id } = request.params as { id: string };

        // TODO: Query products table for product.id = id
        // Include set metadata, current prices, and investment signal

        return reply.send({
          error: 'Not found',
        });
      } catch (err) {
        app.log.error(err);
        return reply.code(500).send({ error: 'Internal server error' });
      }
    },
  );

  /**
   * GET /api/v1/public/score/:productId
   * Returns GrailIQ Score and factor breakdown for a product.
   */
  app.get(
    '/public/score/:productId',
    async (request: FastifyRequest, reply: FastifyReply) => {
      try {
        const { productId } = request.params as { productId: string };

        // TODO: Query productScores table for productId
        // Return: score (0-100), bias (buy/hold/watch/avoid), factors breakdown

        return reply.send({
          error: 'Not found',
        });
      } catch (err) {
        app.log.error(err);
        return reply.code(500).send({ error: 'Internal server error' });
      }
    },
  );
}
