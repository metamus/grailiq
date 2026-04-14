import { FastifyInstance } from 'fastify';
import { z } from 'zod';
import { createHash } from 'node:crypto';
import { db } from '../config/database.js';
import { analyticsEvents, users } from '../db/schema.js';
import { supabaseAdmin } from '../config/supabase.js';
import { eq } from 'drizzle-orm';

const eventSchema = z.object({
  name: z.string().min(1).max(80),
  sessionId: z.string().max(64).optional(),
  properties: z.record(z.any()).optional(),
  path: z.string().max(500).optional(),
  referrer: z.string().max(500).optional(),
});

const batchSchema = z.object({
  events: z.array(eventSchema).min(1).max(50),
});

/**
 * Analytics event ingestion.
 *
 *   POST /events        Body: event OR { events: [...] }
 *
 * Accepts anonymous events (no auth header) so landing-page views count.
 * When an Authorization header is present we resolve the Supabase user
 * and attach user_id. IPs are SHA-256-hashed (never stored in the clear).
 */
export async function eventsRoutes(app: FastifyInstance) {
  app.post(
    '/events',
    {
      // Tight per-route rate limit on top of the global 100/min.
      // Enough for a legitimate session (page_view + a dozen interaction
      // events per minute), low enough to blunt abuse.
      config: {
        rateLimit: { max: 60, timeWindow: '1 minute' },
      },
    },
    async (request, reply) => {
    // Accept either a single event or { events: [...] }
    const parsedBatch = batchSchema.safeParse(request.body);
    const parsedSingle = eventSchema.safeParse(request.body);

    if (!parsedBatch.success && !parsedSingle.success) {
      return reply.status(400).send({
        error: 'validation_failed',
        details: parsedBatch.error.issues,
      });
    }

    const events = parsedBatch.success ? parsedBatch.data.events : [parsedSingle.data!];

    // Best-effort user resolution from Bearer token (if present).
    let userId: string | null = null;
    const authHeader = request.headers.authorization;
    if (authHeader?.startsWith('Bearer ')) {
      try {
        const token = authHeader.slice(7);
        const { data: { user: supabaseUser } } = await supabaseAdmin.auth.getUser(token);
        if (supabaseUser) {
          const [local] = await db
            .select({ id: users.id })
            .from(users)
            .where(eq(users.supabaseId, supabaseUser.id))
            .limit(1);
          userId = local?.id ?? null;
        }
      } catch {
        // Ignore — just log as anonymous
      }
    }

    const ip =
      (request.headers['x-forwarded-for']?.toString().split(',')[0].trim() ?? request.ip) || 'unknown';
    const ipHash = createHash('sha256').update(ip).digest('hex').slice(0, 32);
    const userAgent = request.headers['user-agent']?.toString().slice(0, 500) ?? null;

    await db.insert(analyticsEvents).values(
      events.map((e) => ({
        userId,
        sessionId: e.sessionId ?? null,
        eventName: e.name,
        properties: e.properties ?? {},
        referrer: e.referrer ?? null,
        path: e.path ?? null,
        userAgent,
        ipHash,
      })),
    );

    return reply.status(204).send();
  },
  );
}
