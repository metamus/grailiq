import { useMemo, useState } from 'react';
import { Link, useSearchParams } from 'react-router-dom';
import { useProducts } from '@/hooks/useProducts';
import { Spinner } from '@/components/ui/Spinner';
import { Sparkline } from '@/components/charts/Sparkline';
import { generateTrend, signalToBias, signalToColor } from '@/lib/sparkData';
import { formatPrice } from '@/lib/utils';
import type { Product } from '@/types';
import {
  ArrowLeft,
  ChevronRight,
  Search,
  X,
  Sparkles,
  Scale,
  Trophy,
  Plus,
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

const signalBadge: Record<string, string> = {
  buy: 'bg-grailiq-gold/15 text-grailiq-gold-light border-grailiq-gold/30',
  hold: 'bg-amber-500/15 text-amber-400 border-amber-400/30',
  watch: 'bg-slate-500/20 text-slate-300 border-slate-400/30',
  avoid: 'bg-rose-500/15 text-rose-400 border-rose-400/30',
};

/**
 * Compare 2–3 products side by side. Product IDs are held in the URL
 * (?ids=a,b,c) so the view is shareable. Add/remove by clicking "+" /
 * typing in search; no server call needed — just the products list.
 */
export default function Compare() {
  const [searchParams, setSearchParams] = useSearchParams();
  const idsParam = searchParams.get('ids') ?? '';
  const selectedIds = idsParam.split(',').filter(Boolean).slice(0, 3);
  const { data: products, isLoading } = useProducts();
  const [showPicker, setShowPicker] = useState(false);
  const [query, setQuery] = useState('');

  const selected = useMemo(() => {
    if (!products) return [];
    return selectedIds
      .map((id) => products.find((p) => p.id === id))
      .filter((p): p is Product => !!p);
  }, [products, selectedIds]);

  function setIds(ids: string[]) {
    if (ids.length === 0) {
      setSearchParams({});
    } else {
      setSearchParams({ ids: ids.join(',') });
    }
  }

  function addProduct(id: string) {
    if (selected.some((p) => p.id === id) || selected.length >= 3) return;
    setIds([...selected.map((p) => p.id), id]);
    setShowPicker(false);
    setQuery('');
  }

  function removeProduct(id: string) {
    setIds(selected.filter((p) => p.id !== id).map((p) => p.id));
  }

  const filteredCandidates = useMemo(() => {
    if (!products) return [];
    const chosen = new Set(selected.map((p) => p.id));
    const q = query.trim().toLowerCase();
    return products
      .filter((p) => !chosen.has(p.id))
      .filter((p) => (q ? p.name.toLowerCase().includes(q) : true))
      .slice(0, 12);
  }, [products, selected, query]);

  // Best scorer for trophy crown
  const best = selected.reduce<Product | null>((acc, p) => {
    if (!p.grailiqScore) return acc;
    if (!acc || !acc.grailiqScore) return p;
    return parseFloat(p.grailiqScore) > parseFloat(acc.grailiqScore) ? p : acc;
  }, null);

  if (isLoading) {
    return (
      <div className="flex items-center justify-center min-h-[60vh]">
        <Spinner size="lg" />
      </div>
    );
  }

  return (
    <div className="text-white">
      <Link
        to="/app/sets"
        className="inline-flex items-center gap-1.5 text-sm text-gray-400 hover:text-white transition-colors mb-5"
      >
        <ArrowLeft className="h-4 w-4" />
        Back to sets
      </Link>

      {/* Hero */}
      <div className="relative overflow-hidden rounded-3xl border border-white/5 bg-grailiq-dark p-6 sm:p-8 mb-6">
        <div className="absolute inset-0 bg-gradient-to-br from-grailiq-gold/20 via-grailiq-purple/10 to-transparent" />
        <div className="relative">
          <div className="inline-flex items-center gap-2 mb-2 rounded-full border border-grailiq-gold/30 bg-grailiq-gold/5 px-3 py-1">
            <Scale className="h-3.5 w-3.5 text-grailiq-gold" />
            <span className="text-[11px] font-semibold uppercase tracking-wider text-grailiq-gold-light">
              Side-by-side compare
            </span>
          </div>
          <h1 className="text-3xl sm:text-4xl font-display font-bold">Compare products</h1>
          <p className="text-sm sm:text-base text-gray-400 mt-1">
            Pick up to 3 sealed products and see scores, prices, signals side-by-side. The URL is
            shareable.
          </p>
        </div>
      </div>

      {/* Columns */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
        {[0, 1, 2].map((slot) => {
          const product = selected[slot];
          if (!product) {
            return (
              <button
                key={slot}
                onClick={() => setShowPicker(true)}
                className="h-72 rounded-2xl border-2 border-dashed border-white/10 bg-white/[0.02] hover:border-grailiq-purple/40 hover:bg-grailiq-purple/5 flex flex-col items-center justify-center gap-2 transition-all"
              >
                <div className="h-12 w-12 rounded-2xl border border-white/10 bg-white/5 flex items-center justify-center">
                  <Plus className="h-5 w-5 text-gray-400" />
                </div>
                <p className="text-sm font-semibold text-gray-300">Add product</p>
                <p className="text-xs text-gray-500">Slot {slot + 1} of 3</p>
              </button>
            );
          }

          const bias = signalToBias(product.investmentSignal);
          const color = signalToColor(product.investmentSignal);
          const points = generateTrend(product.id, bias, 20);
          const isBest = best?.id === product.id && selected.length > 1;

          return (
            <div
              key={product.id}
              className={`relative rounded-2xl border p-5 bg-grailiq-dark transition-all ${
                isBest ? 'border-grailiq-gold/40 shadow-lg shadow-grailiq-gold/10' : 'border-white/5'
              }`}
            >
              {isBest && (
                <span className="absolute -top-2 left-4 rounded-full bg-grailiq-gold text-grailiq-ink text-[10px] font-bold uppercase tracking-wider px-2.5 py-0.5 inline-flex items-center gap-1">
                  <Trophy className="h-3 w-3" />
                  Highest score
                </span>
              )}

              <button
                onClick={() => removeProduct(product.id)}
                className="absolute top-3 right-3 p-1.5 rounded-lg text-gray-500 hover:text-rose-400 hover:bg-rose-500/10 transition-colors"
                aria-label="Remove"
              >
                <X className="h-4 w-4" />
              </button>

              <Link to={`/app/products/${product.id}`} className="block">
                <p className="text-[10px] font-semibold uppercase tracking-wider text-grailiq-purple-light mb-1">
                  {typeLabels[product.type] || product.type}
                </p>
                <h3 className="text-base font-bold text-white leading-tight pr-6 line-clamp-2 min-h-[2.5rem]">
                  {product.name}
                </h3>
              </Link>

              <div className="mt-4">
                <Sparkline points={points} color={color} width={220} height={40} />
              </div>

              <dl className="mt-4 space-y-2 text-sm">
                <Row label="Score" value={product.grailiqScore ?? '—'} highlight />
                <Row
                  label="Signal"
                  value={
                    product.investmentSignal ? (
                      <span
                        className={`inline-flex rounded-full border px-2 py-0.5 text-[9px] font-bold uppercase tracking-wider ${signalBadge[product.investmentSignal]}`}
                      >
                        {product.investmentSignal}
                      </span>
                    ) : (
                      <span className="text-gray-500">—</span>
                    )
                  }
                />
                <Row label="MSRP" value={formatPrice(product.msrp)} />
                <Row label="Set" value={product.setId.slice(0, 8)} />
              </dl>

              <Link
                to={`/app/products/${product.id}`}
                className="mt-4 inline-flex items-center gap-1.5 text-xs font-semibold text-grailiq-purple-light hover:text-white"
              >
                View detail <ChevronRight className="h-3.5 w-3.5" />
              </Link>
            </div>
          );
        })}
      </div>

      {selected.length === 0 && (
        <div className="mt-8 text-center">
          <Sparkles className="h-6 w-6 text-grailiq-gold-light mx-auto mb-2" />
          <p className="text-sm text-gray-400">
            Pick a couple of products to see how they stack up on score, signal, and price.
          </p>
        </div>
      )}

      {/* Picker modal */}
      {showPicker && (
        <div
          className="fixed inset-0 z-50 bg-black/60 backdrop-blur-sm flex items-start justify-center p-4 pt-20"
          onClick={() => setShowPicker(false)}
        >
          <div
            className="w-full max-w-lg rounded-2xl border border-white/10 bg-grailiq-dark shadow-2xl"
            onClick={(e) => e.stopPropagation()}
          >
            <div className="p-4 border-b border-white/5">
              <div className="relative">
                <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-gray-500" />
                <input
                  autoFocus
                  value={query}
                  onChange={(e) => setQuery(e.target.value)}
                  placeholder="Search products…"
                  className="w-full rounded-xl border border-white/10 bg-white/[0.03] pl-10 pr-3 py-2.5 text-sm text-white placeholder:text-gray-500 focus:border-grailiq-purple/50 focus:bg-white/[0.05] focus:outline-none"
                />
              </div>
            </div>
            <div className="max-h-80 overflow-y-auto divide-y divide-white/5">
              {filteredCandidates.map((p) => (
                <button
                  key={p.id}
                  onClick={() => addProduct(p.id)}
                  className="flex items-center gap-3 w-full px-4 py-3 hover:bg-white/[0.03] text-left"
                >
                  <div className="flex-1 min-w-0">
                    <p className="text-sm font-semibold text-white truncate">{p.name}</p>
                    <p className="text-[11px] text-gray-500 mt-0.5">
                      {typeLabels[p.type] || p.type} · MSRP {formatPrice(p.msrp)}
                    </p>
                  </div>
                  {p.grailiqScore && (
                    <span className="text-sm font-bold text-grailiq-purple-light tabular-nums">
                      {p.grailiqScore}
                    </span>
                  )}
                </button>
              ))}
              {filteredCandidates.length === 0 && (
                <p className="py-6 text-center text-sm text-gray-500">No matches</p>
              )}
            </div>
          </div>
        </div>
      )}
    </div>
  );
}

function Row({
  label,
  value,
  highlight,
}: {
  label: string;
  value: React.ReactNode;
  highlight?: boolean;
}) {
  return (
    <div className="flex items-center justify-between">
      <dt className="text-[10px] text-gray-500 uppercase tracking-wider font-semibold">
        {label}
      </dt>
      <dd
        className={`font-bold tabular-nums ${highlight ? 'text-grailiq-purple-light text-xl' : 'text-white'}`}
      >
        {value}
      </dd>
    </div>
  );
}
