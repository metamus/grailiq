/**
 * Notification preference schema + resolver.
 *
 * Canonical defaults live here so the notificationWorker can short-circuit
 * without re-hydrating defaults in-worker. Shape:
 *
 *   {
 *     restock:      { email: true,  push: true },
 *     priceTarget:  { email: true,  push: true },
 *     weeklyDigest: { email: true },
 *     quietHours:   { enabled: false, start: "22:00", end: "07:00", timezone: "UTC" }
 *   }
 */

export type NotifChannel = 'email' | 'push';

export interface NotificationPrefs {
  restock: Record<NotifChannel, boolean>;
  priceTarget: Record<NotifChannel, boolean>;
  weeklyDigest: { email: boolean };
  quietHours: {
    enabled: boolean;
    start: string; // 'HH:MM'
    end: string;
    timezone: string;
  };
}

export const DEFAULT_PREFS: NotificationPrefs = {
  restock: { email: true, push: true },
  priceTarget: { email: true, push: true },
  weeklyDigest: { email: true },
  quietHours: {
    enabled: false,
    start: '22:00',
    end: '07:00',
    timezone: 'UTC',
  },
};

type RawPrefs = Partial<NotificationPrefs> | null | undefined;

/** Merge a user's stored prefs with defaults, channel by channel. */
export function resolvePrefs(raw: unknown): NotificationPrefs {
  const r = (raw ?? {}) as RawPrefs;
  return {
    restock: { ...DEFAULT_PREFS.restock, ...(r?.restock ?? {}) },
    priceTarget: { ...DEFAULT_PREFS.priceTarget, ...(r?.priceTarget ?? {}) },
    weeklyDigest: { ...DEFAULT_PREFS.weeklyDigest, ...(r?.weeklyDigest ?? {}) },
    quietHours: { ...DEFAULT_PREFS.quietHours, ...(r?.quietHours ?? {}) },
  };
}

/**
 * Should we send `type` via `channel` right now?
 * Returns false when the user opted out OR we're inside their quiet-hours
 * window.
 */
export function shouldSend(
  prefs: NotificationPrefs,
  type: 'restock' | 'priceTarget' | 'weeklyDigest',
  channel: NotifChannel,
  now: Date = new Date(),
): boolean {
  if (type === 'weeklyDigest') {
    if (channel !== 'email') return false;
    return prefs.weeklyDigest.email;
  }
  const opted = prefs[type]?.[channel] ?? true;
  if (!opted) return false;
  if (!prefs.quietHours.enabled) return true;
  // Check quiet hours in the user's timezone.
  try {
    const fmt = new Intl.DateTimeFormat('en-US', {
      timeZone: prefs.quietHours.timezone,
      hour: '2-digit',
      minute: '2-digit',
      hour12: false,
    });
    const parts = fmt.formatToParts(now);
    const hour = parseInt(parts.find((p) => p.type === 'hour')?.value ?? '0', 10);
    const minute = parseInt(parts.find((p) => p.type === 'minute')?.value ?? '0', 10);
    const cur = hour * 60 + minute;
    const [sh, sm] = prefs.quietHours.start.split(':').map(Number);
    const [eh, em] = prefs.quietHours.end.split(':').map(Number);
    const start = sh * 60 + sm;
    const end = eh * 60 + em;
    // Handle wrap-around (e.g. 22:00 → 07:00)
    const inQuiet = start < end ? cur >= start && cur < end : cur >= start || cur < end;
    return !inQuiet;
  } catch {
    return true;
  }
}
