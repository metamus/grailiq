import { FastifyInstance } from 'fastify';
import { z } from 'zod';
import { eq } from 'drizzle-orm';
import { db } from '../config/database.js';
import { users } from '../db/schema.js';
import { requireAuth } from '../middleware/auth.js';
import { resolveFlags } from '../lib/featureFlags.js';
import { resolvePrefs, DEFAULT_PREFS } from '../lib/notificationPrefs.js';
import { supabaseAdmin } from '../config/supabase.js';

const updateSchema = z.object({
  displayName: z.string().min(1).max(120).optional(),
  preferredCurrency: z.string().length(3).optional(),
});

const prefsSchema = z.object({
  restock: z.object({ email: z.boolean(), push: z.boolean() }).optional(),
  priceTarget: z.object({ email: z.boolean(), push: z.boolean() }).optional(),
  weeklyDigest: z.object({ email: z.boolean() }).optional(),
  quietHours: z
    .object({
      enabled: z.boolean(),
      start: z.string().regex(/^\d{2}:\d{2}$/),
      end: z.string().regex(/^\d{2}:\d{2}$/),
      timezone: z.string().min(1).max(64),
    })
    .optional(),
});

/**
 * "Me" endpoint — current-user profile + resolved feature flags.
 *
 *   GET   /me   → profile, tier, trial, feature flags
 *   PATCH /me   → update displayName / preferredCurrency
 */
export async function meRoutes(app: FastifyInstance) {
  app.addHook('preHandler', requireAuth);

  app.get('/me', async (request, reply) => {
    const user = (request as any).user;
    if (!user) return reply.status(401).send({ error: 'user_not_found' });

    return reply.send({
      data: {
        id: user.id,
        email: user.email,
        displayName: user.displayName,
        preferredCurrency: user.preferredCurrency,
        subscriptionTier: user.subscriptionTier,
        trialEndsAt: user.trialEndsAt,
        featureFlags: resolveFlags(user),
        notificationPrefs: resolvePrefs(user.notificationPrefs),
      },
    });
  });

  /**
   * PATCH /me/notifications  — upsert notification prefs. Shallow-merge
   * with current prefs so clients can update one section at a time.
   */
  app.patch('/me/notifications', async (request, reply) => {
    const user = (request as any).user;
    if (!user) return reply.status(401).send({ error: 'user_not_found' });
    const parsed = prefsSchema.safeParse(request.body);
    if (!parsed.success) {
      return reply.status(400).send({ error: 'validation_failed', details: parsed.error.issues });
    }

    const current = resolvePrefs(user.notificationPrefs);
    const next = {
      ...current,
      ...parsed.data,
      // Ensure full defaults present for any missing sections (safety).
      restock: parsed.data.restock ?? current.restock,
      priceTarget: parsed.data.priceTarget ?? current.priceTarget,
      weeklyDigest: parsed.data.weeklyDigest ?? current.weeklyDigest,
      quietHours: parsed.data.quietHours ?? current.quietHours,
    };

    await db
      .update(users)
      .set({ notificationPrefs: next, updatedAt: new Date() })
      .where(eq(users.id, user.id));

    return reply.send({ data: next });
  });

  /** GET /me/notifications/defaults — clients can reset with a single call. */
  app.get('/me/notifications/defaults', async (_req, reply) => {
    return reply.send({ data: DEFAULT_PREFS });
  });

  app.patch('/me', async (request, reply) => {
    const user = (request as any).user;
    if (!user) return reply.status(401).send({ error: 'user_not_found' });
    const parsed = updateSchema.safeParse(request.body);
    if (!parsed.success) {
      return reply.status(400).send({ error: 'validation_failed', details: parsed.error.issues });
    }

    const [updated] = await db
      .update(users)
      .set({
        displayName: parsed.data.displayName ?? undefined,
        preferredCurrency: parsed.data.preferredCurrency ?? undefined,
        updatedAt: new Date(),
      })
      .where(eq(users.id, user.id))
      .returning();

    return reply.send({
      data: {
        id: updated.id,
        email: updated.email,
        displayName: updated.displayName,
        preferredCurrency: updated.preferredCurrency,
        subscriptionTier: updated.subscriptionTier,
        featureFlags: resolveFlags(updated),
      },
    });
  });

  /** DELETE /me — delete user account permanently. */
  app.delete('/me', async (request, reply) => {
    const user = (request as any).user;
    if (!user) return reply.status(401).send({ error: 'user_not_found' });

    try {
      // Delete user portfolio and related data (cascade)
      await db.delete(users).where(eq(users.id, user.id));

      // Delete from Supabase Auth
      await supabaseAdmin.auth.admin.deleteUser(user.id);

      return reply.send({ data: { deleted: true } });
    } catch (err) {
      console.error('Failed to delete user:', err);
      return reply.status(500).send({ error: 'delete_failed' });
    }
  });
}
