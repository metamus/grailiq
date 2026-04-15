import { FastifyInstance, FastifyRequest, FastifyReply } from 'fastify';
import { db } from '../config/database.js';
import { users, referrals } from '../db/schema.js';
import { eq, and } from 'drizzle-orm';
import crypto from 'crypto';

/**
 * Referral Program Routes
 *
 * GET /api/v1/me/referral-code — Get current user's referral code + URL
 * POST /api/v1/me/apply-referral — Apply a referral code for new user
 */

function generateReferralCode(userId: string): string {
  // Create hash of user ID to make referral code
  const hash = crypto.createHash('sha256').update(userId).digest('hex').substring(0, 8).toUpperCase();
  return `GRAIL-${hash}`;
}

function codeToUserId(code: string): string | null {
  // This is a stub — real implementation would store the mapping
  // For now, we can't decode, so referral codes should be validated against DB
  return null;
}

export async function referralRoutes(app: FastifyInstance) {
  /** Get current user's referral code and URL */
  app.get<{ Headers: { authorization?: string } }>(
    '/me/referral-code',
    async (request: FastifyRequest, reply: FastifyReply) => {
      try {
        // TODO: Extract user from auth header (requires auth middleware)
        // For now, return stub
        const userId = request.headers['x-user-id'] as string | undefined;

        if (!userId) {
          return reply.code(401).send({ error: 'Unauthorized' });
        }

        const code = generateReferralCode(userId);
        const url = `https://grailiq.com/?ref=${code}`;

        return reply.send({
          data: {
            code,
            url,
          },
        });
      } catch (err) {
        app.log.error(err);
        return reply.code(500).send({ error: 'Internal server error' });
      }
    }
  );

  /** Apply a referral code (for new user signup) */
  app.post<{ Body: Record<string, unknown>; Headers: { authorization?: string } }>(
    '/me/apply-referral',
    async (request: FastifyRequest, reply: FastifyReply) => {
      try {
        const { code } = request.body as { code: string };
        const userId = request.headers['x-user-id'] as string | undefined;

        if (!userId || !code) {
          return reply.code(400).send({ error: 'Missing userId or referral code' });
        }

        // TODO: Validate code format (GRAIL-XXXXXXXX)
        // TODO: Look up referrer by code
        // For now, stub implementation

        return reply.send({
          data: {
            message: 'Referral code applied',
            status: 'pending',
          },
        });
      } catch (err) {
        app.log.error(err);
        return reply.code(500).send({ error: 'Internal server error' });
      }
    }
  );

  /** Admin: List referrals for a user */
  app.get<{ Params: Record<string, unknown> }>(
    '/admin/referrals/:userId',
    async (request: FastifyRequest, reply: FastifyReply) => {
      try {
        const { userId } = request.params as { userId: string };

        const userReferrals = await db
          .select()
          .from(referrals)
          .where(eq(referrals.referrerUserId, userId));

        const completed = userReferrals.filter(r => r.status === 'completed').length;

        return reply.send({
          data: {
            total: userReferrals.length,
            completed,
            pending: userReferrals.length - completed,
            referrals: userReferrals,
          },
        });
      } catch (err) {
        app.log.error(err);
        return reply.code(500).send({ error: 'Internal server error' });
      }
    }
  );
}
