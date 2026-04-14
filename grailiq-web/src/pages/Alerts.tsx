import { Link } from 'react-router-dom';
import { Spinner } from '@/components/ui/Spinner';
import { useAlerts, useToggleAlert, useDeleteAlert } from '@/hooks/useAlerts';
import { formatPrice } from '@/lib/utils';
import {
  Bell,
  BellRing,
  Zap,
  ChevronRight,
  ShoppingCart,
  ToggleLeft,
  ToggleRight,
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

const retailerLabels: Record<string, string> = {
  pokemon_center: 'Pokemon Center',
  amazon: 'Amazon',
  target: 'Target',
  walmart: 'Walmart',
  best_buy: 'Best Buy',
  all: 'All Retailers',
};

/** Restock alerts management — wired to live API */
export default function Alerts() {
  const { data: alerts, isLoading } = useAlerts();
  const toggleAlert = useToggleAlert();
  const deleteAlert = useDeleteAlert();

  const activeCount = alerts?.filter((a) => a.isActive).length ?? 0;

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
            <h1 className="text-2xl sm:text-3xl font-bold text-white">Restock Alerts</h1>
            <p className="text-sm text-gray-400 mt-1">
              Get notified within 60 seconds when products restock at or below MSRP
            </p>
          </div>
        </div>
      </div>

      {/* How it works */}
      <div className="grid grid-cols-1 sm:grid-cols-3 gap-4 mb-8">
        <div className="bg-white rounded-xl border border-gray-100 p-4 text-center">
          <div className="h-10 w-10 rounded-xl bg-amber-50 flex items-center justify-center mx-auto mb-3">
            <Bell className="h-5 w-5 text-amber-500" />
          </div>
          <p className="text-sm font-semibold text-gray-900">Set an Alert</p>
          <p className="text-xs text-gray-400 mt-1">Choose a product and retailer to monitor</p>
        </div>
        <div className="bg-white rounded-xl border border-gray-100 p-4 text-center">
          <div className="h-10 w-10 rounded-xl bg-violet-50 flex items-center justify-center mx-auto mb-3">
            <Zap className="h-5 w-5 text-grailiq-purple" />
          </div>
          <p className="text-sm font-semibold text-gray-900">We Monitor 24/7</p>
          <p className="text-xs text-gray-400 mt-1">Checking stock every 30 seconds</p>
        </div>
        <div className="bg-white rounded-xl border border-gray-100 p-4 text-center">
          <div className="h-10 w-10 rounded-xl bg-emerald-50 flex items-center justify-center mx-auto mb-3">
            <ShoppingCart className="h-5 w-5 text-emerald-500" />
          </div>
          <p className="text-sm font-semibold text-gray-900">Buy at MSRP</p>
          <p className="text-xs text-gray-400 mt-1">Get notified instantly to secure your purchase</p>
        </div>
      </div>

      {/* Alerts List */}
      <div className="bg-white rounded-xl border border-gray-100 overflow-hidden">
        <div className="flex items-center justify-between px-5 py-4 border-b border-gray-50">
          <div className="flex items-center gap-2">
            <BellRing className="h-4 w-4 text-grailiq-purple" />
            <h2 className="font-bold text-gray-900">Your Alerts</h2>
          </div>
          <span className="text-xs text-gray-400">{activeCount} active</span>
        </div>

        {alerts && alerts.length > 0 ? (
          <div className="divide-y divide-gray-50">
            {alerts.map((alert) => (
              <div
                key={alert.id}
                className={`flex items-center gap-4 px-5 py-4 transition-colors ${
                  alert.isActive ? '' : 'opacity-50'
                }`}
              >
                {/* Product icon */}
                <div className="h-11 w-11 rounded-xl bg-grailiq-light flex items-center justify-center text-xl flex-shrink-0">
                  {alert.product ? typeIcons[alert.product.type] || '📋' : '📋'}
                </div>

                {/* Info */}
                <div className="flex-1 min-w-0">
                  <Link
                    to={`/products/${alert.productId}`}
                    className="text-sm font-semibold text-gray-900 hover:text-grailiq-purple transition-colors truncate block"
                  >
                    {alert.product?.name ?? `Product ${alert.productId.slice(0, 8)}`}
                  </Link>
                  <p className="text-xs text-gray-400 mt-0.5">
                    {retailerLabels[alert.retailer] || alert.retailer}
                    {alert.product?.msrp && ` · MSRP ${formatPrice(alert.product.msrp)}`}
                  </p>
                </div>

                {/* Status badge */}
                <span
                  className={`text-[10px] font-semibold uppercase tracking-wider px-2 py-0.5 rounded-full flex-shrink-0 ${
                    alert.isActive
                      ? 'bg-emerald-50 text-emerald-600 border border-emerald-200'
                      : 'bg-gray-50 text-gray-400 border border-gray-200'
                  }`}
                >
                  {alert.isActive ? 'Active' : 'Paused'}
                </span>

                {/* Toggle */}
                <button
                  onClick={() => toggleAlert.mutate(alert.id)}
                  className="text-gray-400 hover:text-grailiq-purple transition-colors flex-shrink-0"
                  title={alert.isActive ? 'Pause alert' : 'Activate alert'}
                >
                  {alert.isActive ? (
                    <ToggleRight className="h-6 w-6 text-emerald-500" />
                  ) : (
                    <ToggleLeft className="h-6 w-6" />
                  )}
                </button>

                {/* Delete */}
                <button
                  onClick={() => deleteAlert.mutate(alert.id)}
                  className="text-gray-300 hover:text-red-500 transition-colors flex-shrink-0"
                  title="Delete alert"
                >
                  <Trash2 className="h-4 w-4" />
                </button>
              </div>
            ))}
          </div>
        ) : (
          <div className="flex flex-col items-center justify-center py-16 text-center">
            <div className="h-16 w-16 rounded-2xl bg-amber-50 flex items-center justify-center mb-4">
              <Bell className="h-8 w-8 text-amber-400" />
            </div>
            <p className="text-gray-900 font-medium mb-1">No alerts configured</p>
            <p className="text-sm text-gray-400 max-w-sm">
              Browse products and tap "Alert Me" to set up restock notifications. You'll be notified within 60 seconds of a restock.
            </p>
            <Link
              to="/sets"
              className="mt-4 inline-flex items-center gap-1.5 text-sm font-medium text-grailiq-purple hover:underline"
            >
              Browse Products <ChevronRight className="h-3.5 w-3.5" />
            </Link>
          </div>
        )}
      </div>
    </div>
  );
}
