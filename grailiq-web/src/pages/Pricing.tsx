import { Check, Sparkles, Shield, Zap, CreditCard, Loader2 } from 'lucide-react';
import {
  useSubscription,
  useStartCheckout,
  useOpenBillingPortal,
} from '@/hooks/useStripe';

interface Tier {
  id: 'free' | 'collector' | 'investor';
  name: string;
  price: string;
  period: string;
  annualPrice?: string;
  description: string;
  icon: typeof Shield;
  accent: 'slate' | 'purple' | 'gold';
  features: string[];
  ctaLabel: string;
  popular?: boolean;
}

const tiers: Tier[] = [
  {
    id: 'free',
    name: 'Free',
    price: '$0',
    period: 'forever',
    description: 'Get started tracking your collection',
    icon: Shield,
    accent: 'slate',
    features: [
      '30-day price history',
      '25 portfolio items',
      '3 restock alerts',
      'Basic set encyclopedia',
    ],
    ctaLabel: 'Current plan',
  },
  {
    id: 'collector',
    name: 'Collector',
    price: '$9.99',
    period: '/month',
    annualPrice: '$95/year — save 21%',
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
    ctaLabel: 'Start 14-day trial',
    popular: true,
  },
  {
    id: 'investor',
    name: 'Investor',
    price: '$24.99',
    period: '/month',
    annualPrice: '$239/year — save 20%',
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
    ctaLabel: 'Start 14-day trial',
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
};

/** Pricing page — dark theme, wired to Stripe Checkout + Billing Portal. */
export default function Pricing() {
  const { data: subscription } = useSubscription();
  const startCheckout = useStartCheckout();
  const openPortal = useOpenBillingPortal();

  const currentTier = subscription?.tier ?? 'free';

  return (
    <div className="max-w-5xl mx-auto text-white">
      {/* Header */}
      <div className="text-center mb-10">
        <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full border border-grailiq-gold/30 bg-grailiq-gold/5 text-grailiq-gold-light text-[11px] font-semibold uppercase tracking-wider mb-4">
          <Sparkles className="h-3 w-3" />
          Pricing
        </div>
        <h1 className="text-3xl sm:text-4xl font-bold">Choose your plan</h1>
        <p className="text-gray-400 mt-3 max-w-md mx-auto">
          Start free. Upgrade when you outgrow it. All paid plans include a 14-day free trial and
          you can cancel anytime from the billing portal.
        </p>
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
      <div className="grid grid-cols-1 md:grid-cols-3 gap-5">
        {tiers.map((tier) => {
          const Icon = tier.icon;
          const accents = accentClasses[tier.accent];
          const isCurrent = currentTier === tier.id;
          const loading = startCheckout.isPending && startCheckout.variables === tier.id;

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

              <div className="relative p-6">
                {tier.popular && (
                  <span className="inline-flex items-center gap-1.5 text-[10px] font-bold uppercase tracking-wider px-2.5 py-1 rounded-full bg-grailiq-purple/15 border border-grailiq-purple/30 text-grailiq-purple-light mb-4">
                    <Sparkles className="h-3 w-3" />
                    Most Popular
                  </span>
                )}

                <div className="flex items-center gap-3 mb-3">
                  <div className={`h-10 w-10 rounded-xl flex items-center justify-center border ${accents.iconWrap}`}>
                    <Icon className={`h-5 w-5 ${accents.icon}`} />
                  </div>
                  <h2 className="text-xl font-bold">{tier.name}</h2>
                  {isCurrent && (
                    <span className="ml-auto text-[10px] font-bold uppercase tracking-wider px-2 py-0.5 rounded-full bg-emerald-500/15 border border-emerald-400/30 text-emerald-400">
                      Current
                    </span>
                  )}
                </div>

                <p className="text-sm text-gray-400 mb-5">{tier.description}</p>

                <div className="mb-6">
                  <span className="text-4xl font-bold tabular-nums">{tier.price}</span>
                  <span className="text-gray-500 text-sm ml-1">{tier.period}</span>
                  {tier.annualPrice && (
                    <p className="text-xs font-medium text-emerald-400 mt-1.5">{tier.annualPrice}</p>
                  )}
                </div>

                <button
                  disabled={isCurrent || tier.id === 'free' || loading}
                  onClick={() => {
                    if (tier.id === 'collector' || tier.id === 'investor') {
                      startCheckout.mutate(tier.id);
                    }
                  }}
                  className={`w-full py-3 px-4 rounded-xl font-semibold text-sm transition-all flex items-center justify-center gap-2 ${
                    isCurrent
                      ? 'bg-white/5 border border-white/10 text-gray-500 cursor-default'
                      : tier.popular
                      ? 'bg-gradient-to-r from-grailiq-purple to-grailiq-purple-light text-white shadow-lg shadow-grailiq-purple/30 hover:shadow-grailiq-purple/50 hover:brightness-110'
                      : 'border border-white/15 bg-white/[0.03] text-white hover:border-white/25 hover:bg-white/[0.06]'
                  } disabled:cursor-not-allowed disabled:opacity-60`}
                >
                  {loading ? (
                    <>
                      <Loader2 className="h-4 w-4 animate-spin" />
                      Redirecting...
                    </>
                  ) : isCurrent ? (
                    'Current plan'
                  ) : (
                    tier.ctaLabel
                  )}
                </button>

                <ul className="mt-6 space-y-2.5">
                  {tier.features.map((feature) => (
                    <li key={feature} className="flex items-start gap-2 text-sm text-gray-300">
                      <Check className="h-4 w-4 text-emerald-400 mt-0.5 flex-shrink-0" />
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
          Checkout couldn't start — make sure the Collector / Investor prices are configured in
          Stripe and STRIPE_PRICE_COLLECTOR / STRIPE_PRICE_INVESTOR are set in the API environment.
        </p>
      )}

      <p className="text-center text-xs text-gray-500 mt-10">
        All plans: SSL encryption, Supabase-backed auth, Stripe-secured payments. Cancel anytime.
      </p>
    </div>
  );
}
