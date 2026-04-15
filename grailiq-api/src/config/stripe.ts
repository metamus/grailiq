import Stripe from 'stripe';
import { env } from './env.js';
import { logger } from '../lib/logger.js';

/**
 * Stripe SDK instance.
 *
 * Returns `null` if STRIPE_SECRET_KEY isn't configured — routes should guard
 * on this and respond with 503 rather than crashing. This lets the API boot
 * in local/test environments without a Stripe key.
 */
export const stripe = env.STRIPE_SECRET_KEY
  ? new Stripe(env.STRIPE_SECRET_KEY, {
      apiVersion: '2025-02-24.acacia',
      typescript: true,
    })
  : null;

if (!stripe) {
  logger.info('STRIPE_SECRET_KEY not set — Stripe features disabled');
}

/**
 * Plan → Stripe Price ID map. Configure these in Railway env vars pointing at
 * prices you've created in your Stripe dashboard. The checkout endpoint reads
 * them by tier + billing period.
 *
 * Set in Railway:
 *   STRIPE_PRICE_COLLECTOR_MONTHLY=price_xxxxx
 *   STRIPE_PRICE_COLLECTOR_ANNUAL=price_xxxxx
 *   STRIPE_PRICE_INVESTOR_MONTHLY=price_xxxxx
 *   STRIPE_PRICE_INVESTOR_ANNUAL=price_xxxxx
 *   STRIPE_PRICE_PRO_MONTHLY=price_xxxxx
 *   STRIPE_PRICE_PRO_ANNUAL=price_xxxxx
 *
 * Falls back to legacy env vars if new ones not set:
 *   STRIPE_PRICE_COLLECTOR=price_xxxxx (monthly)
 *   STRIPE_PRICE_INVESTOR=price_xxxxx (monthly)
 */
export const STRIPE_PRICE_IDS: Record<string, string | undefined> = {
  // Collector
  'collector_monthly': process.env.STRIPE_PRICE_COLLECTOR_MONTHLY || process.env.STRIPE_PRICE_COLLECTOR,
  'collector_annual': process.env.STRIPE_PRICE_COLLECTOR_ANNUAL,
  // Investor
  'investor_monthly': process.env.STRIPE_PRICE_INVESTOR_MONTHLY || process.env.STRIPE_PRICE_INVESTOR,
  'investor_annual': process.env.STRIPE_PRICE_INVESTOR_ANNUAL,
  // Pro (restock-only)
  'pro_monthly': process.env.STRIPE_PRICE_PRO_MONTHLY,
  'pro_annual': process.env.STRIPE_PRICE_PRO_ANNUAL,
  // Legacy fallbacks (for backward compat)
  collector: process.env.STRIPE_PRICE_COLLECTOR,
  investor: process.env.STRIPE_PRICE_INVESTOR,
};

/** Billing portal return URL — where Stripe sends the user after managing billing. */
export const STRIPE_RETURN_URL =
  process.env.STRIPE_RETURN_URL ?? 'https://grailiq.com/app';
