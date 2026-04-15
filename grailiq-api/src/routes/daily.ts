import { FastifyInstance } from 'fastify';
import { db } from '../config/database.js';
import { dailyGrails, products } from '../db/schema.js';
import { eq, desc, sql, gte } from 'drizzle-orm';

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

      if (todayGrail && todayGrail.product) {
        return reply.send({
          data: {
            id: todayGrail.id,
            product: todayGrail.product,
            thesis: todayGrail.thesis,
            featuredDate: todayGrail.featuredDate,
          },
        });
      }

      // If no daily grail for today, pick the highest-scoring product
      // that hasn't been featured in the last 30 days
      const thirtyDaysAgo = new Date(Date.now() - 30 * 24 * 60 * 60 * 1000);
      const recentlyFeatured = await db
        .select({ productId: dailyGrails.productId })
        .from(dailyGrails)
        .where(gte(dailyGrails.featuredDate, thirtyDaysAgo));

      const featuredIds = recentlyFeatured.map((r) => r.productId);

      // Get all products sorted by score
      const allProdsQuery = await db
        .select()
        .from(products)
        .orderBy(desc(sql`CAST(${products.grailiqScore} AS FLOAT)`));

      // Find first product not recently featured
      let topProduct = null;
      for (const p of allProdsQuery) {
        if (!featuredIds.includes(p.id)) {
          topProduct = p;
          break;
        }
      }

      // Fallback to highest-scored product if all recent ones are featured
      if (!topProduct && allProdsQuery.length > 0) {
        topProduct = allProdsQuery[0];
      }

      if (!topProduct) {
        return reply.status(404).send({
          error: 'No products available',
        });
      }

      // Insert into daily_grails for today
      const today = new Date();
      today.setUTCHours(0, 0, 0, 0);

      try {
        await db.insert(dailyGrails).values({
          productId: topProduct.id,
          thesis: `Auto-selected today's top-scored product (${topProduct.name}).`,
          featuredDate: today,
        });
      } catch (insertErr: any) {
        // If insert fails due to duplicate (race condition), that's OK
        if (!insertErr.message?.includes('unique')) {
          throw insertErr;
        }
      }

      return reply.send({
        data: {
          product: topProduct,
          thesis: `Auto-selected today's top-scored product (${topProduct.name}).`,
          featuredDate: today.toISOString(),
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
