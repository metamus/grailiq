import { z } from 'zod';
import 'dotenv/config';

/** Zod schema for environment variable validation */
const envSchema = z.object({
  PORT: z.coerce.number().default(3000),
  NODE_ENV: z.enum(['development', 'production', 'test']).default('development'),
  DATABASE_URL: z.string().url(),
  REDIS_URL: z.string().optional().default(''),
  SUPABASE_URL: z.string().url(),
  SUPABASE_ANON_KEY: z.string(),
  SUPABASE_SERVICE_ROLE_KEY: z.string(),
  TCGPLAYER_API_KEY: z.string().optional(),
  TCGPLAYER_API_SECRET: z.string().optional(),
  EBAY_APP_ID: z.string().optional(),
  EBAY_CERT_ID: z.string().optional(),
  STRIPE_SECRET_KEY: z.string().optional(),
  STRIPE_WEBHOOK_SECRET: z.string().optional(),
  RESEND_API_KEY: z.string().optional(),
  SENTRY_DSN: z.string().optional(),
  PROXY_URL: z.string().optional(),
  POKEMON_TCG_API_KEY: z.string().optional(),

  // Retailer stock-check credentials
  TARGET_REDSKY_KEY: z.string().optional(),
  TARGET_STORE_ID: z.string().optional(),
  BEST_BUY_API_KEY: z.string().optional(),
});

/** Validated environment configuration */
export const env = envSchema.parse(process.env);

export type Env = z.infer<typeof envSchema>;
