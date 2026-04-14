import { useMemo } from 'react';
import { Link } from 'react-router-dom';
import { usePortfolio } from '@/hooks/usePortfolio';
import { Spinner } from '@/components/ui/Spinner';
import { formatPrice, formatDate, formatPercentage, getChangeColor } from '@/lib/utils';
import {
  Download,
  Plus,
  DollarSign,
  TrendingUp,
  Wallet,
  Package,
  ChevronRight,
  PieChart,
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

/** Portfolio dashboard — premium redesign */
export default function Portfolio() {
  const { data: items, isLoading } = usePortfolio();

  // Compute portfolio stats
  const stats = useMemo(() => {
    if (!items || items.length === 0) {
      return { totalValue: 0, costBasis: 0, pnl: 0, pnlPct: 0, totalItems: 0 };
    }
    let totalValue = 0;
    let costBasis = 0;
    let totalItems = 0;

    items.forEach((item) => {
      const cost = parseFloat(item.purchasePrice) * item.quantity;
      const current = item.currentPrice ? parseFloat(item.currentPrice) * item.quantity : cost;
      costBasis += cost;
      totalValue += current;
      totalItems += item.quantity;
    });

    const pnl = totalValue - costBasis;
    const pnlPct = costBasis > 0 ? (pnl / costBasis) * 100 : 0;
    return { totalValue, costBasis, pnl, pnlPct, totalItems };
  }, [items]);

  if (isLoading) {
    return (
      <div className="flex items-center justify-center min-h-[60vh]">
        <Spinner size="lg" />
      </div>
    );
  }

  return (
    <div>
      {/* Header */}
      <div className="relative overflow-hidden rounded-2xl bg-grailiq-dark border border-white/5 p-6 mb-8">
        <div className="absolute inset-0 bg-gradient-to-br from-emerald-600/20 via-violet-600/10 to-transparent" />
        <div className="relative flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
          <div>
            <div className="flex items-center gap-2 mb-1">
              <PieChart className="h-5 w-5 text-emerald-400" />
              <span className="text-xs font-semibold uppercase tracking-wider text-emerald-400">
                Portfolio Tracker
              </span>
            </div>
            <h1 className="text-2xl sm:text-3xl font-bold text-white">Your Holdings</h1>
            <p className="text-sm text-gray-400 mt-1">
              Track cost basis, current value, and P&L across your sealed collection
            </p>
          </div>
          <div className="flex gap-2 flex-shrink-0">
            <button className="inline-flex items-center gap-2 px-4 py-2.5 rounded-xl bg-white/10 hover:bg-white/15 backdrop-blur-sm border border-white/10 text-sm font-medium text-white transition-all">
              <Download className="h-4 w-4" />
              Export
            </button>
            <button className="inline-flex items-center gap-2 px-4 py-2.5 rounded-xl bg-grailiq-purple hover:bg-grailiq-purple-dark text-sm font-medium text-white transition-all shadow-lg shadow-grailiq-purple/25">
              <Plus className="h-4 w-4" />
              Add Item
            </button>
          </div>
        </div>
      </div>

      {/* Stats Row */}
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-4 mb-8">
        <div className="bg-white rounded-xl border border-gray-100 p-4">
          <div className="flex items-center justify-between mb-2">
            <span className="text-xs text-gray-400 uppercase tracking-wide font-medium">Total Value</span>
            <DollarSign className="h-4 w-4 text-gray-300" />
          </div>
          <p className="text-2xl font-bold text-gray-900">{formatPrice(stats.totalValue)}</p>
        </div>

        <div className="bg-white rounded-xl border border-gray-100 p-4">
          <div className="flex items-center justify-between mb-2">
            <span className="text-xs text-gray-400 uppercase tracking-wide font-medium">Cost Basis</span>
            <Wallet className="h-4 w-4 text-gray-300" />
          </div>
          <p className="text-2xl font-bold text-gray-900">{formatPrice(stats.costBasis)}</p>
        </div>

        <div className="bg-white rounded-xl border border-gray-100 p-4">
          <div className="flex items-center justify-between mb-2">
            <span className="text-xs text-gray-400 uppercase tracking-wide font-medium">Unrealized P&L</span>
            <TrendingUp className="h-4 w-4 text-gray-300" />
          </div>
          <p className={`text-2xl font-bold ${getChangeColor(stats.pnl)}`}>
            {formatPrice(stats.pnl)}
          </p>
          {stats.costBasis > 0 && (
            <p className={`text-sm font-medium mt-0.5 ${getChangeColor(stats.pnlPct)}`}>
              {formatPercentage(stats.pnlPct)}
            </p>
          )}
        </div>

        <div className="bg-white rounded-xl border border-gray-100 p-4">
          <div className="flex items-center justify-between mb-2">
            <span className="text-xs text-gray-400 uppercase tracking-wide font-medium">Items</span>
            <Package className="h-4 w-4 text-gray-300" />
          </div>
          <p className="text-2xl font-bold text-gray-900">{stats.totalItems}</p>
        </div>
      </div>

      {/* Holdings List */}
      <div className="bg-white rounded-xl border border-gray-100 overflow-hidden">
        <div className="px-5 py-4 border-b border-gray-50">
          <h2 className="font-bold text-gray-900">Holdings</h2>
        </div>

        {items && items.length > 0 ? (
          <div className="divide-y divide-gray-50">
            {items.map((item) => {
              const cost = parseFloat(item.purchasePrice) * item.quantity;
              const current = item.currentPrice
                ? parseFloat(item.currentPrice) * item.quantity
                : cost;
              const itemPnl = current - cost;
              const itemPnlPct = cost > 0 ? (itemPnl / cost) * 100 : 0;

              return (
                <Link
                  key={item.id}
                  to={`/products/${item.productId}`}
                  className="group flex items-center gap-4 px-5 py-4 hover:bg-grailiq-surface transition-colors"
                >
                  {/* Icon */}
                  <div className="h-11 w-11 rounded-xl bg-grailiq-light flex items-center justify-center text-xl flex-shrink-0">
                    {item.product ? typeIcons[item.product.type] || '📋' : '📋'}
                  </div>

                  {/* Info */}
                  <div className="flex-1 min-w-0">
                    <p className="text-sm font-semibold text-gray-900 group-hover:text-grailiq-purple transition-colors truncate">
                      {item.product?.name ?? `Product ${item.productId.slice(0, 8)}`}
                    </p>
                    <p className="text-xs text-gray-400 mt-0.5">
                      Qty {item.quantity} · Bought {formatDate(item.purchaseDate)} · {formatPrice(item.purchasePrice)} ea
                    </p>
                  </div>

                  {/* Value */}
                  <div className="text-right flex-shrink-0 hidden sm:block">
                    <p className="text-sm font-bold text-gray-900">{formatPrice(current)}</p>
                    <p className={`text-xs font-medium ${getChangeColor(itemPnl)}`}>
                      {formatPercentage(itemPnlPct)}
                    </p>
                  </div>

                  <ChevronRight className="h-4 w-4 text-gray-300 group-hover:text-grailiq-purple transition-colors flex-shrink-0" />
                </Link>
              );
            })}
          </div>
        ) : (
          <div className="flex flex-col items-center justify-center py-16 text-center">
            <div className="h-16 w-16 rounded-2xl bg-grailiq-light flex items-center justify-center mb-4">
              <Package className="h-8 w-8 text-grailiq-purple" />
            </div>
            <p className="text-gray-900 font-medium mb-1">No holdings yet</p>
            <p className="text-sm text-gray-400 max-w-xs">
              Browse the set encyclopedia and add sealed products to start tracking your portfolio value.
            </p>
            <Link
              to="/sets"
              className="mt-4 inline-flex items-center gap-1.5 text-sm font-medium text-grailiq-purple hover:underline"
            >
              Browse Sets <ChevronRight className="h-3.5 w-3.5" />
            </Link>
          </div>
        )}
      </div>
    </div>
  );
}
