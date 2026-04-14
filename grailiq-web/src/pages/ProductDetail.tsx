import { useState, useMemo } from 'react';
import { useParams, Link } from 'react-router-dom';
import { useProduct, usePriceHistory } from '@/hooks/useProducts';
import { useIsWatching, useToggleWatch } from '@/hooks/useWatchlist';
import { Spinner } from '@/components/ui/Spinner';
import { ScoreRing } from '@/components/ScoreRing';
import { PriceChart } from '@/components/charts/PriceChart';
import { AddToPortfolioModal } from '@/components/modals/AddToPortfolioModal';
import { CreateAlertModal } from '@/components/modals/CreateAlertModal';
import { formatPrice, formatDate, formatPercentage, getSignalVariant } from '@/lib/utils';
import type { TimeRange } from '@/types';
import {
  ArrowLeft,
  TrendingUp,
  DollarSign,
  Target,
  Bell,
  Plus,
  BarChart3,
  Calendar,
  ArrowUpRight,
  ArrowDownRight,
  Minus,
  Sparkles,
  Heart,
} from 'lucide-react';

const typeLabels: Record<string, string> = {
  booster_box: 'Booster Box',
  etb: 'Elite Trainer Box',
  booster_pack: 'Booster Pack',
  collection_box: 'Collection Box',
  blister_pack: 'Blister Pack',
  tin: 'Tin',
  premium_collection: 'Premium Collection',
  other: 'Other',
};

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

const signalStyles: Record<
  string,
  { bg: string; text: string; border: string; accent: string }
> = {
  buy: {
    bg: 'bg-emerald-500/15',
    text: 'text-emerald-400',
    border: 'border-emerald-400/30',
    accent: 'from-emerald-500/25',
  },
  hold: {
    bg: 'bg-amber-500/15',
    text: 'text-amber-400',
    border: 'border-amber-400/30',
    accent: 'from-amber-500/25',
  },
  watch: {
    bg: 'bg-slate-500/20',
    text: 'text-slate-300',
    border: 'border-slate-400/30',
    accent: 'from-slate-500/25',
  },
  avoid: {
    bg: 'bg-rose-500/15',
    text: 'text-rose-400',
    border: 'border-rose-400/30',
    accent: 'from-rose-500/25',
  },
};

/** Product detail — dark intelligence-platform theme. */
export default function ProductDetail() {
  const { id } = useParams<{ id: string }>();
  const { data: product, isLoading } = useProduct(id ?? '');
  const [timeRange, setTimeRange] = useState<TimeRange>('30d');
  const { data: priceHistory } = usePriceHistory(id ?? '', timeRange);
  const [showPortfolioModal, setShowPortfolioModal] = useState(false);
  const [showAlertModal, setShowAlertModal] = useState(false);
  const { watching } = useIsWatching(id);
  const toggleWatch = useToggleWatch();

  const priceStats = useMemo(() => {
    if (!priceHistory || priceHistory.length === 0) {
      return {
        current: null as number | null,
        change: null as number | null,
        changePct: null as number | null,
        high: null as number | null,
        low: null as number | null,
        avg: null as number | null,
      };
    }
    const prices = priceHistory.map((p) => parseFloat(p.price));
    const current = prices[prices.length - 1];
    const first = prices[0];
    const change = current - first;
    const changePct = first !== 0 ? (change / first) * 100 : 0;
    const high = Math.max(...prices);
    const low = Math.min(...prices);
    const avg = prices.reduce((a, b) => a + b, 0) / prices.length;
    return { current, change, changePct, high, low, avg };
  }, [priceHistory]);

  const msrpComparison = useMemo(() => {
    if (!product?.msrp || priceStats.current === null) return null;
    const msrp = parseFloat(product.msrp);
    const diff = priceStats.current - msrp;
    const pct = msrp !== 0 ? (diff / msrp) * 100 : 0;
    return { diff, pct, isAbove: diff > 0 };
  }, [product?.msrp, priceStats.current]);

  if (isLoading) {
    return (
      <div className="flex items-center justify-center min-h-[60vh]">
        <Spinner size="lg" />
      </div>
    );
  }

  if (!product) {
    return (
      <div className="text-center py-16 text-white">
        <p className="text-gray-400">Product not found</p>
        <Link
          to="/app/sets"
          className="text-grailiq-purple-light text-sm mt-2 inline-block hover:underline"
        >
          Back to Sets
        </Link>
      </div>
    );
  }

  const signal = product.investmentSignal ? signalStyles[product.investmentSignal] : null;
  const signalInfo = getSignalVariant(product.investmentSignal);
  const changeColor =
    priceStats.changePct === null
      ? 'text-gray-400'
      : priceStats.changePct > 0
      ? 'text-emerald-400'
      : priceStats.changePct < 0
      ? 'text-rose-400'
      : 'text-gray-400';

  return (
    <div className="text-white">
      {/* Back link */}
      <Link
        to={`/app/sets/${product.setId}`}
        className="inline-flex items-center gap-1.5 text-sm text-gray-400 hover:text-white transition-colors mb-5"
      >
        <ArrowLeft className="h-4 w-4" />
        Back to set
      </Link>

      {/* Hero */}
      <div
        className={`relative overflow-hidden rounded-3xl border border-white/5 bg-grailiq-dark p-6 sm:p-8 mb-6`}
      >
        <div
          className={`absolute inset-0 bg-gradient-to-br ${
            signal?.accent ?? 'from-grailiq-purple/25'
          } via-transparent to-transparent`}
        />
        <div className="absolute top-0 right-0 h-56 w-56 rounded-full bg-grailiq-purple/15 blur-3xl" />

        <div className="relative flex flex-col sm:flex-row sm:items-start sm:justify-between gap-6">
          <div className="flex items-start gap-4 min-w-0">
            <div className="h-16 w-16 rounded-2xl bg-white/5 border border-white/10 flex items-center justify-center text-3xl flex-shrink-0">
              {typeIcons[product.type] || '📋'}
            </div>
            <div className="min-w-0">
              <p className="text-[10px] font-semibold uppercase tracking-wider text-grailiq-purple-light mb-1">
                {typeLabels[product.type] || product.type}
              </p>
              <h1 className="text-2xl sm:text-3xl font-bold leading-tight font-serif italic">{product.name}</h1>
              {product.msrp && (
                <p className="text-sm text-gray-400 mt-2 flex items-center gap-1.5">
                  <DollarSign className="h-3.5 w-3.5" />
                  MSRP {formatPrice(product.msrp)}
                </p>
              )}
            </div>
          </div>

          <div className="flex gap-2 flex-shrink-0">
            <button
              onClick={() => id && toggleWatch.mutate(id)}
              disabled={toggleWatch.isPending}
              className={`inline-flex items-center gap-2 px-4 py-2.5 rounded-xl border text-sm font-semibold transition-all ${
                watching
                  ? 'border-rose-400/40 bg-rose-500/10 text-rose-300 hover:bg-rose-500/20'
                  : 'border-white/15 bg-white/[0.03] text-white hover:border-white/25 hover:bg-white/[0.06]'
              }`}
              aria-label={watching ? 'Remove from watchlist' : 'Add to watchlist'}
            >
              <Heart className={`h-4 w-4 ${watching ? 'fill-current' : ''}`} />
              {watching ? 'Watching' : 'Watch'}
            </button>
            <button
              onClick={() => setShowAlertModal(true)}
              className="inline-flex items-center gap-2 px-4 py-2.5 rounded-xl border border-white/15 bg-white/[0.03] text-sm font-semibold text-white hover:border-white/25 hover:bg-white/[0.06] transition-all"
            >
              <Bell className="h-4 w-4" />
              Alert Me
            </button>
            <button
              onClick={() => setShowPortfolioModal(true)}
              className="inline-flex items-center gap-2 px-4 py-2.5 rounded-xl bg-gradient-to-r from-grailiq-purple to-grailiq-purple-light text-sm font-semibold text-white shadow-lg shadow-grailiq-purple/30 transition-all hover:shadow-grailiq-purple/50 hover:brightness-110"
            >
              <Plus className="h-4 w-4" />
              Add to Portfolio
            </button>
          </div>
        </div>
      </div>

      {/* Stats row */}
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-3 sm:gap-4 mb-6">
        <StatCard
          icon={DollarSign}
          label="Market Price"
          value={priceStats.current !== null ? formatPrice(priceStats.current) : '—'}
          accent="purple"
          sub={
            priceStats.change !== null ? (
              <span className={`inline-flex items-center gap-1 text-sm font-semibold ${changeColor}`}>
                {priceStats.change > 0 ? (
                  <ArrowUpRight className="h-3.5 w-3.5" />
                ) : priceStats.change < 0 ? (
                  <ArrowDownRight className="h-3.5 w-3.5" />
                ) : (
                  <Minus className="h-3.5 w-3.5" />
                )}
                {formatPercentage(priceStats.changePct ?? 0)}
              </span>
            ) : null
          }
        />
        <StatCard
          icon={Target}
          label="vs MSRP"
          value={msrpComparison ? `${msrpComparison.isAbove ? '+' : ''}${formatPrice(msrpComparison.diff)}` : '—'}
          accent={msrpComparison?.isAbove === false ? 'rose' : 'emerald'}
          sub={
            msrpComparison ? (
              <span
                className={`text-sm font-semibold ${
                  msrpComparison.isAbove ? 'text-emerald-400' : 'text-rose-400'
                }`}
              >
                {formatPercentage(msrpComparison.pct)} from MSRP
              </span>
            ) : null
          }
        />
        <StatCard
          icon={BarChart3}
          label="Period Range"
          value={priceStats.high !== null ? formatPrice(priceStats.high) : '—'}
          accent="fuchsia"
          sub={
            priceStats.low !== null ? (
              <span className="text-xs text-gray-400">
                low {formatPrice(priceStats.low)}
              </span>
            ) : null
          }
        />
        <div className="rounded-2xl border border-white/5 bg-grailiq-dark p-4 flex flex-col items-center justify-center">
          <span className="text-[10px] text-gray-500 uppercase tracking-wider font-semibold mb-3">
            GrailIQ Score
          </span>
          {product.grailiqScore ? (
            <>
              <ScoreRing
                score={product.grailiqScore}
                size={80}
                bias={signal ? (signal === signalStyles.buy ? 'bullish' : signal === signalStyles.avoid ? 'bearish' : signal === signalStyles.watch ? 'watch' : 'neutral') : 'neutral'}
              />
              {signalInfo && (
                <span
                  className={`inline-flex items-center gap-1.5 text-[10px] font-bold uppercase tracking-wider px-2 py-0.5 rounded-full border mt-3 ${signal?.bg} ${signal?.text} ${signal?.border}`}
                >
                  {signalInfo.label}
                </span>
              )}
            </>
          ) : (
            <span className="text-xs text-gray-500">Awaiting data</span>
          )}
        </div>
      </div>

      {/* Main content */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-4 sm:gap-6">
        {/* Chart */}
        <div className="lg:col-span-2">
          <div className="rounded-2xl border border-white/5 bg-grailiq-dark p-5">
            <div className="flex items-center justify-between mb-4">
              <h2 className="text-base font-bold">Price history</h2>
              <span className="text-[10px] uppercase tracking-wider text-gray-500">
                Source: TCGPlayer · eBay
              </span>
            </div>
            <PriceChart
              data={priceHistory ?? []}
              timeRange={timeRange}
              onTimeRangeChange={setTimeRange}
            />
            {(!priceHistory || priceHistory.length === 0) && (
              <div className="flex flex-col items-center justify-center py-12 text-center">
                <div className="h-12 w-12 rounded-2xl bg-white/5 border border-white/10 flex items-center justify-center mb-3">
                  <BarChart3 className="h-6 w-6 text-gray-500" />
                </div>
                <p className="text-sm text-white font-semibold">No price data yet</p>
                <p className="text-xs text-gray-400 mt-1">
                  Prices start tracking as soon as this product hits the hot tier.
                </p>
              </div>
            )}
          </div>
        </div>

        {/* Sidebar */}
        <div className="space-y-4">
          {/* Signal card */}
          {product.investmentSignal && signal && (
            <div
              className={`relative overflow-hidden rounded-2xl border ${signal.border} bg-grailiq-dark p-5`}
            >
              <div
                className={`pointer-events-none absolute inset-0 bg-gradient-to-br ${signal.accent} via-transparent to-transparent`}
              />
              <div className="relative">
                <div className="flex items-center gap-2 mb-3">
                  <Sparkles className={`h-4 w-4 ${signal.text}`} />
                  <span
                    className={`text-[10px] font-bold uppercase tracking-wider ${signal.text}`}
                  >
                    Investment Signal
                  </span>
                </div>
                <p className={`text-2xl font-bold ${signal.text}`}>{signalInfo.label}</p>
                {product.signalRationale && (
                  <p className="text-sm text-gray-300 leading-relaxed mt-2">
                    {product.signalRationale}
                  </p>
                )}
              </div>
            </div>
          )}

          {/* Product info */}
          <div className="rounded-2xl border border-white/5 bg-grailiq-dark p-5">
            <h3 className="text-[10px] font-bold text-gray-500 uppercase tracking-wider mb-4">
              Product Details
            </h3>
            <dl className="space-y-3 text-sm">
              <Detail label="Type" value={
                <span className="inline-flex items-center gap-1.5 text-white">
                  <span>{typeIcons[product.type] || '📋'}</span>
                  {typeLabels[product.type] || product.type}
                </span>
              } />
              <Detail label="MSRP" value={<span className="text-white">{formatPrice(product.msrp)}</span>} />
              {product.tcgplayerId && (
                <Detail
                  label="TCGPlayer ID"
                  value={<span className="font-mono text-xs text-gray-300">{product.tcgplayerId}</span>}
                />
              )}
              <Detail
                label="Added"
                value={
                  <span className="inline-flex items-center gap-1.5 text-white">
                    <Calendar className="h-3.5 w-3.5 text-gray-500" />
                    {formatDate(product.createdAt)}
                  </span>
                }
              />
            </dl>
          </div>

          {/* Price stats */}
          {priceStats.avg !== null && (
            <div className="rounded-2xl border border-white/5 bg-grailiq-dark p-5">
              <h3 className="text-[10px] font-bold text-gray-500 uppercase tracking-wider mb-4">
                Price Statistics
              </h3>
              <dl className="space-y-3 text-sm">
                <Detail
                  label="Average"
                  value={<span className="text-white">{formatPrice(priceStats.avg)}</span>}
                />
                <Detail
                  label="Period high"
                  value={<span className="text-emerald-400">{formatPrice(priceStats.high)}</span>}
                />
                <Detail
                  label="Period low"
                  value={<span className="text-rose-400">{formatPrice(priceStats.low)}</span>}
                />
                <Detail
                  label="Data points"
                  value={<span className="text-white">{priceHistory?.length ?? 0}</span>}
                />
              </dl>
            </div>
          )}
        </div>
      </div>

      <AddToPortfolioModal
        isOpen={showPortfolioModal}
        onClose={() => setShowPortfolioModal(false)}
        product={product}
        currentPrice={priceStats.current}
      />
      <CreateAlertModal
        isOpen={showAlertModal}
        onClose={() => setShowAlertModal(false)}
        product={product}
      />
    </div>
  );
}

function StatCard({
  icon: Icon,
  label,
  value,
  accent,
  sub,
}: {
  icon: React.ElementType;
  label: string;
  value: string | number;
  accent: 'purple' | 'gold' | 'emerald' | 'rose' | 'fuchsia';
  sub?: React.ReactNode;
}) {
  const classes = {
    purple: 'bg-grailiq-purple/15 border-grailiq-purple/30 text-grailiq-purple-light',
    gold: 'bg-grailiq-gold/15 border-grailiq-gold/30 text-grailiq-gold-light',
    emerald: 'bg-emerald-500/15 border-emerald-400/30 text-emerald-400',
    rose: 'bg-rose-500/15 border-rose-400/30 text-rose-400',
    fuchsia: 'bg-fuchsia-500/15 border-fuchsia-400/30 text-fuchsia-300',
  }[accent];

  return (
    <div className="rounded-2xl border border-white/5 bg-grailiq-dark p-4">
      <div className="flex items-center justify-between mb-3">
        <span className="text-[10px] text-gray-500 uppercase tracking-wider font-semibold">
          {label}
        </span>
        <div className={`h-8 w-8 rounded-xl border flex items-center justify-center ${classes}`}>
          <Icon className="h-4 w-4" />
        </div>
      </div>
      <p className="text-2xl font-bold text-white tabular-nums flex items-center gap-2">
        {typeof value === 'number' ? value : value}
        {typeof value === 'number' && <TrendingUp className="h-4 w-4 text-grailiq-purple-light" />}
      </p>
      {sub && <div className="mt-1">{sub}</div>}
    </div>
  );
}

function Detail({ label, value }: { label: string; value: React.ReactNode }) {
  return (
    <div className="flex justify-between items-center gap-4">
      <dt className="text-gray-500 text-xs uppercase tracking-wider">{label}</dt>
      <dd className="font-semibold">{value}</dd>
    </div>
  );
}
