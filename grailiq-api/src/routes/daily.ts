import { FastifyInstance } from 'fastify';
import { db } from '../config/database.js';
import { dailyGrails, products } from '../db/schema.js';
import { eq, desc, sql } from 'drizzle-orm';

/**
 * Daily Grail routes
 * GET /api/v1/daily — returns today's featured product
 */

export async function dailyRoutes(app: FastifyInstance) {
  /** Get today's featured grail product */
  app.get('/daily', async (request, reply) => {
    try {
      // Find today's grail
      const [todayGrail] = await db
        .select({
          id: dailyGrails.id,
          productId: dailyGrails.productId,
          thesis: dailyGrails.thesis,
          featuredDate: dailyGrails.featuredDate,
          product: products,
        })
        .from(dailyGrails)
        .leftJoin(products, eq(dailyGrails.productId, products.id))
        .where(eq(sql`DATE(${dailyGrails.featuredDate})`, sql`CURRENT_DATE`))
        .limit(1);

      if (!todayGrail) {
        return reply.status(404).send({
          error: 'No daily grail selected yet',
          note: 'Daily selection happens at 9am ET daily',
        });
      }

      return reply.send({
        data: {
          id: todayGrail.id,
          product: todayGrail.product,
          thesis: todayGrail.thesis,
          featuredDate: todayGrail.featuredDate,
        },
      });
    } catch (err) {
      app.log.error(err);
      return reply.code(500).send({ error: 'Internal server error' });
    }
  });

  /** Get grails for a date range (past/future) */
  app.get<{ Querystring: { days?: string; offset?: string } }>(
    '/daily/history',
    async (request, reply) => {
      try {
        const days = parseInt(request.query.days || '30', 10);
        const offset = parseInt(request.query.offset || '0', 10);

        const startDate = new Date();
        startDate.setDate(startDate.getDate() - days);

        const grails = await db
          .select({
            id: dailyGrails.id,
            productId: dailyGrails.productId,
            thesis: dailyGrails.thesis,
            featuredDate: dailyGrails.featuredDate,
            product: products,
          })
          .from(dailyGrails)
          .leftJoin(products, eq(dailyGrails.productId, products.id))
          .orderBy(desc(dailyGrails.featuredDate))
          .limit(30)
          .offset(offset);

        return reply.send({
          data: grails.map(g => ({
            id: g.id,
            product: g.product,
            thesis: g.thesis,
            featuredDate: g.featuredDate,
          })),
          pagination: { limit: 30, offset },
        });
      } catch (err) {
        app.log.error(err);
        return reply.code(500).send({ error: 'Internal server error' });
      }
    },
  );
}
