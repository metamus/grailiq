/**
 * Simple, themed skeleton loader. Uses Tailwind's animate-pulse + a tinted
 * background that matches the dark theme.
 *
 *   <Skeleton className="h-4 w-24" />
 */

interface Props {
  className?: string;
}

export function Skeleton({ className = '' }: Props) {
  return <div className={`animate-pulse rounded-md bg-white/5 ${className}`} />;
}

/** Convenience composite: a titled list of N rows for use as a page skeleton. */
export function ListSkeleton({ rows = 5 }: { rows?: number }) {
  return (
    <div className="space-y-3">
      {Array.from({ length: rows }).map((_, i) => (
        <div
          key={i}
          className="flex items-center gap-4 rounded-2xl border border-white/5 bg-grailiq-dark p-4"
        >
          <Skeleton className="h-11 w-11 rounded-xl" />
          <div className="flex-1 space-y-2">
            <Skeleton className="h-3 w-3/4" />
            <Skeleton className="h-2.5 w-1/2" />
          </div>
          <Skeleton className="h-4 w-12" />
        </div>
      ))}
    </div>
  );
}

export function StatSkeleton({ count = 4 }: { count?: number }) {
  return (
    <div className="grid grid-cols-2 lg:grid-cols-4 gap-3 sm:gap-4">
      {Array.from({ length: count }).map((_, i) => (
        <div key={i} className="rounded-2xl border border-white/5 bg-grailiq-dark p-4">
          <Skeleton className="h-8 w-8 rounded-xl mb-3" />
          <Skeleton className="h-6 w-16 mb-2" />
          <Skeleton className="h-3 w-20" />
        </div>
      ))}
    </div>
  );
}
