import { FastifyInstance } from 'fastify';
import { z } from 'zod';
import { eq } from 'drizzle-orm';
import { stripe, STRIPE_PRICE_IDS, STRIPE_RETURN_URL } from '../config/stripe.js';
import { env } from '../config/env.js';
import { db } from '../config/database.js';
import { users } from '../db/schema.js';
import { requireAuth } from '../middleware/auth.js';
import { logger } from '../lib/logger.js';
import type Stripe from 'stripe';

const checkoutSchema = z.object({
  tier: z.enum(['collector', 'investor']),
  successUrl: z.string().url().optional(),
  cancelUrl: z.string().url().optional(),
});

const portalSchema = z.object({
  returnUrl: z.string().url().optional(),
});

/**
 * Stripe Checkout + billing portal + webhook routes.
 *
 *   POST /stripe/checkout        — creates a Checkout Session for a tier
 *   POST /stripe/portal          — creates a Billing Portal session
 *   POST /stripe/webhook         — Stripe webhook (raw body, no auth)
 *
 * The first two require auth; the webhook verifies the Stripe signature
 * header using STRIPE_WEBHOOK_SECRET.
 */
export async function stripeRoutes(app: FastifyInstance) {
  // ─── Webhook (must come first, no auth, raw body) ────────────────────
  // We need the raw body for Stripe signature verification. Scope the
  // raw-buffer content-type parser to the webhook route ONLY (via a child
  // plugin); the rest of the stripe routes keep the default JSON parser
  // so that `request.body` is parsed normally.
  await app.register(async (webhookScope) => {
    webhookScope.addContentTypeParser(
      'application/json',
      { parseAs: 'buffer' },
      (_req, body, done) => {
        done(null, body);
      },
    );

    webhookScope.post('/stripe/webhook', async (request, reply) => {
      if (!stripe) return reply.status(503).send({ error: 'stripe_not_configured' });
      if (!env.STRIPE_WEBHOOK_SECRET) {
        return reply.status(503).send({ error: 'webhook_secret_not_configured' });
      }

      const sig = request.headers['stripe-signature'] as string | undefined;
      if (!sig) return reply.status(400).send({ error: 'missing_signature' });

      const rawBody = request.body as Buffer;

    let event: Stripe.Event;
    try {
      event = stripe.webhooks.constructEvent(rawBody, sig, env.STRIPE_WEBHOOK_SECRET);
    } catch (err) {
      logger.warn({ err }, 'Stripe webhook signature verification failed');
      return reply.status(400).send({ error: 'invalid_signature' });
    }

    logger.info({ type: event.type, id: event.id }, 'Stripe webhook received');

    try {
      switch (event.type) {
        case 'checkout.session.completed': {
          const session = event.data.object as Stripe.Checkout.Session;
          await handleCheckoutCompleted(session);
          break;
        }
        case 'customer.subscription.created':
        case 'customer.subscription.updated': {
          const sub = event.data.object as Stripe.Subscription;
          await applySubscription(sub);
          break;
        }
        case 'customer.subscription.deleted': {
          const sub = event.data.object as Stripe.Subscription;
          await downgradeSubscription(sub);
          break;
        }
        default:
          // ignore other events
          break;
      }
    } catch (err) {
      logger.error({ err, type: event.type }, 'Stripe webhook handler failed');
      // Return 200 anyway — Stripe retries on non-2xx. We log and move on.
    }

      return reply.send({ received: true });
    });
  });

  // ─── Auth-required routes ────────────────────────────────────────────
  app.register(async (scoped) => {
    scoped.addHook('preHandler', requireAuth);

    /**
     * POST /stripe/checkout
     * Body: { tier: 'collector' | 'investor', successUrl?, cancelUrl? }
     *
     * Creates a Stripe Checkout Session for the requested tier, reusing the
     * user's existing Stripe customer if we have one.
     */
    scoped.post('/stripe/checkout', async (request, reply) => {
      if (!stripe) return reply.status(503).send({ error: 'stripe_not_configured' });

      const user = (request as any).user;
      if (!user) return reply.status(401).send({ error: 'user_not_found' });

      const parsed = checkoutSchema.safeParse(request.body);
      if (!parsed.success) {
        return reply.status(400).send({ error: 'validation_failed', details: parsed.error.issues });
      }

      const priceId = STRIPE_PRICE_IDS[parsed.data.tier];
      if (!priceId) {
        return reply.status(400).send({
          error: 'price_not_configured',
          detail: `Set STRIPE_PRICE_${parsed.data.tier.toUpperCase()} in the environment.`,
        });
      }

      // Create or reuse customer.
      let customerId = user.stripeCustomerId;
      if (!customerId) {
        const customer = await stripe.customers.create({
          email: user.email,
          name: user.displayName ?? undefined,
          metadata: { userId: user.id },
        });
        customerId = customer.id;
        await db
          .update(users)
          .set({ stripeCustomerId: customerId })
          .where(eq(users.id, user.id));
      }

      const origin = request.headers.origin ?? 'https://grailiq.com';
      const session = await stripe.checkout.sessions.create({
        mode: 'subscription',
        customer: customerId,
        line_items: [{ price: priceId, quantity: 1 }],
        success_url:
          parsed.data.successUrl ?? `${origin}/app?checkout=success&session_id={CHECKOUT_SESSION_ID}`,
        cancel_url: parsed.data.cancelUrl ?? `${origin}/app/pricing?checkout=canceled`,
        subscription_data: {
          trial_period_days: 14,
          metadata: { userId: user.id, tier: parsed.data.tier },
        },
        metadata: { userId: user.id, tier: parsed.data.tier },
        allow_promotion_codes: true,
      });

      return reply.send({ data: { id: session.id, url: session.url } });
    });

    /**
     * POST /stripe/portal
     * Opens the Stripe-hosted billing portal for the current user.
     */
    scoped.post('/stripe/portal', async (request, reply) => {
      if (!stripe) return reply.status(503).send({ error: 'stripe_not_configured' });

      const user = (request as any).user;
      if (!user) return reply.status(401).send({ error: 'user_not_found' });
      if (!user.stripeCustomerId) {
        return reply.status(400).send({ error: 'no_customer' });
      }

      const parsed = portalSchema.safeParse(request.body ?? {});
      if (!parsed.success) {
        return reply.status(400).send({ error: 'validation_failed', details: parsed.error.issues });
      }

      const session = await stripe.billingPortal.sessions.create({
        customer: user.stripeCustomerId,
        return_url: parsed.data.returnUrl ?? STRIPE_RETURN_URL,
      });

      return reply.send({ data: { url: session.url } });
    });

    /**
     * GET /stripe/subscription
     * Returns the user's current tier + basic subscription info (if any).
     */
    scoped.get('/stripe/subscription', async (request, reply) => {
      const user = (request as any).user;
      if (!user) return reply.status(401).send({ error: 'user_not_found' });

      return reply.send({
        data: {
          tier: user.subscriptionTier ?? 'free',
          trialEndsAt: user.trialEndsAt,
          hasCustomer: Boolean(user.stripeCustomerId),
        },
      });
    });
  });
}

// ─── Webhook handlers ───────────────────────────────────────────────────

async function handleCheckoutCompleted(session: Stripe.Checkout.Session) {
  const userId = session.metadata?.userId;
  const tier = session.metadata?.tier as 'collector' | 'investor' | undefined;

  if (!userId || !tier) return;

  // The subscription.created event also fires — this is defensive in case
  // that one is missed. Safe to run both.
  await db
    .update(users)
    .set({
      subscriptionTier: tier,
      stripeCustomerId: (session.customer as string) ?? undefined,
    })
    .where(eq(users.id, userId));

  logger.info({ userId, tier }, 'Stripe checkout completed — upgraded user');
}

async function applySubscription(sub: Stripe.Subscription) {
  const userId = sub.metadata.userId;
  const tier = sub.metadata.tier as 'collector' | 'investor' | undefined;
  if (!userId || !tier) return;

  const active = ['active', 'trialing', 'past_due'].includes(sub.status);
  const trialEndsAt = sub.trial_end ? new Date(sub.trial_end * 1000) : null;

  await db
    .update(users)
    .set({
      subscriptionTier: active ? tier : 'free',
      trialEndsAt: trialEndsAt ?? undefined,
    })
    .where(eq(users.id, userId));

  logger.info({ userId, tier, status: sub.status }, 'Stripe subscription applied');
}

async function downgradeSubscription(sub: Stripe.Subscription) {
  const userId = sub.metadata.userId;
  if (!userId) return;
  await db.update(users).set({ subscriptionTier: 'free' }).where(eq(users.id, userId));
  logger.info({ userId }, 'Stripe subscription canceled — downgraded to free');
}
