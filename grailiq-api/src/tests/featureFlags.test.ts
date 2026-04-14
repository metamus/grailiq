import { describe, it, expect } from 'vitest';
import { isFlagEnabled, resolveFlags, DEFAULT_FLAGS } from '../lib/featureFlags.js';

describe('isFlagEnabled', () => {
  it('returns default when user has no override', () => {
    expect(isFlagEnabled({ featureFlags: {} }, 'watchlist')).toBe(DEFAULT_FLAGS.watchlist);
    expect(isFlagEnabled(null, 'watchlist')).toBe(DEFAULT_FLAGS.watchlist);
    expect(isFlagEnabled(undefined, 'ai_summaries')).toBe(DEFAULT_FLAGS.ai_summaries);
  });

  it('respects explicit per-user overrides', () => {
    const user = { featureFlags: { ai_summaries: true, watchlist: false } };
    expect(isFlagEnabled(user, 'ai_summaries')).toBe(true);
    expect(isFlagEnabled(user, 'watchlist')).toBe(false);
    // Flag not in user's dict → falls back to default
    expect(isFlagEnabled(user, 'beta_signals')).toBe(DEFAULT_FLAGS.beta_signals);
  });

  it('ignores non-boolean values in the flags dict', () => {
    const user = { featureFlags: { ai_summaries: 'yes' as unknown as boolean } };
    expect(isFlagEnabled(user, 'ai_summaries')).toBe(DEFAULT_FLAGS.ai_summaries);
  });
});

describe('resolveFlags', () => {
  it('always returns every declared flag', () => {
    const out = resolveFlags({ featureFlags: {} });
    expect(Object.keys(out).sort()).toEqual(Object.keys(DEFAULT_FLAGS).sort());
  });

  it('applies overrides while keeping other defaults intact', () => {
    const out = resolveFlags({ featureFlags: { ai_summaries: true } });
    expect(out.ai_summaries).toBe(true);
    expect(out.watchlist).toBe(DEFAULT_FLAGS.watchlist);
  });
});
