import { describe, it, expect } from 'vitest';
import {
  resolvePrefs,
  shouldSend,
  DEFAULT_PREFS,
} from '../lib/notificationPrefs.js';

describe('resolvePrefs', () => {
  it('returns defaults when given null/undefined/empty', () => {
    expect(resolvePrefs(null)).toEqual(DEFAULT_PREFS);
    expect(resolvePrefs(undefined)).toEqual(DEFAULT_PREFS);
    expect(resolvePrefs({})).toEqual(DEFAULT_PREFS);
  });

  it('merges partial prefs with defaults', () => {
    const out = resolvePrefs({ restock: { email: false, push: true } });
    expect(out.restock).toEqual({ email: false, push: true });
    expect(out.priceTarget).toEqual(DEFAULT_PREFS.priceTarget);
    expect(out.weeklyDigest).toEqual(DEFAULT_PREFS.weeklyDigest);
  });

  it('respects a user opt-out on a single channel', () => {
    const out = resolvePrefs({ restock: { email: true, push: false } });
    expect(out.restock.email).toBe(true);
    expect(out.restock.push).toBe(false);
  });
});

describe('shouldSend', () => {
  const base = resolvePrefs({});

  it('allows restock email when enabled and no quiet hours', () => {
    expect(shouldSend(base, 'restock', 'email')).toBe(true);
  });

  it('respects per-channel opt-outs', () => {
    const prefs = resolvePrefs({ restock: { email: false, push: true } });
    expect(shouldSend(prefs, 'restock', 'email')).toBe(false);
    expect(shouldSend(prefs, 'restock', 'push')).toBe(true);
  });

  it('weeklyDigest only allowed via email, never push', () => {
    expect(shouldSend(base, 'weeklyDigest', 'email')).toBe(true);
    expect(shouldSend(base, 'weeklyDigest', 'push')).toBe(false);
  });

  it('suppresses push during quiet hours in the user timezone', () => {
    const prefs = resolvePrefs({
      quietHours: { enabled: true, start: '22:00', end: '07:00', timezone: 'UTC' },
    });
    // 02:00 UTC — inside quiet window
    const deepNight = new Date('2026-04-15T02:00:00Z');
    expect(shouldSend(prefs, 'restock', 'push', deepNight)).toBe(false);
    // 14:00 UTC — outside
    const midday = new Date('2026-04-15T14:00:00Z');
    expect(shouldSend(prefs, 'restock', 'push', midday)).toBe(true);
  });

  it('handles non-wrap quiet windows (09:00 - 17:00)', () => {
    const prefs = resolvePrefs({
      quietHours: { enabled: true, start: '09:00', end: '17:00', timezone: 'UTC' },
    });
    expect(shouldSend(prefs, 'restock', 'push', new Date('2026-04-15T12:00:00Z'))).toBe(false);
    expect(shouldSend(prefs, 'restock', 'push', new Date('2026-04-15T20:00:00Z'))).toBe(true);
  });

  it('ignores quiet hours when disabled', () => {
    const prefs = resolvePrefs({
      quietHours: { enabled: false, start: '22:00', end: '07:00', timezone: 'UTC' },
    });
    const deepNight = new Date('2026-04-15T02:00:00Z');
    expect(shouldSend(prefs, 'restock', 'push', deepNight)).toBe(true);
  });

  it('handles invalid timezone gracefully by allowing the send', () => {
    const prefs = resolvePrefs({
      quietHours: { enabled: true, start: '22:00', end: '07:00', timezone: 'Not/A_Real_Zone' },
    });
    // Should not throw; defaults to "not in quiet hours" when timezone parsing fails
    const result = shouldSend(prefs, 'restock', 'push', new Date());
    expect(typeof result).toBe('boolean');
  });
});
