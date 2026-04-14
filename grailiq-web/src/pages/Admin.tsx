import { useQuery } from '@tanstack/react-query';
import { api } from '@/lib/api';
import { Spinner } from '@/components/ui/Spinner';
import {
  Activity,
  AlertCircle,
  Bell,
  Database,
  Package,
  TrendingUp,
  Users,
  Zap,
  RefreshCw,
} from 'lucide-react';

interface HealthResponse {
  ok: boolean;
  serverTime: string;
  uptime: {
    priceFeed: {
      latestRecordedAt: string | null;
      latencyMs: number | null;
      rowsLastHour: number;
      rowsLastDay: number;
    };
    redis: string;
  };
  counts: Record<string, number>;
  usersByTier: Record<string, number>;
  signalDistribution: Record<string, number>;
  topRetailerErrors: Array<{ retailer: string; error: string; count: number }>;
  queues: Record<string, any>;
}

/**
 * /app/admin — renders GET /admin/health. Intended for operators.
 * Not tier-gated yet; the endpoint itself has no auth so this page is
 * functional without a special role. If you want to lock it down later,
 * add a role check on the API + a feature flag check here.
 */
export default function Admin() {
  const { data, isLoading, isFetching, refetch } = useQuery<HealthResponse>({
    queryKey: ['admin-health'],
    queryFn: async () => {
      const { data } = await api.get('/admin/health');
      return data;
    },
    refetchInterval: 30_000,
  });

  if (isLoading) {
    return (
      <div className="flex items-center justify-center min-h-[60vh]">
        <Spinner size="lg" />
      </div>
    );
  }
  if (!data) {
    return (
      <div className="text-white text-center py-16">
        <p className="text-gray-400">Could not fetch health data</p>
      </div>
    );
  }

  const latencyBadge = (() => {
    const ms = data.uptime.priceFeed.latencyMs;
    if (ms === null) return { label: 'no data', cls: 'bg-slate-500/20 text-slate-300 border-slate-400/30' };
    const mins = ms / 60_000;
    if (mins < 10) return { label: `${mins.toFixed(1)}m fresh`, cls: 'bg-emerald-500/15 text-emerald-400 border-emerald-400/30' };
    if (mins < 60) return { label: `${mins.toFixed(0)}m behind`, cls: 'bg-amber-500/15 text-amber-400 border-amber-400/30' };
    return { label: `${(mins / 60).toFixed(1)}h stale`, cls: 'bg-rose-500/15 text-rose-400 border-rose-400/30' };
  })();

  return (
    <div className="text-white">
      {/* Hero */}
      <div className="relative overflow-hidden rounded-3xl border border-white/5 bg-grailiq-dark p-6 sm:p-8 mb-6">
        <div className="absolute inset-0 bg-gradient-to-br from-grailiq-gold/20 via-transparent to-transparent" />
        <div className="absolute top-0 right-0 h-48 w-48 rounded-full bg-grailiq-gold/10 blur-3xl" />

        <div className="relative flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
          <div>
            <p className="text-[10px] font-bold uppercase tracking-wider text-grailiq-gold-light mb-1">
              Operations
            </p>
            <h1 className="text-3xl sm:text-4xl font-bold">System Health</h1>
            <p className="text-sm text-gray-400 mt-2">
              Live snapshot — auto-refreshes every 30 seconds.
            </p>
          </div>
          <div className="flex items-center gap-3 flex-shrink-0">
            <span
              className={`inline-flex items-center gap-2 rounded-full border px-3 py-1.5 text-xs font-bold ${latencyBadge.cls}`}
            >
              <Activity className="h-3.5 w-3.5" /> Price feed · {latencyBadge.label}
            </span>
            <button
              onClick={() => refetch()}
              className="inline-flex items-center gap-1.5 rounded-lg border border-white/15 bg-white/[0.03] px-3 py-1.5 text-xs font-semibold hover:border-white/25 hover:bg-white/[0.06] transition-all"
            >
              <RefreshCw className={`h-3.5 w-3.5 ${isFetching ? 'animate-spin' : ''}`} />
              Refresh
            </button>
          </div>
        </div>
      </div>

      {/* Counts row */}
      <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-4 gap-3 mb-6">
        <CountCard icon={Package} label="Products" value={data.counts.products} accent="purple" />
        <CountCard icon={Database} label="Portfolio items" value={data.counts.portfolioItems} accent="fuchsia" />
        <CountCard icon={Bell} label="Active alerts" value={data.counts.activeAlerts} accent="emerald" />
        <CountCard icon={Zap} label="Push tokens" value={data.counts.enabledPushTokens} accent="gold" />
        <CountCard
          icon={Package}
          label="Retailer maps (enabled)"
          value={`${data.counts.retailerMappingsEnabled}/${data.counts.retailerMappingsTotal}`}
          accent="purple"
        />
        <CountCard
          icon={TrendingUp}
          label="In stock now"
          value={data.counts.retailerMappingsInStock}
          accent="emerald"
        />
        <CountCard
          icon={Users}
          label="Users"
          value={Object.values(data.usersByTier).reduce((a, b) => a + b, 0)}
          accent="fuchsia"
        />
        <CountCard
          icon={Database}
          label="Rows last 24h"
          value={data.uptime.priceFeed.rowsLastDay}
          sub={`${data.uptime.priceFeed.rowsLastHour} last hour`}
          accent="gold"
        />
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-4 sm:gap-6">
        {/* Tier distribution */}
        <Panel title="Users by Tier" icon={Users}>
          {Object.keys(data.usersByTier).length === 0 ? (
            <EmptyRow msg="No users yet" />
          ) : (
            Object.entries(data.usersByTier).map(([tier, count]) => (
              <DistributionRow key={tier} label={tier} value={count} total={sum(data.usersByTier)} />
            ))
          )}
        </Panel>

        {/* Signal distribution */}
        <Panel title="Signal Distribution" icon={TrendingUp}>
          {Object.entries(data.signalDistribution).map(([sig, count]) => (
            <DistributionRow
              key={sig}
              label={sig}
              value={count}
              total={sum(data.signalDistribution)}
              tone={signalTone(sig)}
            />
          ))}
        </Panel>

        {/* Queue depths */}
        <Panel title="Job Queues" icon={Activity} span={2}>
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-3">
            {Object.entries(data.queues).map(([name, stats]) => (
              <QueueTile key={name} name={name} stats={stats} />
            ))}
          </div>
        </Panel>

        {/* Retailer errors */}
        <Panel title="Top Retailer Errors" icon={AlertCircle} span={2}>
          {data.topRetailerErrors.length === 0 ? (
            <EmptyRow msg="No retailer errors in the last check window." />
          ) : (
            <div className="divide-y divide-white/5">
              {data.topRetailerErrors.map((e, i) => (
                <div key={i} className="flex items-center justify-between py-2">
                  <div className="flex items-center gap-2 min-w-0">
                    <span className="text-xs uppercase tracking-wider text-gray-500 font-semibold shrink-0 w-28">
                      {e.retailer}
                    </span>
                    <span className="text-sm text-gray-300 font-mono truncate">
                      {e.error || '—'}
                    </span>
                  </div>
                  <span className="text-sm font-bold text-rose-400 tabular-nums flex-shrink-0 ml-4">
                    ×{e.count}
                  </span>
                </div>
              ))}
            </div>
          )}
        </Panel>
      </div>

      <p className="mt-6 text-[11px] text-gray-500 text-center">
        Server time: {new Date(data.serverTime).toLocaleString()} · Redis: {data.uptime.redis}
      </p>
    </div>
  );
}

function CountCard({
  icon: Icon,
  label,
  value,
  sub,
  accent,
}: {
  icon: React.ElementType;
  label: string;
  value: number | string;
  sub?: string;
  accent: 'purple' | 'fuchsia' | 'emerald' | 'gold';
}) {
  const c = {
    purple: 'bg-grailiq-purple/15 border-grailiq-purple/30 text-grailiq-purple-light',
    fuchsia: 'bg-fuchsia-500/15 border-fuchsia-400/30 text-fuchsia-300',
    emerald: 'bg-emerald-500/15 border-emerald-400/30 text-emerald-400',
    gold: 'bg-grailiq-gold/15 border-grailiq-gold/30 text-grailiq-gold-light',
  }[accent];
  return (
    <div className="rounded-2xl border border-white/5 bg-grailiq-dark p-4">
      <div className={`h-8 w-8 rounded-xl border flex items-center justify-center mb-3 ${c}`}>
        <Icon className="h-4 w-4" />
      </div>
      <p className="text-2xl font-bold tabular-nums">{value}</p>
      <p className="text-[10px] text-gray-500 uppercase tracking-wider mt-1 font-semibold">
        {label}
      </p>
      {sub && <p className="text-[10px] text-gray-600 mt-0.5">{sub}</p>}
    </div>
  );
}

function Panel({
  title,
  icon: Icon,
  children,
  span,
}: {
  title: string;
  icon: React.ElementType;
  children: React.ReactNode;
  span?: number;
}) {
  return (
    <div
      className={`rounded-2xl border border-white/5 bg-grailiq-dark p-5 ${
        span === 2 ? 'lg:col-span-2' : ''
      }`}
    >
      <div className="flex items-center gap-2 mb-4">
        <Icon className="h-4 w-4 text-grailiq-purple-light" />
        <h2 className="font-bold text-white text-sm">{title}</h2>
      </div>
      {children}
    </div>
  );
}

function DistributionRow({
  label,
  value,
  total,
  tone,
}: {
  label: string;
  value: number;
  total: number;
  tone?: string;
}) {
  const pct = total > 0 ? Math.round((value / total) * 100) : 0;
  return (
    <div className="flex items-center gap-3 py-1.5">
      <span className="text-xs uppercase tracking-wider text-gray-400 font-semibold w-24">
        {label}
      </span>
      <div className="flex-1 h-1.5 rounded-full bg-white/5 overflow-hidden">
        <div
          className={`h-full rounded-full ${
            tone ?? 'bg-gradient-to-r from-grailiq-purple to-grailiq-purple-light'
          }`}
          style={{ width: `${pct}%` }}
        />
      </div>
      <span className="text-xs font-bold text-white tabular-nums w-14 text-right">
        {value} <span className="text-gray-500 font-normal">({pct}%)</span>
      </span>
    </div>
  );
}

function QueueTile({ name, stats }: { name: string; stats: any }) {
  if (stats.status === 'offline') {
    return (
      <div className="rounded-xl border border-white/5 bg-white/[0.02] p-3">
        <p className="text-xs font-semibold text-gray-300">{name}</p>
        <p className="text-[10px] text-rose-400 mt-1 uppercase tracking-wider">offline</p>
      </div>
    );
  }
  return (
    <div className="rounded-xl border border-white/5 bg-white/[0.02] p-3">
      <p className="text-xs font-semibold text-white">{name}</p>
      <div className="mt-2 grid grid-cols-4 gap-2 text-[10px]">
        <StatSmall label="wait" value={stats.waiting} color="text-amber-400" />
        <StatSmall label="active" value={stats.active} color="text-grailiq-purple-light" />
        <StatSmall label="ok" value={stats.completed} color="text-emerald-400" />
        <StatSmall label="fail" value={stats.failed} color="text-rose-400" />
      </div>
    </div>
  );
}

function StatSmall({ label, value, color }: { label: string; value: number; color: string }) {
  return (
    <div>
      <p className={`tabular-nums font-bold ${color}`}>{value ?? 0}</p>
      <p className="text-gray-600 uppercase tracking-wider">{label}</p>
    </div>
  );
}

function EmptyRow({ msg }: { msg: string }) {
  return <p className="text-sm text-gray-500 py-4 text-center">{msg}</p>;
}

function sum(obj: Record<string, number>): number {
  return Object.values(obj).reduce((a, b) => a + b, 0);
}

function signalTone(sig: string): string {
  switch (sig) {
    case 'buy':
      return 'bg-emerald-400';
    case 'hold':
      return 'bg-amber-400';
    case 'watch':
      return 'bg-slate-400';
    case 'avoid':
      return 'bg-rose-400';
    default:
      return 'bg-white/20';
  }
}
