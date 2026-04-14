# GrailIQ — What You Need To Do

Everything I can't finish for you, organized so you can knock them out in
the order that unblocks the most downstream work.

**Bolded items = do first.** Each item has: what to do, why, how long.

---

## 🚀 Deploy the latest code (3 min, do right now)

Two deploys pending on your Mac — web and API:

```bash
# Web — ships /today page, inline Score demo, Score visibility pass,
# italic serif motif, branded product-type icons, affiliate helper
cd ~/Documents/Development/GrailIQ/grailiq-web
npm run build
npx wrangler pages deploy dist --project-name=grailiq-web --branch=master --commit-dirty=true
```

```bash
# API — ships public API scaffolding at /api/v1/public/*
cd ~/Documents/Development/GrailIQ/grailiq-api
git add -A
git commit -m "feat(api): public REST API scaffolding for Investor tier"
git push origin master
# Railway auto-deploys on push (this one is wired correctly)
```

Then reply "deployed" and I'll verify live.

---

## 🔐 Account & auth (15 min total)

**1. Stripe smoke test** — 2 min
- Sign in at <https://grailiq.com/sign-in>
- Go to <https://grailiq.com/app/pricing>
- Click "Start 14-day trial" on Collector
- Test card `4242 4242 4242 4242`, any future expiry, any CVC, any ZIP
- Confirms Stripe webhook + paywall + tier upgrade works end-to-end

**2. Google OAuth client** — 5 min
- <https://console.cloud.google.com/apis/credentials> → create project `GrailIQ`
- **Create Credentials** → **OAuth client ID** → **Web application**
- Authorized redirect URIs (paste both):
  ```
  https://ipsgkfonkurdepbrlgwl.supabase.co/auth/v1/callback
  grailiq://auth-callback
  ```
- Paste Client ID + Secret back to me. I'll enable Google in Supabase.

**3. Apple OAuth** — DEFER until App Store submission (needs $99 dev account)

---

## 💳 Stripe products for new pricing (10 min)

When you're ready to move from current 2-tier to 3-tier pricing (the
creative-review recommendation), create these in Stripe Dashboard →
Products:

**Tier A — Collector @ $14/mo + $140/yr**
- Monthly: `Collector Monthly` / $14.00 / recurring / monthly
- Annual: `Collector Annual` / $140.00 / recurring / yearly (label: "2 months free")

**Tier B — Investor @ $39/mo + $390/yr**
- Monthly: `Investor Monthly` / $39.00 / recurring / monthly
- Annual: `Investor Annual` / $390.00 / recurring / yearly

**Tier C — Pro (restocks only) @ $19/mo + $190/yr**
- Monthly: `Pro Monthly` / $19.00 / recurring / monthly
- Annual: `Pro Annual` / $190.00 / recurring / yearly

After creating, copy all 6 price IDs and paste them to me. I'll update
Railway env vars (`STRIPE_PRICE_*`) and wire the pricing page.

Also: create a **Stripe Coupon** called `REFER3` — 100% off for 1 month —
for the referral program.

---

## 🛒 Retailer affiliate programs (30–60 min each)

You need to sign up for these retailer affiliate programs and paste me
the affiliate IDs. I'll wire them into every outbound retailer link
across the site.

**1. Target Partners (via Impact)** — <https://partners.target.com>
- Sign up as affiliate, wait for approval (~2–5 days)
- Once approved, grab your affiliate ID
- Add to Railway as `VITE_TARGET_AFFILIATE_ID`

**2. TCGPlayer Affiliate** — <https://tcgplayer.pxf.io/>
- Sign up via Partnerize, instant approval for most
- Grab your `PID` and partner ID
- Add to Railway as `VITE_TCGPLAYER_AFFILIATE_ID`

**3. eBay Partner Network** — <https://partnernetwork.ebay.com/>
- Sign up, approval 24–48 hours
- Grab your Campaign ID
- Add to Railway as `VITE_EBAY_PARTNER_ID`

**4. Amazon Associates** (optional)
- <https://affiliate-program.amazon.com/>
- Add as `VITE_AMAZON_TAG`

---

## 🌐 Retailer data work (ongoing)

**Pokémon Center residential proxy** — $20-500/mo recurring
- Options ranked by cost: Crawlbase pay-per-use ($3/1K requests),
  Brightdata ($500/mo for unlimited residential), Oxylabs (similar)
- Start with Crawlbase — cheapest, scales with usage
- Sign up, get API key, paste me → I'll wire `discover-pokemon-center.ts`
  through the proxy

**Seed 5–10 retailer mappings** — 15 min
- <https://grailiq.com/app/admin/retailers>
- Add Target TCINs (8-digit number in `/p/.../A-93954435`)
- Add Pokémon Center URLs (URL alone is enough)
- Focus on your top-score products

---

## 📱 Mobile (requires Xcode + time on your Mac)

**1. Prebuild** — 3 min
```bash
cd ~/Documents/Development/GrailIQ/grailiq-mobile
rm -rf ios android node_modules/.cache
npx expo prebuild --clean
cd ios && pod install && cd ..
npx expo run:ios
```

Validates the 6→4 tab consolidation I shipped this session (Home +
Discover + Watch + Settings).

**2. Apple Developer account** — $99/yr — when ready for TestFlight
- <https://developer.apple.com/programs/>
- Gets you: Sign in with Apple, Push certs, TestFlight, App Store

**3. Google Play Console** — $25 one-time — when ready for Android
- <https://play.google.com/console>

**4. App Store Connect setup** — 2 hours the day before submission
- Screenshots, category = **Finance** (not Entertainment), keywords,
  privacy labels, demo account credentials for review

---

## 🤝 Community & growth (founder-driven)

**1. Claim @grailiq handles** — 20 min
- X, Instagram, TikTok, Reddit, YouTube, Discord, LinkedIn, GitHub
- Do this before any public announcement to prevent squatting

**2. Launch Discord server** — 30 min
- Create the server, 4-5 channels (#announcements, #restock-alerts,
  #general, #show-and-tell, #support)
- Drop the invite link in Notion — I'll wire it to the landing footer

**3. Create r/GrailIQ subreddit** — 10 min
- Mod queue set, auto-flair for restock posts, sidebar with
  @grailiq handles

**4. Creator partnerships** — several hours of email over ~2 weeks
- Outreach list (in priority order): PokeRev, Smpratic, PTCGRadio,
  TrayTCG, PokeBallerMike
- Offer: unique 10% discount code (I'll create in Stripe) + 20% rev
  share on signups via their code
- Track in Notion Backlog → F4

**5. Product Hunt launch** — half a day, schedule in Q3
- Already in Launch Checklist
- Need: teaser page, hunter commitment, launch-day Discord/Reddit push

---

## 🏛️ Legal / business

**1. USPTO trademark search + filing** — 15 min search, 30 min filing
- Search: <https://tmsearch.uspto.gov> for GRAILIQ
- If clear: file an intent-to-use application via TEAS Plus ($350)
- Alternatively use LegalZoom for the filing

**2. Privacy policy + Terms review** — 30 min
- Already published at grailiq.com/privacy and /terms
- Get a real lawyer to review before adding paid users

**3. Financial disclaimer** — already on /score, needs to appear on
  every product page that shows ratings. In the Notion Backlog as
  P2 when you want me to add.

---

## 📧 External API approvals (waiting on third parties)

**1. eBay Developer Program** — already submitted, awaiting approval
- Check status at <https://developer.ebay.com>
- Paste me the credentials when approved

**2. TCGPlayer API** — confirmed closed to new registrations
- Workaround: existing scraper in `services/scraper.ts` works
- Alternative: CardLadder commercial API (contact sales)

**3. PSA Pop Report API / CGC API** — low priority
- Both have limited access; workaround is deep-linking to their
  public pop lookup pages (already in Backlog as C5)

---

## 🎯 What I'll ship next (no action from you needed)

While you're working through the above, I can autonomously knock out:

- **C6** Shareable Score card image generator (OG image endpoint)
- **B4** Product hero photography — I'll write a scraper, you run it once
- **C7** Investment thesis paragraph per product (LLM pipeline)
- **F1 cron** Daily Grail auto-rotation (API cron job)
- **H4** Community signal layer (Reddit + TikTok trending bots)
- **A3** More landing polish (animated iPhone mockup)

Just tell me to continue and I'll keep shipping.

---

## 📊 Status summary

- **14 of 50 backlog items** → Done
- **0 items** → In Progress
- **36 items** → Open (split: ~20 I can do autonomously, ~16 need you)

Best return on your 2 hours of time: Stripe smoke test + Google OAuth +
claim social handles + seed 5 retailer mappings. That unblocks 60% of
the rest.

---

*Updated 2026-04-14 end of day.*
