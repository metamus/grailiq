import { Link, useLocation } from 'react-router-dom';
import { ArrowLeft, Compass } from 'lucide-react';

export default function NotFound() {
  const location = useLocation();
  return (
    <div className="min-h-screen flex items-center justify-center bg-grailiq-ink text-white px-4 relative">
      <div className="pointer-events-none absolute inset-0 overflow-hidden">
        <div className="absolute top-1/4 left-1/2 h-[500px] w-[700px] -translate-x-1/2 rounded-full bg-grailiq-purple/15 blur-[128px]" />
      </div>

      <div className="relative w-full max-w-md text-center">
        <div className="inline-flex h-16 w-16 items-center justify-center rounded-2xl border border-grailiq-gold/30 bg-grailiq-gold/10 text-grailiq-gold-light mb-6">
          <Compass className="h-7 w-7" />
        </div>
        <h1 className="font-display text-6xl tracking-tight mb-3">404</h1>
        <p className="text-lg text-white font-semibold">We can't find that page</p>
        <p className="text-sm text-gray-400 mt-2 font-mono break-all">{location.pathname}</p>
        <p className="text-sm text-gray-400 mt-4">
          It may have been renamed, archived, or just never existed. Try the paths below.
        </p>

        <div className="mt-6 grid grid-cols-2 gap-2 text-left">
          {[
            { to: '/', label: 'Home' },
            { to: '/score', label: 'The GrailIQ Score' },
            { to: '/status', label: 'System status' },
            { to: '/sign-in', label: 'Sign in / Sign up' },
          ].map((l) => (
            <Link
              key={l.to}
              to={l.to}
              className="rounded-xl border border-white/10 bg-white/[0.02] px-4 py-3 text-sm font-medium text-gray-300 hover:border-white/25 hover:bg-white/[0.06] hover:text-white transition-all"
            >
              {l.label} →
            </Link>
          ))}
        </div>

        <Link
          to="/"
          className="mt-6 inline-flex items-center gap-1.5 text-sm text-gray-400 hover:text-white transition-colors"
        >
          <ArrowLeft className="h-4 w-4" />
          Back to home
        </Link>
      </div>
    </div>
  );
}
