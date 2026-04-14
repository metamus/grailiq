import { BROWSER_USER_AGENT, DEFAULT_CHECK_TIMEOUT_MS } from './types.js';

/**
 * Fetch wrapper with timeout + realistic headers.
 * Never throws for non-2xx — returns the response so adapters can inspect it.
 * Throws only for network/timeout errors so the caller can catch → error result.
 */
export async function stockFetch(
  url: string,
  init: RequestInit = {},
  timeoutMs = DEFAULT_CHECK_TIMEOUT_MS,
): Promise<Response> {
  const controller = new AbortController();
  const timer = setTimeout(() => controller.abort(), timeoutMs);

  try {
    return await fetch(url, {
      ...init,
      signal: controller.signal,
      headers: {
        'User-Agent': BROWSER_USER_AGENT,
        Accept: 'text/html,application/xhtml+xml,application/json;q=0.9,*/*;q=0.8',
        'Accept-Language': 'en-US,en;q=0.9',
        'Cache-Control': 'no-cache',
        ...(init.headers ?? {}),
      },
      redirect: 'follow',
    });
  } finally {
    clearTimeout(timer);
  }
}

/**
 * Parse the first reasonable USD price from an arbitrary string of HTML/JSON.
 * Used as a best-effort fallback for adapters that can't surface a structured price.
 */
export function extractFirstPrice(input: string): number | undefined {
  const match = input.match(/\$(\d{1,4}(?:\.\d{2})?)/);
  if (!match) return undefined;
  const n = parseFloat(match[1]);
  return Number.isFinite(n) && n > 0.5 && n < 100_000 ? n : undefined;
}
