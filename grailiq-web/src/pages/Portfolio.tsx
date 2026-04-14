import { Link } from 'react-router-dom';
import { usePortfolio, useDeletePortfolioItem } from '@/hooks/usePortfolio';
import { Spinner } from '@/components/ui/Spinner';
import { Sparkline } from '@/components/charts/Sparkline';
import { generateTrend, signalToBias, signalToColor, pnlColor } from '@/lib/sparkData';
import { formatPrice, formatDate, formatPercentage, getChangeColor } from '@/lib/utils';
import type { PortfolioItem } from '@/types';
import {
  Download,
  Plus,
  TrendingUp,
  TrendingDown,
  Package,
  ChevronRight,
  PieChart,
  Crown,
  AlertTriangle,
  Trash2,
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

function toNum(v: number | string | null | undefined): number {
  if (v == null) return 0;
  return typeof v === 'number' ? v : parseFloat(v) || 0;
}

/** Portfolio dashboard — reads enriched items + summary from API */
export default function Portfolio() {
  const { data, isLoading } = usePortfolio();
  const deleteItem = useDeletePortfolioItem();

  if (isLoading) {
    return (
      <div className="flex items-center justify-center min-h-[60vh]">
        <Spinner size="lg" />
      </div>
    );
  }

  const items: PortfolioItem[] = data?.data ?? [];
  const summary = data?.summary;

  const totalValue = toNum(summary?.totalValue);
  const costBasis = toNum(summary?.costBasis);
  const pnl = toNum(summary?.unrealizedPnl);
  const pnlPct = toNum(summary?.unrealizedPnlPct);
  const holdings = summary?.holdings ?? items.length;
  const uniqueProducts = summary?.uniqueProducts ?? 0;

  // Deterministic headline sparkline shaped by overall P&L direction
  const heroBias = pnl > 0 ? 'up' : pnl < 0 ? 'down' : 'flat';
  const heroPoints = generateTrend(`portfolio-${holdings}-${Math.round(totalValue)}`, heroBias, 28);
  const heroColor = pnlColor(pnl);

  return (
    <div>
      {/* Hero header */}
      <div className="relative overflow-hidden rounded-2xl bg-grailiq-dark border border-white/5 p-6 mb-6">
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
              Cost basis, market value, and unrealized P&L across your sealed collection
            </p>
          </div>
          <div className="flex gap-2 flex-shrink-0">
            <button
              onClick={() => {
                const csv = [
                  ['Product', 'Type', 'Set', 'Quantity', 'Cost Basis', 'Current Price', 'Current Value', 'P&L', 'P&L %'],
                  ...items.map((item) => [
                    item.product.name,
                    item.product.type,
                    '', // set name not in item
                    item.quantity.toString(),
                    item.purchasePrice,
                    item.currentPrice || '',
                    item.currentValue || '',
                    item.unrealizedPnl || '',
                    item.unrealizedPnlPct || '',
                  ]),
                ]
                  .map((row) =>
                    row
                      .map((cell) => {
                        const str = String(cell);
                        return str.includes(',') || str.includes('"') ? `"${str.replace(/"/g, '""')}"` : str;
                      })
                      .join(','),
                  )
                  .join('\n');

                const blob = new Blob([csv], { type: 'text/csv' });
                const url = URL.createObjectURL(blob);
                const a = document.createElement('a');
                a.href = url;
                a.download = `portfolio-${new Date().toISOString().split('T')[0]}.csv`;
                a.click();
                URL.revokeObjectURL(url);
              }}
              className="inline-flex items-center gap-2 px-4 py-2.5 rounded-xl bg-white/10 hover:bg-white/15 backdrop-blur-sm border border-white/10 text-sm font-medium text-white transition-all"
            >
              <Download className="h-4 w-4" />
              Export CSV
            </button>
            <Link
              to="/sets"
              className="inline-flex items-center gap-2 px-4 py-2.5 rounded-xl bg-grailiq-purple hover:bg-grailiq-purple-dark text-sm font-medium text-white transition-all shadow-lg shadow-grailiq-purple/25"
            >
              <Plus className="h-4 w-4" />
              Add Item
            </Link>
          </div>
        </div>
      </div>

      {/* Value hero card with sparkline */}
      <div className="relative overflow-hidden rounded-2xl border border-white/5 bg-gradient-to-br from-grailiq-dark via-[#131325] to-grailiq-dark p-6 mb-6">
        <div
          className="absolute inset-0 opacity-40 pointer-events-none"
          style={{
            background: `radial-gradient(circle at top right, ${heroColor}33, transparent 60%)`,
          }}
        />
        <div className="relative grid lg:grid-cols-[1fr_auto] gap-6 items-end">
          <div className="min-w-0">
            <p className="text-xs font-semibold uppercase tracking-[0.12em] text-gray-400">
              Total Value
            </p>
            <div className="flex items-baseline gap-3 mt-2 flex-wrap">
              <span className="text-5xl font-black text-white tracking-tight tabular-nums font-serif italic">
                {formatPrice(totalValue)}
              </span>
              {holdings > 0 && (
                <span
                  className="inline-flex items-center gap-1 rounded-full px-3 py-1 text-sm font-bold tabular-nums"
                  style={{
                    color: heroColor,
                    backgroundColor: `${heroColor}1A`,
                    border: `1px solid ${heroColor}33`,
                  }}
                >
                  {pnl >= 0 ? (
                    <TrendingUp className="h-3.5 w-3.5" />
                  ) : (
                    <TrendingDown className="h-3.5 w-3.5" />
                  )}
                  {pnl >= 0 ? '+' : ''}
                  {formatPrice(pnl)} ({formatPercentage(pnlPct)})
                </span>
              )}
            </div>
            <div className="flex items-center gap-4 mt-4 text-xs text-gray-400">
              <span>
                Cost basis{' '}
                <span className="text-gray-200 font-semibold tabular-nums">
                  {formatPrice(costBasis)}
                </span>
              </span>
              <span className="h-1 w-1 rounded-full bg-gray-600" />
              <span>
                <span className="text-gray-200 font-semibold">{holdings}</span> holdings
              </span>
              <span className="h-1 w-1 rounded-full bg-gray-600" />
              <span>
                <span className="text-gray-200 font-semibold">{uniqueProducts}</span> unique
              </span>
            </div>
          </div>
          <div className="flex items-end justify-end">
            <Sparkline points={heroPoints} color={heroColor} width={320} height={80} />
          </div>
        </div>
      </div>

      {/* Best / Worst holding tiles */}
      {summary?.bestHolding || summary?.worstHolding ? (
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4 mb-6">
          {summary?.bestHolding && (
            <div className="rounded-2xl border border-emerald-500/20 bg-emerald-500/[0.04] p-5">
              <div className="flex items-center gap-2 mb-1">
                <Crown className="h-4 w-4 text-emerald-400" />
                <span className="text-xs font-semibold uppercase tracking-wider text-emerald-400">
                  Top Performer
                </span>
              </div>
              <p className="text-white font-bold truncate">{summary.bestHolding.name}</p>
              <p className="text-2xl font-black text-emerald-400 tabular-nums mt-1">
                +{formatPrice(toNum(summary.bestHolding.pnl))}
                <span className="text-sm font-bold ml-2 text-emerald-400/80">
                  {formatPercentage(toNum(summary.bestHolding.pnlPct))}
                </span>
              </p>
            </div>
          )}
          {summary?.worstHolding && (
            <div className="rounded-2xl border border-rose-500/20 bg-rose-500/[0.04] p-5">
              <div className="flex items-center gap-2 mb-1">
                <AlertTriangle className="h-4 w-4 text-rose-400" />
                <span className="text-xs font-semibold uppercase tracking-wider text-rose-400">
                  Biggest Drag
                </span>
              </div>
              <p className="text-white font-bold truncate">{summary.worstHolding.name}</p>
              <p className="text-2xl font-black tabular-nums mt-1 text-rose-400">
                {formatPrice(toNum(summary.worstHolding.pnl))}
                <span className="text-sm font-bold ml-2 text-rose-400/80">
                  {formatPercentage(toNum(summary.worstHolding.pnlPct))}
                </span>
              </p>
            </div>
          )}
        </div>
      ) : null}

      {/* Holdings List */}
      <div className="rounded-2xl border border-white/5 bg-grailiq-dark overflow-hidden">
        <div className="px-5 py-4 border-b border-white/5 flex items-center justify-between">
          <h2 className="font-bold text-white">Holdings</h2>
          {items.length > 0 && (
            <span className="text-xs text-gray-400">
              {items.length} {items.length === 1 ? 'position' : 'positions'}
            </span>
          )}
        </div>

        {items.length > 0 ? (
          <div className="divide-y divide-white/5">
            {items.map((item) => {
              const current = toNum(item.currentValue);
              const itemPnl = toNum(item.unrealizedPnl);
              const itemPnlPct = toNum(item.unrealizedPnlPct);
              const bias = signalToBias(item.product.investmentSignal);
              const color = itemPnl === 0 ? signalToColor(item.product.investmentSignal) : pnlColor(itemPnl);
              const points = generateTrend(item.productId, bias, 16);

              return (
                <div
                  key={item.id}
                  className="group flex items-center gap-4 px-5 py-4 hover:bg-white/[0.02] transition-colors"
                >
                  <Link
                    to={`/products/${item.productId}`}
                    className="flex items-center gap-4 flex-1 min-w-0"
                  >
                    {/* Icon */}
                    <div className="h-12 w-12 rounded-xl bg-white/5 border border-white/5 flex items-center justify-center text-xl flex-shrink-0">
                      {typeIcons[item.product.type] || '📋'}
                    </div>

                    {/* Info */}
                    <div className="flex-1 min-w-0">
                      <p className="text-sm font-semibold text-white group-hover:text-grailiq-purple-light transition-colors truncate">
                        {item.product.name}
                      </p>
                      <p className="text-xs text-gray-400 mt-0.5 truncate">
                        Qty {item.quantity} · Bought {formatDate(item.purchaseDate)} ·{' '}
                        {formatPrice(item.purchasePrice)} ea
                      </p>
                    </div>

                    {/* Sparkline */}
                    <div className="hidden md:block flex-shrink-0">
                      <Sparkline points={points} color={color} width={96} height={32} />
                    </div>

                    {/* Value / PnL */}
                    <div className="text-right flex-shrink-0">
                      <p className="text-sm font-bold text-white tabular-nums">
                        {formatPrice(current)}
                      </p>
                      <p className={`text-xs font-bold tabular-nums ${getChangeColor(itemPnl)}`}>
                        {itemPnl >= 0 ? '+' : ''}
                        {formatPrice(itemPnl)} ({formatPercentage(itemPnlPct)})
                      </p>
                    </div>
                  </Link>

                  {/* Delete */}
                  <button
                    onClick={() => {
                      if (confirm(`Remove ${item.product.name} from portfolio?`)) {
                        deleteItem.mutate(item.id);
                      }
                    }}
                    className="p-2 rounded-lg text-gray-500 hover:text-rose-400 hover:bg-rose-500/10 transition-colors flex-shrink-0"
                    aria-label="Delete holding"
                  >
                    <Trash2 className="h-4 w-4" />
                  </button>
                  <ChevronRight className="h-4 w-4 text-gray-600 group-hover:text-grailiq-purple-light transition-colors flex-shrink-0 hidden sm:block" />
                </div>
              );
            })}
          </div>
        ) : (
          <div className="flex flex-col items-center justify-center py-20 text-center px-6">
            <div className="h-16 w-16 rounded-2xl bg-grailiq-purple/10 border border-grailiq-purple/20 flex items-center justify-center mb-4">
              <Package className="h-8 w-8 text-grailiq-purple-light" />
            </div>
            <p className="text-white font-semibold mb-1">No holdings yet</p>
            <p className="text-sm text-gray-400 max-w-xs">
              Browse the set encyclopedia and add sealed products to start tracking cost basis and P&L.
            </p>
            <Link
              to="/sets"
              className="mt-5 inline-flex items-center gap-1.5 text-sm font-semibold text-grailiq-purple-light hover:text-white transition-colors"
            >
              Browse Sets <ChevronRight className="h-3.5 w-3.5" />
            </Link>
          </div>
        )}
      </div>
    </div>
  );
}
