import { Link } from 'react-router-dom';
import { useEffect, useState } from 'react';
import {
  TrendingUp,
  Bell,
  BarChart3,
  ArrowRight,
  Star,
  ChevronRight,
  LineChart,
  Package,
  Wallet,
  Sparkles,
  ShieldCheck,
  Check,
  ArrowUpRight,
  ArrowDownRight,
  Activity,
  Eye,
  Gauge,
} from 'lucide-react';

/* ─── Rotating Set Names ───────────────────────────────────── */
const ROTATING_SETS = [
  'Prismatic Evolutions',
  'Surging Sparks',
  'Pokémon 151',
  'Twilight Masquerade',
  'Paldean Fates',
];

function useRotatingIndex(length: number, intervalMs = 2200) {
  const [i, setI] = useState(0);
  useEffect(() => {
    const id = setInterval(() => setI((v) => (v + 1) % length), intervalMs);
    return () => clearInterval(id);
  }, [length, intervalMs]);
  return i;
}

/* ─── Ticker Data ──────────────────────────────────────────── */
type Signal = 'BUY' | 'HOLD' | 'WATCH' | 'AVOID';
interface TickerItem {
  name: string;
  set: string;
  price: string;
  change: string;
  up: boolean;
  signal: Signal;
}

const TICKER_DATA: TickerItem[] = [
  { name: 'Prismatic Evolutions ETB', set: 'SV8.5', price: '$84.99', change: '+12.4%', up: true, signal: 'BUY' },
  { name: 'Surging Sparks Booster Box', set: 'SV8', price: '$178.50', change: '+6.8%', up: true, signal: 'BUY' },
  { name: '151 UPC', set: 'MEG', price: '$289.00', change: '−2.1%', up: false, signal: 'HOLD' },
  { name: 'Twilight Masquerade BB', set: 'SV6', price: '$152.25', change: '+1.4%', up: true, signal: 'HOLD' },
  { name: 'Paldean Fates ETB', set: 'SV4.5', price: '$74.80', change: '−0.6%', up: false, signal: 'WATCH' },
  { name: 'Obsidian Flames BB', set: 'SV3', price: '$164.00', change: '+3.2%', up: true, signal: 'BUY' },
  { name: 'Paradox Rift ETB', set: 'SV4', price: '$58.95', change: '−1.8%', up: false, signal: 'AVOID' },
  { name: 'Crown Zenith Collection', set: 'SWSH12.5', price: '$112.00', change: '+4.9%', up: true, signal: 'BUY' },
  { name: 'Evolving Skies BB', set: 'SWSH7', price: '$1,240.00', change: '+18.2%', up: true, signal: 'BUY' },
  { name: 'Lost Origin ETB', set: 'SWSH11', price: '$46.50', change: '+0.3%', up: true, signal: 'HOLD' },
];

function signalStyle(signal: Signal) {
  switch (signal) {
    case 'BUY':
      return 'bg-grailiq-buy/15 text-grailiq-buy border-grailiq-buy/30';
    case 'HOLD':
      return 'bg-grailiq-hold/15 text-grailiq-hold border-grailiq-hold/30';
    case 'WATCH':
      return 'bg-grailiq-watch/20 text-slate-300 border-grailiq-watch/40';
    case 'AVOID':
      return 'bg-grailiq-avoid/15 text-grailiq-avoid border-grailiq-avoid/30';
  }
}

/* ─── Sparkline SVG ────────────────────────────────────────── */
function Sparkline({
  points,
  color = '#7F77DD',
  width = 280,
  height = 64,
}: {
  points: number[];
  color?: string;
  width?: number;
  height?: number;
}) {
  const min = Math.min(...points);
  const max = Math.max(...points);
  const range = max - min || 1;
  const step = width / (points.length - 1);
  const d = points
    .map((p, i) => {
      const x = i * step;
      const y = height - ((p - min) / range) * (height - 8) - 4;
      return `${i === 0 ? 'M' : 'L'}${x.toFixed(1)},${y.toFixed(1)}`;
    })
    .join(' ');
  const area = `${d} L${width},${height} L0,${height} Z`;
  const gradId = `spark-grad-${color.replace('#', '')}`;
  return (
    <svg width={width} height={height} viewBox={`0 0 ${width} ${height}`} className="overflow-visible">
      <defs>
        <linearGradient id={gradId} x1="0" y1="0" x2="0" y2="1">
          <stop offset="0%" stopColor={color} stopOpacity="0.35" />
          <stop offset="100%" stopColor={color} stopOpacity="0" />
        </linearGradient>
      </defs>
      <path d={area} fill={`url(#${gradId})`} />
      <path d={d} fill="none" stroke={color} strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" />
    </svg>
  );
}

/* ─── Phone Mockup ─────────────────────────────────────────── */
function PhoneMockup() {
  const portfolioTrend = [
    10200, 10380, 10290, 10510, 10720, 10650, 10840, 11020,
    11190, 11080, 11350, 11580, 11720, 11940, 12180, 12480, 12847,
  ];

  return (
    <div className="relative mx-auto w-full max-w-[360px]">
      {/* Floating glow */}
      <div className="pointer-events-none absolute -inset-10 rounded-[3rem] bg-grailiq-purple/20 blur-3xl" />
      <div className="pointer-events-none absolute -top-8 -right-6 h-40 w-40 rounded-full bg-grailiq-gold/20 blur-3xl" />

      {/* Phone frame */}
      <div className="relative rounded-[2.75rem] border border-white/10 bg-gradient-to-b from-white/[0.08] to-white/[0.02] p-2 shadow-[0_40px_120px_-20px_rgba(127,119,221,0.35)] animate-float">
        <div className="relative overflow-hidden rounded-[2.4rem] bg-grailiq-ink">
          {/* Notch */}
          <div className="absolute left-1/2 top-2 z-10 h-6 w-28 -translate-x-1/2 rounded-full bg-black" />

          {/* Screen content */}
          <div className="relative px-5 pt-10 pb-6">
            {/* Status bar */}
            <div className="mb-4 flex items-center justify-between text-[10px] font-medium text-gray-400">
              <span>9:41</span>
              <div className="flex items-center gap-1">
                <div className="h-2 w-2 rounded-full bg-grailiq-buy" />
                <span>Live</span>
              </div>
            </div>

            {/* Portfolio card */}
            <div className="rounded-2xl border border-white/10 bg-gradient-to-br from-grailiq-purple/20 via-grailiq-purple/5 to-transparent p-4">
              <p className="text-[10px] font-medium uppercase tracking-wider text-gray-400">
                Portfolio Value
              </p>
              <p className="mt-1 font-display text-3xl text-white">$12,847.50</p>
              <div className="mt-1 flex items-center gap-1.5 text-xs">
                <ArrowUpRight size={12} className="text-grailiq-buy" />
                <span className="font-semibold text-grailiq-buy">+$1,284.30</span>
                <span className="text-gray-500">+11.1% · 30d</span>
              </div>
              <div className="mt-3 -mx-1">
                <Sparkline points={portfolioTrend} color="#9B94E8" width={300} height={56} />
              </div>
            </div>

            {/* Section header */}
            <div className="mt-5 mb-2 flex items-center justify-between">
              <p className="text-[10px] font-semibold uppercase tracking-wider text-gray-500">
                Top Signals
              </p>
              <p className="text-[10px] text-grailiq-purple-light">View all</p>
            </div>

            {/* Signal rows */}
            {[
              {
                name: 'Prismatic Evolutions ETB',
                price: '$84.99',
                chg: '+12.4%',
                up: true,
                signal: 'BUY' as Signal,
                trend: [40, 42, 41, 45, 44, 48, 52, 55, 58, 62, 65, 68],
              },
              {
                name: 'Evolving Skies BB',
                price: '$1,240',
                chg: '+18.2%',
                up: true,
                signal: 'BUY' as Signal,
                trend: [60, 58, 62, 65, 63, 68, 72, 75, 78, 82, 85, 90],
              },
              {
                name: 'Paradox Rift ETB',
                price: '$58.95',
                chg: '−1.8%',
                up: false,
                signal: 'AVOID' as Signal,
                trend: [68, 66, 64, 65, 62, 60, 58, 57, 55, 53, 52, 50],
              },
            ].map((row) => (
              <div
                key={row.name}
                className="mb-2 flex items-center justify-between rounded-xl border border-white/5 bg-white/[0.03] px-3 py-2.5"
              >
                <div className="min-w-0 flex-1">
                  <p className="truncate text-xs font-semibold text-white">{row.name}</p>
                  <div className="mt-0.5 flex items-center gap-1.5 text-[10px] text-gray-400">
                    <span className="font-medium text-white">{row.price}</span>
                    <span className={row.up ? 'text-grailiq-buy' : 'text-grailiq-avoid'}>
                      {row.chg}
                    </span>
                  </div>
                </div>
                <div className="mx-2 h-6 w-10">
                  <Sparkline
                    points={row.trend}
                    color={row.up ? '#22C55E' : '#EF4444'}
                    width={40}
                    height={24}
                  />
                </div>
                <span
                  className={`rounded-md border px-1.5 py-0.5 text-[9px] font-bold tracking-wide ${signalStyle(
                    row.signal
                  )}`}
                >
                  {row.signal}
                </span>
              </div>
            ))}

            {/* Bottom nav hint */}
            <div className="mt-5 flex items-center justify-around border-t border-white/5 pt-3">
              <div className="flex flex-col items-center gap-1 text-grailiq-purple-light">
                <Gauge size={14} />
                <span className="text-[9px]">Dashboard</span>
              </div>
              <div className="flex flex-col items-center gap-1 text-gray-600">
                <Package size={14} />
                <span className="text-[9px]">Sets</span>
              </div>
              <div className="flex flex-col items-center gap-1 text-gray-600">
                <Wallet size={14} />
                <span className="text-[9px]">Portfolio</span>
              </div>
              <div className="flex flex-col items-center gap-1 text-gray-600">
                <Bell size={14} />
                <span className="text-[9px]">Alerts</span>
              </div>
            </div>
          </div>
        </div>
      </div>

      {/* Floating signal chip */}
      <div className="absolute -left-6 top-24 animate-float rounded-xl border border-grailiq-buy/30 bg-grailiq-ink/90 px-3 py-2 backdrop-blur-md shadow-xl">
        <div className="flex items-center gap-2">
          <div className="h-2 w-2 rounded-full bg-grailiq-buy animate-pulse-glow" />
          <span className="text-[10px] font-bold uppercase tracking-wider text-grailiq-buy">
            Strong Buy
          </span>
        </div>
        <p className="mt-0.5 text-[10px] text-gray-400">Score jumped to 92</p>
      </div>

      {/* Floating alert chip */}
      <div
        className="absolute -right-4 top-64 rounded-xl border border-grailiq-gold/30 bg-grailiq-ink/90 px-3 py-2 backdrop-blur-md shadow-xl animate-float"
        style={{ animationDelay: '1.5s' }}
      >
        <div className="flex items-center gap-2">
          <Sparkles size={12} className="text-grailiq-gold" />
          <span className="text-[10px] font-bold uppercase tracking-wider text-grailiq-gold">
            Grail Alert
          </span>
        </div>
        <p className="mt-0.5 text-[10px] text-gray-400">Back in stock at Target</p>
      </div>
    </div>
  );
}

/* ─── Live Ticker ──────────────────────────────────────────── */
function LiveTicker() {
  return (
    <div className="relative overflow-hidden border-y border-white/5 bg-grailiq-ink/60 backdrop-blur-sm py-3">
      {/* Edge fades */}
      <div className="pointer-events-none absolute inset-y-0 left-0 z-10 w-24 bg-gradient-to-r from-grailiq-ink to-transparent" />
      <div className="pointer-events-none absolute inset-y-0 right-0 z-10 w-24 bg-gradient-to-l from-grailiq-ink to-transparent" />

      <div className="flex items-center gap-3 px-6">
        <div className="flex shrink-0 items-center gap-2 border-r border-white/10 pr-4">
          <div className="flex items-center gap-1.5">
            <span className="h-2 w-2 animate-pulse-glow rounded-full bg-grailiq-buy" />
            <span className="text-[11px] font-bold uppercase tracking-wider text-grailiq-buy">
              Live
            </span>
          </div>
          <span className="text-[11px] font-semibold uppercase tracking-wider text-gray-500">
            Market
          </span>
        </div>

        <div className="relative flex-1 overflow-hidden">
          <div className="flex min-w-max animate-marquee gap-8">
            {[...TICKER_DATA, ...TICKER_DATA].map((t, i) => (
              <div key={i} className="flex shrink-0 items-center gap-3">
                <span
                  className={`rounded border px-1.5 py-0.5 text-[9px] font-bold tracking-wider ${signalStyle(
                    t.signal
                  )}`}
                >
                  {t.signal}
                </span>
                <span className="text-xs font-medium text-white">{t.name}</span>
                <span className="text-xs font-bold text-gray-300">{t.price}</span>
                <span
                  className={`flex items-center gap-0.5 text-xs font-semibold ${
                    t.up ? 'text-grailiq-buy' : 'text-grailiq-avoid'
                  }`}
                >
                  {t.up ? <ArrowUpRight size={12} /> : <ArrowDownRight size={12} />}
                  {t.change}
                </span>
                <span className="text-grailiq-watch">•</span>
              </div>
            ))}
          </div>
        </div>
      </div>
    </div>
  );
}

/* ─── Feature Card ─────────────────────────────────────────── */
function FeatureCard({
  icon: Icon,
  title,
  description,
  accent = 'purple',
}: {
  icon: React.ElementType;
  title: string;
  description: string;
  accent?: 'purple' | 'gold' | 'buy';
}) {
  const accents = {
    purple: {
      border: 'hover:border-grailiq-purple/40',
      bg: 'group-hover:bg-grailiq-purple/25',
      iconBg: 'bg-grailiq-purple/15',
      iconText: 'text-grailiq-purple',
    },
    gold: {
      border: 'hover:border-grailiq-gold/40',
      bg: 'group-hover:bg-grailiq-gold/25',
      iconBg: 'bg-grailiq-gold/15',
      iconText: 'text-grailiq-gold',
    },
    buy: {
      border: 'hover:border-grailiq-buy/40',
      bg: 'group-hover:bg-grailiq-buy/25',
      iconBg: 'bg-grailiq-buy/15',
      iconText: 'text-grailiq-buy',
    },
  }[accent];

  return (
    <div
      className={`group relative rounded-2xl border border-white/10 bg-white/[0.03] p-8 transition-all ${accents.border} hover:bg-white/[0.06]`}
    >
      <div
        className={`mb-5 inline-flex h-12 w-12 items-center justify-center rounded-xl ${accents.iconBg} ${accents.iconText} transition-colors ${accents.bg}`}
      >
        <Icon size={24} />
      </div>
      <h3 className="mb-2 text-lg font-semibold text-white">{title}</h3>
      <p className="text-sm leading-relaxed text-gray-400">{description}</p>
    </div>
  );
}

/* ─── Testimonial ──────────────────────────────────────────── */
function Testimonial({
  quote,
  name,
  role,
  initials,
}: {
  quote: string;
  name: string;
  role: string;
  initials: string;
}) {
  return (
    <div className="rounded-2xl border border-white/10 bg-white/[0.03] p-6 transition-all hover:border-white/20 hover:bg-white/[0.06]">
      <div className="mb-3 flex gap-0.5">
        {[0, 1, 2, 3, 4].map((i) => (
          <Star key={i} size={14} className="fill-grailiq-gold text-grailiq-gold" />
        ))}
      </div>
      <p className="text-sm leading-relaxed text-gray-300">&ldquo;{quote}&rdquo;</p>
      <div className="mt-5 flex items-center gap-3">
        <div className="flex h-9 w-9 items-center justify-center rounded-full bg-gradient-to-br from-grailiq-purple to-grailiq-purple-dark text-xs font-bold text-white">
          {initials}
        </div>
        <div>
          <p className="text-xs font-semibold text-white">{name}</p>
          <p className="text-xs text-gray-500">{role}</p>
        </div>
      </div>
    </div>
  );
}

/* ─── Landing Page ─────────────────────────────────────────── */
export default function Landing() {
  const setIndex = useRotatingIndex(ROTATING_SETS.length);

  return (
    <div className="min-h-screen bg-grailiq-ink text-white">
      {/* Navigation */}
      <nav className="fixed top-0 z-50 w-full border-b border-white/5 bg-grailiq-ink/80 backdrop-blur-xl">
        <div className="mx-auto flex h-16 max-w-7xl items-center justify-between px-6">
          <Link to="/" className="flex items-center gap-1 text-xl font-bold tracking-tight">
            Grail<span className="text-grailiq-purple">IQ</span>
          </Link>
          <div className="hidden items-center gap-8 md:flex">
            <a href="#features" className="text-sm text-gray-400 transition-colors hover:text-white">
              Features
            </a>
            <a href="#how-it-works" className="text-sm text-gray-400 transition-colors hover:text-white">
              How It Works
            </a>
            <a href="#testimonials" className="text-sm text-gray-400 transition-colors hover:text-white">
              Reviews
            </a>
            <a href="#pricing" className="text-sm text-gray-400 transition-colors hover:text-white">
              Pricing
            </a>
          </div>
          <div className="flex items-center gap-3">
            <Link
              to="/sign-in"
              className="rounded-lg px-4 py-2 text-sm font-medium text-gray-300 transition-colors hover:text-white"
            >
              Sign In
            </Link>
            <Link
              to="/sign-in"
              className="rounded-lg bg-grailiq-purple px-5 py-2 text-sm font-semibold text-white shadow-lg shadow-grailiq-purple/25 transition-all hover:bg-grailiq-purple-light hover:shadow-grailiq-purple/40"
            >
              Get Started Free
            </Link>
          </div>
        </div>
      </nav>

      {/* Hero Section */}
      <section className="relative overflow-hidden pt-32 pb-16 md:pt-40 md:pb-24">
        {/* Background effects */}
        <div className="pointer-events-none absolute inset-0">
          <div className="absolute inset-0 bg-grid-pattern opacity-60" />
          <div className="absolute top-10 left-1/4 h-[600px] w-[800px] -translate-x-1/2 rounded-full bg-grailiq-purple/15 blur-[128px]" />
          <div className="absolute top-40 right-0 h-[500px] w-[500px] rounded-full bg-grailiq-gold/8 blur-[120px]" />
        </div>

        <div className="relative mx-auto max-w-7xl px-6">
          <div className="grid items-center gap-12 lg:grid-cols-[1.1fr_1fr] lg:gap-16">
            {/* Left: copy */}
            <div>
              <div className="mb-6 inline-flex items-center gap-2 rounded-full border border-grailiq-gold/30 bg-grailiq-gold/5 px-4 py-1.5 text-sm text-grailiq-gold-light">
                <Sparkles size={14} />
                <span className="font-medium">The Bloomberg Terminal for Sealed Pokémon</span>
              </div>

              <h1 className="font-display text-5xl leading-[0.95] tracking-tight md:text-6xl lg:text-7xl">
                Know what your{' '}
                <span className="relative inline-block">
                  <span className="bg-gradient-to-r from-grailiq-gold via-grailiq-gold-light to-grailiq-gold bg-clip-text text-transparent italic">
                    grails
                  </span>
                  <svg
                    className="absolute -bottom-2 left-0 w-full"
                    height="10"
                    viewBox="0 0 200 10"
                    fill="none"
                  >
                    <path
                      d="M2 7 Q50 2 100 5 T198 4"
                      stroke="url(#underline)"
                      strokeWidth="3"
                      strokeLinecap="round"
                    />
                    <defs>
                      <linearGradient id="underline" x1="0" y1="0" x2="1" y2="0">
                        <stop offset="0%" stopColor="#F4C430" />
                        <stop offset="100%" stopColor="#FFDB6E" />
                      </linearGradient>
                    </defs>
                  </svg>
                </span>
                <br />
                are actually worth.
              </h1>

              {/* Rotating set name */}
              <div className="mt-6 flex items-center gap-2 text-base text-gray-400 md:text-lg">
                <span>Live prices for</span>
                <span className="relative inline-block h-7 min-w-[200px] overflow-hidden">
                  {ROTATING_SETS.map((s, i) => (
                    <span
                      key={s}
                      className={`absolute left-0 top-0 font-semibold text-white transition-all duration-500 ${
                        i === setIndex
                          ? 'translate-y-0 opacity-100'
                          : i === (setIndex - 1 + ROTATING_SETS.length) % ROTATING_SETS.length
                          ? '-translate-y-full opacity-0'
                          : 'translate-y-full opacity-0'
                      }`}
                    >
                      {s}
                    </span>
                  ))}
                </span>
              </div>

              <p className="mt-6 max-w-xl text-base leading-relaxed text-gray-400 md:text-lg">
                Real-time price tracking, buy/hold/avoid signals, and portfolio analytics for every
                sealed Pokémon TCG product. Stop guessing — invest with data.
              </p>

              {/* CTA Buttons */}
              <div className="mt-8 flex flex-col gap-3 sm:flex-row">
                <Link
                  to="/sign-in"
                  className="group flex items-center justify-center gap-2 rounded-xl bg-gradient-to-r from-grailiq-purple to-grailiq-purple-light px-7 py-3.5 text-base font-semibold text-white shadow-xl shadow-grailiq-purple/30 transition-all hover:shadow-grailiq-purple/50 hover:brightness-110"
                >
                  Start Tracking Free
                  <ArrowRight size={18} className="transition-transform group-hover:translate-x-0.5" />
                </Link>
                <a
                  href="#features"
                  className="flex items-center justify-center gap-2 rounded-xl border border-white/15 bg-white/[0.02] px-7 py-3.5 text-base font-medium text-gray-300 transition-all hover:border-white/25 hover:bg-white/[0.05] hover:text-white"
                >
                  See the Platform
                </a>
              </div>

              {/* Trust row */}
              <div className="mt-8 flex flex-wrap items-center gap-x-6 gap-y-3 text-xs text-gray-500">
                <div className="flex items-center gap-1.5">
                  <Check size={14} className="text-grailiq-buy" />
                  <span>No credit card required</span>
                </div>
                <div className="flex items-center gap-1.5">
                  <Check size={14} className="text-grailiq-buy" />
                  <span>Free forever tier</span>
                </div>
                <div className="flex items-center gap-1.5">
                  <Check size={14} className="text-grailiq-buy" />
                  <span>Cancel anytime</span>
                </div>
              </div>
            </div>

            {/* Right: phone mockup */}
            <div className="relative">
              <PhoneMockup />
            </div>
          </div>
        </div>
      </section>

      {/* Live Ticker */}
      <LiveTicker />

      {/* Stats Strip */}
      <section className="border-b border-white/5 py-10">
        <div className="mx-auto grid max-w-5xl grid-cols-2 gap-8 px-6 md:grid-cols-4">
          {[
            { value: '500+', label: 'Sealed Products' },
            { value: '40+', label: 'TCG Sets' },
            { value: '24/7', label: 'Price Monitoring' },
            { value: '<5m', label: 'Update Frequency' },
          ].map((s) => (
            <div key={s.label} className="text-center">
              <p className="font-display text-3xl text-white md:text-4xl">{s.value}</p>
              <p className="mt-1 text-xs uppercase tracking-wider text-gray-500">{s.label}</p>
            </div>
          ))}
        </div>
      </section>

      {/* Features Section */}
      <section id="features" className="relative py-24 md:py-32">
        <div className="mx-auto max-w-7xl px-6">
          <div className="mx-auto mb-16 max-w-2xl text-center">
            <p className="mb-3 text-sm font-semibold uppercase tracking-wider text-grailiq-gold">
              The Platform
            </p>
            <h2 className="font-display text-4xl md:text-5xl">
              Every tool a serious collector needs
            </h2>
            <p className="mt-4 text-gray-400">
              Price data, investment signals, and portfolio analytics — built for the people who
              actually hold the product.
            </p>
          </div>

          <div className="grid gap-6 md:grid-cols-2 lg:grid-cols-3">
            <FeatureCard
              icon={LineChart}
              title="Live Price Tracking"
              description="Prices from TCGPlayer, eBay sold listings, and major retailers — refreshed continuously. Historical charts across 7d, 30d, 90d, and all-time."
              accent="purple"
            />
            <FeatureCard
              icon={Gauge}
              title="GrailIQ Score"
              description="A proprietary 0–100 score combining price momentum, scarcity, demand, and long-term value. One number that cuts through the noise."
              accent="gold"
            />
            <FeatureCard
              icon={Activity}
              title="Buy / Hold / Avoid Signals"
              description="Data-driven signals powered by volatility, trend, and sentiment analysis. Know when to move — without relying on rumor threads."
              accent="buy"
            />
            <FeatureCard
              icon={Wallet}
              title="Portfolio Tracker"
              description="Log purchases, track current value, and see real-time P&L on your full collection. Break it down by set, product type, or time horizon."
              accent="purple"
            />
            <FeatureCard
              icon={Bell}
              title="Price & Restock Alerts"
              description="Push alerts when products drop to your target, when signals flip, or when that sold-out ETB lands back in stock."
              accent="gold"
            />
            <FeatureCard
              icon={Package}
              title="Full Set Explorer"
              description="Browse every sealed product across every Scarlet & Violet, Sword & Shield, and classic set. Compare retailers side by side."
              accent="purple"
            />
          </div>
        </div>
      </section>

      {/* How It Works */}
      <section id="how-it-works" className="relative border-t border-white/5 py-24 md:py-32">
        <div className="pointer-events-none absolute inset-0 bg-grid-pattern opacity-40" />
        <div className="relative mx-auto max-w-7xl px-6">
          <div className="mx-auto mb-16 max-w-2xl text-center">
            <p className="mb-3 text-sm font-semibold uppercase tracking-wider text-grailiq-gold">
              How It Works
            </p>
            <h2 className="font-display text-4xl md:text-5xl">Three steps. Smarter every buy.</h2>
          </div>

          <div className="grid gap-12 md:grid-cols-3 md:gap-6">
            {[
              {
                step: '01',
                icon: Eye,
                title: 'Track',
                desc: 'Browse every sealed product across 40+ sets. Prices refresh in real time from the places the market actually cares about.',
              },
              {
                step: '02',
                icon: BarChart3,
                title: 'Analyze',
                desc: 'GrailIQ scores, historical charts, and buy/hold/avoid signals surface the opportunities before the Discord servers catch on.',
              },
              {
                step: '03',
                icon: TrendingUp,
                title: 'Profit',
                desc: 'Build your portfolio, set alerts, track P&L. Move on data, not vibes — and watch the grails actually start paying off.',
              },
            ].map((item, i) => (
              <div
                key={item.step}
                className="relative rounded-3xl border border-white/10 bg-white/[0.02] p-8 text-center"
              >
                {i < 2 && (
                  <div className="pointer-events-none absolute -right-3 top-1/2 hidden h-px w-6 bg-grailiq-purple/30 md:block" />
                )}
                <div className="mx-auto mb-6 flex h-16 w-16 items-center justify-center rounded-2xl bg-gradient-to-br from-grailiq-purple/25 to-grailiq-purple/5 text-grailiq-purple-light">
                  <item.icon size={28} />
                </div>
                <span className="mb-2 block text-xs font-bold uppercase tracking-widest text-grailiq-gold">
                  Step {item.step}
                </span>
                <h3 className="mb-3 font-display text-2xl text-white">{item.title}</h3>
                <p className="text-sm leading-relaxed text-gray-400">{item.desc}</p>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* Why GrailIQ comparison */}
      <section className="relative border-t border-white/5 py-24 md:py-32">
        <div className="mx-auto max-w-6xl px-6">
          <div className="mx-auto mb-12 max-w-2xl text-center">
            <p className="mb-3 text-sm font-semibold uppercase tracking-wider text-grailiq-gold">
              Why GrailIQ
            </p>
            <h2 className="font-display text-4xl md:text-5xl">
              The only tool built for sealed investors
            </h2>
          </div>

          <div className="grid gap-4 md:grid-cols-2">
            {[
              {
                title: 'Built for sealed — not singles',
                desc: 'Every feature is tuned for booster boxes, ETBs, and collection boxes. No card-grading noise.',
              },
              {
                title: 'Actual investment signals',
                desc: 'Buy/Hold/Avoid calls backed by price momentum, volatility, and market data — not Reddit takes.',
              },
              {
                title: 'Portfolio P&L that makes sense',
                desc: 'Real cost basis tracking with time-weighted returns. See which sets are carrying your collection.',
              },
              {
                title: 'Alerts that actually matter',
                desc: 'Restock notifications from major retailers plus price, signal, and score alerts — not spam.',
              },
              {
                title: 'Fast, clean, no clutter',
                desc: 'No ad-stuffed walls. No 30 tabs of junk. Just the data and the call.',
              },
              {
                title: 'Fair pricing — free tier forever',
                desc: 'The core you need, free. Upgrade only when you want the pro-grade analytics.',
              },
            ].map((item) => (
              <div
                key={item.title}
                className="flex gap-4 rounded-2xl border border-white/10 bg-white/[0.03] p-6"
              >
                <div className="flex h-10 w-10 shrink-0 items-center justify-center rounded-xl bg-grailiq-gold/15 text-grailiq-gold">
                  <Check size={20} />
                </div>
                <div>
                  <h3 className="font-semibold text-white">{item.title}</h3>
                  <p className="mt-1 text-sm leading-relaxed text-gray-400">{item.desc}</p>
                </div>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* Testimonials */}
      <section id="testimonials" className="relative border-t border-white/5 py-24 md:py-32">
        <div className="mx-auto max-w-7xl px-6">
          <div className="mx-auto mb-12 max-w-2xl text-center">
            <div className="mb-4 flex items-center justify-center gap-1">
              {[0, 1, 2, 3, 4].map((i) => (
                <Star key={i} size={18} className="fill-grailiq-gold text-grailiq-gold" />
              ))}
              <span className="ml-2 text-sm font-semibold text-white">4.9 · Early users</span>
            </div>
            <h2 className="font-display text-4xl md:text-5xl">Loved by serious collectors</h2>
          </div>

          <div className="grid gap-6 md:grid-cols-3">
            <Testimonial
              quote="Finally, a platform that treats sealed like the asset class it is. The GrailIQ Score caught Prismatic Evolutions before it doubled. Paid for itself in a week."
              name="Marcus R."
              role="Long-term collector · 8 years"
              initials="MR"
            />
            <Testimonial
              quote="I used to track everything in a spreadsheet. Portfolio tracker and real-time P&L is the upgrade I didn't know I needed. The restock alerts alone are worth it."
              name="Priya K."
              role="Set completionist"
              initials="PK"
            />
            <Testimonial
              quote="The buy/hold/avoid signals are shockingly good. Not hype — just clean data on trend and volatility. My flip rate has genuinely gone up."
              name="Jordan T."
              role="Reseller · TCG flipper"
              initials="JT"
            />
          </div>
        </div>
      </section>

      {/* Pricing */}
      <section id="pricing" className="relative border-t border-white/5 py-24 md:py-32">
        <div className="mx-auto max-w-7xl px-6">
          <div className="mx-auto max-w-3xl text-center">
            <p className="mb-3 text-sm font-semibold uppercase tracking-wider text-grailiq-gold">
              Pricing
            </p>
            <h2 className="font-display text-4xl md:text-5xl">
              Start free. Upgrade when the numbers tell you to.
            </h2>
            <p className="mt-4 text-gray-400">
              Full access to tracking, portfolio, and signals. No lock-in, no credit card.
            </p>
          </div>

          <div className="mx-auto mt-12 grid max-w-4xl gap-6 md:grid-cols-2">
            {/* Free Tier */}
            <div className="rounded-3xl border border-white/10 bg-white/[0.03] p-8">
              <div className="flex items-center gap-2">
                <h3 className="text-lg font-semibold text-white">Free</h3>
                <span className="rounded-full bg-white/10 px-2 py-0.5 text-[10px] font-semibold uppercase tracking-wider text-gray-300">
                  Forever
                </span>
              </div>
              <p className="mt-1 text-sm text-gray-400">Everything you need to get started</p>
              <p className="mt-6 flex items-baseline gap-1">
                <span className="font-display text-5xl text-white">$0</span>
                <span className="text-gray-400">/ month</span>
              </p>
              <Link
                to="/sign-in"
                className="mt-8 block rounded-xl border border-white/15 py-3 text-center text-sm font-semibold text-white transition-all hover:border-white/30 hover:bg-white/5"
              >
                Get Started
              </Link>
              <ul className="mt-8 space-y-3 text-sm text-gray-300">
                {[
                  'Track up to 50 products',
                  '30-day price history',
                  'Portfolio tracker',
                  '5 price alerts',
                  'GrailIQ scores',
                ].map((f) => (
                  <li key={f} className="flex items-start gap-2">
                    <Check size={16} className="mt-0.5 shrink-0 text-grailiq-buy" />
                    {f}
                  </li>
                ))}
              </ul>
            </div>

            {/* Pro Tier */}
            <div className="relative rounded-3xl border-2 border-grailiq-gold/50 bg-gradient-to-b from-grailiq-gold/[0.08] to-grailiq-purple/[0.05] p-8 shadow-xl shadow-grailiq-gold/10">
              <div className="absolute -top-3 left-1/2 -translate-x-1/2 rounded-full bg-gradient-to-r from-grailiq-gold to-grailiq-gold-light px-4 py-1 text-[11px] font-bold uppercase tracking-wider text-grailiq-ink shadow-lg">
                Most Popular
              </div>
              <div className="flex items-center gap-2">
                <h3 className="text-lg font-semibold text-white">Pro</h3>
                <Sparkles size={14} className="text-grailiq-gold" />
              </div>
              <p className="mt-1 text-sm text-gray-400">For serious collectors & investors</p>
              <p className="mt-6 flex items-baseline gap-1">
                <span className="font-display text-5xl text-white">$9</span>
                <span className="text-gray-400">/ month</span>
              </p>
              <Link
                to="/sign-in"
                className="mt-8 block rounded-xl bg-gradient-to-r from-grailiq-gold to-grailiq-gold-light py-3 text-center text-sm font-bold text-grailiq-ink shadow-lg shadow-grailiq-gold/30 transition-all hover:brightness-110"
              >
                Start Free Trial
              </Link>
              <ul className="mt-8 space-y-3 text-sm text-gray-300">
                {[
                  'Unlimited product tracking',
                  'Full price history (all time)',
                  'Advanced portfolio analytics',
                  'Unlimited price & restock alerts',
                  'Buy / Hold / Avoid signals',
                  'Priority data refreshes',
                  'CSV export',
                ].map((f) => (
                  <li key={f} className="flex items-start gap-2">
                    <Check size={16} className="mt-0.5 shrink-0 text-grailiq-gold" />
                    {f}
                  </li>
                ))}
              </ul>
            </div>
          </div>
        </div>
      </section>

      {/* Final CTA */}
      <section className="relative border-t border-white/5 py-24 md:py-32">
        <div className="pointer-events-none absolute inset-0">
          <div className="absolute bottom-0 left-1/2 h-[500px] w-[700px] -translate-x-1/2 rounded-full bg-grailiq-purple/12 blur-[120px]" />
          <div className="absolute bottom-10 right-1/3 h-64 w-64 rounded-full bg-grailiq-gold/8 blur-[100px]" />
        </div>
        <div className="relative mx-auto max-w-3xl px-6 text-center">
          <div className="mb-6 inline-flex items-center gap-2 rounded-full border border-grailiq-gold/30 bg-grailiq-gold/5 px-4 py-1.5 text-sm text-grailiq-gold-light">
            <ShieldCheck size={14} />
            <span>No credit card required</span>
          </div>
          <h2 className="font-display text-4xl md:text-6xl">
            Ready to level up your{' '}
            <span className="bg-gradient-to-r from-grailiq-gold to-grailiq-gold-light bg-clip-text italic text-transparent">
              collection
            </span>
            ?
          </h2>
          <p className="mt-5 text-lg text-gray-400">
            Join GrailIQ and start making data-driven decisions on every sealed buy.
          </p>
          <Link
            to="/sign-in"
            className="group mt-10 inline-flex items-center gap-2 rounded-xl bg-gradient-to-r from-grailiq-purple to-grailiq-purple-light px-10 py-4 text-base font-semibold text-white shadow-xl shadow-grailiq-purple/30 transition-all hover:shadow-grailiq-purple/50 hover:brightness-110"
          >
            Create Your Free Account
            <ChevronRight size={18} className="transition-transform group-hover:translate-x-0.5" />
          </Link>
        </div>
      </section>

      {/* Footer */}
      <footer className="border-t border-white/5 bg-grailiq-ink py-14">
        <div className="mx-auto max-w-7xl px-6">
          <div className="grid gap-10 md:grid-cols-4">
            <div>
              <div className="flex items-center gap-1 text-xl font-bold">
                Grail<span className="text-grailiq-purple">IQ</span>
              </div>
              <p className="mt-3 text-sm text-gray-500">
                Price intelligence for sealed Pokémon TCG products.
              </p>
            </div>
            <div>
              <p className="mb-3 text-xs font-semibold uppercase tracking-wider text-gray-400">
                Product
              </p>
              <ul className="space-y-2 text-sm text-gray-500">
                <li>
                  <a href="#features" className="hover:text-white">
                    Features
                  </a>
                </li>
                <li>
                  <a href="#pricing" className="hover:text-white">
                    Pricing
                  </a>
                </li>
                <li>
                  <a href="#how-it-works" className="hover:text-white">
                    How It Works
                  </a>
                </li>
              </ul>
            </div>
            <div>
              <p className="mb-3 text-xs font-semibold uppercase tracking-wider text-gray-400">
                Company
              </p>
              <ul className="space-y-2 text-sm text-gray-500">
                <li>
                  <a href="mailto:support@grailiq.com" className="hover:text-white">
                    Contact
                  </a>
                </li>
                <li>
                  <a href="#" className="hover:text-white">
                    Privacy
                  </a>
                </li>
                <li>
                  <a href="#" className="hover:text-white">
                    Terms
                  </a>
                </li>
              </ul>
            </div>
            <div>
              <p className="mb-3 text-xs font-semibold uppercase tracking-wider text-gray-400">
                Get the App
              </p>
              <div className="flex flex-col gap-2">
                <div className="flex items-center gap-2 rounded-xl border border-white/10 bg-white/[0.02] px-3 py-2 text-xs text-gray-400">
                  <Package size={14} /> iOS · Coming soon
                </div>
                <div className="flex items-center gap-2 rounded-xl border border-white/10 bg-white/[0.02] px-3 py-2 text-xs text-gray-400">
                  <Package size={14} /> Android · Coming soon
                </div>
              </div>
            </div>
          </div>
          <div className="mt-12 flex flex-col items-center justify-between gap-4 border-t border-white/5 pt-6 md:flex-row">
            <p className="text-xs text-gray-600">
              &copy; {new Date().getFullYear()} GrailIQ. All rights reserved.
            </p>
            <p className="text-xs text-gray-600">
              Not affiliated with The Pokémon Company International.
            </p>
          </div>
        </div>
      </footer>
    </div>
  );
}
