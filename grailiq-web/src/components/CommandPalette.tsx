import { useState, useEffect, useMemo } from 'react';
import { useNavigate } from 'react-router-dom';
import { Search, Package, Layers, ArrowRight } from 'lucide-react';
import { formatPrice } from '@/lib/utils';
import axios from 'axios';

interface Product {
  id: string;
  name: string;
  setName?: string;
  grailiqScore?: string;
  msrp?: string;
}

interface SearchResult {
  type: 'product' | 'set';
  id: string;
  name: string;
  setName?: string;
  score?: string;
  price?: string;
}

export function CommandPalette() {
  const navigate = useNavigate();
  const [open, setOpen] = useState(false);
  const [search, setSearch] = useState('');
  const [results, setResults] = useState<SearchResult[]>([]);
  const [selectedIdx, setSelectedIdx] = useState(0);
  const [loading, setLoading] = useState(false);

  // Debounced search
  useEffect(() => {
    if (!search.trim()) {
      setResults([]);
      return;
    }

    setLoading(true);
    const timer = setTimeout(async () => {
      try {
        const { data } = await axios.get('/api/v1/products', {
          params: { q: search, limit: 20 },
        });
        const formatted = data.data?.map((p: Product) => ({
          type: 'product' as const,
          id: p.id,
          name: p.name,
          setName: p.setName,
          score: p.grailiqScore,
          price: p.msrp,
        })) ?? [];
        setResults(formatted);
        setSelectedIdx(0);
      } catch (err) {
        console.error('Search failed:', err);
      } finally {
        setLoading(false);
      }
    }, 200);

    return () => clearTimeout(timer);
  }, [search]);

  // Keyboard shortcuts
  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      if ((e.metaKey || e.ctrlKey) && e.key === 'k') {
        e.preventDefault();
        setOpen(!open);
        setSearch('');
      }

      if (!open) return;

      if (e.key === 'Escape') {
        setOpen(false);
      } else if (e.key === 'ArrowDown') {
        e.preventDefault();
        setSelectedIdx((i) => Math.min(i + 1, results.length - 1));
      } else if (e.key === 'ArrowUp') {
        e.preventDefault();
        setSelectedIdx((i) => Math.max(i - 1, 0));
      } else if (e.key === 'Enter') {
        e.preventDefault();
        if (results[selectedIdx]) {
          handleSelect(results[selectedIdx]);
        }
      }
    };

    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, [open, results, selectedIdx]);

  const handleSelect = (result: SearchResult) => {
    if (result.type === 'product') {
      navigate(`/app/products/${result.id}`);
    }
    setOpen(false);
    setSearch('');
  };

  const groupedResults = useMemo(() => {
    const products = results.filter((r) => r.type === 'product');
    const sets = results.filter((r) => r.type === 'set');
    return { products, sets };
  }, [results]);

  if (!open) return null;

  return (
    <>
      {/* Backdrop */}
      <div
        className="fixed inset-0 bg-black/50 backdrop-blur-sm z-50"
        onClick={() => setOpen(false)}
      />

      {/* Modal */}
      <div className="fixed inset-0 z-50 flex items-start justify-center pt-24 pointer-events-none">
        <div className="w-full max-w-2xl pointer-events-auto">
          <div className="rounded-2xl border border-white/10 bg-grailiq-dark shadow-2xl overflow-hidden">
            {/* Search input */}
            <div className="flex items-center gap-3 px-4 py-3 border-b border-white/5">
              <Search className="h-5 w-5 text-gray-500" />
              <input
                autoFocus
                type="text"
                placeholder="Search products and sets... (⌘K)"
                value={search}
                onChange={(e) => setSearch(e.target.value)}
                className="flex-1 bg-transparent text-white placeholder-gray-500 outline-none text-lg"
              />
            </div>

            {/* Results */}
            <div className="max-h-96 overflow-y-auto">
              {loading && (
                <div className="px-4 py-8 text-center text-gray-400">
                  <div className="inline-block h-4 w-4 animate-spin rounded-full border-2 border-gray-600 border-r-transparent" />
                </div>
              )}

              {!loading && results.length === 0 && search && (
                <div className="px-4 py-8 text-center text-gray-400">
                  No results for "{search}"
                </div>
              )}

              {!loading && results.length === 0 && !search && (
                <div className="px-4 py-8 text-center text-gray-500">
                  Type to search products
                </div>
              )}

              {/* Products section */}
              {!loading && groupedResults.products.length > 0 && (
                <>
                  <div className="px-4 py-2 text-xs font-semibold uppercase text-gray-500 border-t border-white/5">
                    Products
                  </div>
                  {groupedResults.products.map((product, idx) => (
                    <button
                      key={product.id}
                      onClick={() => handleSelect(product)}
                      className={`w-full px-4 py-3 flex items-center justify-between text-left transition-colors border-b border-white/5 ${
                        selectedIdx === idx
                          ? 'bg-grailiq-purple/20 text-white'
                          : 'hover:bg-white/5 text-gray-300'
                      }`}
                    >
                      <div className="flex items-center gap-3 flex-1 min-w-0">
                        <Package className="h-4 w-4 flex-shrink-0 text-gray-500" />
                        <div className="min-w-0">
                          <p className="font-medium truncate">{product.name}</p>
                          <p className="text-xs text-gray-500 truncate">
                            {product.setName || 'Unknown set'}
                          </p>
                        </div>
                      </div>
                      <div className="flex items-center gap-3 flex-shrink-0 ml-2">
                        {product.score && (
                          <span className="inline-flex items-center rounded-full bg-grailiq-purple/30 px-2 py-1 text-xs font-semibold text-grailiq-purple-light">
                            Score {product.score}
                          </span>
                        )}
                        {product.price && (
                          <span className="text-sm font-medium whitespace-nowrap">
                            {formatPrice(parseFloat(product.price))}
                          </span>
                        )}
                      </div>
                    </button>
                  ))}
                </>
              )}

              {/* Sets section */}
              {!loading && groupedResults.sets.length > 0 && (
                <>
                  <div className="px-4 py-2 text-xs font-semibold uppercase text-gray-500 border-t border-white/5">
                    Sets
                  </div>
                  {groupedResults.sets.map((set) => (
                    <button
                      key={set.id}
                      onClick={() => handleSelect(set)}
                      className="w-full px-4 py-3 flex items-center gap-3 text-left hover:bg-white/5 transition-colors text-gray-300 border-b border-white/5"
                    >
                      <Layers className="h-4 w-4 flex-shrink-0 text-gray-500" />
                      <p className="font-medium flex-1">{set.name}</p>
                      <ArrowRight className="h-4 w-4 text-gray-600" />
                    </button>
                  ))}
                </>
              )}
            </div>

            {/* Footer hint */}
            {results.length > 0 && (
              <div className="px-4 py-3 border-t border-white/5 flex items-center justify-between text-xs text-gray-500">
                <span>
                  {results.length} result{results.length !== 1 ? 's' : ''}
                </span>
                <div className="flex items-center gap-2">
                  <kbd className="rounded bg-white/5 px-2 py-1">↑↓</kbd>
                  <kbd className="rounded bg-white/5 px-2 py-1">↵</kbd>
                </div>
              </div>
            )}
          </div>
        </div>
      </div>
    </>
  );
}
