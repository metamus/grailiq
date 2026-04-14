import { useState, useMemo } from 'react';
import { useParams, Link } from 'react-router-dom';
import { useProduct, usePriceHistory } from '@/hooks/useProducts';
import { Spinner } from '@/components/ui/Spinner';
import { PriceChart } from '@/components/charts/PriceChart';
import { AddToPortfolioModal } from '@/components/modals/AddToPortfolioModal';
import { CreateAlertModal } from '@/components/modals/CreateAlertModal';
import { formatPrice, formatDate, formatPercentage, getChangeColor, getSignalVariant } from '@/lib/utils';
import type { TimeRange } from '@/types';
import {
  ArrowLeft,
  TrendingUp,
  DollarSign,
  Target,
  Bell,
  Plus,
  Shield,
  BarChart3,
  Calendar,
  ArrowUpRight,
  ArrowDownRight,
  Minus,
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

const signalColors: Record<string, { bg: string; text: string; border: string; icon: string }> = {
  buy: { bg: 'bg-emerald-500/15', text: 'text-emerald-400', border: 'border-emerald-500/30', icon: '🟢' },
  hold: { bg: 'bg-blue-500/15', text: 'text-blue-400', border: 'border-blue-500/30', icon: '🔵' },
  watch: { bg: 'bg-amber-500/15', text: 'text-amber-400', border: 'border-amber-500/30', icon: '🟡' },
  avoid: { bg: 'bg-red-500/15', text: 'text-red-400', border: 'border-red-500/30', icon: '🔴' },
};

/** Product price detail page — premium redesign */
export default function ProductDetail() {
  const { id } = useParams<{ id: string }>();
  const { data: product, isLoading } = useProduct(id ?? '');
  const [timeRange, setTimeRange] = useState<TimeRange>('30d');
  const { data: priceHistory } = usePriceHistory(id ?? '', timeRange);
  const [showPortfolioModal, setShowPortfolioModal] = useState(false);
  const [showAlertModal, setShowAlertModal] = useState(false);

  // Compute price stats from history
  const priceStats = useMemo(() => {
    if (!priceHistory || priceHistory.length === 0) {
      return { current: null, change: null, changePct: null, high: null, low: null, avg: null };
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

  // MSRP vs market comparison
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
      <div className="text-center py-16">
        <p className="text-gray-500">Product not found</p>
        <Link to="/sets" className="text-grailiq-purple text-sm mt-2 inline-block hover:underline">
          Back to Sets
        </Link>
      </div>
    );
  }

  const signal = product.investmentSignal ? signalColors[product.investmentSignal] : null;
  const signalInfo = getSignalVariant(product.investmentSignal);

  return (
    <div>
      {/* Back Link */}
      <Link
        to={`/sets/${product.setId}`}
        className="inline-flex items-center gap-1.5 text-sm text-gray-400 hover:text-grailiq-purple transition-colors mb-6"
      >
        <ArrowLeft className="h-4 w-4" />
        Back to Set
      </Link>

      {/* Product Header */}
      <div className="relative overflow-hidden rounded-2xl bg-grailiq-dark border border-white/5 p-6 mb-8">
        <div className="absolute inset-0 bg-gradient-to-br from-violet-600/20 via-fuchsia-600/10 to-transparent" />
        <div className="relative">
          <div className="flex flex-col sm:flex-row sm:items-start sm:justify-between gap-4">
            <div className="flex items-start gap-4">
              {/* Type Icon */}
              <div className="h-16 w-16 rounded-2xl bg-white/10 backdrop-blur-sm flex items-center justify-center text-3xl flex-shrink-0 border border-white/10">
                {typeIcons[product.type] || '📋'}
              </div>
              <div>
                <p className="text-xs font-mono text-gray-400 mb-1">
                  {typeLabels[product.type] || product.type}
                </p>
                <h1 className="text-2xl sm:text-3xl font-bold text-white leading-tight">
                  {product.name}
                </h1>
                {product.msrp && (
                  <p className="text-sm text-gray-400 mt-2 flex items-center gap-1.5">
                    <DollarSign className="h-3.5 w-3.5" />
                    MSRP {formatPrice(product.msrp)}
                  </p>
                )}
              </div>
            </div>

            {/* Action Buttons */}
            <div className="flex gap-2 flex-shrink-0">
              <button
                onClick={() => setShowAlertModal(true)}
                className="inline-flex items-center gap-2 px-4 py-2.5 rounded-xl bg-white/10 hover:bg-white/15 backdrop-blur-sm border border-white/10 text-sm font-medium text-white transition-all"
              >
                <Bell className="h-4 w-4" />
                Alert Me
              </button>
              <button
                onClick={() => setShowPortfolioModal(true)}
                className="inline-flex items-center gap-2 px-4 py-2.5 rounded-xl bg-grailiq-purple hover:bg-grailiq-purple-dark text-sm font-medium text-white transition-all shadow-lg shadow-grailiq-purple/25"
              >
                <Plus className="h-4 w-4" />
                Add to Portfolio
              </button>
            </div>
          </div>
        </div>
      </div>

      {/* Stats Cards Row */}
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-4 mb-8">
        {/* Current Price */}
        <div className="relative overflow-hidden rounded-xl bg-white border border-gray-100 p-4">
          <div className="flex items-center justify-between mb-2">
            <span className="text-xs text-gray-400 uppercase tracking-wide font-medium">Market Price</span>
            <DollarSign className="h-4 w-4 text-gray-300" />
          </div>
          <p className="text-2xl font-bold text-gray-900">
            {priceStats.current !== null ? formatPrice(priceStats.current) : '—'}
          </p>
          {priceStats.change !== null && (
            <div className={`flex items-center gap-1 mt-1 text-sm font-medium ${getChangeColor(priceStats.changePct)}`}>
              {priceStats.change > 0 ? (
                <ArrowUpRight className="h-3.5 w-3.5" />
              ) : priceStats.change < 0 ? (
                <ArrowDownRight className="h-3.5 w-3.5" />
              ) : (
                <Minus className="h-3.5 w-3.5" />
              )}
              {formatPercentage(priceStats.changePct)}
            </div>
          )}
        </div>

        {/* MSRP Comparison */}
        <div className="relative overflow-hidden rounded-xl bg-white border border-gray-100 p-4">
          <div className="flex items-center justify-between mb-2">
            <span className="text-xs text-gray-400 uppercase tracking-wide font-medium">vs MSRP</span>
            <Target className="h-4 w-4 text-gray-300" />
          </div>
          {msrpComparison ? (
            <>
              <p className={`text-2xl font-bold ${msrpComparison.isAbove ? 'text-grailiq-green' : 'text-grailiq-red'}`}>
                {msrpComparison.isAbove ? '+' : ''}{formatPrice(msrpComparison.diff)}
              </p>
              <p className={`text-sm font-medium mt-1 ${msrpComparison.isAbove ? 'text-grailiq-green' : 'text-grailiq-red'}`}>
                {formatPercentage(msrpComparison.pct)} from MSRP
              </p>
            </>
          ) : (
            <p className="text-2xl font-bold text-gray-300">—</p>
          )}
        </div>

        {/* Range High/Low */}
        <div className="relative overflow-hidden rounded-xl bg-white border border-gray-100 p-4">
          <div className="flex items-center justify-between mb-2">
            <span className="text-xs text-gray-400 uppercase tracking-wide font-medium">Period Range</span>
            <BarChart3 className="h-4 w-4 text-gray-300" />
          </div>
          {priceStats.high !== null ? (
            <>
              <div className="flex items-baseline gap-2">
                <span className="text-lg font-bold text-grailiq-green">{formatPrice(priceStats.high)}</span>
                <span className="text-xs text-gray-400">high</span>
              </div>
              <div className="flex items-baseline gap-2 mt-0.5">
                <span className="text-lg font-bold text-grailiq-red">{formatPrice(priceStats.low)}</span>
                <span className="text-xs text-gray-400">low</span>
              </div>
            </>
          ) : (
            <p className="text-2xl font-bold text-gray-300">—</p>
          )}
        </div>

        {/* GrailIQ Score */}
        <div className="relative overflow-hidden rounded-xl bg-white border border-gray-100 p-4">
          <div className="flex items-center justify-between mb-2">
            <span className="text-xs text-gray-400 uppercase tracking-wide font-medium">GrailIQ Score</span>
            <Shield className="h-4 w-4 text-gray-300" />
          </div>
          {product.grailiqScore ? (
            <>
              <div className="flex items-center gap-2">
                <TrendingUp className="h-5 w-5 text-grailiq-purple" />
                <p className="text-2xl font-bold text-grailiq-purple">{product.grailiqScore}</p>
              </div>
              {signal && (
                <span className={`inline-flex items-center gap-1.5 mt-2 text-xs font-semibold px-2.5 py-1 rounded-full ${signal.bg} ${signal.text} border ${signal.border}`}>
                  {signal.icon} {signalInfo.label}
                </span>
              )}
            </>
          ) : (
            <>
              <p className="text-2xl font-bold text-gray-300">—</p>
              <p className="text-xs text-gray-400 mt-1">Awaiting data</p>
            </>
          )}
        </div>
      </div>

      {/* Main Content Grid */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* Price Chart — 2 cols */}
        <div className="lg:col-span-2">
          <div className="bg-white rounded-xl border border-gray-100 p-5">
            <h2 className="text-lg font-bold text-gray-900 mb-4">Price History</h2>
            <PriceChart
              data={priceHistory ?? []}
              timeRange={timeRange}
              onTimeRangeChange={setTimeRange}
            />
            {(!priceHistory || priceHistory.length === 0) && (
              <div className="flex flex-col items-center justify-center py-12 text-center">
                <BarChart3 className="h-10 w-10 text-gray-200 mb-3" />
                <p className="text-sm text-gray-400">No price data recorded yet</p>
                <p className="text-xs text-gray-300 mt-1">Prices will appear once tracking begins</p>
              </div>
            )}
          </div>
        </div>

        {/* Sidebar — 1 col */}
        <div className="space-y-5">
          {/* Investment Signal Card */}
          {product.investmentSignal && signal && (
            <div className={`rounded-xl border p-5 ${signal.bg} ${signal.border}`}>
              <h3 className={`text-sm font-semibold uppercase tracking-wide ${signal.text} mb-3`}>
                Investment Signal
              </h3>
              <div className="flex items-center gap-3 mb-3">
                <span className="text-3xl">{signal.icon}</span>
                <span className={`text-2xl font-bold ${signal.text}`}>{signalInfo.label}</span>
              </div>
              {product.signalRationale && (
                <p className="text-sm text-gray-600 leading-relaxed">
                  {product.signalRationale}
                </p>
              )}
            </div>
          )}

          {/* Product Info */}
          <div className="bg-white rounded-xl border border-gray-100 p-5">
            <h3 className="text-sm font-bold text-gray-900 uppercase tracking-wide mb-4">
              Product Details
            </h3>
            <dl className="space-y-3 text-sm">
              <div className="flex justify-between">
                <dt className="text-gray-400">Type</dt>
                <dd className="font-medium text-gray-900 flex items-center gap-1.5">
                  <span>{typeIcons[product.type] || '📋'}</span>
                  {typeLabels[product.type] || product.type}
                </dd>
              </div>
              <div className="flex justify-between">
                <dt className="text-gray-400">MSRP</dt>
                <dd className="font-medium text-gray-900">{formatPrice(product.msrp)}</dd>
              </div>
              {product.tcgplayerId && (
                <div className="flex justify-between">
                  <dt className="text-gray-400">TCGPlayer ID</dt>
                  <dd className="font-mono text-xs text-gray-600">{product.tcgplayerId}</dd>
                </div>
              )}
              <div className="flex justify-between">
                <dt className="text-gray-400">Added</dt>
                <dd className="font-medium text-gray-900 flex items-center gap-1.5">
                  <Calendar className="h-3.5 w-3.5 text-gray-400" />
                  {formatDate(product.createdAt)}
                </dd>
              </div>
            </dl>
          </div>

          {/* Quick Stats */}
          {priceStats.avg !== null && (
            <div className="bg-white rounded-xl border border-gray-100 p-5">
              <h3 className="text-sm font-bold text-gray-900 uppercase tracking-wide mb-4">
                Price Statistics
              </h3>
              <dl className="space-y-3 text-sm">
                <div className="flex justify-between">
                  <dt className="text-gray-400">Average</dt>
                  <dd className="font-medium text-gray-900">{formatPrice(priceStats.avg)}</dd>
                </div>
                <div className="flex justify-between">
                  <dt className="text-gray-400">Period High</dt>
                  <dd className="font-medium text-grailiq-green">{formatPrice(priceStats.high)}</dd>
                </div>
                <div className="flex justify-between">
                  <dt className="text-gray-400">Period Low</dt>
                  <dd className="font-medium text-grailiq-red">{formatPrice(priceStats.low)}</dd>
                </div>
                <div className="flex justify-between">
                  <dt className="text-gray-400">Data Points</dt>
                  <dd className="font-medium text-gray-900">{priceHistory?.length ?? 0}</dd>
                </div>
              </dl>
            </div>
          )}
        </div>
      </div>

      {/* Modals */}
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
