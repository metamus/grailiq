import { Link } from 'react-router-dom';
import {
  ArrowLeft,
  ArrowRight,
  Gauge,
  TrendingUp,
  Target,
  Activity,
  Layers,
  Flame,
  Check,
  X,
} from 'lucide-react';

/**
 * Public /score page. Explains the GrailIQ Score in plain language.
 * SEO play: captures searches like "pokemon tcg investment signals",
 * "how to value sealed pokemon", "buy hold sell pokemon booster box".
 */

const factors = [
  {
    name: 'Price Trend',
    weight: 35,
    icon: TrendingUp,
    accent: 'text-grailiq-purple-light bg-grailiq-purple/15 border-grailiq-purple/30',
    explainer:
      'How the market price has moved over the trailing 30 days, weighted toward recent data. Momentum up pulls the score up.',
  },
  {
    name: 'MSRP Premium',
    weight: 25,
    icon: Target,
    accent: 'text-emerald-400 bg-emerald-500/15 border-emerald-400/30',
    explainer:
      'How far current market price sits above or below MSRP. A persistent premium signals real demand; sustained below-MSRP signals headwinds.',
  },
  {
    name: 'Volatility',
    weight: 15,
    icon: Activity,
    accent: 'text-amber-400 bg-amber-500/15 border-amber-400/30',
    explainer:
      'Standard deviation of recent prices. Low volatility = stable investment; high volatility discounts the score.',
  },
  {
    name: 'Demand Velocity',
    weight: 15,
    icon: Flame,
    accent: 'text-rose-400 bg-rose-500/15 border-rose-400/30',
    explainer:
      'Sold-listing cadence on eBay and retailer restock cycles. Higher turnover = stronger demand.',
  },
  {
    name: 'Scarcity / Print',
    weight: 10,
    icon: Layers,
    accent: 'text-grailiq-gold-light bg-grailiq-gold/15 border-grailiq-gold/30',
    explainer:
      'Whether the set is in-print, near end-of-print, or fully out-of-print. Permanent-OOP sets carry a structural premium.',
  },
];

const signalBands = [
  {
    label: 'Buy',
    range: '75 – 100',
    color: 'from-grailiq-gold/25 border-grailiq-gold/40 text-grailiq-gold-light',
    description:
      'Strong momentum, healthy MSRP premium, low volatility. The quantitative signal says accumulate.',
  },
  {
    label: 'Hold',
    range: '55 – 74',
    color: 'from-amber-500/25 border-amber-400/40 text-amber-400',
    description:
      'Market is neutral-to-positive. No urgency to buy or sell — keep watching for a cleaner entry.',
  },
  {
    label: 'Watch',
    range: '35 – 54',
    color: 'from-slate-500/25 border-slate-400/40 text-slate-300',
    description:
      'Mixed signals. Could be consolidating before a move, could be quietly unwinding. Wait for confirmation.',
  },
  {
    label: 'Avoid',
    range: '0 – 34',
    color: 'from-rose-500/25 border-rose-400/40 text-rose-400',
    description:
      'Negative momentum, compressing premium, rising volatility, or all three. Stay out until the picture changes.',
  },
];

const myths = [
  {
    myth: 'Reprints kill every set',
    truth:
      'Some sets survive reprints because demand compounds. The Score tracks the net effect, not the rumor.',
  },
  {
    myth: 'Twitter "chase cards" predict sealed P&L',
    truth:
      'Chase cards drive pack-opening demand — which drives sealed demand — but the correlation is lagged. The Score weights the sealed-market signal directly.',
  },
  {
    myth: 'MSRP is what it\'s worth',
    truth:
      "MSRP is where the print era anchored. Secondary market prices — and their drift from MSRP — are what the Score quantifies.",
  },
];

export default function Score() {
  return (
    <div className="min-h-screen bg-grailiq-ink text-white">
      {/* Nav */}
      <nav className="fixed top-0 z-50 w-full border-b border-white/5 bg-grailiq-ink/80 backdrop-blur-xl">
        <div className="mx-auto flex h-16 max-w-7xl items-center justify-between px-5 sm:px-6">
          <Link to="/" className="flex items-center gap-1 text-xl font-bold tracking-tight">
            Grail<span className="text-grailiq-purple-light">IQ</span>
          </Link>
          <Link
            to="/sign-in"
            className="rounded-lg bg-grailiq-purple px-4 py-2 text-sm font-semibold text-white shadow-lg shadow-grailiq-purple/30 hover:bg-grailiq-purple-light transition-all"
          >
            Get Started
          </Link>
        </div>
      </nav>

      {/* Hero */}
      <section className="relative overflow-hidden pt-28 pb-12 md:pt-36 md:pb-16">
        <div className="pointer-events-none absolute inset-0">
          <div className="absolute top-0 left-1/2 h-[500px] w-[800px] -translate-x-1/2 rounded-full bg-grailiq-gold/15 blur-[128px]" />
        </div>
        <div className="relative mx-auto max-w-4xl px-5 sm:px-6 text-center">
          <Link
            to="/"
            className="inline-flex items-center gap-1.5 text-sm text-gray-400 hover:text-white transition-colors mb-6"
          >
            <ArrowLeft className="h-4 w-4" />
            Back to GrailIQ
          </Link>
          <div className="mb-6 inline-flex items-center gap-2 rounded-full border border-grailiq-gold/30 bg-grailiq-gold/5 px-4 py-1.5 text-sm text-grailiq-gold-light">
            <Gauge size={14} />
            <span className="font-medium">The GrailIQ Score</span>
          </div>
          <h1 className="font-display text-4xl leading-[1.05] tracking-tight md:text-6xl">
            The one number that tells you whether a sealed product is{' '}
            <span className="bg-gradient-to-r from-grailiq-gold via-grailiq-gold-light to-grailiq-gold bg-clip-text italic text-transparent">
              actually worth it.
            </span>
          </h1>
          <p className="mt-6 max-w-2xl mx-auto text-base leading-relaxed text-gray-400 md:text-lg">
            0 to 100. Buy, Hold, Watch, or Avoid. Every sealed Pokémon TCG product gets a score
            that blends five factors — no black-box AI, no guesswork, no influencer pumping.
          </p>
        </div>
      </section>

      {/* The five factors */}
      <section className="py-16 md:py-20 border-t border-white/5">
        <div className="mx-auto max-w-5xl px-5 sm:px-6">
          <div className="mx-auto max-w-2xl text-center mb-12">
            <p className="mb-3 text-sm font-semibold uppercase tracking-wider text-grailiq-gold-light">
              The Formula
            </p>
            <h2 className="font-display text-3xl md:text-4xl">
              Five factors. Weighted. Recomputed daily.
            </h2>
            <p className="mt-4 text-gray-400">
              Everything is deterministic. Same inputs, same score — every time.
            </p>
          </div>

          <div className="space-y-4">
            {factors.map((f) => (
              <div
                key={f.name}
                className="rounded-2xl border border-white/10 bg-white/[0.02] p-6 flex items-start gap-4"
              >
                <div
                  className={`h-12 w-12 rounded-xl flex items-center justify-center border ${f.accent} flex-shrink-0`}
                >
                  <f.icon size={22} />
                </div>
                <div className="flex-1">
                  <div className="flex items-center justify-between gap-4 mb-1">
                    <h3 className="text-lg font-semibold">{f.name}</h3>
                    <span className="text-sm font-bold text-gray-300 tabular-nums">
                      {f.weight}%
                    </span>
                  </div>
                  <p className="text-sm leading-relaxed text-gray-400">{f.explainer}</p>
                  <div className="mt-3 h-1.5 w-full rounded-full bg-white/5 overflow-hidden">
                    <div
                      className="h-full rounded-full bg-gradient-to-r from-grailiq-purple to-grailiq-gold"
                      style={{ width: `${f.weight}%` }}
                    />
                  </div>
                </div>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* Signal bands */}
      <section className="border-t border-white/5 py-16 md:py-20">
        <div className="mx-auto max-w-5xl px-5 sm:px-6">
          <div className="mx-auto max-w-2xl text-center mb-12">
            <p className="mb-3 text-sm font-semibold uppercase tracking-wider text-grailiq-gold-light">
              The Bands
            </p>
            <h2 className="font-display text-3xl md:text-4xl">From the score to the signal</h2>
          </div>

          <div className="grid gap-4 md:grid-cols-2">
            {signalBands.map((b) => (
              <div
                key={b.label}
                className={`rounded-2xl border bg-gradient-to-br ${b.color.split(' ').filter(c => c.startsWith('from-')).join(' ')} to-transparent p-6`}
              >
                <div className="flex items-center justify-between mb-3">
                  <h3
                    className={`text-xl font-bold ${b.color.split(' ').filter((c) => c.startsWith('text-')).join(' ')}`}
                  >
                    {b.label}
                  </h3>
                  <span className="text-sm font-bold text-gray-300 tabular-nums">
                    {b.range}
                  </span>
                </div>
                <p className="text-sm leading-relaxed text-gray-300">{b.description}</p>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* Myths */}
      <section className="border-t border-white/5 py-16 md:py-20">
        <div className="mx-auto max-w-4xl px-5 sm:px-6">
          <div className="mx-auto max-w-2xl text-center mb-12">
            <p className="mb-3 text-sm font-semibold uppercase tracking-wider text-grailiq-gold-light">
              What the Score Is Not
            </p>
            <h2 className="font-display text-3xl md:text-4xl">Common myths, corrected</h2>
          </div>

          <div className="space-y-4">
            {myths.map((m, i) => (
              <div key={i} className="grid md:grid-cols-2 gap-4">
                <div className="rounded-2xl border border-rose-500/20 bg-rose-500/[0.04] p-5">
                  <p className="text-[10px] font-bold uppercase tracking-wider text-rose-400 mb-2 inline-flex items-center gap-1.5">
                    <X size={12} /> Myth
                  </p>
                  <p className="text-sm text-gray-300">{m.myth}</p>
                </div>
                <div className="rounded-2xl border border-emerald-500/20 bg-emerald-500/[0.04] p-5">
                  <p className="text-[10px] font-bold uppercase tracking-wider text-emerald-400 mb-2 inline-flex items-center gap-1.5">
                    <Check size={12} /> What GrailIQ does
                  </p>
                  <p className="text-sm text-gray-300">{m.truth}</p>
                </div>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* CTA */}
      <section className="relative overflow-hidden border-t border-white/5 py-20 md:py-24">
        <div className="pointer-events-none absolute inset-0">
          <div className="absolute inset-0 bg-gradient-to-br from-grailiq-purple/20 via-grailiq-ink to-grailiq-ink" />
        </div>
        <div className="relative mx-auto max-w-3xl px-5 sm:px-6 text-center">
          <h2 className="font-display text-3xl md:text-5xl">
            See the score on every product.
          </h2>
          <p className="mx-auto mt-4 max-w-xl text-gray-400">
            Free to try. No credit card. Log a few sealed products and watch their scores move.
          </p>
          <div className="mt-8 flex flex-col items-center justify-center gap-3 sm:flex-row">
            <Link
              to="/sign-in"
              className="group flex items-center gap-2 rounded-xl bg-gradient-to-r from-grailiq-purple to-grailiq-purple-light px-7 py-3.5 text-base font-semibold text-white shadow-xl shadow-grailiq-purple/30 transition-all hover:shadow-grailiq-purple/50 hover:brightness-110"
            >
              Start Tracking Free
              <ArrowRight size={18} className="transition-transform group-hover:translate-x-0.5" />
            </Link>
            <Link
              to="/"
              className="flex items-center gap-2 rounded-xl border border-white/15 bg-white/[0.02] px-7 py-3.5 text-base font-medium text-gray-300 hover:border-white/25 hover:bg-white/[0.05] hover:text-white transition-all"
            >
              Back to home
            </Link>
          </div>
        </div>
      </section>

      <section className="py-20 border-t border-white/5">
        <div className="mx-auto max-w-3xl px-6">
          <p className="text-[10px] font-bold uppercase tracking-wider text-grailiq-gold-light mb-4">Appendix · Methodology</p>
          <h2 className="text-3xl font-bold text-white mb-6">How the GrailIQ Score is computed</h2>
          <div className="space-y-5 text-[15px] leading-relaxed text-gray-300">
            <p>
              Every sealed product receives a score from 0 to 100, recomputed
              at 02:00 UTC daily and snapshotted to <code className="text-gray-100 bg-white/5 px-1.5 py-0.5 rounded">score_history</code> so
              performance is auditable over time. Same inputs, same score — every time.
            </p>
            <p>
              The score is a weighted blend of five deterministic factors. Each factor
              returns a 0–100 subscore, which is then combined according to these weights:
            </p>
            <ul className="space-y-2 ml-5 list-disc marker:text-grailiq-gold-light">
              <li><strong className="text-white">Price trend (35%)</strong> — 30-day price movement, weighted toward recent days.</li>
              <li><strong className="text-white">Scarcity (25%)</strong> — reprint status, print run tier, time since last restock across tracked retailers.</li>
              <li><strong className="text-white">Momentum (15%)</strong> — social and search signals, recent creator coverage.</li>
              <li><strong className="text-white">Liquidity (15%)</strong> — volume of tracked retailer mappings that are currently in stock, secondary market depth.</li>
              <li><strong className="text-white">Set quality (10%)</strong> — pull-rate modifiers, chase card density, historical set performance.</li>
            </ul>
            <p>
              Data sources: retailer APIs and scrapers for Target, Pokémon Center, Best Buy,
              Walmart, Amazon, and TCGPlayer. Price history verified against TCGPlayer and
              eBay sold listings. Print run status sourced from official Pokémon TCG releases
              and confirmed reprint announcements.
            </p>
            <p className="text-sm text-gray-500 italic">
              GrailIQ is a data product. Scores are informational, not financial advice.
            </p>
          </div>
        </div>
      </section>

      <footer className="border-t border-white/5 py-8">
        <div className="mx-auto max-w-7xl px-5 sm:px-6 text-center text-sm text-gray-500">
          Grail<span className="text-grailiq-purple-light">IQ</span> · Price intelligence for
          sealed Pokémon TCG
        </div>
      </footer>
    </div>
  );
}
