import { useState, useMemo } from 'react';
import { Link } from 'react-router-dom';
import { useSets } from '@/hooks/useSets';
import { Spinner } from '@/components/ui/Spinner';
import { formatDate } from '@/lib/utils';
import { Search, Package, Calendar, Layers, Filter, ChevronRight } from 'lucide-react';

const seriesColors: Record<string, string> = {
  'Scarlet & Violet': 'from-violet-600/30 to-fuchsia-600/20',
  'Sword & Shield': 'from-cyan-600/30 to-blue-600/20',
};

const seriesBadge: Record<string, string> = {
  'Scarlet & Violet': 'bg-violet-500/20 text-violet-300 border-violet-500/30',
  'Sword & Shield': 'bg-cyan-500/20 text-cyan-300 border-cyan-500/30',
};

/** Sets encyclopedia listing page */
export default function Sets() {
  const { data: sets, isLoading } = useSets();
  const [search, setSearch] = useState('');
  const [seriesFilter, setSeries] = useState<string>('all');

  // Product count per set (now from API via productCount field)
  const productCounts = useMemo(() => {
    if (!sets) return {};
    const counts: Record<string, number> = {};
    sets.forEach((s) => {
      counts[s.id] = s.productCount || 0;
    });
    return counts;
  }, [sets]);

  // Unique series for filter
  const allSeries = useMemo(() => {
    if (!sets) return [];
    return [...new Set(sets.map((s) => s.series))];
  }, [sets]);

  // Filtered and sorted sets
  const filtered = useMemo(() => {
    if (!sets) return [];
    return sets
      .filter((s) => {
        const matchesSearch =
          s.name.toLowerCase().includes(search.toLowerCase()) ||
          s.code.toLowerCase().includes(search.toLowerCase());
        const matchesSeries = seriesFilter === 'all' || s.series === seriesFilter;
        return matchesSearch && matchesSeries;
      })
      .sort((a, b) => {
        if (!a.releaseDate || !b.releaseDate) return 0;
        return new Date(b.releaseDate).getTime() - new Date(a.releaseDate).getTime();
      });
  }, [sets, search, seriesFilter]);

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
      <div className="mb-8">
        <h1 className="text-3xl font-display font-bold text-white">
          Set Encyclopedia
        </h1>
        <p className="text-gray-500 mt-1">
          Browse {sets?.length ?? 0} Pokemon TCG expansions — sorted newest first
        </p>
      </div>

      {/* Search + Filters */}
      <div className="flex flex-col sm:flex-row gap-3 mb-8">
        <div className="relative flex-1 max-w-md">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-gray-400" />
          <input
            type="text"
            placeholder="Search sets by name or code..."
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            className="w-full pl-10 pr-4 py-2.5 bg-white border border-gray-200 rounded-xl text-sm focus:outline-none focus:ring-2 focus:ring-grailiq-purple/30 focus:border-grailiq-purple transition-all"
          />
        </div>
        <div className="relative">
          <Filter className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-gray-400" />
          <select
            value={seriesFilter}
            onChange={(e) => setSeries(e.target.value)}
            className="pl-10 pr-8 py-2.5 bg-white border border-gray-200 rounded-xl text-sm appearance-none focus:outline-none focus:ring-2 focus:ring-grailiq-purple/30 focus:border-grailiq-purple cursor-pointer"
          >
            <option value="all">All Series</option>
            {allSeries.map((s) => (
              <option key={s} value={s}>{s}</option>
            ))}
          </select>
        </div>
      </div>

      {/* Results count */}
      {search || seriesFilter !== 'all' ? (
        <p className="text-sm text-gray-400 mb-4">
          Showing {filtered.length} of {sets?.length ?? 0} sets
        </p>
      ) : null}

      {/* Sets Grid */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-5">
        {filtered.map((set) => {
          const gradient = seriesColors[set.series] || 'from-gray-600/30 to-gray-500/20';
          const badge = seriesBadge[set.series] || 'bg-gray-500/20 text-gray-300 border-gray-500/30';
          const count = productCounts[set.id] || 0;

          return (
            <Link
              key={set.id}
              to={`/app/sets/${set.id}`}
              className="group relative overflow-hidden rounded-2xl bg-grailiq-dark border border-white/5 hover:border-grailiq-purple/40 transition-all duration-300 hover:shadow-lg hover:shadow-grailiq-purple/10"
            >
              {/* Gradient Background */}
              <div className={`absolute inset-0 bg-gradient-to-br ${gradient} opacity-60 group-hover:opacity-80 transition-opacity`} />

              {/* Content */}
              <div className="relative p-5">
                {/* Top Row: Series Badge + OOP Tag */}
                <div className="flex items-center justify-between mb-4">
                  <span className={`text-[11px] font-semibold uppercase tracking-wider px-2.5 py-1 rounded-full border ${badge}`}>
                    {set.series}
                  </span>
                  {set.isOutOfPrint && (
                    <span className="text-[11px] font-semibold uppercase tracking-wider px-2.5 py-1 rounded-full bg-amber-500/20 text-amber-300 border border-amber-500/30">
                      Out of Print
                    </span>
                  )}
                </div>

                {/* Set Code + Name */}
                <p className="text-xs font-mono text-gray-400 mb-1">{set.code}</p>
                <h3 className="text-lg font-bold text-white group-hover:text-grailiq-purple-light transition-colors leading-tight mb-4">
                  {set.name}
                </h3>

                {/* Meta Row */}
                <div className="flex items-center gap-4 text-xs text-gray-400">
                  <span className="flex items-center gap-1.5">
                    <Calendar className="h-3.5 w-3.5" />
                    {formatDate(set.releaseDate)}
                  </span>
                  {set.totalCards && (
                    <span className="flex items-center gap-1.5">
                      <Layers className="h-3.5 w-3.5" />
                      {set.totalCards} cards
                    </span>
                  )}
                  <span className="flex items-center gap-1.5">
                    <Package className="h-3.5 w-3.5" />
                    {count} product{count !== 1 ? 's' : ''}
                  </span>
                </div>

                {/* Hover Arrow */}
                <div className="absolute bottom-5 right-5 opacity-0 group-hover:opacity-100 transition-opacity">
                  <ChevronRight className="h-5 w-5 text-grailiq-purple-light" />
                </div>
              </div>
            </Link>
          );
        })}
      </div>

      {/* Empty State */}
      {filtered.length === 0 && !isLoading && (
        <div className="text-center py-16">
          <Package className="h-12 w-12 text-gray-300 mx-auto mb-3" />
          <p className="text-gray-500 font-medium">No sets match your search</p>
          <p className="text-sm text-gray-400 mt-1">Try a different search term or filter</p>
        </div>
      )}
    </div>
  );
}
