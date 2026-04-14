import { useParams, Link } from 'react-router-dom';
import { useSet } from '@/hooks/useSets';
import { Spinner } from '@/components/ui/Spinner';
import { ScoreRing } from '@/components/ScoreRing';
import { Sparkline } from '@/components/charts/Sparkline';
import { generateTrend, signalToBias, signalToColor } from '@/lib/sparkData';
import { formatDate, formatPrice } from '@/lib/utils';
import {
  ArrowLeft,
  Calendar,
  Layers,
  Package,
  ChevronRight,
  Sparkles,
  Scale,
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

// Helper to get abbreviation from product type
function typeAbbreviation(type: string): string {
  const abbrev: Record<string, string> = {
    booster_box: 'BOX',
    etb: 'ETB',
    booster_pack: 'BPK',
    collection_box: 'COL',
    blister_pack: 'BLS',
    tin: 'TIN',
    premium_collection: 'PRM',
    other: 'OTH',
  };
  return abbrev[type] || type.slice(0, 3).toUpperCase();
}

const signalBadge: Record<string, string> = {
  buy: 'bg-grailiq-gold/15 text-grailiq-gold-light border-grailiq-gold/30',
  hold: 'bg-amber-500/15 text-amber-400 border-amber-400/30',
  watch: 'bg-slate-500/20 text-slate-300 border-slate-400/30',
  avoid: 'bg-rose-500/15 text-rose-400 border-rose-400/30',
};

/** Set detail — dark theme, per-product sparklines, signal badges. */
export default function SetDetail() {
  const { id } = useParams<{ id: string }>();
  const { data: set, isLoading } = useSet(id ?? '');

  if (isLoading) {
    return (
      <div className="flex items-center justify-center min-h-[60vh]">
        <Spinner size="lg" />
      </div>
    );
  }

  if (!set) {
    return (
      <div className="text-center py-16 text-white">
        <p className="text-gray-400">Set not found</p>
        <Link
          to="/app/sets"
          className="text-grailiq-purple-light text-sm mt-2 inline-block hover:underline"
        >
          Back to Sets
        </Link>
      </div>
    );
  }

  return (
    <div className="text-white">
      {/* Back link */}
      <Link
        to="/app/sets"
        className="inline-flex items-center gap-1.5 text-sm text-gray-400 hover:text-white transition-colors mb-5"
      >
        <ArrowLeft className="h-4 w-4" />
        Back to all sets
      </Link>

      {/* Hero */}
      <div className="relative overflow-hidden rounded-3xl border border-white/5 bg-grailiq-dark p-6 sm:p-8 mb-6">
        <div className="absolute inset-0 bg-gradient-to-br from-grailiq-purple/25 via-fuchsia-600/10 to-transparent" />
        <div className="absolute top-0 right-0 h-56 w-56 rounded-full bg-grailiq-purple/15 blur-3xl" />

        <div className="relative flex flex-col sm:flex-row sm:items-start sm:justify-between gap-4">
          <div className="min-w-0">
            <p className="text-[10px] font-bold uppercase tracking-wider text-grailiq-purple-light mb-1">
              {set.code} · {set.series}
            </p>
            <h1 className="text-3xl sm:text-4xl font-bold leading-tight">{set.name}</h1>
          </div>
          {set.isOutOfPrint ? (
            <span className="inline-flex shrink-0 items-center gap-1 text-[10px] font-bold uppercase tracking-wider px-3 py-1.5 rounded-full bg-amber-500/15 text-amber-400 border border-amber-400/30">
              <Sparkles className="h-3 w-3" />
              Out of Print
            </span>
          ) : (
            <span className="inline-flex shrink-0 items-center gap-1 text-[10px] font-bold uppercase tracking-wider px-3 py-1.5 rounded-full bg-emerald-500/15 text-emerald-400 border border-emerald-400/30">
              <Sparkles className="h-3 w-3" />
              In Print
            </span>
          )}
        </div>

        <div className="relative flex flex-wrap items-center gap-5 text-sm text-gray-300 mt-5">
          <span className="inline-flex items-center gap-2">
            <Calendar className="h-4 w-4 text-gray-500" />
            Released {formatDate(set.releaseDate)}
          </span>
          {set.totalCards && (
            <span className="inline-flex items-center gap-2">
              <Layers className="h-4 w-4 text-gray-500" />
              {set.totalCards} cards
            </span>
          )}
          <span className="inline-flex items-center gap-2">
            <Package className="h-4 w-4 text-gray-500" />
            {set.products?.length ?? 0} sealed products
          </span>
        </div>
      </div>

      {/* Products list */}
      <div className="rounded-2xl border border-white/5 bg-grailiq-dark overflow-hidden">
        <div className="flex items-center justify-between px-5 py-4 border-b border-white/5 gap-2">
          <div className="flex items-center gap-2 min-w-0">
            <Package className="h-4 w-4 text-grailiq-purple-light flex-shrink-0" />
            <h2 className="font-bold text-white truncate">Sealed Products</h2>
            <span className="text-xs text-gray-500 uppercase tracking-wider hidden sm:inline">
              {set.products?.length ?? 0} items
            </span>
          </div>
          {(set.products?.length ?? 0) >= 2 && (
            <Link
              to={`/app/compare?ids=${(set.products ?? [])
                .slice(0, 3)
                .map((p) => p.id)
                .join(',')}`}
              className="inline-flex items-center gap-1.5 rounded-lg border border-grailiq-gold/30 bg-grailiq-gold/5 px-3 py-1.5 text-xs font-semibold text-grailiq-gold-light hover:bg-grailiq-gold/15 transition-all flex-shrink-0"
            >
              <Scale className="h-3.5 w-3.5" />
              Compare
            </Link>
          )}
        </div>

        {set.products && set.products.length > 0 ? (
          <div className="divide-y divide-white/5">
            {set.products.map((product) => {
              const bias = signalToBias(product.investmentSignal);
              const color = signalToColor(product.investmentSignal);
              const points = generateTrend(product.id, bias, 14);
              const signal = product.investmentSignal;

              return (
                <Link
                  key={product.id}
                  to={`/app/products/${product.id}`}
                  className="group flex items-center gap-4 px-5 py-3.5 hover:bg-white/[0.02] transition-colors"
                >
                  <div className="h-11 w-11 rounded-xl bg-gradient-to-br from-grailiq-purple/30 to-grailiq-dark border border-grailiq-purple/20 flex items-center justify-center text-[10px] font-bold text-grailiq-purple-light flex-shrink-0">
                    {typeAbbreviation(product.type)}
                  </div>

                  <div className="flex-1 min-w-0">
                    <p className="text-sm font-semibold text-white group-hover:text-grailiq-purple-light transition-colors truncate">
                      {product.name}
                    </p>
                    <p className="text-[11px] text-gray-500 mt-0.5 uppercase tracking-wider">
                      {typeLabels[product.type] || product.type}
                    </p>
                  </div>

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

                  <div className="text-right flex-shrink-0">
                    <p className="text-[10px] text-gray-500 uppercase tracking-wider">MSRP</p>
                    <p className="text-sm font-bold text-white tabular-nums">
                      {formatPrice(product.msrp)}
                    </p>
                  </div>

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

                  <ChevronRight className="h-4 w-4 text-gray-600 group-hover:text-grailiq-purple-light transition-colors flex-shrink-0" />
                </Link>
              );
            })}
          </div>
        ) : (
          <div className="flex flex-col items-center justify-center py-16 text-center px-6">
            <div className="h-14 w-14 rounded-2xl bg-grailiq-purple/10 border border-grailiq-purple/20 flex items-center justify-center mb-3">
              <Package className="h-6 w-6 text-grailiq-purple-light" />
            </div>
            <p className="text-white font-semibold">No products tracked yet</p>
            <p className="text-sm text-gray-400 mt-1 max-w-sm">
              Products populate as the catalog syncs. If this is a pre-release set, check back
              closer to the release date.
            </p>
          </div>
        )}
      </div>
    </div>
  );
}
