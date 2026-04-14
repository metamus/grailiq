#!/usr/bin/env bash
# One-shot commit + push for GrailIQ.
# Run from repo root:  bash SHIP_ME.sh
#
# The sandbox that drives Claude can't write into .git/, so this script
# does what a Claude agent would do if it could: add, commit with a full
# message, push to master. Re-runnable — aborts cleanly if there's nothing
# to commit.

set -euo pipefail

# Safety: remove any stale locks if a prior run aborted
rm -f .git/index.lock .git/HEAD.lock .git/refs/heads/master.lock 2>/dev/null || true

# Stage only our three project trees so we don't accidentally include
# editor temp files or .DS_Store.
git add .gitignore grailiq-api grailiq-web grailiq-mobile SHIP_NOTES_*.md || true

# Bail if nothing's staged
if git diff --cached --quiet; then
  echo "Nothing to commit — working tree matches HEAD."
  exit 0
fi

echo "Staged changes:"
git diff --cached --stat

COMMIT_MSG=$(cat <<'EOF'
feat: huge surface expansion across web + mobile + API

API
- score_history table + daily snapshot on scoreWorker + /products/movers
- watchlist_items table + full CRUD + /watchlist/toggle
- feature_flags + notification_prefs JSONB columns on users
- GET/PATCH /me + PATCH /me/notifications + defaults endpoint
- analytics_events table + POST /events (single or batch, ip_hash)
- /portfolio/export.csv (all tiers) + /portfolio/export.pdf (Collector+)
- notificationWorker respects user prefs + timezone-aware quiet hours
- /admin/health observability snapshot + /admin/retailer-mappings bulk upsert
- Stripe: checkout + portal + webhook with signature verify + /stripe/subscription
- Retailer stock adapters: pokemon_center, target, best_buy, amazon stub, walmart
- restockWorker with change detection (false->true only fires notifications)
- Expo push notifications: push_tokens + /push/register + expoPush service
- Insurance PDF via pdfkit
- Weekly digest worker + Mon 14:00 UTC schedule (Investor tier)
- Free-tier paywall: 25 portfolio items / 3 active alerts -> 402
- Catalog cleanup: 70 generic names fixed, 17 duplicate sets merged

Web
- Landing v2 with comparison + 7 real FAQs + phone mockup + live ticker
- Dashboard v2 dark theme + real weekly movers widget
- ProductDetail + SetDetail dark rewrites with sparklines
- /app/admin, /app/watchlist, /app/compare, /app/pricing (Stripe wired)
- /score (SEO), /status, /changelog, 404
- SignIn v2: Google + Apple OAuth + password reset
- OnboardingModal 5-step first-visit tour
- ErrorBoundary around app tree
- usePageTracking emits page_view on every route change
- SEO: robots, sitemap, OG + Twitter + JSON-LD meta, SVG OG image
- AppLayout main bg dark, mobile bottom nav dark
- Watch toggle on ProductDetail
- Heart-icon watchlist integration

Mobile
- Watchlist tab with per-row sparklines + long-press to remove
- Settings tab with biometric toggle + tier display
- Watch/Alert/Add action row on ProductDetail
- expo-notifications push registration + tap-to-deep-link
- Biometric lock via expo-local-authentication + SecureStore
- BiometricGate wrapping AppNavigator with 2-min idle timeout

Migrations applied to prod Supabase (idempotent):
- 001_retailer_products
- 002_push_tokens
- 003_score_history
- 004_watchlist_items
- 005_user_feature_flags
- 006_analytics_events
- 007_notification_preferences
EOF
)

git commit -m "$COMMIT_MSG"

echo
echo "Pushing to origin master..."
git push origin master

echo
echo "✓ Shipped. Cloudflare Pages (grailiq-web) and Railway (grailiq-api) will auto-deploy."
echo "✓ Mobile: run  cd grailiq-mobile && npx expo start --clear  to pull the latest."
