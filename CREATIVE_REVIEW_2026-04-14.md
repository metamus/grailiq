# GrailIQ — Creative & Strategic Review

Written as a creative director / entrepreneur / Pokémon enthusiast after a
tour of the live site at grailiq.com, the pricing page, the sign-in flow,
the dashboard, and a read through the mobile app structure and backend
feature set.

The product is real. The scaffolding is impressive. But it's positioned
for investors when the audience it lives or dies on is enthusiasts. This
document argues for the changes that turn a good tool into a category
brand, organized by lens so you can disagree with individual takes
without losing the thread.

---

## 1. The central tension

GrailIQ reads like two products stapled together. The copy calls it "The
Bloomberg Terminal for Sealed Pokémon." The features — Buy/Hold/Watch/Avoid
ratings, a GrailIQ Score, portfolio P&L, weekly digest — reinforce that
frame. This is a strong identity for the 10% of the audience who think of
Pokémon as an asset class.

The other 90% — the people who collected in 1999, rediscovered during
COVID, and now spend $300 a month because an Umbreon pull feels like
opening a birthday card from their childhood — don't want Bloomberg.
They want a shopping companion, a memory keeper, and a bragging surface.
Right now nothing on the site speaks to them. The word "grail" is doing
all the emotional work, and it can't carry the load alone.

The fix is not to abandon the investor positioning — that's your
differentiator versus CardLadder, PriceCharting, and Collectr. The fix
is to build a second, warmer entry point for the enthusiast and let the
investor tier be the upgrade path, not the front door.

---

## 2. The enthusiast POV — what's actually missing

A collector's brain runs on five questions, in this order:

1. Do I have it?
2. Is it going up?
3. Should I rip it or hold it?
4. What's inside if I rip?
5. Where can I buy another one, cheapest?

The site today answers 1 and 2 well. It partially answers 5. It does not
touch 3 and 4, which are the two questions that dominate r/pkmntcg and
every Pokémon YouTube comment thread.

**The EV calculator.** Every sealed product has an implicit expected
value — the average dollar value of the singles you'd pull from a box.
A Prismatic Evolutions ETB at $85 is either a steal or a trap depending
on whether the EV is $120 or $40. TCGFish and PokeData have a primitive
version of this. GrailIQ has the pricing infrastructure and the product
catalog to do it better, and nobody has shipped a clean version. This is
the #1 feature request you'll get from beta users. Ship it.

**The rip-vs-hold signal.** Related but distinct. Right now Buy/Hold/
Watch/Avoid treats every product as "sealed forever." A real collector
wants a second axis: "if you own this, should you open it or keep it
sealed?" That's a scarcity × EV calculation. Adding it gives you
something no competitor has.

**Chase card tracking.** Every modern set has 2-4 cards that matter and
~200 that don't. A collector with a sealed Surging Sparks ETB cares about
one thing: what's Pikachu ex SIR trading at? Currently you only track the
sealed product. Linking each set to its 3-5 chase cards (pulled from
TCGPlayer Infinite or CardLadder) and showing those on the set page
would 10x the engagement per session.

**Print run context.** "This set is still in print" vs "Last printed
Q3 2024, no reprint announced" changes the entire investment thesis.
You already have the data. Surface it. A red OUT OF PRINT badge on the
SetDetail hero would be a power move.

**Grading and pop reports.** Not urgent, but on the roadmap: every
serious collector checks PSA/CGC pop reports before buying chase
singles. A button from a chase card to its PSA 10 pop is a week of
integration work and adds massive credibility.

**Nostalgia.** Nothing on the site references the fact that collectors
came to this hobby through emotion. The landing could open with a
rotating set of past sets the user might remember — Base Set, Neo
Genesis, Diamond & Pearl — and end with today's. "We've been paying
attention since 1999." It's not a feature. It's a feeling. The feeling
is why people pay.

---

## 3. The investor POV — what's already strong

The investor tier is where you currently lead. The GrailIQ Score
framework (5 weighted factors, recomputed daily, deterministic) is
something CardLadder doesn't do and Collectr can't do because Collectr
is a restock-alert product that backed into pricing. Lean in here:

- **Put the Score on every product card.** Right now it's buried in the
  SetDetail table. On the product card, on the landing ticker, on
  every thumbnail — the Score number should be as omnipresent as Apple
  shows battery percentages. It's your brand.
- **Make the Score shareable.** A product page should have a "Share my
  score card" button that generates a gorgeous dark-themed image with
  the product, score, rating, and today's movement, for Twitter and
  Reddit. Free viral surface, zero moat to copy because the Score is
  yours.
- **Publish a methodology page.** Investors pay for explainability.
  `/score` exists but reads like marketing. Add a methodology appendix
  with the exact factor weights, recompute schedule, and data sources.
  Transparency is a moat.
- **Backtested performance.** The hardest thing to build, the most
  valuable thing to show. "If you had bought every BUY-rated product
  6 months ago, you'd be up 34%." That number sells subscriptions by
  itself.
- **API access.** Investors running spreadsheets will pay $99/mo for
  programmatic access. Ship a keyed API at the Investor tier and
  watch power users upgrade from Collector.

---

## 4. Creative director lens — the visual system

The design is already above-average for a solo-founder product. Dark
theme, purple/gold, serif-and-sans mix. "Grails" set in italic serif in
the hero is beautiful. But the system doesn't propagate:

**Typography.** The italic serif "grails" treatment should recur. Every
user's portfolio value could be set in the same italic serif. Every
product name on SetDetail could have its rarity indicator in that face.
Pick one visual motif and repeat it until it becomes the brand mark.

**Product imagery.** This is the single biggest visual gap. SetDetail
uses emojis (📦 🎯 🃏 🎁 💎 🥫 👑) for product types. That reads MVP.
Every TCG site uses hero photography. You have 216 products; pulling
their official images from retailer APIs is a one-time scrape and
elevates the entire product overnight. Without images you cannot
compete on a feature of collectibles called "visual desire."

**Color grammar.** Emerald for BUY, rose for AVOID is the default
finance convention. But your premium color is gold. When a BUY signal
triggers, it should glow gold, not green — that's branded behavior
nobody else has, and it subtly aligns the most positive rating with the
grail metaphor. Green reads Wall Street. Gold reads Pokémon.

**The Score visualization.** Currently rendered as a number ("67.0").
Radial progress ring color-coded by rating would be instantly more
scannable and would work as a hero element on shareable images. Think
CreditKarma's credit score dial but done in your palette.

**The iPhone mockup on the landing.** Static PNG. Animate the portfolio
number counting up, the sparkline drawing, the Grail Alert sliding in.
LottieFiles + 4 hours of work; increases hero dwell time meaningfully.

**The live ticker.** Currently moves too fast to read, text-only. Slow
it down, show 3 items at a time, include a 24×24px product thumbnail
next to each price. This is the second biggest element on the landing
and it's phoned in.

**Social proof.** The Launch Checklist mentions 3 testimonials with gold
5-star ratings on the marketing landing. I could not find them on the
live page. Add them back, halfway down, above the footer, with real
names and collection size ("Mike R. / 340 sealed products").

**Empty states.** The dashboard today says "0 Buy Signals" when a user
has nothing tracked. That's a dead state. Fill it: "Start tracking
Prismatic Evolutions ETB to get your first buy signal." Every empty
state should be an onboarding opportunity.

---

## 5. Entrepreneur lens — pricing, growth, moats

**Pricing is undershooting.** Collector at $9.99 and Investor at $24.99
feels like you're afraid of the price point. The pain you solve — missing
a $250 chase card, buying at the wrong time, discovering a grail post-
reprint — is worth $30-50/month to a serious collector. Three tiers
reads cleaner than two:

```
Free          — portfolio, basic watchlist, daily score delay
Collector $14 — real-time alerts, full score history, unlimited watchlist
Investor  $39 — weekly digest, API access, bulk export, priority support
```

Annual plans with a "2 months free" label have the best conversion
ratios in DTC subscription; I don't see annual offered today. Add it.

**Affiliate revenue layer.** Every "Buy at Target" / "View on TCGPlayer"
link on the product detail page should be an affiliate link. Target's
program is 1-8%, TCGPlayer is 5-7%, eBay Partner Network is 2-4%. On a
$250 restock alert that converts at 2% × 5% avg affiliate = a dollar per
subscriber per month in passive revenue. Across 10K subscribers, that's
more than your hosting bill.

**Restock alerts as a standalone "Pro" tier.** Collectr monetized this
at $10/mo as their entire product. GrailIQ treats it as a feature.
Consider breaking it out: Data plan at $14, Pro (restocks only) at $19,
Full (both) at $29. You'd convert Collectr users who care only about
restocks and your current Collector users who care only about data,
without cannibalizing either.

**Referral program.** Collectors evangelize when they trust a tool.
"Refer three collectors, get one month of Collector free." Build it
into the dashboard with a single link. 4 hours of work, 20% of new
signups within 60 days based on similar DTC benchmarks.

**Creator partnerships.** The TCG world is creator-driven more than any
other hobby. PokeRev, Smpratic, PTCGRadio, TrayTCG — five creator deals
with a code like PTCG10 for 10% off and 20% rev share get you in front
of 2M subscribers for zero ad spend. Your launch checklist lists this
as a P1 but nothing has moved. This should be the next GTM step after
shipping the Stripe smoke test.

**Community.** No Discord, no subreddit, no presence on r/pkmninvesting.
Collectr runs a Discord with 40K members that functions as its primary
support channel and viral loop. You need one. Launch it the day you do
the Stripe smoke test so new signups have somewhere to land.

**App store category.** When mobile ships, list it under Finance, not
Entertainment. Finance drives higher-intent installs and higher ARPU
even in hobby categories. Your ASO keywords should lead with
"pokemon investment," "sealed tcg tracker," "pokemon card portfolio,"
not "pokemon collection."

**The #1 entrepreneurial bet I'd make:** launch a free, no-signup
`/today` page. Every day the algorithm picks one product with a
story — new restock, score jump, creator mention — and builds a full
shareable page for it. Free SEO engine, daily traffic hook, Reddit
bait, Twitter bait. One Next.js route, one cron job, ten days of
accumulated authority before you even need to start paying for
acquisition.

---

## 6. Competitive positioning

**Versus Collectr.** They own restock alerts for Walmart/Target/BestBuy.
You need to match them there and extend to Pokémon Center (the retailer
they don't cover because it's the hardest). If you win PC by a
meaningful margin — even if it requires a $20/mo residential proxy —
you've earned the right to charge more than Collectr does.

**Versus CardLadder.** They own the historical chart for singles.
You're sealed-only, which is clear positioning. But singles is 70% of
collector spend. Keep the sealed focus for now but tease a singles
product in the footer ("Singles coming 2026"). This stops users from
leaving and installs a future upgrade path.

**Versus PriceCharting.** They have the deepest dataset and the worst
UX. You can't out-data them, but you can out-design them easily, and
you can cite them as a data source to borrow credibility. "Prices
verified against PriceCharting and eBay sold listings" on every
product page.

**Nobody has the Score.** Don't give this up. License it eventually.
The end state is that other tools (Discord bots, Reddit flair, YouTube
creator overlays) show "GrailIQ Score: 92" the way movies show Rotten
Tomatoes percentages. That takes 18 months of consistent use. Start
building toward it now by making the Score shareable everywhere.

---

## 7. Mobile app specifics

I haven't run the mobile build yet (you haven't prebuilt since the new
native modules were added), but reading the structure:

**Six tabs is one too many.** Apple's HIG says 3-5. You have Dashboard,
Sets, Portfolio, Watch, Alerts, Settings. Consolidate:

```
Home      — merged Dashboard + Portfolio
Discover  — Sets + search
Watch     — merged Watchlist + Alerts  (fewer top-level distinctions)
Settings
```

Tabs two and three both get much more real estate. You keep the same
features but the information architecture is cleaner.

**iOS widget.** This is a $30 feature with $3000 value. Small widget
showing today's top mover in the user's portfolio. Medium widget
showing portfolio value + 3 top movers. Large widget showing a mini
watchlist. Widgets convert to daily active use in a way that no other
feature does. Ship it in the second mobile release.

**Rich push notifications.** "Back in stock" is what Collectr does.
"🔥 Moonbreon ETB $84.99 at Target — 4 min ago" with an image and a
"Buy Now" button that deep-links into the Target app — that's a league
up. iOS notification service extensions make this a one-day build.

**Biometric lock default.** Off by default. Most users won't have a
portfolio worth locking. Surface it in Settings with copy like
"Add Face ID if your portfolio is > $1,000."

**Haptics on alerts.** Every restock alert push should trigger a heavy
impact haptic on iOS. Tiny detail, signals premium. Collectr doesn't do
this.

---

## 8. The #1 creative bet

Ship a free, public-facing, no-signup `grailiq.com/today` page. Every
day at 9am ET, the algorithm picks one product having a moment — new
restock, big score jump, creator coverage, print run news — and builds a
full-bleed shareable page for it. The page includes:

- Hero product image
- Today's Score with the daily delta
- One-paragraph investment thesis written by a GPT-5 pass over the
  product's data, reviewed weekly
- A sparkline of the last 30 days
- A "Where to buy" strip with affiliate-tagged retailer buttons
- A share-to-Twitter button that generates a pre-filled tweet with an
  open-graph card

This is your Wordle. It gives collectors a daily reason to come back
without a login prompt. It builds SEO authority on ~365 product pages
per year. It seeds Reddit and Twitter with shareable content. It costs
one engineer-week to ship and one product-manager-hour per day to
curate.

If you do nothing else from this document, do this.

---

## 9. Specific, stack-ranked enhancements

**Ship this week (low effort, high impact):**

1. Add product hero images to all 216 products — one-time scrape from
   retailer APIs
2. Annual pricing tiers with "2 months free"
3. Share-my-score image generation for product pages
4. Testimonials restored on landing page
5. Dark theme applied to `/app/*` routes — parity with pre-auth pages

**Ship next two weeks (core enhancement):**

6. EV calculator on every SetDetail
7. Chase card sidebar on every SetDetail (top 3-5 chase cards + current
   single prices via TCGPlayer)
8. Print run status badge (In Print / Out of Print / Reprint Expected)
9. Affiliate link tagging on every retailer outbound link
10. Discord server launch + subreddit creation

**Ship month 2 (growth engine):**

11. `/today` daily grail page
12. Referral program
13. Creator partnership outreach + custom discount codes
14. Mobile iOS widget
15. Rich push notifications with product image + Buy button
16. Standalone Pro tier ($19/mo) for restock-only users
17. API access for Investor tier

**Ship month 3+ (moat):**

18. Singles price integration
19. PSA/CGC pop report integration on chase cards
20. Backtested Score performance ("Our BUYs are +34% over 6 months")
21. Set forecast ML — predict which sets will go up based on print run
    data, streamer attention, pre-order patterns
22. Community feed showing what's trending on Reddit and TikTok
23. Authentication via iPhone camera scan of sealed products

---

## 10. Copy directions for the landing

The current hero:

> Know what your grails are *actually* worth.

This is fine for investors. It's cold for enthusiasts. Pair it with
rotating subheads to test:

> Finally, a way to know if that ETB is worth $85 or $850.
>
> For collectors who grew up pulling Charizards and grew into pulling triggers.
>
> Every sealed product. Every retailer. One score.
>
> You already know which ones are grails. We tell you which ones are moves.

The landing CTA ("Start Tracking Free") should be paired with a "Try a
Score" inline demo where the user picks a set from a dropdown and sees
the Score render in real time before signup. Instant aha; no
registration wall.

---

## 11. The honest summary

GrailIQ is 80% of the way to a product people pay for and 30% of the
way to a brand people love. The product half is mostly shipping work —
real-time alerts, affiliate links, mobile widgets. The brand half is
harder because it requires a decision: are you Bloomberg or are you the
Sotheby's of sealed Pokémon? Bloomberg is a bigger TAM but a cooler
brand. Sotheby's is smaller but sticky and repeatable.

My recommendation is to choose Sotheby's with a Bloomberg engine under
the hood. The user-facing surface should feel like a curator who
happens to know the math. The actual math should be as good as
Bloomberg's. Most competitors pick one side and lose half the market.

The next 90 days matter more than the last 90 did. Get mobile shipped,
launch the `/today` page, run three creator partnerships, and you'll be
the category's default tool by Q3. The scaffolding you built this
session is good enough to carry all of that.

---

*Reviewed 2026-04-14. Based on live inspection of grailiq.com, `/score`,
`/sign-in`, the app dashboard, the SetDetail component code, and the
HANDOFF documentation. Mobile app not yet rebuilt on this machine; the
mobile section is based on the declared structure in code and docs.*
