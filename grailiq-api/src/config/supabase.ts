import { createClient } from '@supabase/supabase-js';
import { env } from './env.js';

/** Supabase admin client (service role - bypasses RLS) for server-side operations */
export const supabaseAdmin = createClient(env.SUPABASE_URL, env.SUPABASE_SERVICE_ROLE_KEY, {
  auth: { autoRefreshToken: false, persistSession: false },
});

/** Create a Supabase client scoped to a user's JWT (respects RLS) */
export function createUserClient(accessToken: string) {
  return createClient(env.SUPABASE_URL, env.SUPABASE_ANON_KEY, {
    global: { headers: { Authorization: `Bearer ${accessToken}` } },
  });
}
