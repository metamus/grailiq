import { FastifyRequest, FastifyReply } from 'fastify';
import { supabaseAdmin, createUserClient } from '../config/supabase.js';
import { db } from '../config/database.js';
import { users } from '../db/schema.js';
import { eq } from 'drizzle-orm';

/** Verify Supabase JWT and attach user to request */
export async function requireAuth(request: FastifyRequest, reply: FastifyReply) {
  const authHeader = request.headers.authorization;

  if (!authHeader?.startsWith('Bearer ')) {
    return reply.status(401).send({ error: 'Authentication required' });
  }

  const token = authHeader.slice(7);

  try {
    const { data: { user: supabaseUser }, error } = await supabaseAdmin.auth.getUser(token);

    if (error || !supabaseUser) {
      return reply.status(401).send({ error: 'Invalid or expired token' });
    }

    // Look up our local user record
    const [localUser] = await db
      .select()
      .from(users)
      .where(eq(users.supabaseId, supabaseUser.id))
      .limit(1);

    // Attach to request for downstream use
    (request as any).user = localUser ?? null;
    (request as any).supabaseUser = supabaseUser;
  } catch {
    return reply.status(401).send({ error: 'Authentication failed' });
  }
}

/** Check if user has required subscription tier */
export function requireTier(minimumTier: 'free' | 'collector' | 'investor') {
  const tierOrder = { free: 0, collector: 1, investor: 2 };

  return async (request: FastifyRequest, reply: FastifyReply) => {
    const user = (request as any).user;
    if (!user) {
      return reply.status(401).send({ error: 'Authentication required' });
    }

    const userTier = user.subscriptionTier || 'free';
    if (tierOrder[userTier as keyof typeof tierOrder] < tierOrder[minimumTier]) {
      return reply.status(403).send({
        error: `Requires ${minimumTier} tier or above`,
        currentTier: userTier,
        upgradeUrl: '/pricing',
      });
    }
  };
}
