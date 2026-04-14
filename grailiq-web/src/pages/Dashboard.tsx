import { useMemo } from 'react';
import { Link } from 'react-router-dom';
import { useSets } from '@/hooks/useSets';
import { useProducts } from '@/hooks/useProducts';
import { formatPrice } from '@/lib/utils';
import {
  TrendingUp,
  Package,
  Layers,
  BarChart3,
  ArrowRight,
  Sparkles,
  ChevronRight,
  Zap,
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

/** Dashboard home page — wired to live API data */
export default function Dashboard() {
  const { data: sets } = useSets();
  const { data: products } = useProducts();

  // Compute real stats
  const stats = useMemo(() => {
    const totalSets = sets?.length ?? 0;
    const totalProducts = products?.length ?? 0;
    const scored = products?.filter((p) => p.grailiqScore) ?? [];
    const avgScore =
      scored.length > 0
        ? scored.reduce((sum, p) => sum + parseFloat(p.grailiqScore!), 0) / scored.length
        : null;
    const buySignals = products?.filter((p) => p.investmentSignal === 'buy').length ?? 0;
    return { totalSets, totalProducts, avgScore, buySignals };
  }, [sets, products]);

  // Top scored products for "Trending" section
  const topProducts = useMemo(() => {
    if (!products) return [];
    return [...products]
      .filter((p) => p.grailiqScore)
      .sort((a, b) => parseFloat(b.grailiqScore!) - parseFloat(a.grailiqScore!))
      .slice(0, 5);
  }, [products]);

  // Recently added sets
  const recentSets = useMemo(() => {
    if (!sets) return [];
    return [...sets]
      .sort((a, b) => {
        if (!a.releaseDate || !b.releaseDate) return 0;
        return new Date(b.releaseDate).getTime() - new Date(a.releaseDate).getTime();
      })
      .slice(0, 4);
  }, [sets]);

  return (
    <div>
      {/* Hero Header */}
      <div className="relative overflow-hidden rounded-2xl bg-grailiq-dark border border-white/5 p-6 sm:p-8 mb-8">
        <div className="absolute inset-0 bg-gradient-to-br from-violet-600/25 via-fuchsia-600/15 to-indigo-600/10" />
        <div className="absolute top-0 right-0 w-64 h-64 bg-grailiq-purple/10 rounded-full blur-3xl" />
        <div className="relative">
          <div className="flex items-center gap-2 mb-2">
            <Sparkles className="h-5 w-5 text-grailiq-purple-light" />
            <span className="text-xs font-semibold uppercase tracking-wider text-grailiq-purple-light">
              Intelligence Platform
            </span>
          </div>
          <h1 className="text-3xl sm:text-4xl font-bold text-white mb-2">
            Welcome to GrailIQ
          </h1>
          <p className="text-gray-400 max-w-lg">
            Track sealed Pokemon TCG product prices, analyze investment signals, and build your portfolio with confidence.
          </p>
        </div>
      </div>

      {/* Stats Cards */}
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-4 mb-8">
        <div className="bg-white rounded-xl border border-gray-100 p-4 hover:shadow-md hover:shadow-grailiq-purple/5 transition-shadow">
          <div className="flex items-center justify-between mb-3">
            <div className="h-10 w-10 rounded-xl bg-violet-50 flex items-center justify-center">
              <Layers className="h-5 w-5 text-grailiq-purple" />
            </div>
          </div>
          <p className="text-2xl font-bold text-gray-900">{stats.totalSets}</p>
          <p className="text-xs text-gray-400 uppercase tracking-wide mt-1">Sets Tracked</p>
        </div>

        <div className="bg-white rounded-xl border border-gray-100 p-4 hover:shadow-md hover:shadow-grailiq-purple/5 transition-shadow">
          <div className="flex items-center justify-between mb-3">
            <div className="h-10 w-10 rounded-xl bg-fuchsia-50 flex items-center justify-center">
              <Package className="h-5 w-5 text-fuchsia-500" />
            </div>
          </div>
          <p className="text-2xl font-bold text-gray-900">{stats.totalProducts}</p>
          <p className="text-xs text-gray-400 uppercase tracking-wide mt-1">Products</p>
        </div>

        <div className="bg-white rounded-xl border border-gray-100 p-4 hover:shadow-md hover:shadow-grailiq-purple/5 transition-shadow">
          <div className="flex items-center justify-between mb-3">
            <div className="h-10 w-10 rounded-xl bg-emerald-50 flex items-center justify-center">
              <TrendingUp className="h-5 w-5 text-emerald-500" />
            </div>
          </div>
          <p className="text-2xl font-bold text-gray-900">{stats.buySignals}</p>
          <p className="text-xs text-gray-400 uppercase tracking-wide mt-1">Buy Signals</p>
        </div>

        <div className="bg-white rounded-xl border border-gray-100 p-4 hover:shadow-md hover:shadow-grailiq-purple/5 transition-shadow">
          <div className="flex items-center justify-between mb-3">
            <div className="h-10 w-10 rounded-xl bg-amber-50 flex items-center justify-center">
              <BarChart3 className="h-5 w-5 text-amber-500" />
            </div>
          </div>
          <p className="text-2xl font-bold text-gray-900">
            {stats.avgScore !== null ? stats.avgScore.toFixed(1) : '—'}
          </p>
          <p className="text-xs text-gray-400 uppercase tracking-wide mt-1">Avg Score</p>
        </div>
      </div>

      {/* Two-Column Content */}
      <div className="grid grid-cols-1 lg:grid-cols-5 gap-6">
        {/* Top Scored Products — 3 cols */}
        <div className="lg:col-span-3">
          <div className="bg-white rounded-xl border border-gray-100 overflow-hidden">
            <div className="flex items-center justify-between px-5 py-4 border-b border-gray-50">
              <div className="flex items-center gap-2">
                <Zap className="h-4 w-4 text-grailiq-purple" />
                <h2 className="font-bold text-gray-900">Top Rated Products</h2>
              </div>
              <Link
                to="/sets"
                className="text-xs font-medium text-grailiq-purple hover:underline flex items-center gap-1"
              >
                View All <ArrowRight className="h-3 w-3" />
              </Link>
            </div>

            {topProducts.length > 0 ? (
              <div className="divide-y divide-gray-50">
                {topProducts.map((product, idx) => (
                  <Link
                    key={product.id}
                    to={`/products/${product.id}`}
                    className="group flex items-center gap-4 px-5 py-3.5 hover:bg-grailiq-surface transition-colors"
                  >
                    <span className="text-sm font-bold text-gray-300 w-5 text-center">
                      {idx + 1}
                    </span>
                    <div className="h-10 w-10 rounded-lg bg-grailiq-light flex items-center justify-center text-lg flex-shrink-0">
                      {typeIcons[product.type] || '📋'}
                    </div>
                    <div className="flex-1 min-w-0">
                      <p className="text-sm font-semibold text-gray-900 group-hover:text-grailiq-purple transition-colors truncate">
                        {product.name}
                      </p>
                      <p className="text-xs text-gray-400">
                        MSRP {formatPrice(product.msrp)}
                      </p>
                    </div>
                    <div className="flex items-center gap-1.5 flex-shrink-0">
                      <TrendingUp className="h-4 w-4 text-grailiq-purple" />
                      <span className="text-sm font-bold text-grailiq-purple">
                        {product.grailiqScore}
                      </span>
                    </div>
                    <ChevronRight className="h-4 w-4 text-gray-300 group-hover:text-grailiq-purple transition-colors flex-shrink-0" />
                  </Link>
                ))}
              </div>
            ) : (
              <div className="flex flex-col items-center justify-center py-12 text-center">
                <BarChart3 className="h-10 w-10 text-gray-200 mb-3" />
                <p className="text-sm text-gray-400">No scored products yet</p>
                <p className="text-xs text-gray-300 mt-1">Scores will appear as data is collected</p>
              </div>
            )}
          </div>
        </div>

        {/* Recent Sets — 2 cols */}
        <div className="lg:col-span-2">
          <div className="bg-white rounded-xl border border-gray-100 overflow-hidden">
            <div className="flex items-center justify-between px-5 py-4 border-b border-gray-50">
              <div className="flex items-center gap-2">
                <Layers className="h-4 w-4 text-grailiq-purple" />
                <h2 className="font-bold text-gray-900">Latest Sets</h2>
              </div>
              <Link
                to="/sets"
                className="text-xs font-medium text-grailiq-purple hover:underline flex items-center gap-1"
              >
                All Sets <ArrowRight className="h-3 w-3" />
              </Link>
            </div>

            {recentSets.length > 0 ? (
              <div className="divide-y divide-gray-50">
                {recentSets.map((set) => (
                  <Link
                    key={set.id}
                    to={`/sets/${set.id}`}
                    className="group flex items-center gap-3 px-5 py-3.5 hover:bg-grailiq-surface transition-colors"
                  >
                    <div className="flex-1 min-w-0">
                      <p className="text-sm font-semibold text-gray-900 group-hover:text-grailiq-purple transition-colors truncate">
                        {set.name}
                      </p>
                      <p className="text-xs text-gray-400 mt-0.5">
                        {set.code} · {set.series}
                      </p>
                    </div>
                    {set.isOutOfPrint && (
                      <span className="text-[10px] font-semibold uppercase tracking-wider px-2 py-0.5 rounded-full bg-amber-50 text-amber-600 border border-amber-200 flex-shrink-0">
                        OOP
                      </span>
                    )}
                    <ChevronRight className="h-4 w-4 text-gray-300 group-hover:text-grailiq-purple transition-colors flex-shrink-0" />
                  </Link>
                ))}
              </div>
            ) : (
              <div className="flex flex-col items-center justify-center py-12 text-center">
                <Layers className="h-10 w-10 text-gray-200 mb-3" />
                <p className="text-sm text-gray-400">No sets loaded yet</p>
              </div>
            )}
          </div>

          {/* Quick Links */}
          <div className="mt-5 grid grid-cols-2 gap-3">
            <Link
              to="/portfolio"
              className="flex items-center gap-2 p-3.5 bg-grailiq-light rounded-xl text-sm font-medium text-grailiq-purple hover:bg-grailiq-purple hover:text-white transition-all group"
            >
              <TrendingUp className="h-4 w-4" />
              Portfolio
            </Link>
            <Link
              to="/alerts"
              className="flex items-center gap-2 p-3.5 bg-grailiq-light rounded-xl text-sm font-medium text-grailiq-purple hover:bg-grailiq-purple hover:text-white transition-all group"
            >
              <Zap className="h-4 w-4" />
              Alerts
            </Link>
          </div>
        </div>
      </div>
    </div>
  );
}
