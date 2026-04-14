import * as WebBrowser from 'expo-web-browser';
import * as Linking from 'expo-linking';
import { supabase } from './supabase';

/**
 * OAuth sign-in for mobile via Supabase + Expo.
 *
 * Flow:
 *   1. Ask Supabase for the provider auth URL with skipBrowserRedirect=true
 *      so we get the URL back instead of attempting a page-level redirect
 *      (which doesn't work in React Native).
 *   2. Open that URL in an in-app browser via WebBrowser.openAuthSessionAsync.
 *      iOS uses SFAuthenticationSession / ASWebAuthenticationSession so the
 *      user's existing provider cookies are available.
 *   3. The provider redirects back to our `grailiq://auth-callback` deep
 *      link carrying `#access_token=...&refresh_token=...`.
 *   4. Parse those tokens and call supabase.auth.setSession.
 *
 * Requires the URL scheme `grailiq://` to be registered as a redirect URL
 * in the Supabase project settings and in the Google / Apple provider
 * configs.
 */

WebBrowser.maybeCompleteAuthSession();

const REDIRECT_TO = Linking.createURL('auth-callback');

export type OAuthProvider = 'google' | 'apple';

export async function signInWithProvider(
  provider: OAuthProvider,
): Promise<{ ok: boolean; error?: string }> {
  try {
    const { data, error } = await supabase.auth.signInWithOAuth({
      provider,
      options: {
        redirectTo: REDIRECT_TO,
        skipBrowserRedirect: true,
      },
    });

    if (error || !data.url) {
      return { ok: false, error: error?.message ?? 'no_auth_url' };
    }

    const result = await WebBrowser.openAuthSessionAsync(data.url, REDIRECT_TO);

    if (result.type === 'success') {
      const parsed = parseCallback(result.url);
      if (parsed?.access_token && parsed?.refresh_token) {
        const { error: setErr } = await supabase.auth.setSession({
          access_token: parsed.access_token,
          refresh_token: parsed.refresh_token,
        });
        if (setErr) return { ok: false, error: setErr.message };
        return { ok: true };
      }
      if (parsed?.error_description) {
        return { ok: false, error: parsed.error_description };
      }
      return { ok: false, error: 'no_tokens_in_callback' };
    }
    if (result.type === 'cancel' || result.type === 'dismiss') {
      return { ok: false, error: 'canceled' };
    }
    return { ok: false, error: 'browser_failed' };
  } catch (err) {
    return { ok: false, error: err instanceof Error ? err.message : String(err) };
  }
}

/**
 * Supabase returns tokens in the URL fragment (#...) for implicit flow, or in
 * the query (?code=...) for PKCE. Handle both.
 */
function parseCallback(url: string): Record<string, string> | null {
  try {
    const hashIndex = url.indexOf('#');
    const queryIndex = url.indexOf('?');
    const start = hashIndex >= 0 ? hashIndex + 1 : queryIndex >= 0 ? queryIndex + 1 : -1;
    if (start < 0) return null;
    const params = new URLSearchParams(url.slice(start));
    const out: Record<string, string> = {};
    params.forEach((v, k) => (out[k] = v));
    return out;
  } catch {
    return null;
  }
}
