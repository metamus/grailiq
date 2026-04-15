import { Link } from 'react-router-dom';
import { useEffect, useState } from 'react';
import axios from 'axios';
import { ScoreRing } from '@/components/ScoreRing';
import {
  Bell,
  ArrowRight,
  Star,
  ChevronRight,
  ChevronDown,
  LineChart,
  Package,
  Wallet,
  Sparkles,
  Check,
  ArrowUpRight,
  ArrowDownRight,
  Activity,
  Gauge,
  ShieldCheck,
  Zap,
  FileSpreadsheet,
  Radio,
  X,
} from 'lucide-react';

/* ─── Rotating Set Names (real current sets) ────────────────── */
const ROTATING_SETS = [
  'Prismatic Evolutions',
  'Surging Sparks',
  'Journey Together',
  'Destined Rivals',
  'Pokémon 151',
  'Mega Evolution',
];

function useRotatingIndex(length: number, intervalMs = 2000) {
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
  price: string;
  change: string;
  up: boolean;
  signal: Signal;
}

const TICKER_DATA: TickerItem[] = [
  { name: 'Prismatic Evolutions ETB', price: '$84.99', change: '+12.4%', up: true, signal: 'BUY' },
  { name: 'Surging Sparks Booster Box', price: '$178.50', change: '+6.8%', up: true, signal: 'BUY' },
  { name: 'Journey Together Booster Bundle', price: '$39.99', change: '+3.1%', up: true, signal: 'HOLD' },
  { name: 'Pokémon 151 UPC', price: '$289.00', change: '−2.1%', up: false, signal: 'HOLD' },
  { name: 'Destined Rivals ETB', price: '$74.80', change: '+0.6%', up: true, signal: 'WATCH' },
  { name: 'Obsidian Flames BB', price: '$164.00', change: '+3.2%', up: true, signal: 'BUY' },
  { name: 'Paradox Rift ETB', price: '$58.95', change: '−1.8%', up: false, signal: 'AVOID' },
  { name: 'Crown Zenith Collection', price: '$112.00', change: '+4.9%', up: true, signal: 'BUY' },
  { name: 'Evolving Skies BB', price: '$1,240.00', change: '+18.2%', up: true, signal: 'BUY' },
];

function signalStyle(signal: Signal) {
  switch (signal) {
    case 'BUY':
      return 'bg-emerald-500/15 text-emerald-400 border-emerald-400/30';
    case 'HOLD':
      return 'bg-amber-500/15 text-amber-400 border-amber-400/30';
    case 'WATCH':
      return 'bg-slate-500/20 text-slate-300 border-slate-400/30';
    case 'AVOID':
      return 'bg-rose-500/15 text-rose-400 border-rose-400/30';
  }
}

/* ─── Inline Sparkline (for the phone preview) ───────────────── */
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
  const gradId = `land-sg-${color.replace('#', '')}`;
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
  const trend = [
    10200, 10380, 10290, 10510, 10720, 10650, 10840, 11020, 11180, 11090, 11300,
    11450, 11320, 11560, 11740, 11890, 11760, 12010, 12180, 12340,
  ];

  const [displayValue, setDisplayValue] = useState(0);

  useEffect(() => {
    let animationFrame: number;
    let startTime: number | null = null;
    const targetValue = 12340;
    const duration = 1500; // 1.5 seconds

    const animate = (currentTime: number) => {
      if (startTime === null) startTime = currentTime;
      const elapsed = currentTime - startTime;
      const progress = Math.min(elapsed / duration, 1);
      setDisplayValue(Math.floor(progress * targetValue));

      if (progress < 1) {
        animationFrame = requestAnimationFrame(animate);
      }
    };

    animationFrame = requestAnimationFrame(animate);
    return () => cancelAnimationFrame(animationFrame);
  }, []);

  return (
    <div className="relative mx-auto w-full max-w-[320px]">
      {/* Device frame */}
      <div className="relative rounded-[44px] border border-white/10 bg-gradient-to-br from-zinc-900 to-grailiq-ink p-2.5 shadow-2xl shadow-grailiq-purple/30">
        <div className="rounded-[36px] bg-grailiq-ink overflow-hidden">
          {/* Status bar */}
          <div className="flex items-center justify-between px-6 pt-4 pb-2 text-[10px] font-semibold text-white">
            <span>9:41</span>
            <div className="flex items-center gap-1">
              <span className="h-1 w-4 rounded-full bg-white" />
              <span className="h-1 w-4 rounded-full bg-white" />
              <span className="h-1 w-4 rounded-full bg-white/60" />
            </div>
          </div>

          {/* Portfolio card */}
          <div className="mx-4 mt-2 rounded-2xl border border-white/10 bg-gradient-to-br from-grailiq-purple/20 to-transparent p-4">
            <p className="text-[9px] font-semibold uppercase tracking-wider text-grailiq-purple-light">
              Portfolio Value
            </p>
            <p className="mt-1 font-display text-3xl tabular-nums text-white">${displayValue.toLocaleString()}</p>
            <div className="mt-1 flex items-center gap-1 text-xs">
              <ArrowUpRight size={12} className="text-emerald-400" />
              <span className="font-semibold text-emerald-400">+$2,140 (21.0%)</span>
              <span className="text-gray-500">all time</span>
            </div>
            <div className="mt-3">
              <Sparkline points={trend} color="#22C55E" width={260} height={48} />
            </div>
          </div>

          {/* Holding row */}
          <div className="mx-4 mt-3 rounded-xl border border-white/5 bg-white/[0.03] px-3 py-3">
            <div className="flex items-center gap-3">
              <div className="h-10 w-10 flex items-center justify-center rounded-lg bg-white/5 text-lg">📦</div>
              <div className="flex-1 min-w-0">
                <p className="truncate text-xs font-bold text-white">Prismatic Evolutions BB</p>
                <p className="text-[10px] text-gray-400">SV8.5 · 3 qty</p>
              </div>
              <div className="text-right">
                <p className="text-xs font-bold tabular-nums text-white">$534</p>
                <p className="text-[10px] font-semibold text-emerald-400">+18.4%</p>
              </div>
            </div>
          </div>

          {/* Signal card */}
          <div
            className="mx-4 mt-3 mb-6 rounded-xl border border-emerald-400/20 bg-emerald-500/5 px-3 py-2.5 transition-all duration-500"
            style={{
              opacity: displayValue > 0 ? 1 : 0,
              transform: displayValue > 0 ? 'translateY(0)' : 'translateY(16px)',
              animation: displayValue > 0 ? 'pulse-bg 3s ease-in-out infinite' : 'none',
            }}
          >
            <div className="flex items-center gap-2">
              <div className="h-1.5 w-1.5 animate-pulse rounded-full bg-emerald-400" />
              <p className="text-[10px] font-bold uppercase tracking-wider text-emerald-400">Strong Buy</p>
              <span
                className="ml-auto text-[10px] tabular-nums text-emerald-400"
                style={{ animation: 'slide-up 400ms ease-out infinite 2s' }}
              >
                92
              </span>
            </div>
            <p className="mt-1 text-[11px] font-medium text-white">Surging Sparks Booster Box</p>
            <p className="text-[10px] text-gray-400">Momentum + scarcity breakout</p>
            <style>{`
              @keyframes pulse-bg {
                0%, 100% { background-color: rgba(5, 150, 105, 0.05); }
                50% { background-color: rgba(5, 150, 105, 0.12); }
              }
              @keyframes slide-up {
                0% { transform: translateY(0); }
                50% { transform: translateY(-2px); }
                100% { transform: translateY(0); }
              }
            `}</style>
          </div>
        </div>
      </div>

      {/* Floating badges */}
      <div
        className="absolute -left-6 top-28 rounded-xl border border-grailiq-gold/30 bg-grailiq-ink/90 px-3 py-2 shadow-xl backdrop-blur-md transition-opacity duration-500"
        style={{
          animation: displayValue > 0 ? 'float 6s ease-in-out infinite' : 'none',
          opacity: displayValue > 0 ? 1 : 0,
        }}
      >
        <div className="flex items-center gap-2">
          <Bell size={12} className="text-grailiq-gold" />
          <span className="text-[10px] font-bold uppercase tracking-wider text-grailiq-gold">Grail Alert</span>
        </div>
        <p className="mt-0.5 text-[10px] text-gray-400">Back in stock at Target</p>
      </div>

      <div
        className="absolute -right-4 top-60 rounded-xl border border-grailiq-purple/30 bg-grailiq-ink/90 px-3 py-2 shadow-xl backdrop-blur-md"
        style={{ animation: 'float 6s ease-in-out infinite 2s' }}
      >
        <div className="flex items-center gap-2">
          <Gauge size={12} className="text-grailiq-purple-light" />
          <span className="text-[10px] font-bold uppercase tracking-wider text-grailiq-purple-light">
            Score ↑ 4pts
          </span>
        </div>
        <p className="mt-0.5 text-[10px] text-gray-400">Prismatic ETB</p>
      </div>
    </div>
  );
}

/* ─── Live Ticker ──────────────────────────────────────────── */
function LiveTicker() {
  return (
    <div className="relative overflow-hidden border-y border-white/5 bg-grailiq-ink/60 py-3">
      <div className="pointer-events-none absolute inset-y-0 left-0 z-10 w-24 bg-gradient-to-r from-grailiq-ink to-transparent" />
      <div className="pointer-events-none absolute inset-y-0 right-0 z-10 w-24 bg-gradient-to-l from-grailiq-ink to-transparent" />
      <div className="flex items-center gap-3 px-6">
        <div className="flex shrink-0 items-center gap-2 border-r border-white/10 pr-4">
          <div className="flex items-center gap-1.5">
            <span className="h-2 w-2 animate-pulse rounded-full bg-emerald-400" />
            <span className="text-[11px] font-bold uppercase tracking-wider text-emerald-400">
              Live
            </span>
          </div>
          <span className="text-[11px] font-semibold uppercase tracking-wider text-gray-500">Market</span>
        </div>
        <div className="relative flex-1 overflow-hidden">
          <div className="flex min-w-max animate-marquee gap-8">
            {[...TICKER_DATA, ...TICKER_DATA].map((t, i) => (
              <div key={i} className="flex shrink-0 items-center gap-3">
                <div className="h-5 w-5 rounded bg-white/5 border border-white/10 flex-shrink-0" />
                <span
                  className={`rounded border px-1.5 py-0.5 text-[9px] font-bold tracking-wider ${signalStyle(t.signal)}`}
                >
                  {t.signal}
                </span>
                <span className="text-xs font-medium text-white">{t.name}</span>
                <span className="text-xs font-bold text-gray-300 tabular-nums">{t.price}</span>
                <span
                  className={`flex items-center gap-0.5 text-xs font-semibold tabular-nums ${
                    t.up ? 'text-emerald-400' : 'text-rose-400'
                  }`}
                >
                  {t.up ? <ArrowUpRight size={12} /> : <ArrowDownRight size={12} />}
                  {t.change}
                </span>
                <span className="text-gray-600">•</span>
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
}: {
  icon: React.ElementType;
  title: string;
  description: string;
}) {
  return (
    <div className="group relative overflow-hidden rounded-2xl border border-white/10 bg-white/[0.02] p-6 transition-all hover:border-grailiq-purple/40 hover:bg-white/[0.04]">
      <div className="absolute -right-10 -top-10 h-32 w-32 rounded-full bg-grailiq-purple/10 opacity-0 blur-2xl transition-opacity group-hover:opacity-100" />
      <div className="relative">
        <div className="mb-4 inline-flex h-11 w-11 items-center justify-center rounded-xl bg-grailiq-purple/15 text-grailiq-purple-light transition-colors group-hover:bg-grailiq-purple/25">
          <Icon size={20} />
        </div>
        <h3 className="mb-1.5 text-lg font-semibold text-white">{title}</h3>
        <p className="text-sm leading-relaxed text-gray-400">{description}</p>
      </div>
    </div>
  );
}

/* ─── Backtest Stats ───────────────────────────────────────── */
function BacktestStats() {
  const [stats, setStats] = useState<any>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const fetchStats = async () => {
      try {
        const response = await axios.get('/api/v1/score-backtest');
        setStats(response.data?.data);
      } catch (err) {
        console.error('Failed to fetch backtest stats:', err);
      } finally {
        setLoading(false);
      }
    };
    fetchStats();
  }, []);

  const show6mo = stats?.trailing_6mo?.insufficient_data !== true;
  const show3mo = stats?.trailing_3mo?.insufficient_data !== true;

  if (loading) {
    return (
      <section className="border-y border-white/5 py-12">
        <div className="mx-auto max-w-5xl px-6 text-center">
          <p className="text-gray-400">Loading backtest data...</p>
        </div>
      </section>
    );
  }

  if (!show6mo && !show3mo) {
    return (
      <section className="border-y border-white/5 py-12">
        <div className="mx-auto max-w-5xl px-6 text-center">
          <p className="text-sm text-grailiq-gold-light font-semibold mb-2">⏱️ Backtesting in Progress</p>
          <p className="text-gray-400">Backtesting starts May 1 — launching soon</p>
        </div>
      </section>
    );
  }

  return (
    <section className="border-y border-white/5 py-12">
      <div className="mx-auto max-w-5xl px-6">
        <h2 className="text-sm font-bold uppercase tracking-wider text-gray-500 text-center mb-8">
          Backtested BUY Signal Performance
        </h2>
        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
          {show6mo && (
            <div className="rounded-2xl border border-grailiq-gold/30 bg-gradient-to-br from-grailiq-gold/5 to-transparent p-6">
              <p className="text-xs font-bold uppercase tracking-wider text-grailiq-gold-light mb-4">
                Last 6 Months
              </p>
              <div className="space-y-4">
                <div>
                  <p className="text-2xl font-bold text-white">+{stats.trailing_6mo.avg_return_pct}%</p>
                  <p className="text-xs text-gray-400 mt-1">Avg Return on BUY Signals</p>
                </div>
                <div className="flex gap-4">
                  <div>
                    <p className="text-xl font-bold text-emerald-400">{stats.trailing_6mo.win_rate_pct}%</p>
                    <p className="text-xs text-gray-400 mt-1">Win Rate</p>
                  </div>
                  <div>
                    <p className="text-xl font-bold text-white">{stats.trailing_6mo.buys}</p>
                    <p className="text-xs text-gray-400 mt-1">BUY Signals</p>
                  </div>
                </div>
              </div>
            </div>
          )}
          {show3mo && (
            <div className="rounded-2xl border border-grailiq-purple/30 bg-gradient-to-br from-grailiq-purple/5 to-transparent p-6">
              <p className="text-xs font-bold uppercase tracking-wider text-grailiq-purple-light mb-4">
                Last 3 Months
              </p>
              <div className="space-y-4">
                <div>
                  <p className="text-2xl font-bold text-white">+{stats.trailing_3mo.avg_return_pct}%</p>
                  <p className="text-xs text-gray-400 mt-1">Avg Return on BUY Signals</p>
                </div>
                <div className="flex gap-4">
                  <div>
                    <p className="text-xl font-bold text-emerald-400">{stats.trailing_3mo.win_rate_pct}%</p>
                    <p className="text-xs text-gray-400 mt-1">Win Rate</p>
                  </div>
                  <div>
                    <p className="text-xl font-bold text-white">{stats.trailing_3mo.buys}</p>
                    <p className="text-xs text-gray-400 mt-1">BUY Signals</p>
                  </div>
                </div>
              </div>
            </div>
          )}
        </div>
      </div>
    </section>
  );
}

/* ─── FAQ Item ─────────────────────────────────────────────── */
function FAQItem({ q, a, defaultOpen }: { q: string; a: string; defaultOpen?: boolean }) {
  const [open, setOpen] = useState(!!defaultOpen);
  return (
    <div className="rounded-2xl border border-white/10 bg-white/[0.02] transition-colors hover:border-white/20">
      <button
        onClick={() => setOpen((v) => !v)}
        className="flex w-full items-center justify-between gap-4 px-6 py-5 text-left"
      >
        <span className="text-base font-semibold text-white">{q}</span>
        <ChevronDown
          size={18}
          className={`shrink-0 text-gray-400 transition-transform ${open ? 'rotate-180 text-grailiq-purple-light' : ''}`}
        />
      </button>
      {open && (
        <div className="px-6 pb-5 pt-0">
          <p className="text-sm leading-relaxed text-gray-400">{a}</p>
        </div>
      )}
    </div>
  );
}

/* ─── Score Demo Card ────────────────────────────────────────── */
function ScoreDemoCard() {
  const [selectedSet, setSelectedSet] = useState<string>('Prismatic Evolutions');
  const setNames = Object.keys(demoScores);
  const demo = demoScores[selectedSet as keyof typeof demoScores] || demoScores['Prismatic Evolutions'];

  return (
    <div className="mt-12 max-w-md">
      <p className="text-xs font-bold uppercase tracking-wider text-gray-500 mb-4">
        Try it →
      </p>
      <div className="rounded-xl border border-grailiq-gold/30 bg-gradient-to-br from-grailiq-gold/10 to-transparent p-5">
        <select
          value={selectedSet}
          onChange={(e) => setSelectedSet(e.target.value)}
          className="w-full mb-5 px-3 py-2 rounded-lg bg-white/5 border border-white/10 text-white text-sm font-medium hover:border-grailiq-gold/50 focus:outline-none focus:border-grailiq-gold/50"
        >
          {setNames.map((name) => (
            <option key={name} value={name} className="bg-grailiq-dark text-white">
              {name}
            </option>
          ))}
        </select>

        <div className="flex items-start gap-4">
          <div className="flex-1">
            <p className="text-sm font-semibold text-white mb-1">{demo.name}</p>
            <p className="text-xs text-gray-400 mb-3">{demo.thesis}</p>
            <div className="flex items-center gap-2">
              <span className="text-xs font-bold uppercase tracking-wider text-gray-500">Price</span>
              <span className="text-sm font-semibold text-white tabular-nums">
                ${demo.price.toFixed(2)}
              </span>
            </div>
          </div>
          <div className="flex-shrink-0">
            <ScoreRing
              score={demo.score}
              size={64}
              bias={demo.bias}
            />
          </div>
        </div>
      </div>
    </div>
  );
}

/* ─── Landing Page ─────────────────────────────────────────── */
const ROTATING_TAGLINES = [
  'For collectors who grew up pulling Charizards and grew into pulling triggers.',
  'Finally, a way to know if that ETB is worth $85 or $850.',
  'Every sealed product. Every retailer. One score.',
  'Nostalgia-grade intel, investor-grade data.',
  'Buy the dip. Hold the grails. Know the difference.',
  'Prices, not hype.',
];

const demoScores = {
  'Prismatic Evolutions': {
    name: 'Prismatic Evolutions ETB',
    price: 89.99,
    score: 92,
    bias: 'bullish' as const,
    thesis: 'Strong demand on chase cards + limited print status = tight liquidity.',
  },
  'Surging Sparks': {
    name: 'Surging Sparks Booster Box',
    price: 178.50,
    score: 88,
    bias: 'bullish' as const,
    thesis: 'Momentum from competitive play meta + booster revenue parity.',
  },
  'Journey Together': {
    name: 'Journey Together Collection Box',
    price: 39.99,
    score: 72,
    bias: 'neutral' as const,
    thesis: 'Steady collector interest, but higher print run means slower appreciation.',
  },
  'Mega Evolution': {
    name: 'Mega Evolution Collection',
    price: 129.99,
    score: 78,
    bias: 'neutral' as const,
    thesis: 'Classic nostalgia appeal, but vintage reprints limit exclusivity.',
  },
  'Perfect Order': {
    name: 'Perfect Order Booster Box',
    price: 164.00,
    score: 81,
    bias: 'bullish' as const,
    thesis: 'Early set momentum + international demand support valuation.',
  },
};

export default function Landing() {
  const setIndex = useRotatingIndex(ROTATING_SETS.length);
  const taglineIndex = useRotatingIndex(ROTATING_TAGLINES.length, 4000);
  const [stats, setStats] = useState({ products: '216+', sets: '173' });

  useEffect(() => {
    // Set OG meta tags
    document.title = 'GrailIQ - Pokemon TCG Price Intelligence & Portfolio Analytics';
    const setMeta = (name: string, content: string) => {
      let meta = document.querySelector(`meta[property="${name}"]`) || document.querySelector(`meta[name="${name}"]`);
      if (!meta) {
        meta = document.createElement('meta');
        document.head.appendChild(meta);
      }
      meta.setAttribute('property' in meta ? 'property' : 'name', name);
      meta.setAttribute('content', content);
    };

    setMeta('og:title', 'GrailIQ - Pokemon TCG Price Intelligence');
    setMeta('og:description', 'Real-time price data, investment signals, and portfolio analytics for sealed Pokemon TCG products.');
    setMeta('og:type', 'website');
    setMeta('og:url', 'https://grailiq.com');
    setMeta('og:image', 'https://grailiq.com/og-image.png');
    setMeta('description', 'Real-time price data, investment signals, and portfolio analytics for sealed Pokemon TCG products.');
  }, []);

  useEffect(() => {
    // Fetch real product and set counts from API
    (async () => {
      try {
        const [productsRes, setsRes] = await Promise.all([
          axios.get('/api/v1/products'),
          axios.get('/api/v1/sets'),
        ]);
        const productCount = (productsRes.data.data || []).length;
        const setCount = (setsRes.data.data || []).length;
        setStats({
          products: productCount > 0 ? productCount.toString() : '216+',
          sets: setCount > 0 ? setCount.toString() : '173',
        });
      } catch {
        // Fallback to defaults if API unavailable
      }
    })();
  }, []);

  return (
    <div className="min-h-screen bg-grailiq-ink text-white">
      {/* Navigation */}
      <nav className="fixed top-0 z-50 w-full border-b border-white/5 bg-grailiq-ink/80 backdrop-blur-xl">
        <div className="mx-auto flex h-16 max-w-7xl items-center justify-between px-5 sm:px-6">
          <Link to="/" className="flex items-center gap-1 text-xl font-bold tracking-tight">
            Grail<span className="text-grailiq-purple-light">IQ</span>
          </Link>
          <div className="hidden items-center gap-8 md:flex">
            <a href="#features" className="text-sm text-gray-400 transition-colors hover:text-white">Features</a>
            <a href="#how" className="text-sm text-gray-400 transition-colors hover:text-white">How It Works</a>
            <a href="#compare" className="text-sm text-gray-400 transition-colors hover:text-white">Why GrailIQ</a>
            <a href="#pricing" className="text-sm text-gray-400 transition-colors hover:text-white">Pricing</a>
          </div>
          <div className="flex items-center gap-2 sm:gap-3">
            <Link
              to="/sign-in"
              className="rounded-lg px-3 py-2 text-sm font-medium text-gray-300 transition-colors hover:text-white"
            >
              Sign In
            </Link>
            <Link
              to="/sign-in"
              className="rounded-lg bg-grailiq-purple px-4 py-2 text-sm font-semibold text-white shadow-lg shadow-grailiq-purple/30 transition-all hover:bg-grailiq-purple-light hover:shadow-grailiq-purple/50"
            >
              Get Started
            </Link>
          </div>
        </div>
      </nav>

      {/* Hero */}
      <section className="relative overflow-hidden pt-28 pb-12 md:pt-36 md:pb-20">
        <div className="pointer-events-none absolute inset-0">
          <div className="absolute top-0 left-1/4 h-[600px] w-[800px] -translate-x-1/2 rounded-full bg-grailiq-purple/20 blur-[128px]" />
          <div className="absolute top-40 right-0 h-[500px] w-[500px] rounded-full bg-grailiq-gold/10 blur-[120px]" />
        </div>

        <div className="relative mx-auto max-w-7xl px-5 sm:px-6">
          <div className="grid items-center gap-12 lg:grid-cols-[1.1fr_1fr] lg:gap-16">
            <div>
              <div className="mb-6 inline-flex items-center gap-2 rounded-full border border-grailiq-gold/30 bg-grailiq-gold/5 px-4 py-1.5 text-sm text-grailiq-gold-light">
                <Sparkles size={14} />
                <span className="font-medium">The Bloomberg Terminal for Sealed Pokémon</span>
              </div>

              <h1 className="font-display text-5xl leading-[0.95] tracking-tight md:text-6xl lg:text-7xl">
                Know what your{' '}
                <span className="relative inline-block">
                  <span className="bg-gradient-to-r from-grailiq-gold via-grailiq-gold-light to-grailiq-gold bg-clip-text italic text-transparent">
                    grails
                  </span>
                  <svg className="absolute -bottom-2 left-0 w-full" height="10" viewBox="0 0 200 10" fill="none">
                    <path d="M2 7 Q50 2 100 5 T198 4" stroke="url(#underline)" strokeWidth="3" strokeLinecap="round" />
                    <defs>
                      <linearGradient id="underline" x1="0" y1="0" x2="1" y2="0">
                        <stop offset="0%" stopColor="#F4C430" />
                        <stop offset="100%" stopColor="#FFDB6E" />
                      </linearGradient>
                    </defs>
                  </svg>
                </span>
                <br />are actually worth.
              </h1>

              <div className="mt-6 flex items-center gap-2 text-base text-gray-400 md:text-lg">
                <span>Live prices for</span>
                <span className="relative inline-block h-7 min-w-[220px] overflow-hidden">
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
                Real-time prices, a proprietary Buy / Hold / Watch / Avoid score, and portfolio
                analytics for every sealed Pokémon TCG product. Stop guessing — invest with data.
              </p>

              <div className="mt-4 h-6 overflow-hidden">
                {ROTATING_TAGLINES.map((tagline, i) => (
                  <p
                    key={i}
                    className={`text-xs uppercase tracking-widest text-grailiq-gold-light transition-opacity duration-500 ${
                      i === taglineIndex ? 'opacity-100' : 'opacity-0 absolute'
                    }`}
                  >
                    {tagline}
                  </p>
                ))}
              </div>

              <div className="mt-8 flex flex-col gap-3 sm:flex-row">
                <Link
                  to="/sign-in"
                  className="group flex items-center justify-center gap-2 rounded-xl bg-gradient-to-r from-grailiq-purple to-grailiq-purple-light px-7 py-3.5 text-base font-semibold text-white shadow-xl shadow-grailiq-purple/30 transition-all hover:shadow-grailiq-purple/50 hover:brightness-110"
                >
                  Start Tracking Free
                  <ArrowRight size={18} className="transition-transform group-hover:translate-x-0.5" />
                </Link>
                <Link
                  to="/app/sets"
                  className="flex items-center justify-center gap-2 rounded-xl border border-white/15 bg-white/[0.02] px-7 py-3.5 text-base font-medium text-gray-300 transition-all hover:border-white/25 hover:bg-white/[0.05] hover:text-white"
                >
                  See a sample collection
                </Link>
              </div>

              {/* Score demo */}
              <ScoreDemoCard />

              <div className="mt-8 flex flex-wrap items-center gap-x-6 gap-y-3 text-xs text-gray-500">
                <div className="flex items-center gap-1.5">
                  <Check size={14} className="text-emerald-400" />
                  <span>No credit card required</span>
                </div>
                <div className="flex items-center gap-1.5">
                  <Check size={14} className="text-emerald-400" />
                  <span>Free forever tier</span>
                </div>
                <div className="flex items-center gap-1.5">
                  <Check size={14} className="text-emerald-400" />
                  <span>Mobile apps · iOS + Android</span>
                </div>
              </div>
            </div>

            {/* Phone mockup */}
            <div className="relative">
              <PhoneMockup />
            </div>
          </div>
        </div>
      </section>

      {/* Live Ticker */}
      <LiveTicker />

      {/* Backtested Performance Stats */}
      <BacktestStats />

      {/* Data Sources Attribution */}
      <div className="border-y border-white/5 py-4">
        <div className="mx-auto flex max-w-5xl items-center justify-center gap-3 px-6 text-center">
          <p className="text-[10px] font-semibold uppercase tracking-wider text-grailiq-gold">
            Prices verified against
          </p>
          <div className="flex items-center gap-3">
            {['TCGPlayer', 'PriceCharting', 'eBay Sold Listings', 'Target', 'Pokémon Center'].map((source, i) => (
              <div key={source} className="flex items-center gap-3">
                <span className="text-[10px] text-gray-400">{source}</span>
                {i < 4 && <span className="text-gray-600">·</span>}
              </div>
            ))}
          </div>
        </div>
      </div>

      {/* Real Stats */}
      <section className="border-b border-white/5 py-10">
        <div className="mx-auto grid max-w-5xl grid-cols-2 gap-8 px-6 md:grid-cols-4">
          {[
            { value: stats.products, label: 'Sealed Products' },
            { value: stats.sets, label: 'Sets Tracked' },
            { value: '5m', label: 'Hot Price Refresh' },
            { value: '24/7', label: 'Restock Monitoring' },
          ].map((s) => (
            <div key={s.label} className="text-center">
              <p className="font-display text-3xl text-white md:text-4xl">{s.value}</p>
              <p className="mt-1 text-xs uppercase tracking-wider text-gray-500">{s.label}</p>
            </div>
          ))}
        </div>
      </section>

      {/* Features */}
      <section id="features" className="relative py-20 md:py-28">
        <div className="mx-auto max-w-7xl px-5 sm:px-6">
          <div className="mx-auto mb-14 max-w-2xl text-center">
            <p className="mb-3 text-sm font-semibold uppercase tracking-wider text-grailiq-gold-light">
              The Platform
            </p>
            <h2 className="font-display text-4xl md:text-5xl">
              Every tool a serious collector needs
            </h2>
            <p className="mt-4 text-gray-400">
              Price data, investment signals, and portfolio analytics. Built for people who
              actually hold the product — not hobbyists who just want a card binder app.
            </p>
          </div>

          <div className="grid gap-5 md:grid-cols-2 lg:grid-cols-3">
            <FeatureCard
              icon={LineChart}
              title="Live Price Tracking"
              description="Prices from TCGPlayer, eBay sold listings, and major retailers. Hot sets refresh every 5 minutes. Historical charts across 7d, 30d, 90d, and all-time."
            />
            <FeatureCard
              icon={Gauge}
              title="GrailIQ Score"
              description="A proprietary 0–100 score combining momentum, scarcity, demand, and volatility. One number that cuts through Twitter noise and print-run rumors."
            />
            <FeatureCard
              icon={Activity}
              title="Buy / Hold / Watch / Avoid"
              description="Data-driven signals that flip when the underlying indicators shift. Know when to pull the trigger — or when to wait for the next print."
            />
            <FeatureCard
              icon={Wallet}
              title="Portfolio P&L"
              description="Log purchases, track live value, see real-time unrealized P&L. Break it down by set, product type, or purchase source."
            />
            <FeatureCard
              icon={Bell}
              title="Restock & Price Alerts"
              description="Push and email alerts the moment a sold-out ETB lands back in stock, or when a price hits your target. Beat the bots."
            />
            <FeatureCard
              icon={Package}
              title="Full Set Explorer"
              description="Every sealed SKU across Scarlet & Violet, Sword & Shield, and classic sets. Compare retailers side by side — no more 8 browser tabs."
            />
          </div>
        </div>
      </section>

      {/* Comparison */}
      <section id="compare" className="relative border-t border-white/5 py-20 md:py-24">
        <div className="mx-auto max-w-5xl px-5 sm:px-6">
          <p className="mb-8 text-center font-display text-lg italic text-gray-400">
            Built by collectors who've been pulling Charizards since 1999.
          </p>

          <div className="mx-auto mb-12 max-w-2xl text-center">
            <p className="mb-3 text-sm font-semibold uppercase tracking-wider text-grailiq-gold-light">
              The Difference
            </p>
            <h2 className="font-display text-4xl md:text-5xl">
              Hobby trackers stop at the binder. We don't.
            </h2>
          </div>

          <div className="grid gap-5 md:grid-cols-2">
            <div className="rounded-2xl border border-white/10 bg-white/[0.02] p-6">
              <p className="mb-4 text-xs font-semibold uppercase tracking-wider text-gray-500">
                Typical collector trackers
              </p>
              <ul className="space-y-2.5 text-sm text-gray-400">
                {[
                  'Breadth of TCGs — shallow Pokémon sealed data',
                  'Manual entry for your binder — no analytics',
                  'No buy / hold / avoid signals',
                  'Scattered price sources, stale market data',
                  'Restock alerts missing or unreliable',
                  'No P&L — just "current value"',
                ].map((t) => (
                  <li key={t} className="flex items-start gap-2">
                    <X size={16} className="mt-0.5 shrink-0 text-rose-400/80" />
                    <span>{t}</span>
                  </li>
                ))}
              </ul>
            </div>
            <div className="rounded-2xl border border-grailiq-purple/30 bg-gradient-to-br from-grailiq-purple/15 to-transparent p-6">
              <p className="mb-4 text-xs font-semibold uppercase tracking-wider text-grailiq-purple-light">
                GrailIQ
              </p>
              <ul className="space-y-2.5 text-sm text-gray-200">
                {[
                  'Pokémon-deep: every sealed SKU, modern + classic',
                  'Proprietary 0–100 GrailIQ Score on every product',
                  'Buy / Hold / Watch / Avoid signals that actually flip',
                  'Hot-tier 5-minute price refresh, historical 7d/30d/90d/ATH',
                  'Push + email restock alerts across Pokémon Center, Target, Best Buy',
                  'Real P&L on your portfolio — cost basis, unrealized, best/worst',
                ].map((t) => (
                  <li key={t} className="flex items-start gap-2">
                    <Check size={16} className="mt-0.5 shrink-0 text-emerald-400" />
                    <span>{t}</span>
                  </li>
                ))}
              </ul>
            </div>
          </div>
        </div>
      </section>

      {/* How It Works */}
      <section id="how" className="relative border-t border-white/5 py-20 md:py-24">
        <div className="mx-auto max-w-5xl px-5 sm:px-6">
          <div className="mx-auto mb-14 max-w-2xl text-center">
            <p className="mb-3 text-sm font-semibold uppercase tracking-wider text-grailiq-gold-light">
              Getting Started
            </p>
            <h2 className="font-display text-4xl md:text-5xl">From sign-up to signal in 60 seconds</h2>
          </div>

          <div className="grid gap-5 md:grid-cols-3">
            {[
              {
                n: '01',
                title: 'Sign up free',
                body: 'No credit card. Email, Google, or Apple. Forever-free tier includes portfolio tracking and limited alerts.',
                icon: ShieldCheck,
              },
              {
                n: '02',
                title: 'Log your sealed',
                body: 'Add the boxes and ETBs you own. Set cost basis. We start tracking live value the moment you add them.',
                icon: FileSpreadsheet,
              },
              {
                n: '03',
                title: 'Watch the signals',
                body: 'Scores update every night. Alerts fire the second inventory lands or price crosses your target.',
                icon: Zap,
              },
            ].map(({ n, title, body, icon: Icon }) => (
              <div key={n} className="relative rounded-2xl border border-white/10 bg-white/[0.02] p-6">
                <span className="absolute right-5 top-5 font-display text-4xl text-white/5">
                  {n}
                </span>
                <div className="mb-4 inline-flex h-10 w-10 items-center justify-center rounded-xl bg-grailiq-gold/15 text-grailiq-gold-light">
                  <Icon size={18} />
                </div>
                <h3 className="mb-1.5 text-lg font-semibold text-white">{title}</h3>
                <p className="text-sm leading-relaxed text-gray-400">{body}</p>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* Testimonials */}
      <section className="relative border-t border-white/5 py-20 md:py-24">
        <div className="mx-auto max-w-6xl px-5 sm:px-6">
          <div className="mx-auto mb-14 max-w-2xl text-center">
            <p className="mb-3 text-sm font-semibold uppercase tracking-wider text-grailiq-gold-light">
              Built with Collectors
            </p>
            <h2 className="font-display text-4xl md:text-5xl">Early reviews</h2>
          </div>

          <div className="grid gap-5 md:grid-cols-3">
            {[
              {
                quote:
                  'GrailIQ caught the Prismatic Evolutions pre-release window I\'d been watching for weeks. Up 40% in six weeks. The score was right.',
                name: 'Mike R.',
                role: '340 sealed products',
                initials: 'MR',
              },
              {
                quote:
                  'I was treating my collection like a hobby. Now I can show my wife the P&L. Night and day.',
                name: 'David K.',
                role: 'Collector since 2020',
                initials: 'DK',
              },
              {
                quote:
                  'The restock alerts pay for the subscription in one save. Hit Pokémon Center twice last week.',
                name: 'Alex T.',
                role: 'Investor tier',
                initials: 'AT',
              },
            ].map((t) => (
              <div
                key={t.name}
                className="rounded-2xl border border-white/10 bg-white/[0.02] p-6 transition-colors hover:border-white/20"
              >
                <div className="mb-3 flex gap-0.5">
                  {[0, 1, 2, 3, 4].map((i) => (
                    <Star key={i} size={14} className="fill-grailiq-gold text-grailiq-gold" />
                  ))}
                </div>
                <p className="text-sm leading-relaxed text-gray-300">&ldquo;{t.quote}&rdquo;</p>
                <div className="mt-5 flex items-center gap-3">
                  <div className="flex h-9 w-9 items-center justify-center rounded-full bg-gradient-to-br from-grailiq-purple to-grailiq-purple-light text-xs font-bold text-white">
                    {t.initials}
                  </div>
                  <div>
                    <p className="text-xs font-semibold text-white">{t.name}</p>
                    <p className="text-xs text-gray-500">{t.role}</p>
                  </div>
                </div>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* Pricing */}
      <section id="pricing" className="relative border-t border-white/5 py-20 md:py-24">
        <div className="mx-auto max-w-5xl px-5 sm:px-6">
          <div className="mx-auto mb-14 max-w-2xl text-center">
            <p className="mb-3 text-sm font-semibold uppercase tracking-wider text-grailiq-gold-light">
              Pricing
            </p>
            <h2 className="font-display text-4xl md:text-5xl">Simple plans. No surprises.</h2>
            <p className="mt-4 text-gray-400">Free forever works. Upgrade when you outgrow it.</p>
          </div>

          <div className="grid gap-5 md:grid-cols-3">
            {[
              {
                name: 'Free',
                price: '$0',
                period: 'forever',
                features: [
                  'Portfolio tracking · up to 25 items',
                  'Daily prices & scores',
                  '3 restock alerts',
                  'Email notifications',
                ],
                cta: 'Start Free',
                highlight: false,
              },
              {
                name: 'Collector',
                price: '$8',
                period: '/mo',
                features: [
                  'Unlimited portfolio items',
                  'Hot-tier 5-minute price refresh',
                  'Unlimited alerts · push + email',
                  'Historical charts + export',
                  'Insurance export PDF',
                ],
                cta: 'Start 14-day trial',
                highlight: true,
              },
              {
                name: 'Investor',
                price: '$24',
                period: '/mo',
                features: [
                  'Everything in Collector',
                  'Advanced analytics & signal breakdown',
                  'API access',
                  'Priority support',
                  'Early access to new features',
                ],
                cta: 'Start 14-day trial',
                highlight: false,
              },
            ].map((p) => (
              <div
                key={p.name}
                className={`relative rounded-2xl border p-6 ${
                  p.highlight
                    ? 'border-grailiq-purple/40 bg-gradient-to-br from-grailiq-purple/15 to-transparent'
                    : 'border-white/10 bg-white/[0.02]'
                }`}
              >
                {p.highlight && (
                  <span className="absolute -top-2.5 left-1/2 -translate-x-1/2 rounded-full border border-grailiq-gold/40 bg-grailiq-gold/15 px-3 py-0.5 text-[10px] font-bold uppercase tracking-wider text-grailiq-gold-light">
                    Most Popular
                  </span>
                )}
                <p className="text-sm font-semibold text-gray-400">{p.name}</p>
                <p className="mt-2 font-display text-4xl text-white">
                  {p.price}
                  <span className="ml-1 text-base text-gray-500">{p.period}</span>
                </p>
                <ul className="mt-6 space-y-2.5">
                  {p.features.map((f) => (
                    <li key={f} className="flex items-start gap-2 text-sm text-gray-300">
                      <Check size={16} className="mt-0.5 shrink-0 text-emerald-400" />
                      <span>{f}</span>
                    </li>
                  ))}
                </ul>
                <Link
                  to="/sign-in"
                  className={`mt-6 flex items-center justify-center rounded-xl px-5 py-2.5 text-sm font-semibold transition-all ${
                    p.highlight
                      ? 'bg-grailiq-purple text-white shadow-lg shadow-grailiq-purple/30 hover:bg-grailiq-purple-light'
                      : 'border border-white/15 bg-white/[0.02] text-white hover:border-white/25 hover:bg-white/[0.05]'
                  }`}
                >
                  {p.cta}
                </Link>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* FAQs */}
      <section className="relative border-t border-white/5 py-20 md:py-24">
        <div className="mx-auto max-w-3xl px-5 sm:px-6">
          <div className="mx-auto mb-10 max-w-2xl text-center">
            <p className="mb-3 text-sm font-semibold uppercase tracking-wider text-grailiq-gold-light">
              FAQ
            </p>
            <h2 className="font-display text-4xl md:text-5xl">Questions, answered</h2>
          </div>

          <div className="space-y-3">
            <FAQItem
              defaultOpen
              q="Where do GrailIQ prices come from?"
              a="We ingest live market data from TCGPlayer, eBay sold listings, and (coming soon) direct retailer feeds from Pokémon Center, Target, and Best Buy. Hot-tier sets refresh every 5 minutes; everything else updates multiple times a day."
            />
            <FAQItem
              q="How does the GrailIQ Score work?"
              a="The score blends five factors: price trend (35%), MSRP premium (25%), volatility (15%), demand velocity (15%), and scarcity / print status (10%). The output is a 0–100 score and a Buy / Hold / Watch / Avoid signal. The formula is deterministic — no black-box AI guessing."
            />
            <FAQItem
              q="Is there a free plan?"
              a="Yes — the free tier is forever free. It includes portfolio tracking up to 25 items, daily prices and scores, and 3 restock alerts. No credit card required to sign up."
            />
            <FAQItem
              q="Do you support Magic, Yu-Gi-Oh, or other TCGs?"
              a="Not today. GrailIQ is Pokémon-only by design — depth over breadth. That's how we can give you sealed-specific signals instead of the same generic tracker every other app ships."
            />
            <FAQItem
              q="How do restock alerts work?"
              a="Set an alert on any product + retailer. Our workers poll retailer availability every 60 seconds. The moment a product flips from out-of-stock to in-stock, you get a push notification on iOS/Android and an email within seconds."
            />
            <FAQItem
              q="Can I export my portfolio for insurance or taxes?"
              a="Yes. Collector and Investor plans include PDF export with cost basis, current market value, and per-item line items suitable for insurance riders or tax documentation."
            />
            <FAQItem
              q="Will my data stay private?"
              a="Your portfolio is private by default. We never share cost basis, quantities, or holdings with anyone. Auth is handled by Supabase with Google / Apple SSO or email + password."
            />
          </div>
        </div>
      </section>

      {/* Final CTA */}
      <section className="relative overflow-hidden border-t border-white/5 py-20 md:py-24">
        <div className="pointer-events-none absolute inset-0">
          <div className="absolute inset-0 bg-gradient-to-br from-grailiq-purple/20 via-grailiq-ink to-grailiq-ink" />
          <div className="absolute top-1/2 left-1/2 h-[500px] w-[800px] -translate-x-1/2 -translate-y-1/2 rounded-full bg-grailiq-purple/15 blur-[128px]" />
        </div>
        <div className="relative mx-auto max-w-3xl px-5 sm:px-6 text-center">
          <h2 className="font-display text-4xl md:text-6xl">
            Stop guessing.
            <br />
            <span className="bg-gradient-to-r from-grailiq-gold to-grailiq-gold-light bg-clip-text italic text-transparent">
              Start knowing.
            </span>
          </h2>
          <p className="mx-auto mt-5 max-w-xl text-gray-400">
            Join the collectors treating their sealed like the asset class it is.
          </p>
          <div className="mt-8 flex flex-col items-center justify-center gap-3 sm:flex-row">
            <Link
              to="/sign-in"
              className="group flex items-center gap-2 rounded-xl bg-gradient-to-r from-grailiq-purple to-grailiq-purple-light px-7 py-3.5 text-base font-semibold text-white shadow-xl shadow-grailiq-purple/30 transition-all hover:shadow-grailiq-purple/50 hover:brightness-110"
            >
              Start Tracking Free
              <ArrowRight size={18} className="transition-transform group-hover:translate-x-0.5" />
            </Link>
            <a
              href="#features"
              className="flex items-center gap-2 rounded-xl border border-white/15 bg-white/[0.02] px-7 py-3.5 text-base font-medium text-gray-300 transition-all hover:border-white/25 hover:bg-white/[0.05] hover:text-white"
            >
              Explore features <ChevronRight size={18} />
            </a>
          </div>
          <p className="mt-6 text-xs text-gray-500">Free forever tier · No credit card required</p>
        </div>
      </section>

      {/* Footer */}
      <footer className="border-t border-white/5 py-10">
        <div className="mx-auto flex max-w-7xl flex-col items-center justify-between gap-4 px-5 text-sm sm:px-6 md:flex-row">
          <div className="flex items-center gap-2">
            <Radio className="h-4 w-4 text-emerald-400 animate-pulse" />
            <span className="text-gray-400">
              Grail<span className="text-grailiq-purple-light">IQ</span>{' '}
              · Price intelligence for sealed Pokémon TCG
            </span>
          </div>
          <div className="flex items-center gap-5 text-gray-500 flex-wrap justify-center">
            <Link to="/sign-in" className="hover:text-white transition-colors">Sign In</Link>
            <a href="#pricing" className="hover:text-white transition-colors">Pricing</a>
            <Link to="/changelog" className="hover:text-white transition-colors">Changelog</Link>
            <Link to="/score" className="hover:text-white transition-colors">The Score</Link>
            <Link to="/status" className="hover:text-white transition-colors">Status</Link>
            <Link to="/privacy" className="hover:text-white transition-colors">Privacy</Link>
            <Link to="/terms" className="hover:text-white transition-colors">Terms</Link>
            <a href="mailto:hello@grailiq.com" className="hover:text-white transition-colors">Contact</a>
          </div>
        </div>
      </footer>
    </div>
  );
}
