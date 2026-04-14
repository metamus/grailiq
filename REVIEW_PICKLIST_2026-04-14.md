# GrailIQ — Review Picklist

Every enhancement from the creative review, broken out as a discrete item
you can say YES / NO / LATER to. Grouped by area. Each item has:

- **Type** — ADD (new) / UPDATE (improve) / CHANGE (replace) / REMOVE (cut)
- **Effort** — S (hours) / M (days) / L (week+)
- **Priority hint** — ⭐⭐⭐ (do first) / ⭐⭐ (do soon) / ⭐ (nice to have)

Once you've marked up the ones you want, I'll create Backlog entries in
Notion with Epic linkage, story points, and sprint assignment.

---

## A. Landing page (grailiq.com/)

- [ ] **A1. ADD — Rotating hero subheadline for enthusiast audience.** Pair the "Know what your grails are *actually* worth" investor line with a rotating warmer line for non-investors. ⭐⭐⭐ S
- [ ] **A2. ADD — "Try a Score" inline demo on the hero.** Dropdown that lets a visitor pick a set, renders a live Score card without signup. ⭐⭐⭐ M
- [ ] **A3. UPDATE — Animate the iPhone mockup.** Currently static PNG. Animate portfolio number counting up, sparkline drawing, Grail Alert sliding in. ⭐⭐ S
- [ ] **A4. UPDATE — Slow down the live market ticker and add product thumbnails.** 24×24 product images, 3 items visible at a time, readable scroll speed. ⭐⭐ S
- [ ] **A5. UPDATE — Restore 3 testimonials with gold 5-star ratings.** They're in the Launch Checklist but missing from live. ⭐⭐ S
- [ ] **A6. ADD — Cited data sources strip.** "Prices verified against TCGPlayer, PriceCharting, eBay sold listings." Borrows credibility. ⭐ S
- [ ] **A7. UPDATE — Second CTA copy.** "See the Platform" is vague. Replace with "See a sample collection" linking to a seeded demo dashboard. ⭐⭐ S

## B. Visual system / brand

- [ ] **B1. CHANGE — BUY signal color from emerald → gold.** Aligns strongest rating with your premium brand color. ⭐⭐⭐ S
- [ ] **B2. UPDATE — Score badge → radial progress ring.** Color-coded ring instead of just a number. More scannable, works as hero on shareable images. ⭐⭐ M
- [ ] **B3. ADD — Italic serif "grails" motif as a recurring brand element.** Use the same face for portfolio totals, rarity tags, product name highlights. ⭐ S
- [ ] **B4. ADD — Real product photography for all 216 products.** One-time scrape from retailer APIs. Replaces emoji product-type icons (📦 🎯 🃏). ⭐⭐⭐ M
- [ ] **B5. UPDATE — Empty states.** "0 Buy Signals" today is dead. Every empty state should be an onboarding prompt. ⭐⭐ S
- [ ] **B6. UPDATE — Dark theme applied to `/app/*` routes.** Pre-auth pages are dark, app routes revert to light. Ship parity. ⭐⭐⭐ M

## C. Product detail / SetDetail

- [ ] **C1. ADD — EV (expected value) calculator per sealed product.** "Open this box = ~$X average pull value." Highest-requested feature in the TCG space. ⭐⭐⭐ L
- [ ] **C2. ADD — Rip vs Hold signal.** Second axis next to Buy/Hold/Watch/Avoid. Scarcity × EV calculation. ⭐⭐ M
- [ ] **C3. ADD — Chase card sidebar per set.** 3-5 chase cards with current TCGPlayer single prices. ⭐⭐⭐ M
- [ ] **C4. ADD — Print run status badge.** IN PRINT / OUT OF PRINT / REPRINT ANNOUNCED on every SetDetail hero. ⭐⭐⭐ S
- [ ] **C5. ADD — PSA/CGC pop report link on chase cards.** Deep link out to pop lookup pages. ⭐ M
- [ ] **C6. ADD — "Share my score card" button.** Generates dark-themed open-graph image of product + score + delta for Twitter/Reddit. ⭐⭐⭐ M
- [ ] **C7. ADD — Investment thesis paragraph per product.** 1-paragraph explainer: "Why this score." Auto-generated, reviewed weekly. ⭐⭐ M

## D. Score + methodology

- [ ] **D1. ADD — Methodology appendix on `/score`.** Exact factor weights, recompute schedule, data sources. Transparency = moat. ⭐⭐ S
- [ ] **D2. ADD — Backtested performance banner.** "BUYs +X% over trailing 6 months." Sells subscriptions by itself — but requires historical data. ⭐⭐⭐ L
- [ ] **D3. UPDATE — Score visibility everywhere.** Product cards, ticker, thumbnails, dashboard — Score on every surface. ⭐⭐ S

## E. Pricing & packaging

- [ ] **E1. CHANGE — Three tiers instead of two.** Free / Collector $14 / Investor $39. Current $9.99 + $24.99 undershoots. ⭐⭐⭐ S
- [ ] **E2. ADD — Annual plans with "2 months free" label.** Not currently offered. ⭐⭐⭐ S
- [ ] **E3. ADD — Standalone "Pro" tier (restocks only) at $19/mo.** Converts users who care only about alerts (Collectr's audience). ⭐⭐ M
- [ ] **E4. ADD — Referral program.** "Refer 3, get 1 month free Collector." Single link in dashboard. ⭐⭐ M
- [ ] **E5. ADD — Affiliate link tagging on all retailer buttons.** Target, TCGPlayer, eBay Partner Network. Passive revenue layer. ⭐⭐⭐ S

## F. Growth / GTM

- [ ] **F1. ADD — Daily Grail page at `/today`.** Free, no-signup, one curated product per day with Score + thesis + where to buy. ⭐⭐⭐ L
- [ ] **F2. ADD — Discord server.** Primary support + community loop. ⭐⭐⭐ S
- [ ] **F3. ADD — r/GrailIQ subreddit.** Seed with restock alert previews to drive FOMO. ⭐⭐ S
- [ ] **F4. ADD — Creator partnerships (5 YouTubers).** PokeRev / Smpratic / PTCGRadio / TrayTCG / one more. Discount codes + 20% rev share. ⭐⭐⭐ M
- [ ] **F5. ADD — Launch social handles (@grailiq everywhere).** X, IG, TikTok, Reddit, YouTube, Discord, LinkedIn, GitHub. ⭐⭐⭐ S

## G. Mobile

- [ ] **G1. CHANGE — Consolidate 6 tabs → 4.** Home (Dashboard+Portfolio) / Discover / Watch (Watchlist+Alerts) / Settings. ⭐⭐⭐ M
- [ ] **G2. ADD — iOS widget (small + medium + large).** Portfolio value, top movers, watchlist. Retention monster. ⭐⭐⭐ M
- [ ] **G3. UPDATE — Rich push notifications.** Product image + price + "Buy Now" deep link. iOS notification service extension. ⭐⭐⭐ M
- [ ] **G4. ADD — Heavy haptic on restock alerts.** Premium feel, zero effort. ⭐ S
- [ ] **G5. CHANGE — Biometric lock to opt-in (off by default).** Surface in Settings: "Add Face ID if portfolio > $1,000." ⭐⭐ S
- [ ] **G6. CHANGE — App Store category to Finance.** Higher-intent installs, higher ARPU than Entertainment/Lifestyle. ⭐⭐ S

## H. Data & integrations

- [ ] **H1. ADD — Singles price integration (CardLadder or TCGPlayer).** Currently sealed-only. Singles is 70% of collector spend. Even a read-only tease enables the chase-card sidebar (C3). ⭐⭐⭐ L
- [ ] **H2. ADD — eBay sold listings integration.** Already in backlog as blocker (eBay Developer pending). ⭐⭐⭐ M
- [ ] **H3. ADD — Pokémon Center via residential proxy.** Brightdata / Oxylabs / Crawlbase to beat Akamai. Only retailer Collectr doesn't cover. Competitive edge. ⭐⭐ M
- [ ] **H4. ADD — Community signal layer.** "Trending on /r/pkmninvesting this week" + "PokeRev covered this Tuesday" badges on products. ⭐⭐ M

## I. Copy / positioning

- [ ] **I1. CHANGE — "Bloomberg Terminal" positioning softens.** Keep investor framing but pair with an enthusiast warmth line. "For collectors who grew up pulling Charizards and grew into pulling triggers." ⭐⭐ S
- [ ] **I2. ADD — Nostalgia thread somewhere on landing.** Subtle reference to past sets. "We've been paying attention since 1999." ⭐ S
- [ ] **I3. REMOVE — The emoji product-type icons (📦 🎯 🃏 🎁 💎 🥫 👑 📋).** Replaced by real product photography (covered by B4). ⭐⭐⭐ S

## J. Tech / platform

- [ ] **J1. UPDATE — Reconnect Cloudflare Pages → GitHub webhook OR formalize Wrangler deploy script.** Right now auto-deploy is broken; I deployed manually today via Wrangler. ⭐⭐⭐ S
- [ ] **J2. ADD — API access at Investor tier.** Keyed REST access for power users / sheet-runners. ⭐⭐ M
- [ ] **J3. ADD — Bulk portfolio export (CSV + PDF).** Already have PDF for portfolio; add CSV for Investor tier. ⭐ S

---

## My top 10 — if you're going to say YES to only a few

1. **B4** — Real product photography (216 images)
2. **C6** — Shareable Score image generator
3. **F1** — `/today` Daily Grail free page
4. **E5** — Affiliate tagging on every retailer link
5. **C1** — EV calculator per product
6. **F4** — 5 creator partnerships
7. **B6** — Dark theme parity in `/app/*`
8. **G3** — Rich push notifications on mobile
9. **E2** — Annual pricing with 2 months free
10. **C4** — Print run status badges

Do these ten and you ship a substantially different product in 30 days.

---

## Process

Mark items with one of:

- **YES** — add to backlog now
- **LATER** — park for Q3+
- **NO** — reject; I'll note the rationale
- **MODIFY** — tell me what to change

Once you've marked them, I'll create Notion Backlog entries for everything
marked YES, linked to the right Epic, with story points and a suggested
sprint.
