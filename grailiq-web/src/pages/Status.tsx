import { useEffect, useState } from 'react';
import { Link } from 'react-router-dom';
import { api } from '@/lib/api';
import { ArrowLeft, Radio, Check, AlertTriangle } from 'lucide-react';

interface Health {
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
  queues: Record<string, any>;
}

/**
 * Public /status page. Pulls /admin/health (which is unauthenticated) and
 * renders a customer-facing "system status" surface. No internals leaked —
 * just green/amber/red per component.
 */
export default function Status() {
  const [health, setHealth] = useState<Health | null>(null);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    let cancelled = false;
    async function load() {
      try {
        const { data } = await api.get('/admin/health');
        if (!cancelled) setHealth(data as Health);
      } catch (err) {
        if (!cancelled) setError(err instanceof Error ? err.message : 'Could not reach API');
      }
    }
    load();
    const iv = setInterval(load, 30_000);
    return () => {
      cancelled = true;
      clearInterval(iv);
    };
  }, []);

  // Map health into public-safe components
  const components = [
    {
      name: 'API',
      status: health?.ok ? 'operational' : error ? 'down' : 'loading',
      detail: health?.ok ? 'Responding normally' : error ?? 'Checking…',
    },
    {
      name: 'Price feed',
      status: (() => {
        const ms = health?.uptime.priceFeed.latencyMs;
        if (ms == null) return 'loading';
        if (ms < 30 * 60_000) return 'operational';
        if (ms < 4 * 60 * 60_000) return 'degraded';
        return 'down';
      })(),
      detail: health?.uptime.priceFeed.latencyMs != null
        ? `Last price recorded ${Math.max(0, Math.round(health.uptime.priceFeed.latencyMs / 60_000))}m ago · ${health.uptime.priceFeed.rowsLastHour} rows last hour`
        : 'Loading…',
    },
    {
      name: 'Restock monitoring',
      status: getQueueStatus(health?.queues?.restockChecks),
      detail: health?.queues?.restockChecks
        ? `${health.queues.restockChecks.completed ?? 0} completed · ${health.queues.restockChecks.failed ?? 0} failed`
        : 'Loading…',
    },
    {
      name: 'Notifications',
      status: getQueueStatus(health?.queues?.notifications),
      detail: health?.queues?.notifications
        ? `${health.queues.notifications.waiting ?? 0} waiting · ${health.queues.notifications.failed ?? 0} failed`
        : 'Loading…',
    },
    {
      name: 'Score pipeline',
      status: getQueueStatus(health?.queues?.scores),
      detail: 'Recalculates daily at 02:00 UTC',
    },
  ];

  const overall: 'operational' | 'degraded' | 'down' = (() => {
    if (components.some((c) => c.status === 'down')) return 'down';
    if (components.some((c) => c.status === 'degraded')) return 'degraded';
    return 'operational';
  })();

  return (
    <div className="min-h-screen bg-grailiq-ink text-white">
      {/* Nav */}
      <nav className="fixed top-0 z-50 w-full border-b border-white/5 bg-grailiq-ink/80 backdrop-blur-xl">
        <div className="mx-auto flex h-16 max-w-7xl items-center justify-between px-5 sm:px-6">
          <Link to="/" className="flex items-center gap-1 text-xl font-bold tracking-tight">
            Grail<span className="text-grailiq-purple-light">IQ</span>
          </Link>
          <Link
            to="/sign-in"
            className="rounded-lg bg-grailiq-purple px-4 py-2 text-sm font-semibold text-white shadow-lg shadow-grailiq-purple/30 hover:bg-grailiq-purple-light transition-all"
          >
            Open App
          </Link>
        </div>
      </nav>

      <section className="relative overflow-hidden pt-28 pb-12">
        <div className="pointer-events-none absolute inset-0">
          <div className="absolute top-0 left-1/2 h-[400px] w-[700px] -translate-x-1/2 rounded-full bg-grailiq-purple/15 blur-[128px]" />
        </div>
        <div className="relative mx-auto max-w-3xl px-5 sm:px-6">
          <Link
            to="/"
            className="inline-flex items-center gap-1.5 text-sm text-gray-400 hover:text-white transition-colors mb-5"
          >
            <ArrowLeft className="h-4 w-4" />
            Back to GrailIQ
          </Link>

          {/* Overall banner */}
          <div
            className={`rounded-3xl border p-6 mb-8 ${
              overall === 'operational'
                ? 'border-emerald-400/30 bg-emerald-500/5'
                : overall === 'degraded'
                ? 'border-amber-400/30 bg-amber-500/5'
                : 'border-rose-400/30 bg-rose-500/5'
            }`}
          >
            <div className="flex items-center gap-3">
              {overall === 'operational' ? (
                <Check className="h-6 w-6 text-emerald-400" />
              ) : (
                <AlertTriangle
                  className={overall === 'degraded' ? 'h-6 w-6 text-amber-400' : 'h-6 w-6 text-rose-400'}
                />
              )}
              <div>
                <p className="text-2xl font-bold">
                  {overall === 'operational'
                    ? 'All systems operational'
                    : overall === 'degraded'
                    ? 'Degraded performance'
                    : 'Service disruption'}
                </p>
                <p className="text-sm text-gray-400 mt-0.5 inline-flex items-center gap-1.5">
                  <Radio className="h-3 w-3 animate-pulse text-emerald-400" />
                  Auto-refreshing · updated{' '}
                  {health ? new Date(health.serverTime).toLocaleTimeString() : '…'}
                </p>
              </div>
            </div>
          </div>

          {/* Components */}
          <div className="space-y-3">
            {components.map((c) => (
              <div
                key={c.name}
                className="rounded-2xl border border-white/10 bg-white/[0.02] p-5 flex items-center gap-4"
              >
                <StatusDot status={c.status} />
                <div className="flex-1 min-w-0">
                  <p className="text-base font-semibold">{c.name}</p>
                  <p className="text-xs text-gray-400 mt-0.5">{c.detail}</p>
                </div>
                <StatusBadge status={c.status} />
              </div>
            ))}
          </div>

          <p className="mt-10 text-center text-xs text-gray-500">
            Report a problem:{' '}
            <a href="mailto:support@grailiq.com" className="text-grailiq-purple-light hover:text-white">
              support@grailiq.com
            </a>
          </p>
        </div>
      </section>
    </div>
  );
}

function getQueueStatus(q: any): 'operational' | 'degraded' | 'down' | 'loading' {
  if (!q) return 'loading';
  if (q.status === 'offline') return 'down';
  const failed = q.failed ?? 0;
  if (failed > 25) return 'degraded';
  return 'operational';
}

function StatusDot({ status }: { status: string }) {
  const cls = {
    operational: 'bg-emerald-400',
    degraded: 'bg-amber-400',
    down: 'bg-rose-400',
    loading: 'bg-slate-400',
  }[status] ?? 'bg-slate-400';
  return <span className={`h-3 w-3 rounded-full ${cls} ${status !== 'loading' ? 'animate-pulse' : ''}`} />;
}

function StatusBadge({ status }: { status: string }) {
  const cls = {
    operational: 'bg-emerald-500/15 text-emerald-400 border-emerald-400/30',
    degraded: 'bg-amber-500/15 text-amber-400 border-amber-400/30',
    down: 'bg-rose-500/15 text-rose-400 border-rose-400/30',
    loading: 'bg-slate-500/20 text-slate-300 border-slate-400/30',
  }[status] ?? 'bg-slate-500/20 text-slate-300 border-slate-400/30';
  const label = {
    operational: 'Operational',
    degraded: 'Degraded',
    down: 'Down',
    loading: 'Loading',
  }[status] ?? status;
  return (
    <span className={`rounded-full border px-2.5 py-0.5 text-[10px] font-bold uppercase tracking-wider ${cls}`}>
      {label}
    </span>
  );
}
