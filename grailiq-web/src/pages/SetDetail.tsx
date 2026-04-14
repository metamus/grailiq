import { useParams, Link } from 'react-router-dom';
import { useSet } from '@/hooks/useSets';
import { Spinner } from '@/components/ui/Spinner';
import { formatDate, formatPrice } from '@/lib/utils';
import { ArrowLeft, Calendar, Layers, Package, TrendingUp, ChevronRight } from 'lucide-react';

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

/** Set detail page with products listing */
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
      <div className="text-center py-16">
        <p className="text-gray-500">Set not found</p>
        <Link to="/sets" className="text-grailiq-purple text-sm mt-2 inline-block hover:underline">
          Back to Sets
        </Link>
      </div>
    );
  }

  return (
    <div>
      {/* Back Link */}
      <Link
        to="/sets"
        className="inline-flex items-center gap-1.5 text-sm text-gray-400 hover:text-grailiq-purple transition-colors mb-6"
      >
        <ArrowLeft className="h-4 w-4" />
        Back to Sets
      </Link>

      {/* Set Header */}
      <div className="relative overflow-hidden rounded-2xl bg-grailiq-dark border border-white/5 p-6 mb-8">
        <div className="absolute inset-0 bg-gradient-to-br from-violet-600/20 to-fuchsia-600/10" />
        <div className="relative">
          <div className="flex items-start justify-between mb-4">
            <div>
              <p className="text-xs font-mono text-gray-400 mb-1">{set.code} · {set.series}</p>
              <h1 className="text-3xl font-bold text-white">{set.name}</h1>
            </div>
            {set.isOutOfPrint && (
              <span className="text-[11px] font-semibold uppercase tracking-wider px-3 py-1.5 rounded-full bg-amber-500/20 text-amber-300 border border-amber-500/30">
                Out of Print
              </span>
            )}
          </div>

          <div className="flex flex-wrap items-center gap-5 text-sm text-gray-300 mt-4">
            <span className="flex items-center gap-2">
              <Calendar className="h-4 w-4 text-gray-400" />
              Released {formatDate(set.releaseDate)}
            </span>
            {set.totalCards && (
              <span className="flex items-center gap-2">
                <Layers className="h-4 w-4 text-gray-400" />
                {set.totalCards} cards
              </span>
            )}
            <span className="flex items-center gap-2">
              <Package className="h-4 w-4 text-gray-400" />
              {set.products?.length ?? 0} sealed products
            </span>
          </div>
        </div>
      </div>

      {/* Products */}
      <h2 className="text-lg font-bold text-gray-900 mb-4">Sealed Products</h2>

      <div className="space-y-3">
        {set.products?.map((product) => (
          <Link
            key={product.id}
            to={`/products/${product.id}`}
            className="group flex items-center gap-4 p-4 bg-white rounded-xl border border-gray-100 hover:border-grailiq-purple/30 hover:shadow-md hover:shadow-grailiq-purple/5 transition-all"
          >
            {/* Type Icon */}
            <div className="h-12 w-12 rounded-xl bg-grailiq-light flex items-center justify-center text-xl flex-shrink-0">
              {typeIcons[product.type] || '📋'}
            </div>

            {/* Info */}
            <div className="flex-1 min-w-0">
              <h3 className="font-semibold text-gray-900 group-hover:text-grailiq-purple transition-colors">
                {product.name}
              </h3>
              <p className="text-sm text-gray-500 mt-0.5">
                {typeLabels[product.type] || product.type}
              </p>
            </div>

            {/* MSRP */}
            <div className="text-right flex-shrink-0">
              <p className="text-xs text-gray-400 uppercase tracking-wide">MSRP</p>
              <p className="text-lg font-bold text-gray-900">{formatPrice(product.msrp)}</p>
            </div>

            {/* GrailIQ Score (if available) */}
            {product.grailiqScore && (
              <div className="text-right flex-shrink-0 hidden sm:block">
                <p className="text-xs text-gray-400 uppercase tracking-wide">Score</p>
                <div className="flex items-center gap-1">
                  <TrendingUp className="h-4 w-4 text-grailiq-purple" />
                  <p className="text-lg font-bold text-grailiq-purple">{product.grailiqScore}</p>
                </div>
              </div>
            )}

            {/* Arrow */}
            <ChevronRight className="h-5 w-5 text-gray-300 group-hover:text-grailiq-purple transition-colors flex-shrink-0" />
          </Link>
        ))}
      </div>

      {/* Empty */}
      {(!set.products || set.products.length === 0) && (
        <div className="text-center py-12 bg-gray-50 rounded-xl">
          <Package className="h-10 w-10 text-gray-300 mx-auto mb-2" />
          <p className="text-gray-500 text-sm">No products tracked for this set yet.</p>
        </div>
      )}
    </div>
  );
}
