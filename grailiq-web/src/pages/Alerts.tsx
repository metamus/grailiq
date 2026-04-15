import { Link } from 'react-router-dom';
import { Spinner } from '@/components/ui/Spinner';
import { Sparkline } from '@/components/charts/Sparkline';
import { useAlerts, useToggleAlert, useDeleteAlert } from '@/hooks/useAlerts';
import { formatPrice } from '@/lib/utils';
import { generateTrend, signalToBias, signalToColor } from '@/lib/sparkData';
import {
  Bell,
  BellRing,
  Zap,
  ChevronRight,
  ShoppingCart,
  Trash2,
  Radio,
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

const retailerLabels: Record<string, string> = {
  pokemon_center: 'Pokemon Center',
  amazon: 'Amazon',
  target: 'Target',
  walmart: 'Walmart',
  best_buy: 'Best Buy',
  all: 'All Retailers',
};

/** Restock alerts management — premium dark redesign */
export default function Alerts() {
  const { data: alerts, isLoading } = useAlerts();
  const toggleAlert = useToggleAlert();
  const deleteAlert = useDeleteAlert();

  if (isLoading) {
    return (
      <div className="flex items-center justify-center min-h-[60vh]">
        <Spinner size="lg" />
      </div>
    );
  }

  const items = alerts ?? [];
  const activeCount = items.filter((a) => a.isActive).length;

  return (
    <div>
      {/* Hero header */}
      <div className="relative overflow-hidden rounded-2xl bg-grailiq-dark border border-white/5 p-6 mb-6">
        <div className="absolute inset-0 bg-gradient-to-br from-amber-600/20 via-orange-600/10 to-transparent" />
        <div className="absolute top-0 right-0 w-48 h-48 bg-amber-500/10 rounded-full blur-3xl" />
        <div className="relative flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
          <div>
            <div className="flex items-center gap-2 mb-1">
              <Zap className="h-5 w-5 text-amber-400" />
              <span className="text-xs font-semibold uppercase tracking-wider text-amber-400">
                Instant Notifications
              </span>
            </div>
            <h1 className="text-2xl sm:text-3xl font-display font-bold text-white">Restock Alerts</h1>
            <p className="text-sm text-gray-400 mt-1">
              Get notified the second a product lands back in stock — across every major retailer
            </p>
          </div>
          <div className="inline-flex items-center gap-2 rounded-full border border-emerald-400/30 bg-emerald-500/10 px-3 py-1.5 text-xs font-bold text-emerald-400">
            <Radio className="h-3.5 w-3.5 animate-pulse" />
            {activeCount} active · {items.length} total
          </div>
        </div>
      </div>

      {/* How it works */}
      <div className="grid grid-cols-1 sm:grid-cols-3 gap-4 mb-6">
        <div className="rounded-2xl border border-white/5 bg-grailiq-dark p-5">
          <div className="h-10 w-10 rounded-xl bg-amber-500/15 border border-amber-400/20 flex items-center justify-center mb-3">
            <Bell className="h-5 w-5 text-amber-400" />
          </div>
          <p className="text-sm font-bold text-white">Set an Alert</p>
          <p className="text-xs text-gray-400 mt-1 leading-relaxed">
            Pick a product and a retailer — or "All Retailers" for the widest net.
          </p>
        </div>
        <div className="rounded-2xl border border-white/5 bg-grailiq-dark p-5">
          <div className="h-10 w-10 rounded-xl bg-grailiq-purple/15 border border-grailiq-purple/30 flex items-center justify-center mb-3">
            <Zap className="h-5 w-5 text-grailiq-purple-light" />
          </div>
          <p className="text-sm font-bold text-white">We Monitor 24/7</p>
          <p className="text-xs text-gray-400 mt-1 leading-relaxed">
            Every 60 seconds, our workers re-check stock at every monitored retailer.
          </p>
        </div>
        <div className="rounded-2xl border border-white/5 bg-grailiq-dark p-5">
          <div className="h-10 w-10 rounded-xl bg-emerald-500/15 border border-emerald-400/20 flex items-center justify-center mb-3">
            <ShoppingCart className="h-5 w-5 text-emerald-400" />
          </div>
          <p className="text-sm font-bold text-white">Buy at MSRP</p>
          <p className="text-xs text-gray-400 mt-1 leading-relaxed">
            Hit "buy" before the bots — email and push the second inventory returns.
          </p>
        </div>
      </div>

      {/* Alerts List */}
      <div className="rounded-2xl border border-white/5 bg-grailiq-dark overflow-hidden">
        <div className="flex items-center justify-between px-5 py-4 border-b border-white/5">
          <div className="flex items-center gap-2">
            <BellRing className="h-4 w-4 text-grailiq-purple-light" />
            <h2 className="font-bold text-white">Your Alerts</h2>
          </div>
          {items.length > 0 && (
            <span className="text-xs text-gray-400">
              {activeCount}/{items.length} watching
            </span>
          )}
        </div>

        {items.length > 0 ? (
          <div className="divide-y divide-white/5">
            {items.map((alert) => {
              const bias = signalToBias(alert.product.investmentSignal);
              const color = signalToColor(alert.product.investmentSignal);
              const points = generateTrend(alert.productId, bias, 14);

              return (
                <div
                  key={alert.id}
                  className={`flex items-center gap-4 px-5 py-4 transition-colors hover:bg-white/[0.02] ${
                    alert.isActive ? '' : 'opacity-55'
                  }`}
                >
                  {/* Product icon with pulse dot */}
                  <div className="relative flex-shrink-0">
                    <div className="h-12 w-12 rounded-xl bg-white/5 border border-white/5 flex items-center justify-center text-xl">
                      {typeIcons[alert.product.type] || '📋'}
                    </div>
                    <span
                      className={`absolute -top-0.5 -right-0.5 h-3 w-3 rounded-full border-2 border-grailiq-dark ${
                        alert.isActive ? 'bg-emerald-400' : 'bg-gray-500'
                      }`}
                    />
                  </div>

                  {/* Info */}
                  <div className="flex-1 min-w-0">
                    <Link
                      to={`/app/products/${alert.productId}`}
                      className="text-sm font-bold text-white hover:text-grailiq-purple-light transition-colors truncate block"
                    >
                      {alert.product.name}
                    </Link>
                    <p className="text-xs text-gray-400 mt-0.5 truncate">
                      <span className="text-grailiq-purple-light font-semibold">
                        {retailerLabels[alert.retailer] || alert.retailer}
                      </span>
                      {alert.product.msrp && (
                        <> · MSRP {formatPrice(alert.product.msrp)}</>
                      )}
                    </p>
                  </div>

                  {/* Mini sparkline */}
                  <div className="hidden md:block flex-shrink-0">
                    <Sparkline points={points} color={color} width={88} height={28} />
                  </div>

                  {/* Toggle pill */}
                  <button
                    onClick={() =>
                      toggleAlert.mutate(alert.id)
                    }
                    className={`flex-shrink-0 rounded-full px-3 py-1.5 text-[10px] font-bold uppercase tracking-wider border transition-colors ${
                      alert.isActive
                        ? 'bg-emerald-500/15 border-emerald-400/30 text-emerald-400 hover:bg-emerald-500/25'
                        : 'bg-white/5 border-white/10 text-gray-400 hover:bg-white/10'
                    }`}
                  >
                    {alert.isActive ? 'Active' : 'Paused'}
                  </button>

                  {/* Delete */}
                  <button
                    onClick={() => {
                      if (confirm(`Remove alert for ${alert.product.name}?`)) {
                        deleteAlert.mutate(alert.id);
                      }
                    }}
                    className="p-2 rounded-lg text-gray-500 hover:text-rose-400 hover:bg-rose-500/10 transition-colors flex-shrink-0"
                    aria-label="Delete alert"
                  >
                    <Trash2 className="h-4 w-4" />
                  </button>
                </div>
              );
            })}
          </div>
        ) : (
          <div className="flex flex-col items-center justify-center py-12 text-center px-6">
            <div className="h-16 w-16 rounded-2xl bg-amber-500/10 border border-amber-400/20 flex items-center justify-center mb-4">
              <Bell className="h-8 w-8 text-amber-400" />
            </div>
            <p className="text-white font-bold mb-1">No alerts yet</p>
            <p className="text-sm text-gray-400 max-w-sm mb-6">
              Add products to your watchlist and we'll notify you when they restock or hit your price target.
            </p>
            <Link
              to="/app/watchlist"
              className="inline-flex items-center gap-1.5 text-sm font-semibold text-grailiq-purple-light hover:text-white transition-colors"
            >
              Go to Watchlist <ChevronRight className="h-3.5 w-3.5" />
            </Link>
          </div>
        )}
      </div>
    </div>
  );
}
