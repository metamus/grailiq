import { Link } from 'react-router-dom';
import { useWatchlist, useRemoveWatch } from '@/hooks/useWatchlist';
import { Spinner } from '@/components/ui/Spinner';
import { ScoreRing } from '@/components/ScoreRing';
import { Sparkline } from '@/components/charts/Sparkline';
import { generateTrend, signalToBias, signalToColor } from '@/lib/sparkData';
import { formatPrice } from '@/lib/utils';
import {
  Heart,
  Eye,
  ChevronRight,
  Trash2,
  Package,
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

/**
 * Watchlist page — products you're tracking without owning.
 * Save-for-later, with optional target price.
 */
export default function Watchlist() {
  const { data, isLoading } = useWatchlist();
  const removeWatch = useRemoveWatch();

  if (isLoading) {
    return (
      <div className="flex items-center justify-center min-h-[60vh]">
        <Spinner size="lg" />
      </div>
    );
  }

  const items = data ?? [];

  return (
    <div className="text-white">
      {/* Hero */}
      <div className="relative overflow-hidden rounded-3xl border border-white/5 bg-grailiq-dark p-6 sm:p-8 mb-6">
        <div className="absolute inset-0 bg-gradient-to-br from-fuchsia-600/20 via-grailiq-purple/10 to-transparent" />
        <div className="absolute top-0 right-0 h-48 w-48 rounded-full bg-grailiq-purple/15 blur-3xl" />

        <div className="relative flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
          <div>
            <div className="inline-flex items-center gap-2 mb-2 rounded-full border border-grailiq-purple/30 bg-grailiq-purple/10 px-3 py-1">
              <Heart className="h-3.5 w-3.5 text-grailiq-purple-light" />
              <span className="text-[11px] font-semibold uppercase tracking-wider text-grailiq-purple-light">
                Save for Later
              </span>
            </div>
            <h1 className="text-3xl sm:text-4xl font-bold">Watchlist</h1>
            <p className="text-sm sm:text-base text-gray-400 mt-1">
              {items.length === 0
                ? 'Track products you might buy — no cost basis required.'
                : `${items.length} product${items.length === 1 ? '' : 's'} being tracked.`}
            </p>
          </div>
          <Link
            to="/app/sets"
            className="inline-flex items-center gap-2 rounded-xl border border-white/15 bg-white/[0.03] px-4 py-2.5 text-sm font-semibold hover:border-white/25 hover:bg-white/[0.06] transition-all"
          >
            <Package className="h-4 w-4" />
            Browse products
          </Link>
        </div>
      </div>

      {/* List */}
      <div className="rounded-2xl border border-white/5 bg-grailiq-dark overflow-hidden">
        {items.length > 0 ? (
          <div className="divide-y divide-white/5">
            {items.map((entry) => {
              const { product } = entry;
              const bias = signalToBias(product.investmentSignal);
              const color = signalToColor(product.investmentSignal);
              const points = generateTrend(product.id, bias, 14);
              const signal = product.investmentSignal;
              const target = entry.targetPrice ? parseFloat(entry.targetPrice) : null;
              const current = entry.currentPrice;
              const atTarget = target !== null && current !== null && current <= target;

              return (
                <div
                  key={entry.id}
                  className="group flex items-center gap-4 px-5 py-3.5 hover:bg-white/[0.02] transition-colors"
                >
                  <div className="h-11 w-11 rounded-xl bg-white/5 border border-white/10 flex items-center justify-center text-xl flex-shrink-0">
                    {typeIcons[product.type] || '📋'}
                  </div>

                  <Link
                    to={`/app/products/${product.id}`}
                    className="flex-1 min-w-0"
                  >
                    <p className="text-sm font-semibold text-white group-hover:text-grailiq-purple-light transition-colors truncate">
                      {product.name}
                    </p>
                    <div className="flex items-center gap-2 mt-0.5">
                      {target !== null && (
                        <span className={`text-[11px] ${atTarget ? 'text-emerald-400 font-semibold' : 'text-gray-500'}`}>
                          {atTarget ? '🎯 Hit target' : `Target ${formatPrice(target)}`}
                        </span>
                      )}
                      {entry.note && (
                        <span className="text-[11px] text-gray-500 truncate">· {entry.note}</span>
                      )}
                      {!target && !entry.note && (
                        <span className="text-[11px] text-gray-500">
                          MSRP {formatPrice(product.msrp)}
                        </span>
                      )}
                    </div>
                  </Link>

                  <div className="hidden md:block flex-shrink-0">
                    <Sparkline points={points} color={color} width={84} height={26} />
                  </div>

                  {signal && (
                    <span
                      className={`hidden sm:inline-flex flex-shrink-0 rounded-full border px-2 py-0.5 text-[9px] font-bold uppercase tracking-wider ${signalBadge[signal]}`}
                    >
                      {signal}
                    </span>
                  )}

                  {product.grailiqScore && (
                    <div className="flex-shrink-0 hidden sm:block">
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

                  {current !== null && (
                    <div className="text-right flex-shrink-0">
                      <p className="text-[9px] text-gray-500 uppercase tracking-wider">Now</p>
                      <p className="text-sm font-bold text-white tabular-nums">
                        {formatPrice(current)}
                      </p>
                    </div>
                  )}

                  <button
                    onClick={() => {
                      if (confirm(`Remove ${product.name} from watchlist?`)) {
                        removeWatch.mutate(entry.id);
                      }
                    }}
                    className="p-2 rounded-lg text-gray-600 hover:text-rose-400 hover:bg-rose-500/10 transition-colors flex-shrink-0"
                    aria-label="Remove from watchlist"
                  >
                    <Trash2 className="h-4 w-4" />
                  </button>

                  <ChevronRight className="h-4 w-4 text-gray-600 flex-shrink-0" />
                </div>
              );
            })}
          </div>
        ) : (
          <div className="flex flex-col items-center justify-center py-20 text-center px-6">
            <div className="h-16 w-16 rounded-2xl bg-grailiq-purple/10 border border-grailiq-purple/30 flex items-center justify-center mb-4">
              <Eye className="h-7 w-7 text-grailiq-purple-light" />
            </div>
            <p className="text-white font-bold mb-1">Nothing on your watchlist yet</p>
            <p className="text-sm text-gray-400 max-w-sm">
              Tap the heart icon on any product to track it without adding to your portfolio.
            </p>
            <Link
              to="/app/sets"
              className="mt-5 inline-flex items-center gap-1.5 text-sm font-semibold text-grailiq-purple-light hover:text-white transition-colors"
            >
              Browse products <ChevronRight className="h-3.5 w-3.5" />
            </Link>
          </div>
        )}
      </div>
    </div>
  );
}
