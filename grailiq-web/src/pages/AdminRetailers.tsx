import { useState } from 'react';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { api } from '@/lib/api';
import { Spinner } from '@/components/ui/Spinner';
import {
  Link as LinkIcon,
  Package,
  Check,
  X,
  Trash2,
  Radio,
  AlertCircle,
  Plus,
  Save,
} from 'lucide-react';

interface Mapping {
  id: string;
  productId: string;
  productName: string;
  retailer: 'pokemon_center' | 'target' | 'best_buy' | 'walmart' | 'amazon';
  url: string;
  sku: string | null;
  isEnabled: boolean;
  lastInStock: boolean;
  lastCheckedAt: string | null;
  lastPrice: string | null;
  lastError: string | null;
}

interface MappingList {
  data: Mapping[];
  total: number;
  limit: number;
  offset: number;
}

export default function AdminRetailers() {
  const qc = useQueryClient();
  const { data, isLoading } = useQuery<MappingList>({
    queryKey: ['admin-retailer-mappings'],
    queryFn: async () => {
      const { data } = await api.get('/admin/retailer-mappings?limit=200');
      return data;
    },
  });

  const patch = useMutation({
    mutationFn: async ({ id, body }: { id: string; body: Partial<Mapping> }) => {
      const { data } = await api.patch(`/admin/retailer-mappings/${id}`, body);
      return data.data;
    },
    onSuccess: () => qc.invalidateQueries({ queryKey: ['admin-retailer-mappings'] }),
  });

  const remove = useMutation({
    mutationFn: async (id: string) => {
      await api.delete(`/admin/retailer-mappings/${id}`);
    },
    onSuccess: () => qc.invalidateQueries({ queryKey: ['admin-retailer-mappings'] }),
  });

  const [filter, setFilter] = useState<'all' | 'pokemon_center' | 'target' | 'best_buy' | 'walmart' | 'amazon'>('all');
  const [showAdd, setShowAdd] = useState(false);

  if (isLoading) {
    return (
      <div className="flex items-center justify-center min-h-[60vh]">
        <Spinner size="lg" />
      </div>
    );
  }

  const rows = (data?.data ?? []).filter((m) => filter === 'all' || m.retailer === filter);
  const byRetailer = (data?.data ?? []).reduce<Record<string, number>>((acc, m) => {
    acc[m.retailer] = (acc[m.retailer] ?? 0) + 1;
    return acc;
  }, {});

  return (
    <div className="text-white">
      {/* Hero */}
      <div className="relative overflow-hidden rounded-3xl border border-white/5 bg-grailiq-dark p-6 mb-6">
        <div className="absolute inset-0 bg-gradient-to-br from-grailiq-purple/20 via-transparent to-transparent" />
        <div className="relative flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
          <div>
            <p className="text-[10px] font-bold uppercase tracking-wider text-grailiq-purple-light mb-1">
              Admin
            </p>
            <h1 className="text-3xl font-bold">Retailer Mappings</h1>
            <p className="text-sm text-gray-400 mt-1">
              {data?.total ?? 0} mappings · {Object.entries(byRetailer).map(([r, n]) => `${n} ${r.replace('_', ' ')}`).join(' · ') || 'none yet'}
            </p>
          </div>
          <button
            onClick={() => setShowAdd(true)}
            className="inline-flex items-center gap-2 rounded-xl bg-gradient-to-r from-grailiq-purple to-grailiq-purple-light px-4 py-2.5 text-sm font-semibold text-white shadow-lg shadow-grailiq-purple/30"
          >
            <Plus className="h-4 w-4" />
            Add mapping
          </button>
        </div>
      </div>

      {/* Retailer filter */}
      <div className="flex flex-wrap gap-2 mb-4">
        {['all', 'pokemon_center', 'target', 'best_buy', 'walmart', 'amazon'].map((r) => (
          <button
            key={r}
            onClick={() => setFilter(r as typeof filter)}
            className={`rounded-full border px-3 py-1.5 text-xs font-semibold transition-all ${
              filter === r
                ? 'border-grailiq-purple/40 bg-grailiq-purple/15 text-grailiq-purple-light'
                : 'border-white/10 bg-white/[0.02] text-gray-400 hover:border-white/25 hover:text-white'
            }`}
          >
            {r === 'all' ? `All (${data?.data.length ?? 0})` : `${r.replace('_', ' ')} (${byRetailer[r] ?? 0})`}
          </button>
        ))}
      </div>

      {/* List */}
      {rows.length === 0 ? (
        <EmptyState />
      ) : (
        <div className="rounded-2xl border border-white/5 bg-grailiq-dark overflow-hidden">
          <div className="divide-y divide-white/5">
            {rows.map((m) => (
              <MappingRow
                key={m.id}
                mapping={m}
                onToggle={() => patch.mutate({ id: m.id, body: { isEnabled: !m.isEnabled } })}
                onDelete={() => {
                  if (confirm(`Delete mapping for ${m.productName} @ ${m.retailer}?`)) {
                    remove.mutate(m.id);
                  }
                }}
                onEdit={(body) => patch.mutate({ id: m.id, body })}
              />
            ))}
          </div>
        </div>
      )}

      {showAdd && <AddMappingModal onClose={() => setShowAdd(false)} />}
    </div>
  );
}

function MappingRow({
  mapping,
  onToggle,
  onDelete,
  onEdit,
}: {
  mapping: Mapping;
  onToggle: () => void;
  onDelete: () => void;
  onEdit: (body: Partial<Mapping>) => void;
}) {
  const [editing, setEditing] = useState(false);
  const [url, setUrl] = useState(mapping.url);
  const [sku, setSku] = useState(mapping.sku ?? '');

  const stockColor = mapping.lastError
    ? 'text-rose-400'
    : mapping.lastInStock
    ? 'text-emerald-400'
    : 'text-gray-500';

  const lastChecked = mapping.lastCheckedAt
    ? new Date(mapping.lastCheckedAt).toLocaleString()
    : 'never';

  return (
    <div className="px-5 py-4">
      <div className="flex items-start gap-4">
        <div className="flex-1 min-w-0">
          <p className="text-sm font-semibold text-white truncate">{mapping.productName}</p>
          <div className="mt-1 flex items-center gap-2 flex-wrap">
            <span className="text-[10px] font-bold uppercase tracking-wider text-grailiq-purple-light">
              {mapping.retailer.replace('_', ' ')}
            </span>
            {mapping.sku && (
              <span className="text-[10px] font-mono text-gray-500">SKU: {mapping.sku}</span>
            )}
            <span className={`inline-flex items-center gap-1 text-[10px] font-semibold ${stockColor}`}>
              {mapping.lastError ? (
                <>
                  <AlertCircle className="h-3 w-3" />
                  {mapping.lastError}
                </>
              ) : mapping.lastInStock ? (
                <>
                  <Check className="h-3 w-3" />
                  in stock
                </>
              ) : (
                <>
                  <Radio className="h-3 w-3" />
                  out of stock
                </>
              )}
            </span>
            <span className="text-[10px] text-gray-600">checked {lastChecked}</span>
          </div>
          {!editing ? (
            <a
              href={mapping.url}
              target="_blank"
              rel="noreferrer"
              className="mt-2 block text-xs text-gray-400 hover:text-white truncate font-mono"
            >
              <LinkIcon className="inline h-3 w-3 mr-1" />
              {mapping.url}
            </a>
          ) : (
            <div className="mt-2 space-y-2">
              <input
                value={url}
                onChange={(e) => setUrl(e.target.value)}
                className="w-full rounded-lg border border-white/10 bg-white/[0.03] px-3 py-2 text-xs text-white font-mono focus:border-grailiq-purple/50 focus:outline-none"
              />
              <input
                value={sku}
                onChange={(e) => setSku(e.target.value)}
                placeholder="SKU (optional)"
                className="w-full rounded-lg border border-white/10 bg-white/[0.03] px-3 py-2 text-xs text-white font-mono focus:border-grailiq-purple/50 focus:outline-none"
              />
              <div className="flex gap-2">
                <button
                  onClick={() => {
                    onEdit({ url, sku: sku || null });
                    setEditing(false);
                  }}
                  className="inline-flex items-center gap-1 rounded-lg bg-grailiq-purple px-3 py-1.5 text-xs font-semibold text-white"
                >
                  <Save className="h-3 w-3" />
                  Save
                </button>
                <button
                  onClick={() => {
                    setUrl(mapping.url);
                    setSku(mapping.sku ?? '');
                    setEditing(false);
                  }}
                  className="inline-flex items-center gap-1 rounded-lg border border-white/10 bg-white/[0.03] px-3 py-1.5 text-xs font-semibold text-gray-300"
                >
                  Cancel
                </button>
              </div>
            </div>
          )}
        </div>

        <div className="flex items-center gap-2 flex-shrink-0">
          {!editing && (
            <>
              <button
                onClick={onToggle}
                className={`rounded-full px-3 py-1 text-[10px] font-bold uppercase tracking-wider border transition-all ${
                  mapping.isEnabled
                    ? 'border-emerald-400/30 bg-emerald-500/15 text-emerald-400'
                    : 'border-white/10 bg-white/5 text-gray-400'
                }`}
              >
                {mapping.isEnabled ? 'Enabled' : 'Disabled'}
              </button>
              <button
                onClick={() => setEditing(true)}
                className="p-1.5 rounded-lg text-gray-400 hover:text-white hover:bg-white/5"
                aria-label="Edit"
              >
                <LinkIcon className="h-4 w-4" />
              </button>
              <button
                onClick={onDelete}
                className="p-1.5 rounded-lg text-gray-500 hover:text-rose-400 hover:bg-rose-500/10"
                aria-label="Delete"
              >
                <Trash2 className="h-4 w-4" />
              </button>
            </>
          )}
        </div>
      </div>
    </div>
  );
}

function EmptyState() {
  return (
    <div className="rounded-2xl border border-white/5 bg-grailiq-dark p-10 text-center">
      <div className="inline-flex h-14 w-14 items-center justify-center rounded-2xl border border-grailiq-purple/30 bg-grailiq-purple/10 text-grailiq-purple-light mb-4">
        <Package className="h-6 w-6" />
      </div>
      <p className="text-white font-bold">No retailer mappings yet</p>
      <p className="text-sm text-gray-400 mt-1 max-w-md mx-auto">
        Without mappings, the restock worker has nothing to check. Add Pokémon Center URLs, Target
        TCINs, or Best Buy SKUs so alerts can fire when inventory lands.
      </p>
    </div>
  );
}

function AddMappingModal({ onClose }: { onClose: () => void }) {
  const qc = useQueryClient();
  const [productId, setProductId] = useState('');
  const [retailer, setRetailer] = useState<Mapping['retailer']>('pokemon_center');
  const [url, setUrl] = useState('');
  const [sku, setSku] = useState('');
  const [error, setError] = useState<string | null>(null);
  const [loading, setLoading] = useState(false);

  const submit = async () => {
    setError(null);
    setLoading(true);
    try {
      await api.post('/admin/retailer-mappings', {
        mappings: [{ productId, retailer, url, sku: sku || null }],
      });
      qc.invalidateQueries({ queryKey: ['admin-retailer-mappings'] });
      onClose();
    } catch (err: any) {
      setError(err?.response?.data?.error ?? err?.message ?? 'Failed to add');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div
      className="fixed inset-0 z-50 bg-black/60 backdrop-blur-sm flex items-start justify-center p-4 pt-20"
      onClick={onClose}
    >
      <div
        className="w-full max-w-lg rounded-2xl border border-white/10 bg-grailiq-dark p-6"
        onClick={(e) => e.stopPropagation()}
      >
        <h2 className="text-xl font-bold mb-4">Add retailer mapping</h2>
        <div className="space-y-3">
          <Field label="Product ID (UUID)">
            <input
              value={productId}
              onChange={(e) => setProductId(e.target.value)}
              placeholder="f336d0bc-b841-465b-8045-024475c079dd"
              className="w-full rounded-xl border border-white/10 bg-white/[0.03] px-3 py-2 text-sm font-mono text-white focus:border-grailiq-purple/50 focus:outline-none"
            />
          </Field>
          <Field label="Retailer">
            <select
              value={retailer}
              onChange={(e) => setRetailer(e.target.value as Mapping['retailer'])}
              className="w-full rounded-xl border border-white/10 bg-white/[0.03] px-3 py-2 text-sm text-white focus:border-grailiq-purple/50 focus:outline-none"
            >
              <option value="pokemon_center">Pokémon Center</option>
              <option value="target">Target</option>
              <option value="best_buy">Best Buy</option>
              <option value="walmart">Walmart</option>
              <option value="amazon">Amazon</option>
            </select>
          </Field>
          <Field label="URL">
            <input
              value={url}
              onChange={(e) => setUrl(e.target.value)}
              placeholder="https://www.pokemoncenter.com/product/..."
              className="w-full rounded-xl border border-white/10 bg-white/[0.03] px-3 py-2 text-sm font-mono text-white focus:border-grailiq-purple/50 focus:outline-none"
            />
          </Field>
          <Field label="SKU / TCIN / ASIN (optional)">
            <input
              value={sku}
              onChange={(e) => setSku(e.target.value)}
              placeholder="Target needs TCIN, Best Buy needs SKU"
              className="w-full rounded-xl border border-white/10 bg-white/[0.03] px-3 py-2 text-sm font-mono text-white focus:border-grailiq-purple/50 focus:outline-none"
            />
          </Field>

          {error && (
            <div className="rounded-xl border border-rose-400/30 bg-rose-500/10 p-3 text-xs text-rose-300">
              {error}
            </div>
          )}

          <div className="flex gap-2 mt-4">
            <button
              onClick={submit}
              disabled={loading || !productId || !url}
              className="flex-1 rounded-xl bg-gradient-to-r from-grailiq-purple to-grailiq-purple-light py-2.5 text-sm font-semibold text-white shadow-lg shadow-grailiq-purple/30 disabled:opacity-50"
            >
              {loading ? 'Adding…' : 'Add mapping'}
            </button>
            <button
              onClick={onClose}
              className="rounded-xl border border-white/15 bg-white/[0.03] px-4 py-2.5 text-sm font-semibold text-gray-300"
            >
              <X className="h-4 w-4" />
            </button>
          </div>
        </div>
      </div>
    </div>
  );
}

function Field({ label, children }: { label: string; children: React.ReactNode }) {
  return (
    <label className="block">
      <span className="text-[10px] font-bold uppercase tracking-wider text-gray-400 mb-1.5 block">
        {label}
      </span>
      {children}
    </label>
  );
}
