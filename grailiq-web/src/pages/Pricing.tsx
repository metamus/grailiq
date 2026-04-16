import { useState } from 'react';
import { Check, Sparkles, Shield, Zap, CreditCard, Loader2 } from 'lucide-react';
import {
  useSubscription,
  useStartCheckout,
  useOpenBillingPortal,
} from '@/hooks/useStripe';

interface Tier {
  id: 'free' | 'collector' | 'investor' | 'pro';
  name: string;
  monthlyPrice?: string;
  annualPrice?: string;
  description: string;
  icon: typeof Shield;
  accent: 'slate' | 'purple' | 'gold' | 'emerald';
  features: string[];
  ctaLabel: string;
  popular?: boolean;
  priceIdMonthly?: string;
  priceIdAnnual?: string;
}

const tiers: Tier[] = [
  {
    id: 'free',
    name: 'Free',
    monthlyPrice: '$0',
    description: 'Get started tracking your collection',
    icon: Shield,
    accent: 'slate',
    features: [
      '30-day price history',
      '25 portfolio items',
      '3 restock alerts',
      'Basic set encyclopedia',
    ],
    ctaLabel: 'Get started',
  },
  {
    id: 'collector',
    name: 'Collector',
    monthlyPrice: '$9.99',
    annualPrice: '$99',
    description: 'Full intelligence for serious collectors',
    icon: Sparkles,
    accent: 'purple',
    features: [
      'Full price history (all time)',
      'Unlimited portfolio items',
      'Unlimited restock alerts · push + email',
      'GrailIQ score + signals',
      'Insurance PDF + CSV export',
      'Hot-tier 5-minute refresh',
    ],
    ctaLabel: 'Start trial',
    popular: true,
    priceIdMonthly: import.meta.env.VITE_STRIPE_PRICE_COLLECTOR_MONTHLY,
    priceIdAnnual: import.meta.env.VITE_STRIPE_PRICE_COLLECTOR_ANNUAL,
  },
  {
    id: 'investor',
    name: 'Investor',
    monthlyPrice: '$24.99',
    annualPrice: '$249',
    description: 'Maximum edge for portfolio managers',
    icon: Zap,
    accent: 'gold',
    features: [
      'Everything in Collector',
      'Advanced analytics dashboard',
      'Weekly market intelligence email',
      'API access · 10k calls/mo',
      'Priority support',
      'Early access to new features',
    ],
    ctaLabel: 'Start trial',
    priceIdMonthly: import.meta.env.VITE_STRIPE_PRICE_INVESTOR_MONTHLY,
    priceIdAnnual: import.meta.env.VITE_STRIPE_PRICE_INVESTOR_ANNUAL,
  },
  {
    id: 'pro',
    name: 'Pro',
    monthlyPrice: '$19',
    annualPrice: '$190',
    description: 'Restock alerts with premium features',
    icon: Zap,
    accent: 'emerald',
    features: [
      'Unlimited restock alerts (push + email)',
      '24/7 SMS notifications',
      'Custom alert rules',
      'Bot-resistant monitoring',
      'Webhook integrations',
      'Dedicated support',
    ],
    ctaLabel: 'Start trial',
    priceIdMonthly: import.meta.env.VITE_STRIPE_PRICE_PRO_MONTHLY,
    priceIdAnnual: import.meta.env.VITE_STRIPE_PRICE_PRO_ANNUAL,
  },
];

const accentClasses = {
  slate: {
    iconWrap: 'bg-white/5 border-white/10',
    icon: 'text-gray-400',
    border: 'border-white/10',
    highlight: '',
  },
  purple: {
    iconWrap: 'bg-grailiq-purple/15 border-grailiq-purple/30',
    icon: 'text-grailiq-purple-light',
    border: 'border-grailiq-purple/40',
    highlight: 'bg-gradient-to-br from-grailiq-purple/15 to-transparent',
  },
  gold: {
    iconWrap: 'bg-grailiq-gold/15 border-grailiq-gold/30',
    icon: 'text-grailiq-gold-light',
    border: 'border-grailiq-gold/40',
    highlight: 'bg-gradient-to-br from-grailiq-gold/10 to-transparent',
  },
  emerald: {
    iconWrap: 'bg-emerald-500/15 border-emerald-500/30',
    icon: 'text-emerald-400',
    border: 'border-emerald-500/40',
    highlight: 'bg-gradient-to-br from-emerald-500/10 to-transparent',
  },
};

/** Pricing page — dark theme, wired to Stripe Checkout + Billing Portal. */
export default function Pricing() {
  const [isAnnual, setIsAnnual] = useState(false);
  const { data: subscription } = useSubscription();
  const startCheckout = useStartCheckout();
  const openPortal = useOpenBillingPortal();

  const currentTier = subscription?.tier ?? 'free';

  return (
    <div className="max-w-6xl mx-auto text-white">
      {/* Header */}
      <div className="text-center mb-12">
        <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full border border-grailiq-gold/30 bg-grailiq-gold/5 text-grailiq-gold-light text-[11px] font-semibold uppercase tracking-wider mb-4">
          <Sparkles className="h-3 w-3" />
          Pricing
        </div>
        <h1 className="text-3xl sm:text-4xl font-display font-bold">Choose your plan</h1>
        <p className="text-gray-400 mt-3 max-w-md mx-auto">
          Start free. Upgrade when you outgrow it. All paid plans include a 14-day free trial and
          you can cancel anytime from the billing portal.
        </p>

        {/* Annual toggle */}
        <div className="mt-6 inline-flex items-center gap-3 px-4 py-2 rounded-full border border-white/10 bg-white/[0.02]">
          <button
            onClick={() => setIsAnnual(false)}
            className={`px-3 py-1.5 rounded-lg text-sm font-semibold transition-all ${
              !isAnnual
                ? 'bg-grailiq-purple text-white'
                : 'text-gray-400 hover:text-white'
            }`}
          >
            Monthly
          </button>
          <button
            onClick={() => setIsAnnual(true)}
            className={`px-3 py-1.5 rounded-lg text-sm font-semibold transition-all ${
              isAnnual
                ? 'bg-grailiq-purple text-white'
                : 'text-gray-400 hover:text-white'
            }`}
          >
            Annual
            <span className="text-xs font-semibold text-grailiq-gold-light ml-1.5">(save 2 months)</span>
          </button>
        </div>

        {subscription?.hasCustomer && (
          <button
            onClick={() => openPortal.mutate()}
            disabled={openPortal.isPending}
            className="mt-5 inline-flex items-center gap-2 rounded-lg border border-white/15 bg-white/[0.03] px-4 py-2 text-sm font-medium text-gray-300 hover:border-white/25 hover:bg-white/[0.06] hover:text-white transition-all disabled:opacity-50"
          >
            {openPortal.isPending ? (
              <Loader2 className="h-4 w-4 animate-spin" />
            ) : (
              <CreditCard className="h-4 w-4" />
            )}
            Manage billing
          </button>
        )}
      </div>

      {/* Tier cards */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-5">
        {tiers.map((tier) => {
          const Icon = tier.icon;
          const accents = accentClasses[tier.accent];
          const isCurrent = currentTier === tier.id;
          const displayPrice = isAnnual ? tier.annualPrice : tier.monthlyPrice;
          const priceId = isAnnual ? tier.priceIdAnnual : tier.priceIdMonthly;
          const loading = startCheckout.isPending && startCheckout.variables === tier.id;
          // The API resolves price IDs from its own env vars (STRIPE_PRICE_*),
          // so we don't need a frontend price ID to enable the button — we
          // only need the API to support the tier + billing cycle. Monthly
          // collector & investor are always supported because Railway already
          // has STRIPE_PRICE_COLLECTOR / STRIPE_PRICE_INVESTOR set. Annual
          // and Pro still require their respective Stripe prices to exist,
          // and we detect that via the VITE_* env vars (optional).
          const apiSupportsMonthly = tier.id === 'collector' || tier.id === 'investor';
          const hasPrice =
            tier.id === 'free' ||
            (!isAnnual && apiSupportsMonthly) ||
            Boolean(priceId);

          return (
            <div
              key={tier.id}
              className={`relative rounded-2xl border bg-grailiq-dark overflow-hidden transition-all ${
                tier.popular ? `${accents.border} shadow-xl shadow-grailiq-purple/10` : 'border-white/10'
              }`}
            >
              {tier.popular && (
                <>
                  <div className={`pointer-events-none absolute inset-0 ${accents.highlight}`} />
                  <div className="absolute top-0 left-0 right-0 h-1 bg-gradient-to-r from-grailiq-purple to-grailiq-purple-light" />
                </>
              )}

              <div className="relative p-5">
                {tier.popular && (
                  <span className="inline-flex items-center gap-1.5 text-[10px] font-bold uppercase tracking-wider px-2.5 py-1 rounded-full bg-grailiq-purple/15 border border-grailiq-purple/30 text-grailiq-purple-light mb-3">
                    <Sparkles className="h-3 w-3" />
                    Popular
                  </span>
                )}

                <div className="flex items-center gap-2 mb-3">
                  <div className={`h-8 w-8 rounded-lg flex items-center justify-center border ${accents.iconWrap}`}>
                    <Icon className={`h-4 w-4 ${accents.icon}`} />
                  </div>
                  <h2 className="text-lg font-bold">{tier.name}</h2>
                  {isCurrent && (
                    <span className="ml-auto text-[9px] font-bold uppercase tracking-wider px-1.5 py-0.5 rounded-full bg-emerald-500/15 border border-emerald-400/30 text-emerald-400 whitespace-nowrap">
                      Current
                    </span>
                  )}
                </div>

                <p className="text-xs text-gray-400 mb-4 line-clamp-2">{tier.description}</p>

                <div className="mb-5">
                  <span className="text-3xl font-bold tabular-nums">{displayPrice}</span>
                  {tier.id !== 'free' && (
                    <span className="text-gray-500 text-xs ml-1">{isAnnual ? '/year' : '/month'}</span>
                  )}
                </div>

                <button
                  disabled={!hasPrice || isCurrent || loading}
                  onClick={() => {
                    // Only collector & investor are wired on the API today.
                    // Pro checkout will be enabled once the API schema accepts it.
                    if (tier.id === 'collector' || tier.id === 'investor') {
                      startCheckout.mutate(tier.id);
                    }
                  }}
                  className={`w-full py-2.5 px-3 rounded-lg font-semibold text-xs transition-all flex items-center justify-center gap-2 ${
                    !hasPrice
                      ? 'bg-white/5 border border-white/10 text-gray-500 cursor-default'
                      : isCurrent
                      ? 'bg-white/5 border border-white/10 text-gray-500 cursor-default'
                      : tier.popular
                      ? 'bg-gradient-to-r from-grailiq-purple to-grailiq-purple-light text-white shadow-lg shadow-grailiq-purple/30 hover:shadow-grailiq-purple/50 hover:brightness-110'
                      : 'border border-white/15 bg-white/[0.03] text-white hover:border-white/25 hover:bg-white/[0.06]'
                  } disabled:cursor-not-allowed disabled:opacity-60`}
                >
                  {loading ? (
                    <>
                      <Loader2 className="h-3 w-3 animate-spin" />
                      Redirecting...
                    </>
                  ) : !hasPrice ? (
                    'Coming soon'
                  ) : isCurrent ? (
                    'Current plan'
                  ) : (
                    tier.ctaLabel
                  )}
                </button>

                <ul className="mt-4 space-y-1.5">
                  {tier.features.map((feature) => (
                    <li key={feature} className="flex items-start gap-2 text-xs text-gray-300">
                      <Check className="h-3 w-3 text-emerald-400 mt-0.5 flex-shrink-0" />
                      <span>{feature}</span>
                    </li>
                  ))}
                </ul>
              </div>
            </div>
          );
        })}
      </div>

      {startCheckout.isError && (
        <p className="text-center text-sm text-rose-400 mt-6">
          Checkout couldn't start — make sure prices are configured in Stripe and env vars are set.
        </p>
      )}

      {/* Comparison Table */}
      <div className="mt-16 mb-12">
        <h3 className="text-center text-xl font-bold text-white mb-8">Feature Comparison</h3>
        <div className="overflow-x-auto rounded-2xl border border-white/10">
          <table className="w-full text-sm">
            <thead>
              <tr className="border-b border-white/10 bg-white/[0.02]">
                <th className="px-4 py-3 text-left font-semibold text-white">Feature</th>
                <th className="px-4 py-3 text-center font-semibold text-gray-400">Free</th>
                <th className="px-4 py-3 text-center font-semibold text-white">Collector</th>
                <th className="px-4 py-3 text-center font-semibold text-white">Investor</th>
                <th className="px-4 py-3 text-center font-semibold text-gray-400">Pro</th>
              </tr>
            </thead>
            <tbody>
              {[
                { feature: 'Set browsing', free: true, collector: true, investor: true, pro: false },
                { feature: 'GrailIQ Score', free: true, collector: true, investor: true, pro: false },
                { feature: 'Portfolio tracking', free: '10 items', collector: 'Unlimited', investor: 'Unlimited', pro: false },
                { feature: 'Restock alerts', free: '3 alerts', collector: 'Unlimited (email)', investor: 'Unlimited (push+email)', pro: 'Unlimited (push)' },
                { feature: 'Watchlist', free: '5 items', collector: 'Unlimited', investor: 'Unlimited', pro: 'Unlimited' },
                { feature: 'Weekly digest', free: false, collector: false, investor: true, pro: false },
                { feature: 'API access', free: false, collector: false, investor: true, pro: false },
                { feature: 'Bulk export (CSV/PDF)', free: false, collector: 'CSV', investor: 'CSV + PDF', pro: false },
                { feature: 'Price target alerts', free: false, collector: true, investor: true, pro: true },
                { feature: 'Real-time score updates', free: 'Daily', collector: 'Daily', investor: 'Hourly', pro: 'Hourly' },
                { feature: 'Priority support', free: false, collector: false, investor: true, pro: true },
              ].map((row, idx) => (
                <tr key={idx} className="border-b border-white/5 hover:bg-white/[0.02] transition-colors">
                  <td className="px-4 py-3 font-medium text-gray-300">{row.feature}</td>
                  <td className="px-4 py-3 text-center">
                    {row.free === true ? (
                      <Check className="h-4 w-4 text-emerald-400 mx-auto" />
                    ) : row.free === false ? (
                      <span className="text-gray-600">—</span>
                    ) : (
                      <span className="text-xs text-gray-400">{row.free}</span>
                    )}
                  </td>
                  <td className="px-4 py-3 text-center">
                    {row.collector === true ? (
                      <Check className="h-4 w-4 text-emerald-400 mx-auto" />
                    ) : row.collector === false ? (
                      <span className="text-gray-600">—</span>
                    ) : (
                      <span className="text-xs text-gray-300">{row.collector}</span>
                    )}
                  </td>
                  <td className="px-4 py-3 text-center">
                    {row.investor === true ? (
                      <Check className="h-4 w-4 text-emerald-400 mx-auto" />
                    ) : row.investor === false ? (
                      <span className="text-gray-600">—</span>
                    ) : (
                      <span className="text-xs text-gray-300 font-semibold">{row.investor}</span>
                    )}
                  </td>
                  <td className="px-4 py-3 text-center">
                    {row.pro === true ? (
                      <Check className="h-4 w-4 text-emerald-400 mx-auto" />
                    ) : row.pro === false ? (
                      <span className="text-gray-600">—</span>
                    ) : (
                      <span className="text-xs text-gray-400">{row.pro}</span>
                    )}
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>

      <div className="mt-12 space-y-4 max-w-3xl mx-auto">
        <p className="text-center text-xs text-gray-500">
          All plans: SSL encryption, Supabase-backed auth, Stripe-secured payments. Cancel anytime.
        </p>
        <div className="rounded-lg border border-white/10 bg-white/[0.02] p-4 text-center">
          <p className="text-xs text-gray-400">
            <strong className="text-white">Push notifications:</strong> Available on iOS and Android apps.
            Web users receive email alerts only.{' '}
            <a href="/app/sets" className="text-grailiq-purple-light hover:text-grailiq-purple-light/80">
              Download the app
            </a>{' '}
            to get instant push alerts when products restock.
          </p>
        </div>
      </div>
    </div>
  );
}
