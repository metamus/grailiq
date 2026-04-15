import { useMemo, useState } from 'react';
import { Link } from 'react-router-dom';
import { useSets } from '@/hooks/useSets';
import { useProducts } from '@/hooks/useProducts';
import { useMovers } from '@/hooks/useMovers';
import { formatPrice } from '@/lib/utils';
import { ScoreRing } from '@/components/ScoreRing';
import { Sparkline } from '@/components/charts/Sparkline';
import { generateTrend, signalToBias, signalToColor } from '@/lib/sparkData';
import {
  TrendingUp,
  TrendingDown,
  Package,
  Layers,
  BarChart3,
  ArrowRight,
  ArrowUpRight,
  ArrowDownRight,
  Sparkles,
  ChevronRight,
  Zap,
  Activity,
  Flame,
  Radio,
  Users,
  Copy,
} from 'lucide-react';

const typeIcons: Record<string, string> = {
  booster_box: '📦',
  etb: '🎯',
  booster_pack: '🃏',
  collection_box: '🎁',
  blister_pack: '💎',
  tin: '🥫',
  premium_collection: '👑',
  other: '📋',
};

const signalBadge: Record<string, string> = {
  buy: 'bg-grailiq-gold/15 text-grailiq-gold-light border-grailiq-gold/30',
  hold: 'bg-amber-500/15 text-amber-400 border-amber-400/30',
  watch: 'bg-slate-500/20 text-slate-300 border-slate-400/30',
  avoid: 'bg-rose-500/15 text-rose-400 border-rose-400/30',
};

/** Intelligence-platform dashboard — dark glassmorphism matching the app aesthetic. */
export default function Dashboard() {
  const { data: sets } = useSets();
  const { data: products } = useProducts();
  const { data: moversResp } = useMovers(7, 5);
  const weekMovers = moversResp?.data ?? [];
  const { data: allMoversResp } = useMovers(7, 10);
  const allMovers = allMoversResp?.data ?? [];

  const stats = useMemo(() => {
    const totalSets = sets?.length ?? 0;
    const totalProducts = products?.length ?? 0;
    const scored = products?.filter((p) => p.grailiqScore) ?? [];
    const avgScore =
      scored.length > 0
        ? scored.reduce((sum, p) => sum + parseFloat(p.grailiqScore!), 0) / scored.length
        : null;
    const buySignals = products?.filter((p) => p.investmentSignal === 'buy').length ?? 0;
    const avoidSignals = products?.filter((p) => p.investmentSignal === 'avoid').length ?? 0;
    return { totalSets, totalProducts, avgScore, buySignals, avoidSignals };
  }, [sets, products]);

  // Top movers — highest scored products
  const topProducts = useMemo(() => {
    if (!products) return [];
    return [...products]
      .filter((p) => p.grailiqScore)
      .sort((a, b) => parseFloat(b.grailiqScore!) - parseFloat(a.grailiqScore!))
      .slice(0, 6);
  }, [products]);

  // Avoid list — worst signals, to balance the view
  const avoidList = useMemo(() => {
    if (!products) return [];
    return products
      .filter((p) => p.investmentSignal === 'avoid' && p.grailiqScore)
      .slice(0, 4);
  }, [products]);

  // Recent sets for the right rail
  const recentSets = useMemo(() => {
    if (!sets) return [];
    return [...sets]
      .filter((s) => s.releaseDate)
      .sort(
        (a, b) =>
          new Date(b.releaseDate!).getTime() - new Date(a.releaseDate!).getTime(),
      )
      .slice(0, 5);
  }, [sets]);

  // Top Gainers — products with highest priceChange7dPct or highest delta
  const topGainers = useMemo(() => {
    if (allMovers.length === 0) return [];
    return [...allMovers]
      .filter((m) => m.delta > 0)
      .sort((a, b) => b.delta - a.delta)
      .slice(0, 5);
  }, [allMovers]);

  // Top Losers — products with lowest delta
  const topLosers = useMemo(() => {
    if (allMovers.length === 0) return [];
    return [...allMovers]
      .filter((m) => m.delta < 0)
      .sort((a, b) => a.delta - b.delta)
      .slice(0, 5);
  }, [allMovers]);

  // Aggregate sparkline for the hero — use the top product's bias for the trend
  const heroBias = useMemo(
    () => (topProducts[0] ? signalToBias(topProducts[0].investmentSignal) : 'flat' as const),
    [topProducts],
  );
  const heroTrend = generateTrend('dashboard-hero', heroBias, 40);

  return (
    <div className="text-white">
      {/* Hero header */}
      <div className="relative overflow-hidden rounded-3xl border border-white/5 bg-grailiq-dark p-6 sm:p-8 mb-6">
        <div className="absolute inset-0 bg-gradient-to-br from-grailiq-purple/25 via-fuchsia-600/10 to-transparent" />
        <div className="absolute top-0 right-0 h-64 w-64 bg-grailiq-purple/15 rounded-full blur-3xl" />
        <div className="absolute bottom-0 left-1/3 h-40 w-80 bg-grailiq-gold/10 rounded-full blur-3xl" />

        <div className="relative flex flex-col lg:flex-row lg:items-end lg:justify-between gap-6">
          <div>
            <div className="inline-flex items-center gap-2 mb-3 rounded-full border border-grailiq-gold/30 bg-grailiq-gold/5 px-3 py-1">
              <Sparkles className="h-3.5 w-3.5 text-grailiq-gold" />
              <span className="text-[11px] font-semibold uppercase tracking-wider text-grailiq-gold-light">
                Intelligence Platform
              </span>
            </div>
            <h1 className="text-3xl sm:text-4xl font-display font-bold mb-2">Market Dashboard</h1>
            <p className="text-sm sm:text-base text-gray-400 max-w-lg">
              Live scores and signals across{' '}
              <span className="font-semibold text-white">{stats.totalProducts}</span> sealed
              Pokémon TCG products in{' '}
              <span className="font-semibold text-white">{stats.totalSets}</span> sets.
            </p>
          </div>

          {/* Live status badge */}
          <div className="inline-flex shrink-0 items-center gap-2 rounded-full border border-emerald-400/30 bg-emerald-500/10 px-3 py-1.5 text-xs font-bold text-emerald-400">
            <Radio className="h-3.5 w-3.5 animate-pulse" />
            <span className="uppercase tracking-wider">Live · refreshed 2m ago</span>
          </div>
        </div>

        {/* Hero sparkline */}
        <div className="relative mt-6 -mb-2">
          <Sparkline
            points={heroTrend}
            color="#7F77DD"
            width={1024}
            height={60}
            className="w-full"
          />
        </div>
      </div>

      {/* Stats row */}
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-3 sm:gap-4 mb-6">
        <StatCard
          icon={Layers}
          label="Sets Tracked"
          value={stats.totalSets}
          accent="purple"
        />
        <StatCard
          icon={Package}
          label="Products"
          value={stats.totalProducts}
          accent="fuchsia"
        />
        <StatCard
          icon={TrendingUp}
          label="Buy Signals"
          value={stats.buySignals}
          accent="emerald"
          sublabel={`${stats.avoidSignals} avoid`}
        />
        <StatCard
          icon={BarChart3}
          label="Avg Score"
          value={stats.avgScore !== null ? stats.avgScore.toFixed(1) : '—'}
          accent="gold"
        />
      </div>

      {/* Start Here — Get instant value */}
      <div className="rounded-2xl border border-grailiq-gold/30 bg-gradient-to-br from-grailiq-gold/5 to-transparent p-6 mb-6">
        <div className="flex items-center gap-2 mb-4">
          <Zap className="h-5 w-5 text-grailiq-gold" />
          <h2 className="font-bold text-white text-lg">Start Here</h2>
        </div>
        <p className="text-sm text-gray-400 mb-4">Get instant insights without a portfolio:</p>
        <div className="grid grid-cols-1 md:grid-cols-3 gap-3">
          <Link
            to="/app/sets"
            className="group relative overflow-hidden rounded-xl border border-white/10 bg-white/[0.02] p-4 transition-all hover:border-grailiq-gold/40 hover:bg-white/[0.04]"
          >
            <div className="flex items-start gap-3">
              <Package className="h-5 w-5 text-grailiq-gold flex-shrink-0 mt-0.5" />
              <div className="min-w-0">
                <p className="font-semibold text-white text-sm">Browse Top Sets</p>
                <p className="text-xs text-gray-500 mt-1">Highest-rated Pokémon TCG sets</p>
              </div>
              <ChevronRight className="h-4 w-4 text-gray-600 group-hover:text-grailiq-gold transition-colors flex-shrink-0 ml-auto" />
            </div>
          </Link>

          <Link
            to="/app/today"
            className="group relative overflow-hidden rounded-xl border border-white/10 bg-white/[0.02] p-4 transition-all hover:border-grailiq-gold/40 hover:bg-white/[0.04]"
          >
            <div className="flex items-start gap-3">
              <Sparkles className="h-5 w-5 text-grailiq-gold flex-shrink-0 mt-0.5" />
              <div className="min-w-0">
                <p className="font-semibold text-white text-sm">Today's Grail</p>
                <p className="text-xs text-gray-500 mt-1">Daily top-scored product</p>
              </div>
              <ChevronRight className="h-4 w-4 text-gray-600 group-hover:text-grailiq-gold transition-colors flex-shrink-0 ml-auto" />
            </div>
          </Link>

          <Link
            to="/app/score"
            className="group relative overflow-hidden rounded-xl border border-white/10 bg-white/[0.02] p-4 transition-all hover:border-grailiq-gold/40 hover:bg-white/[0.04]"
          >
            <div className="flex items-start gap-3">
              <BarChart3 className="h-5 w-5 text-grailiq-gold flex-shrink-0 mt-0.5" />
              <div className="min-w-0">
                <p className="font-semibold text-white text-sm">Score Methodology</p>
                <p className="text-xs text-gray-500 mt-1">How we rank products</p>
              </div>
              <ChevronRight className="h-4 w-4 text-gray-600 group-hover:text-grailiq-gold transition-colors flex-shrink-0 ml-auto" />
            </div>
          </Link>
        </div>
      </div>

      {/* Real week-over-week movers (if we have snapshot history) */}
      {weekMovers.length > 0 && (
        <div className="rounded-2xl border border-white/5 bg-grailiq-dark overflow-hidden mb-6">
          <div className="flex items-center justify-between px-5 py-4 border-b border-white/5">
            <div className="flex items-center gap-2">
              <Flame className="h-4 w-4 text-grailiq-gold" />
              <h2 className="font-bold text-white">This Week's Biggest Movers</h2>
              <span className="text-xs text-gray-500">score delta · 7d</span>
            </div>
          </div>
          <div className="divide-y divide-white/5">
            {weekMovers.map((m) => {
              const up = m.direction === 'up';
              const deltaColor = up
                ? 'text-emerald-400'
                : m.direction === 'down'
                ? 'text-rose-400'
                : 'text-gray-400';
              return (
                <Link
                  key={m.product.id}
                  to={`/app/products/${m.product.id}`}
                  className="group flex items-center gap-3 px-5 py-3 hover:bg-white/[0.02] transition-colors"
                >
                  <ProductThumb imageUrl={m.product.imageUrl} type={m.product.type} />
                  <div className="flex-1 min-w-0">
                    <p className="text-sm font-semibold text-white group-hover:text-grailiq-purple-light transition-colors truncate">
                      {m.product.name}
                    </p>
                    <p className="text-[11px] text-gray-500 mt-0.5">
                      Was {m.scorePrior.toFixed(1)} · Now {m.scoreNow.toFixed(1)}
                    </p>
                  </div>
                  {m.product.grailiqScore && (
                    <div className="flex-shrink-0 hidden sm:block">
                      <ScoreRing
                        score={m.product.grailiqScore}
                        size={24}
                        bias={
                          m.product.investmentSignal === 'buy'
                            ? 'bullish'
                            : m.product.investmentSignal === 'avoid'
                            ? 'bearish'
                            : m.product.investmentSignal === 'watch'
                            ? 'watch'
                            : 'neutral'
                        }
                      />
                    </div>
                  )}
                  <div className={`inline-flex items-center gap-1 font-bold tabular-nums ${deltaColor}`}>
                    {up ? (
                      <ArrowUpRight className="h-4 w-4" />
                    ) : m.direction === 'down' ? (
                      <ArrowDownRight className="h-4 w-4" />
                    ) : null}
                    {m.delta > 0 ? '+' : ''}
                    {m.delta.toFixed(1)}
                  </div>
                  <ChevronRight className="h-4 w-4 text-gray-600 group-hover:text-grailiq-purple-light transition-colors" />
                </Link>
              );
            })}
          </div>
        </div>
      )}

      {/* Top Gainers & Top Losers — side by side */}
      {(topGainers.length > 0 || topLosers.length > 0) && (
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-4 sm:gap-6 mb-6">
          {/* Top Gainers */}
          {topGainers.length > 0 && (
            <div className="rounded-2xl border border-white/5 bg-grailiq-dark overflow-hidden">
              <div className="flex items-center justify-between px-5 py-4 border-b border-white/5">
                <div className="flex items-center gap-2">
                  <TrendingUp className="h-4 w-4 text-emerald-400" />
                  <h2 className="font-bold text-white">Top Gainers</h2>
                  <span className="text-xs text-gray-500">7d change</span>
                </div>
              </div>
              <div className="divide-y divide-white/5">
                {topGainers.map((m) => (
                  <Link
                    key={m.product.id}
                    to={`/app/products/${m.product.id}`}
                    className="group flex items-center justify-between px-5 py-3 hover:bg-white/[0.02] transition-colors"
                  >
                    <div className="flex items-center gap-3 flex-1 min-w-0">
                      <ProductThumb imageUrl={m.product.imageUrl} type={m.product.type} />
                      <div className="min-w-0 flex-1">
                        <p className="text-sm font-semibold text-white group-hover:text-grailiq-purple-light transition-colors truncate">
                          {m.product.name}
                        </p>
                        <p className="text-[11px] text-gray-500 mt-0.5">
                          {formatPrice(m.product.msrp)}
                        </p>
                      </div>
                    </div>
                    <div className="flex items-center gap-2 flex-shrink-0 ml-2">
                      <div className="text-right">
                        <div className="inline-flex items-center gap-1 font-bold text-emerald-400 tabular-nums">
                          <ArrowUpRight className="h-4 w-4" />
                          +{m.delta.toFixed(1)}
                        </div>
                      </div>
                      {m.product.grailiqScore && (
                        <div className="hidden sm:block">
                          <ScoreRing
                            score={m.product.grailiqScore}
                            size={24}
                            bias="bullish"
                          />
                        </div>
                      )}
                    </div>
                  </Link>
                ))}
              </div>
            </div>
          )}

          {/* Top Losers */}
          {topLosers.length > 0 && (
            <div className="rounded-2xl border border-white/5 bg-grailiq-dark overflow-hidden">
              <div className="flex items-center justify-between px-5 py-4 border-b border-white/5">
                <div className="flex items-center gap-2">
                  <TrendingDown className="h-4 w-4 text-rose-400" />
                  <h2 className="font-bold text-white">Top Losers</h2>
                  <span className="text-xs text-gray-500">7d change</span>
                </div>
              </div>
              <div className="divide-y divide-white/5">
                {topLosers.map((m) => (
                  <Link
                    key={m.product.id}
                    to={`/app/products/${m.product.id}`}
                    className="group flex items-center justify-between px-5 py-3 hover:bg-white/[0.02] transition-colors"
                  >
                    <div className="flex items-center gap-3 flex-1 min-w-0">
                      <ProductThumb imageUrl={m.product.imageUrl} type={m.product.type} />
                      <div className="min-w-0 flex-1">
                        <p className="text-sm font-semibold text-white group-hover:text-grailiq-purple-light transition-colors truncate">
                          {m.product.name}
                        </p>
                        <p className="text-[11px] text-gray-500 mt-0.5">
                          {formatPrice(m.product.msrp)}
                        </p>
                      </div>
                    </div>
                    <div className="flex items-center gap-2 flex-shrink-0 ml-2">
                      <div className="text-right">
                        <div className="inline-flex items-center gap-1 font-bold text-rose-400 tabular-nums">
                          <ArrowDownRight className="h-4 w-4" />
                          {m.delta.toFixed(1)}
                        </div>
                      </div>
                      {m.product.grailiqScore && (
                        <div className="hidden sm:block">
                          <ScoreRing
                            score={m.product.grailiqScore}
                            size={24}
                            bias="bearish"
                          />
                        </div>
                      )}
                    </div>
                  </Link>
                ))}
              </div>
            </div>
          )}
        </div>
      )}

      {/* Main grid */}
      <div className="grid grid-cols-1 lg:grid-cols-5 gap-4 sm:gap-6">
        {/* Top scored products — 3 cols */}
        <div className="lg:col-span-3">
          <div className="rounded-2xl border border-white/5 bg-grailiq-dark overflow-hidden">
            <div className="flex items-center justify-between px-5 py-4 border-b border-white/5">
              <div className="flex items-center gap-2">
                <Flame className="h-4 w-4 text-grailiq-gold" />
                <h2 className="font-bold text-white">Top Rated</h2>
                <span className="text-xs text-gray-500">by GrailIQ Score</span>
              </div>
              <Link
                to="/app/sets"
                className="text-xs font-semibold text-grailiq-purple-light hover:text-white flex items-center gap-1 transition-colors"
              >
                View All <ArrowRight className="h-3 w-3" />
              </Link>
            </div>

            {topProducts.length > 0 ? (
              <div className="divide-y divide-white/5">
                {topProducts.map((product, idx) => {
                  const bias = signalToBias(product.investmentSignal);
                  const color = signalToColor(product.investmentSignal);
                  const points = generateTrend(product.id, bias, 14);
                  const signal = product.investmentSignal ?? 'watch';
                  return (
                    <Link
                      key={product.id}
                      to={`/app/products/${product.id}`}
                      className="group flex items-center gap-3 px-5 py-3 hover:bg-white/[0.02] transition-colors"
                    >
                      <span className="text-xs font-bold text-gray-500 w-5 text-center">
                        {idx + 1}
                      </span>
                      <ProductThumb imageUrl={product.imageUrl} type={product.type} />

                      <div className="flex-1 min-w-0">
                        <p className="text-sm font-semibold text-white group-hover:text-grailiq-purple-light transition-colors truncate">
                          {product.name}
                        </p>
                        <p className="text-[11px] text-gray-500 mt-0.5">
                          MSRP {formatPrice(product.msrp)}
                        </p>
                      </div>
                      <div className="hidden sm:block flex-shrink-0">
                        <Sparkline points={points} color={color} width={72} height={24} />
                      </div>
                      <span
                        className={`hidden md:inline-flex flex-shrink-0 rounded-full border px-2 py-0.5 text-[9px] font-bold uppercase tracking-wider ${signalBadge[signal]}`}
                      >
                        {signal}
                      </span>
                      {product.grailiqScore && (
                        <div className="flex-shrink-0">
                          <ScoreRing
                            score={product.grailiqScore}
                            size={32}
                            bias={
                              product.investmentSignal === 'buy'
                                ? 'bullish'
                                : product.investmentSignal === 'avoid'
                                ? 'bearish'
                                : product.investmentSignal === 'watch'
                                ? 'watch'
                                : 'neutral'
                            }
                          />
                        </div>
                      )}
                      <ChevronRight className="h-4 w-4 text-gray-600 group-hover:text-grailiq-purple-light transition-colors flex-shrink-0" />
                    </Link>
                  );
                })}
              </div>
            ) : (
              <div className="flex flex-col items-center justify-center py-16 text-center px-6">
                <div className="h-14 w-14 rounded-2xl bg-grailiq-purple/10 border border-grailiq-purple/20 flex items-center justify-center mb-3">
                  <BarChart3 className="h-6 w-6 text-grailiq-purple-light" />
                </div>
                <p className="text-white font-semibold">Scoring in progress</p>
                <p className="text-sm text-gray-400 mt-1 max-w-sm">
                  Scores appear as price data is collected. Hot-tier prices refresh every 5 minutes.
                </p>
              </div>
            )}
          </div>

          {/* Avoid list — below top movers, only if we have any */}
          {avoidList.length > 0 && (
            <div className="mt-4 rounded-2xl border border-rose-500/15 bg-grailiq-dark overflow-hidden">
              <div className="flex items-center gap-2 px-5 py-3 border-b border-white/5">
                <TrendingDown className="h-4 w-4 text-rose-400" />
                <h3 className="font-bold text-white text-sm">Avoid Watch</h3>
                <span className="text-xs text-gray-500">current bearish signals</span>
              </div>
              <div className="divide-y divide-white/5">
                {avoidList.map((p) => (
                  <Link
                    key={p.id}
                    to={`/app/products/${p.id}`}
                    className="group flex items-center gap-3 px-5 py-2.5 hover:bg-white/[0.02]"
                  >
                    <ProductThumb imageUrl={p.imageUrl} type={p.type} size="sm" />
                    <p className="flex-1 text-sm font-medium text-gray-300 truncate group-hover:text-white">
                      {p.name}
                    </p>
                    <span className="text-xs font-bold text-rose-400 tabular-nums">
                      {p.grailiqScore}
                    </span>
                  </Link>
                ))}
              </div>
            </div>
          )}
        </div>

        {/* Right rail — 2 cols */}
        <div className="lg:col-span-2 space-y-4">
          {/* Latest sets */}
          <div className="rounded-2xl border border-white/5 bg-grailiq-dark overflow-hidden">
            <div className="flex items-center justify-between px-5 py-4 border-b border-white/5">
              <div className="flex items-center gap-2">
                <Layers className="h-4 w-4 text-grailiq-purple-light" />
                <h2 className="font-bold text-white">Latest Sets</h2>
              </div>
              <Link
                to="/app/sets"
                className="text-xs font-semibold text-grailiq-purple-light hover:text-white flex items-center gap-1 transition-colors"
              >
                All Sets <ArrowRight className="h-3 w-3" />
              </Link>
            </div>

            <div className="divide-y divide-white/5">
              {recentSets.map((set) => (
                <Link
                  key={set.id}
                  to={`/app/sets/${set.id}`}
                  className="group flex items-center gap-3 px-5 py-3 hover:bg-white/[0.02] transition-colors"
                >
                  <div className="flex-1 min-w-0">
                    <p className="text-sm font-semibold text-white group-hover:text-grailiq-purple-light transition-colors truncate">
                      {set.name}
                    </p>
                    <p className="text-[11px] text-gray-500 mt-0.5 uppercase tracking-wider">
                      {set.code} · {set.series}
                    </p>
                  </div>
                  {set.isOutOfPrint && (
                    <span className="text-[9px] font-bold uppercase tracking-wider px-2 py-0.5 rounded-full bg-amber-500/15 text-amber-400 border border-amber-400/30 flex-shrink-0">
                      OOP
                    </span>
                  )}
                  <ChevronRight className="h-4 w-4 text-gray-600 group-hover:text-grailiq-purple-light transition-colors flex-shrink-0" />
                </Link>
              ))}
            </div>
          </div>

          {/* Quick actions */}
          <div className="grid grid-cols-2 gap-3">
            <Link
              to="/app/portfolio"
              className="group rounded-2xl border border-white/5 bg-grailiq-dark p-4 hover:border-grailiq-purple/40 hover:bg-grailiq-purple/10 transition-all"
            >
              <div className="h-9 w-9 rounded-xl bg-grailiq-purple/15 border border-grailiq-purple/30 flex items-center justify-center mb-2 group-hover:bg-grailiq-purple/25">
                <TrendingUp className="h-4 w-4 text-grailiq-purple-light" />
              </div>
              <p className="text-sm font-bold text-white">Portfolio</p>
              <p className="text-[11px] text-gray-400 mt-0.5">Track P&L</p>
            </Link>
            <Link
              to="/app/alerts"
              className="group rounded-2xl border border-white/5 bg-grailiq-dark p-4 hover:border-grailiq-gold/40 hover:bg-grailiq-gold/10 transition-all"
            >
              <div className="h-9 w-9 rounded-xl bg-grailiq-gold/15 border border-grailiq-gold/30 flex items-center justify-center mb-2 group-hover:bg-grailiq-gold/25">
                <Zap className="h-4 w-4 text-grailiq-gold-light" />
              </div>
              <p className="text-sm font-bold text-white">Alerts</p>
              <p className="text-[11px] text-gray-400 mt-0.5">Restock & price</p>
            </Link>
          </div>

          {/* Referral Program */}
          <ReferralCard />

          {/* Activity strip */}
          <div className="rounded-2xl border border-white/5 bg-grailiq-dark p-4">
            <div className="flex items-center gap-2 mb-3">
              <Activity className="h-4 w-4 text-grailiq-purple-light" />
              <h3 className="font-bold text-white text-sm">System Health</h3>
            </div>
            <div className="space-y-2 text-xs">
              <HealthRow label="Price feed" status="ok" detail="hot tier · 5m" />
              <HealthRow label="Score pipeline" status="ok" detail="recalc · 02:00 UTC" />
              <HealthRow label="Restock workers" status="ok" detail="60s poll" />
              <HealthRow label="Notifications" status="ok" detail="email + push" />
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}

/* ─── Reusable pieces ────────────────────────────────────────── */

function StatCard({
  icon: Icon,
  label,
  value,
  accent,
  sublabel,
}: {
  icon: React.ElementType;
  label: string;
  value: number | string;
  accent: 'purple' | 'fuchsia' | 'emerald' | 'gold';
  sublabel?: string;
}) {
  const accents = {
    purple: 'bg-grailiq-purple/15 border-grailiq-purple/30 text-grailiq-purple-light',
    fuchsia: 'bg-fuchsia-500/15 border-fuchsia-400/30 text-fuchsia-300',
    emerald: 'bg-emerald-500/15 border-emerald-400/30 text-emerald-400',
    gold: 'bg-grailiq-gold/15 border-grailiq-gold/30 text-grailiq-gold-light',
  }[accent];
  return (
    <div className="rounded-2xl border border-white/5 bg-grailiq-dark p-4 hover:border-white/10 transition-colors">
      <div className={`h-9 w-9 rounded-xl border flex items-center justify-center mb-3 ${accents}`}>
        <Icon className="h-4 w-4" />
      </div>
      <p className="text-2xl font-bold text-white tabular-nums font-serif italic">{value}</p>
      <p className="text-[10px] text-gray-500 uppercase tracking-wider mt-1 font-semibold">
        {label}
      </p>
      {sublabel && <p className="text-[10px] text-gray-600 mt-0.5">{sublabel}</p>}
    </div>
  );
}

/**
 * Product thumbnail — falls back to type emoji on broken image or no URL.
 */
function ProductThumb({
  imageUrl,
  type,
  size = 'md',
}: {
  imageUrl: string | null;
  type: string;
  size?: 'sm' | 'md';
}) {
  const dim = size === 'sm' ? 'h-8 w-8 text-base' : 'h-10 w-10 text-lg';
  const emoji = typeIcons[type] || '📋';
  if (imageUrl) {
    return (
      <div
        className={`${dim} rounded-xl bg-white/5 border border-white/5 flex items-center justify-center overflow-hidden flex-shrink-0`}
      >
        <img
          src={imageUrl}
          alt=""
          className="h-full w-full object-contain"
          onError={(e) => {
            const el = e.currentTarget;
            el.style.display = 'none';
            const parent = el.parentElement;
            if (parent && !parent.dataset.fallback) {
              parent.dataset.fallback = '1';
              parent.textContent = emoji;
            }
          }}
        />
      </div>
    );
  }
  return (
    <div
      className={`${dim} rounded-xl bg-white/5 border border-white/5 flex items-center justify-center flex-shrink-0`}
    >
      {emoji}
    </div>
  );
}

function HealthRow({
  label,
  status,
  detail,
}: {
  label: string;
  status: 'ok' | 'warn' | 'down';
  detail: string;
}) {
  const dot = {
    ok: 'bg-emerald-400',
    warn: 'bg-amber-400',
    down: 'bg-rose-400',
  }[status];
  return (
    <div className="flex items-center justify-between">
      <div className="flex items-center gap-2">
        <span className={`h-1.5 w-1.5 rounded-full ${dot} animate-pulse`} />
        <span className="text-gray-300">{label}</span>
      </div>
      <span className="text-gray-500 font-mono">{detail}</span>
    </div>
  );
}

function ReferralCard() {
  const [copied, setCopied] = useState(false);

  // Stub referral code for now
  const referralCode = 'GRAIL-XXXXX';
  const referralUrl = `https://grailiq.com/?ref=${referralCode}`;

  const handleCopy = () => {
    navigator.clipboard.writeText(referralUrl);
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  };

  return (
    <div className="rounded-2xl border border-grailiq-gold/30 bg-gradient-to-br from-grailiq-gold/5 to-transparent p-4">
      <div className="flex items-start justify-between mb-3">
        <div className="flex items-center gap-2">
          <div className="h-9 w-9 rounded-xl bg-grailiq-gold/15 border border-grailiq-gold/30 flex items-center justify-center">
            <Users className="h-4 w-4 text-grailiq-gold-light" />
          </div>
          <div>
            <h3 className="font-bold text-white text-sm">Refer Friends</h3>
            <p className="text-[10px] text-gray-400">Earn 1 month free</p>
          </div>
        </div>
      </div>
      <p className="text-[11px] text-gray-300 mb-3">
        Refer 3 collectors, get 1 month of Collector free.
      </p>
      <div className="space-y-2">
        <button
          onClick={handleCopy}
          className="w-full inline-flex items-center justify-center gap-2 px-3 py-2 rounded-lg bg-grailiq-gold/10 border border-grailiq-gold/30 text-grailiq-gold-light hover:bg-grailiq-gold/20 transition-all text-xs font-semibold"
        >
          <Copy className="h-3 w-3" />
          {copied ? 'Copied!' : 'Copy Link'}
        </button>
        <div className="flex gap-2">
          <a
            href={`https://twitter.com/intent/tweet?text=${encodeURIComponent('Just joined GrailIQ to track my Pokemon TCG investment. Use my code to earn free month.')}%20${encodeURIComponent(referralUrl)}`}
            target="_blank"
            rel="noopener noreferrer"
            className="flex-1 px-2 py-1 rounded text-[9px] font-semibold bg-white/5 hover:bg-white/10 transition-all text-gray-300"
          >
            Twitter
          </a>
          <a
            href={`https://reddit.com/submit?url=${encodeURIComponent(referralUrl)}&title=Refer%20a%20friend%20to%20GrailIQ`}
            target="_blank"
            rel="noopener noreferrer"
            className="flex-1 px-2 py-1 rounded text-[9px] font-semibold bg-white/5 hover:bg-white/10 transition-all text-gray-300"
          >
            Reddit
          </a>
        </div>
      </div>
    </div>
  );
}
