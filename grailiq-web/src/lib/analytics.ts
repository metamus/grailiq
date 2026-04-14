import { api } from './api';

/**
 * Lightweight first-party analytics.
 *
 *   track('landing_cta_click', { cta: 'hero_primary' })
 *   page('/score')
 *
 * Events are POSTed to /api/v1/events. Auth token attached when present so
 * user_id can be resolved server-side; otherwise anonymous with a rotating
 * sessionId in localStorage.
 *
 * All errors are swallowed — analytics must never break the UI.
 */

const SESSION_KEY = 'grailiq.sid';

function getSessionId(): string {
  try {
    let sid = localStorage.getItem(SESSION_KEY);
    if (!sid) {
      sid = (crypto.randomUUID ? crypto.randomUUID() : String(Math.random())).slice(0, 32);
      localStorage.setItem(SESSION_KEY, sid);
    }
    return sid;
  } catch {
    return 'no-storage';
  }
}

export async function track(
  name: string,
  properties: Record<string, unknown> = {},
): Promise<void> {
  try {
    await api.post('/events', {
      name,
      sessionId: getSessionId(),
      properties,
      path: typeof window !== 'undefined' ? window.location.pathname : undefined,
      referrer: typeof document !== 'undefined' ? document.referrer : undefined,
    });
  } catch {
    // Intentional swallow
  }
}

export function page(path?: string) {
  return track('page_view', {
    title: typeof document !== 'undefined' ? document.title : undefined,
    path: path ?? (typeof window !== 'undefined' ? window.location.pathname : undefined),
  });
}
