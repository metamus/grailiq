/**
 * Affiliate link helpers. Fill in env vars when retailer programs approved.
 * Each retailer has a specific parameter format for tracking affiliate clicks.
 */
export const AFFILIATE_IDS = {
  target: import.meta.env.VITE_TARGET_AFFILIATE_ID ?? '',
  tcgplayer: import.meta.env.VITE_TCGPLAYER_AFFILIATE_ID ?? '',
  ebay: import.meta.env.VITE_EBAY_PARTNER_ID ?? '',
  amazon: import.meta.env.VITE_AMAZON_TAG ?? '',
};

/**
 * Wraps a retailer URL with affiliate tracking parameters if an affiliate ID is configured.
 * @param retailer - Retailer name (case-insensitive)
 * @param url - Base URL to wrap
 * @returns URL with affiliate parameters appended, or original URL if no affiliate ID
 */
export function affiliate(retailer: string, url: string): string {
  const r = retailer.toLowerCase();
  const id = AFFILIATE_IDS[r as keyof typeof AFFILIATE_IDS];

  if (!id) return url;

  try {
    const u = new URL(url);

    if (r === 'target') {
      u.searchParams.set('afid', id);
    } else if (r === 'tcgplayer') {
      u.searchParams.set('partner', id);
    } else if (r === 'ebay') {
      u.searchParams.set('mkcid', id);
    } else if (r === 'amazon') {
      u.searchParams.set('tag', id);
    }

    return u.toString();
  } catch {
    // If URL is malformed, return original
    return url;
  }
}
