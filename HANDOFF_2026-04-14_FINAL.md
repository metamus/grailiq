# GrailIQ Final Handoff — 2026-04-14

Supersedes all prior HANDOFF files.

---

## ✅ Live in production

| Thing | State |
|---|---|
| `grailiq-web` on Cloudflare Pages | **Live** — deployed via Wrangler from commit `78e1a97` |
| `grailiq-api` on Railway | deployed (commit `ad4f74f`) |
| DB migrations (7) | applied to Supabase prod |
| Product thumbnails | 213 of 216 populated |
| `BEST_BUY_API_KEY` | set + verified |
| `STRIPE_SECRET_KEY` / `STRIPE_WEBHOOK_SECRET` | set in Railway (live keys) |
| `STRIPE_PRICE_COLLECTOR` | `price_1TMAYYIlwvzXT9D7qM2Ni92J` |
| `STRIPE_PRICE_INVESTOR` | `price_1TMAZ1IlwvzXT9D7tyFfcKvo` |
| `RESEND_API_KEY` | set in Railway |
| **Resend domain `grailiq.com`** | **VERIFIED** ✅ |
| DNS records for Resend | 3 records live in Cloudflare (DKIM + MX `send` + SPF `send`) |
| Supabase Site URL + redirect URLs | `https://grailiq.com`, `grailiq://auth-callback` |
| API tests | 16/16 passing |

Pages live on grailiq.com: `/`, `/score`, `/changelog`, `/status`, `/privacy`,
`/terms`, `/sign-in` (dark theme + Google/Apple), `/app/*` (ProtectedRoute).

M365 email — untouched. Resend records don't collide with M365's
`autodiscover`, `selector1/2._domainkey`, root MX, or root SPF.

---

## ⚠️ Deployment caveat — Cloudflare GitHub webhook is broken

The Cloudflare Pages → GitHub auto-deploy webhook stopped firing at some
point. I bypassed it by deploying with Wrangler CLI, which worked. But
future pushes to `master` **will not auto-deploy** until you reconnect
the integration.

**Two options to restore auto-deploy:**

**Option A (recommended) — keep Wrangler as your deploy tool.**

```bash
cd ~/Documents/Development/GrailIQ/grailiq-web
npm run build && npx wrangler pages deploy dist --project-name=grailiq-web --branch=master
```

Takes ~90 seconds end-to-end, no webhook needed. Can be scripted into
`SHIP_ME.sh` if you want.

**Option B — reconnect the GitHub integration.**

Cloudflare Dashboard → Workers & Pages → grailiq-web → Settings →
(look for "Source control" or "Builds & deployments" section) → **Reconnect**.
In the legacy Pages UI this is usually in Settings → Builds & deployments.
If you can't find it, `Delete project` and recreate, re-adding the
`grailiq.com` custom domain. Heavier, but cleanly reestablishes the
webhook.

Also: I changed the production branch from `main` to `master` in
Cloudflare Pages settings, so all future builds ship to grailiq.com
correctly regardless of which option you pick.

---

## 🟡 Still needs you

### 1. Google OAuth (~5 min)

Tied to your Google account:
1. <https://console.cloud.google.com/apis/credentials>
2. Create project `GrailIQ` if needed.
3. **+ Create Credentials** → **OAuth client ID** → **Web application**.
4. Authorized redirect URIs:
   ```
   https://ipsgkfonkurdepbrlgwl.supabase.co/auth/v1/callback
   grailiq://auth-callback
   ```
5. Paste me the Client ID + Secret. I'll enable Google in Supabase.

### 2. Stripe smoke test (~1 min)

1. <https://grailiq.com/sign-in> → sign in
2. <https://grailiq.com/app/pricing>
3. **Start 14-day trial** on Collector
4. Should hit Stripe Checkout with `$9.99/month` + "14 days free" banner
5. Test card `4242 4242 4242 4242` → completes → your tier updates to `collector`

### 3. Retailer mapping seed — manual

Auto-discovery walls confirmed (Akamai on Pokémon Center, anti-bot on
Target RedSky, zero sealed TCG on Best Buy). Seed 5–10 products manually
via <https://grailiq.com/app/admin/retailers>. Focus on **Target** and
**Pokémon Center**.

### 4. Mobile rebuild (~2 min on your Mac)

```bash
cd ~/Documents/Development/GrailIQ/grailiq-mobile
rm -rf ios android node_modules/.cache
npx expo prebuild --clean
cd ios && pod install && cd ..
npx expo run:ios
```

### 5. Apple OAuth — deferred

Requires $99/yr Apple Developer account. Revisit before App Store submission.

---

## 🟥 Known non-issues

- **eBay API** — awaiting their approval. External, no action.
- **TCGPlayer API** — closed to new registrations. Scraper works.
- **Pokémon Center proxy** — Akamai blocks Railway IPs. Low priority.
- **Cloudflare GitHub webhook** — see caveat above. Non-blocking with Wrangler.

---

## Final checklist — priority order

1. [ ] Stripe smoke test at `/app/pricing`
2. [ ] Mobile prebuild
3. [ ] Google OAuth creds → paste me
4. [ ] Seed 5–10 retailer mappings at `/app/admin/retailers`
5. [ ] Decide on Wrangler-only deploys vs reconnecting GitHub webhook
6. [ ] Apple Sign in — only at App Store submission time
