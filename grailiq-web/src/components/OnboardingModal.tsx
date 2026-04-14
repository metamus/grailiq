import { useEffect, useState } from 'react';
import { Link } from 'react-router-dom';
import {
  ArrowRight,
  Gauge,
  Bell,
  Wallet,
  Heart,
  Sparkles,
  X,
} from 'lucide-react';

const STORAGE_KEY = 'grailiq.onboarded.v1';

interface Step {
  key: string;
  icon: React.ElementType;
  accent: 'purple' | 'gold' | 'emerald' | 'rose';
  title: string;
  body: string;
  cta?: { label: string; href: string };
}

const steps: Step[] = [
  {
    key: 'welcome',
    icon: Sparkles,
    accent: 'gold',
    title: "Welcome to GrailIQ",
    body: "You're 60 seconds from live scores on every sealed Pokémon product. Quick tour — 4 screens.",
  },
  {
    key: 'score',
    icon: Gauge,
    accent: 'purple',
    title: 'The GrailIQ Score',
    body: 'Every product gets a 0–100 score and a Buy/Hold/Watch/Avoid signal. It blends price trend, MSRP premium, volatility, demand, and scarcity.',
    cta: { label: 'How the Score works', href: '/score' },
  },
  {
    key: 'portfolio',
    icon: Wallet,
    accent: 'emerald',
    title: 'Log what you own',
    body: 'Add sealed products to your Portfolio with a cost basis — we track live P&L for you. Free plan fits 25 items.',
    cta: { label: 'Open Portfolio', href: '/app/portfolio' },
  },
  {
    key: 'watchlist',
    icon: Heart,
    accent: 'rose',
    title: 'Watch before you buy',
    body: 'Tap the heart on any product to track it without owning. Set a target price and we\'ll flag when it drops to that level.',
    cta: { label: 'Browse products', href: '/app/sets' },
  },
  {
    key: 'alerts',
    icon: Bell,
    accent: 'gold',
    title: 'Never miss a restock',
    body: 'Set restock alerts on sold-out products. We poll retailers every 60 seconds and push to your phone the moment inventory lands.',
    cta: { label: 'View alerts', href: '/app/alerts' },
  },
];

const accentClasses: Record<Step['accent'], string> = {
  purple: 'bg-grailiq-purple/15 border-grailiq-purple/30 text-grailiq-purple-light',
  gold: 'bg-grailiq-gold/15 border-grailiq-gold/30 text-grailiq-gold-light',
  emerald: 'bg-emerald-500/15 border-emerald-400/30 text-emerald-400',
  rose: 'bg-rose-500/15 border-rose-400/30 text-rose-300',
};

/**
 * Onboarding modal — shown on first /app visit after sign-up, dismissed
 * permanently via localStorage. Users can also skip.
 */
export function OnboardingModal() {
  const [open, setOpen] = useState(false);
  const [step, setStep] = useState(0);

  useEffect(() => {
    try {
      const done = localStorage.getItem(STORAGE_KEY);
      if (!done) {
        // Slight delay so the page renders behind the modal first
        const t = setTimeout(() => setOpen(true), 400);
        return () => clearTimeout(t);
      }
    } catch {
      // localStorage disabled — skip
    }
  }, []);

  const finish = () => {
    try {
      localStorage.setItem(STORAGE_KEY, String(Date.now()));
    } catch {
      /* noop */
    }
    setOpen(false);
  };

  if (!open) return null;
  const s = steps[step];
  const isLast = step === steps.length - 1;
  const accent = accentClasses[s.accent];

  return (
    <div className="fixed inset-0 z-[100] flex items-center justify-center p-4 bg-black/60 backdrop-blur-sm">
      <div className="relative w-full max-w-md rounded-3xl border border-white/10 bg-grailiq-dark p-6 shadow-2xl">
        <button
          onClick={finish}
          className="absolute top-4 right-4 p-1.5 rounded-lg text-gray-500 hover:text-white hover:bg-white/5 transition-colors"
          aria-label="Skip tour"
        >
          <X className="h-4 w-4" />
        </button>

        <div className={`h-14 w-14 rounded-2xl flex items-center justify-center border ${accent} mb-5`}>
          <s.icon className="h-6 w-6" />
        </div>

        <h2 className="text-2xl font-bold text-white mb-2">{s.title}</h2>
        <p className="text-sm leading-relaxed text-gray-400">{s.body}</p>

        {s.cta && (
          <Link
            to={s.cta.href}
            onClick={finish}
            target={s.cta.href.startsWith('/') ? undefined : '_blank'}
            className="mt-4 inline-flex items-center gap-1.5 text-sm font-semibold text-grailiq-purple-light hover:text-white transition-colors"
          >
            {s.cta.label} <ArrowRight className="h-3.5 w-3.5" />
          </Link>
        )}

        {/* Progress dots */}
        <div className="flex items-center gap-1.5 mt-6">
          {steps.map((_, i) => (
            <span
              key={i}
              className={`h-1 rounded-full transition-all ${
                i === step ? 'w-8 bg-grailiq-purple-light' : 'w-4 bg-white/10'
              }`}
            />
          ))}
        </div>

        <div className="flex items-center gap-2 mt-4">
          <button
            onClick={finish}
            className="text-xs font-semibold text-gray-500 hover:text-white transition-colors mr-auto"
          >
            Skip tour
          </button>
          {step > 0 && (
            <button
              onClick={() => setStep(step - 1)}
              className="text-xs font-semibold text-gray-400 hover:text-white transition-colors rounded-lg px-3 py-2 border border-white/10"
            >
              Back
            </button>
          )}
          <button
            onClick={() => (isLast ? finish() : setStep(step + 1))}
            className="inline-flex items-center gap-1.5 rounded-lg bg-gradient-to-r from-grailiq-purple to-grailiq-purple-light px-4 py-2 text-sm font-semibold text-white shadow-lg shadow-grailiq-purple/30 hover:shadow-grailiq-purple/50 hover:brightness-110 transition-all"
          >
            {isLast ? 'Get started' : 'Next'}
            <ArrowRight className="h-3.5 w-3.5" />
          </button>
        </div>
      </div>
    </div>
  );
}
