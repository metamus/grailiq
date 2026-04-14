import { FastifyInstance } from 'fastify';
import { z } from 'zod';
import { and, eq } from 'drizzle-orm';
import { db } from '../config/database.js';
import { pushTokens } from '../db/schema.js';
import { requireAuth } from '../middleware/auth.js';

const registerSchema = z.object({
  expoPushToken: z.string().startsWith('ExponentPushToken[').max(255),
  platform: z.enum(['ios', 'android', 'web']),
  deviceId: z.string().max(100).optional(),
});

const unregisterSchema = z.object({
  expoPushToken: z.string().max(255),
});

/**
 * Push notification registration routes.
 *
 * Mobile clients call POST /push/register on every app launch (and whenever
 * the OS hands them a new token). The handler upserts by
 * (user_id, expo_push_token) and bumps `lastUsedAt`.
 *
 * DELETE /push/register removes the token — called on sign-out.
 */
export async function pushRoutes(app: FastifyInstance) {
  app.addHook('preHandler', requireAuth);

  /**
   * POST /push/register
   * Body: { expoPushToken, platform, deviceId? }
   */
  app.post('/push/register', async (request, reply) => {
    const user = (request as any).user;
    if (!user) return reply.status(401).send({ error: 'User not found' });

    const parsed = registerSchema.safeParse(request.body);
    if (!parsed.success) {
      return reply
        .status(400)
        .send({ error: 'Validation failed', details: parsed.error.issues });
    }

    const { expoPushToken, platform, deviceId } = parsed.data;

    const existing = await db
      .select({ id: pushTokens.id })
      .from(pushTokens)
      .where(
        and(
          eq(pushTokens.userId, user.id),
          eq(pushTokens.expoPushToken, expoPushToken),
        ),
      )
      .limit(1);

    if (existing.length > 0) {
      const [updated] = await db
        .update(pushTokens)
        .set({
          platform,
          deviceId: deviceId ?? null,
          isEnabled: true,
          lastUsedAt: new Date(),
        })
        .where(eq(pushTokens.id, existing[0].id))
        .returning();
      return reply.send({ data: updated, action: 'updated' });
    }

    const [inserted] = await db
      .insert(pushTokens)
      .values({
        userId: user.id,
        expoPushToken,
        platform,
        deviceId: deviceId ?? null,
      })
      .returning();

    return reply.status(201).send({ data: inserted, action: 'created' });
  });

  /**
   * DELETE /push/register
   * Body: { expoPushToken }
   *
   * Disables a specific device token (on sign-out or when the client
   * detects the token is invalid).
   */
  app.delete('/push/register', async (request, reply) => {
    const user = (request as any).user;
    if (!user) return reply.status(401).send({ error: 'User not found' });

    const parsed = unregisterSchema.safeParse(request.body);
    if (!parsed.success) {
      return reply
        .status(400)
        .send({ error: 'Validation failed', details: parsed.error.issues });
    }

    await db
      .update(pushTokens)
      .set({ isEnabled: false })
      .where(
        and(
          eq(pushTokens.userId, user.id),
          eq(pushTokens.expoPushToken, parsed.data.expoPushToken),
        ),
      );

    return reply.send({ success: true });
  });
}
