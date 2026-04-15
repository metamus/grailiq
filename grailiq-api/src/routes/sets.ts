import { FastifyInstance } from 'fastify';
import { db } from '../config/database.js';
import { sets, products } from '../db/schema.js';
import { eq } from 'drizzle-orm';
import { getChaseCards } from '../services/singles.js';

/** Register set-related API routes */
export async function setRoutes(app: FastifyInstance) {
  /** List all sets */
  app.get('/sets', async (_request, reply) => {
    const allSets = await db.select().from(sets);
    return reply.send({ data: allSets });
  });

  /** Get a single set by ID with its products */
  app.get<{ Params: { id: string } }>('/sets/:id', async (request, reply) => {
    const { id } = request.params;
    const [set] = await db.select().from(sets).where(eq(sets.id, id)).limit(1);

    if (!set) {
      return reply.status(404).send({ error: 'Set not found' });
    }

    const setProducts = await db
      .select()
      .from(products)
      .where(eq(products.setId, id));

    return reply.send({ data: { ...set, products: setProducts } });
  });

  /** Get chase cards (high-value singles) for a set */
  app.get<{ Params: { id: string } }>('/sets/:id/chase-cards', async (request, reply) => {
    const { id } = request.params;
    const chaseCards = await getChaseCards(id);
    return reply.send({ data: chaseCards });
  });
}
