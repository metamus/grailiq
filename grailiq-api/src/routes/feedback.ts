import { FastifyInstance, FastifyRequest, FastifyReply } from 'fastify';
import { db } from '../config/database.js';
import { feedbackTable } from '../db/schema.js';
import { logger } from '../lib/logger.js';

interface FeedbackBody {
  rating?: number;
  message: string;
  page?: string;
}

export async function feedbackRoutes(fastify: FastifyInstance) {
  fastify.post<{ Body: FeedbackBody }>(
    '/feedback',
    async (request: FastifyRequest<{ Body: FeedbackBody }>, reply: FastifyReply) => {
      try {
        const { rating, message, page } = request.body;

        // Validate
        if (!message || typeof message !== 'string' || message.trim().length === 0) {
          return reply.status(400).send({ error: 'Message is required' });
        }

        if (message.length > 1000) {
          return reply.status(400).send({ error: 'Message must be 1000 characters or less' });
        }

        // Get user ID from auth header if available
        const userId = (request as any).userId || null;

        // Insert feedback
        const result = await db
          .insert(feedbackTable)
          .values({
            userId,
            rating: rating ? Math.min(5, Math.max(1, rating)) : null,
            message: message.trim(),
            page: page || null,
            createdAt: new Date(),
          })
          .returning({ id: feedbackTable.id });

        logger.info(
          { feedbackId: result[0]?.id, userId, rating, page },
          'Feedback submitted',
        );

        return reply.status(201).send({
          id: result[0]?.id,
          message: 'Feedback received. Thank you!',
        });
      } catch (err) {
        logger.error({ err }, 'Feedback submission error');
        return reply.status(500).send({ error: 'Failed to submit feedback' });
      }
    },
  );
}
