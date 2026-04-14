/**
 * Feature-flag helper.
 *
 * Flags live in `users.feature_flags` as a JSONB blob. Each flag has a
 * known default declared here; routes call `isFlagEnabled(user, 'key')`
 * and get either the per-user override or the default without sprinkling
 * JSON parsing everywhere.
 *
 * Adding a new flag:
 *   1. Add it to DEFAULT_FLAGS with its default boolean
 *   2. Read with `isFlagEnabled(user, 'key')`
 *   3. Set per-user with a direct `UPDATE users SET feature_flags = ...`
 *      (or an admin endpoint if we add one)
 */

export type FeatureFlag =
  | 'watchlist'
  | 'ai_summaries'
  | 'beta_signals'
  | 'weekly_digest_opt_in';

export const DEFAULT_FLAGS: Record<FeatureFlag, boolean> = {
  watchlist: true, // shipped — default on
  ai_summaries: false, // not shipped yet
  beta_signals: false, // experimental scoring tweaks
  weekly_digest_opt_in: true, // investor tier gets it by default
};

interface FlagCarrier {
  featureFlags?: unknown;
}

export function isFlagEnabled(user: FlagCarrier | null | undefined, flag: FeatureFlag): boolean {
  if (!user) return DEFAULT_FLAGS[flag];
  const flags = (user.featureFlags ?? {}) as Record<string, unknown>;
  if (typeof flags[flag] === 'boolean') return flags[flag] as boolean;
  return DEFAULT_FLAGS[flag];
}

/** Return all flags resolved for this user (useful for `/me` endpoint). */
export function resolveFlags(user: FlagCarrier | null | undefined): Record<FeatureFlag, boolean> {
  const out = { ...DEFAULT_FLAGS };
  const flags = ((user?.featureFlags ?? {}) as Record<string, unknown>) ?? {};
  for (const key of Object.keys(DEFAULT_FLAGS) as FeatureFlag[]) {
    if (typeof flags[key] === 'boolean') out[key] = flags[key] as boolean;
  }
  return out;
}
