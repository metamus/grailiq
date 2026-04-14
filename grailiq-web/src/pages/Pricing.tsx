import { Check, Sparkles, Shield, Zap } from 'lucide-react';

const tiers = [
  {
    name: 'Free',
    price: '$0',
    period: 'forever',
    description: 'Get started tracking your collection',
    icon: Shield,
    iconColor: 'text-gray-400',
    iconBg: 'bg-gray-50',
    features: [
      '30-day price history',
      '10 portfolio items',
      '1 restock alert',
      'Basic set encyclopedia',
    ],
    cta: 'Get Started',
    ctaClass: 'bg-white border-2 border-gray-200 text-gray-900 hover:border-grailiq-purple hover:text-grailiq-purple',
    popular: false,
    gradient: '',
  },
  {
    name: 'Collector',
    price: '$9.99',
    period: '/month',
    annualPrice: '$95/year — save 21%',
    description: 'Full intelligence for serious collectors',
    icon: Sparkles,
    iconColor: 'text-grailiq-purple',
    iconBg: 'bg-violet-50',
    features: [
      'Full price history (all time)',
      'Unlimited portfolio items',
      '10 restock alerts',
      'GrailIQ investment ratings',
      'Insurance PDF export',
      'CSV tax export',
    ],
    cta: 'Start 7-Day Free Trial',
    ctaClass: 'bg-grailiq-purple text-white hover:bg-grailiq-purple-dark shadow-lg shadow-grailiq-purple/25',
    popular: true,
    gradient: 'from-violet-600/20 to-fuchsia-600/10',
  },
  {
    name: 'Investor',
    price: '$24.99',
    period: '/month',
    annualPrice: '$239/year — save 20%',
    description: 'Maximum edge for portfolio managers',
    icon: Zap,
    iconColor: 'text-amber-500',
    iconBg: 'bg-amber-50',
    features: [
      'Everything in Collector',
      'Unlimited restock alerts',
      'Priority alert delivery',
      'Portfolio analytics dashboard',
      'Weekly market intelligence email',
      'API access',
    ],
    cta: 'Start 7-Day Free Trial',
    ctaClass: 'bg-grailiq-dark text-white hover:bg-grailiq-dark-lighter shadow-lg shadow-black/20',
    popular: false,
    gradient: '',
  },
];

/** Pricing page — premium redesign */
export default function Pricing() {
  return (
    <div className="max-w-5xl mx-auto">
      {/* Header */}
      <div className="text-center mb-12">
        <div className="inline-flex items-center gap-2 px-3 py-1.5 rounded-full bg-grailiq-light text-grailiq-purple text-xs font-semibold uppercase tracking-wider mb-4">
          <Sparkles className="h-3.5 w-3.5" />
          Pricing
        </div>
        <h1 className="text-3xl sm:text-4xl font-bold text-gray-900">
          Choose Your Plan
        </h1>
        <p className="text-gray-500 mt-3 max-w-md mx-auto">
          Start free, upgrade when you need more. All paid plans include a 7-day free trial.
        </p>
      </div>

      {/* Tier Cards */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
        {tiers.map((tier) => {
          const Icon = tier.icon;

          return (
            <div
              key={tier.name}
              className={`relative rounded-2xl border overflow-hidden transition-all ${
                tier.popular
                  ? 'border-grailiq-purple/40 shadow-xl shadow-grailiq-purple/10 scale-[1.02]'
                  : 'border-gray-100 bg-white hover:border-grailiq-purple/20 hover:shadow-lg hover:shadow-grailiq-purple/5'
              }`}
            >
              {/* Popular badge */}
              {tier.popular && (
                <>
                  <div className={`absolute inset-0 bg-gradient-to-br ${tier.gradient} pointer-events-none`} />
                  <div className="absolute top-0 left-0 right-0 h-1 bg-gradient-to-r from-violet-500 to-fuchsia-500" />
                </>
              )}

              <div className="relative p-6">
                {/* Popular label */}
                {tier.popular && (
                  <span className="inline-flex items-center gap-1.5 text-[11px] font-semibold uppercase tracking-wider px-2.5 py-1 rounded-full bg-grailiq-purple/15 text-grailiq-purple mb-4">
                    <Sparkles className="h-3 w-3" />
                    Most Popular
                  </span>
                )}

                {/* Icon + Name */}
                <div className="flex items-center gap-3 mb-3">
                  <div className={`h-10 w-10 rounded-xl ${tier.iconBg} flex items-center justify-center`}>
                    <Icon className={`h-5 w-5 ${tier.iconColor}`} />
                  </div>
                  <h2 className="text-xl font-bold text-gray-900">{tier.name}</h2>
                </div>

                <p className="text-sm text-gray-500 mb-5">{tier.description}</p>

                {/* Price */}
                <div className="mb-6">
                  <span className="text-4xl font-bold text-gray-900">{tier.price}</span>
                  <span className="text-gray-400 text-sm ml-1">{tier.period}</span>
                  {tier.annualPrice && (
                    <p className="text-xs font-medium text-grailiq-green mt-1.5">{tier.annualPrice}</p>
                  )}
                </div>

                {/* CTA */}
                <button
                  className={`w-full py-3 px-4 rounded-xl font-semibold text-sm transition-all ${tier.ctaClass}`}
                >
                  {tier.cta}
                </button>

                {/* Feature list */}
                <ul className="mt-6 space-y-3">
                  {tier.features.map((feature) => (
                    <li key={feature} className="flex items-start gap-2.5 text-sm text-gray-600">
                      <div className="h-5 w-5 rounded-full bg-grailiq-light flex items-center justify-center flex-shrink-0 mt-0.5">
                        <Check className="h-3 w-3 text-grailiq-purple" />
                      </div>
                      {feature}
                    </li>
                  ))}
                </ul>
              </div>
            </div>
          );
        })}
      </div>

      {/* Footer note */}
      <p className="text-center text-xs text-gray-400 mt-10">
        All plans include SSL encryption and Supabase-backed security. Cancel anytime.
      </p>
    </div>
  );
}
