import { Link } from 'react-router-dom';
import {
  TrendingUp,
  Bell,
  BarChart3,
  Shield,
  Zap,
  Eye,
  ArrowRight,
  Star,
  ChevronRight,
  LineChart,
  Package,
  Wallet,
} from 'lucide-react';

/* ─── Feature Card ──────────────────────────────────────────── */
function FeatureCard({
  icon: Icon,
  title,
  description,
}: {
  icon: React.ElementType;
  title: string;
  description: string;
}) {
  return (
    <div className="group relative rounded-2xl border border-white/10 bg-white/[0.03] p-8 transition-all hover:border-grailiq-purple/40 hover:bg-white/[0.06]">
      <div className="mb-5 inline-flex h-12 w-12 items-center justify-center rounded-xl bg-grailiq-purple/15 text-grailiq-purple transition-colors group-hover:bg-grailiq-purple/25">
        <Icon size={24} />
      </div>
      <h3 className="mb-2 text-lg font-semibold text-white">{title}</h3>
      <p className="text-sm leading-relaxed text-gray-400">{description}</p>
    </div>
  );
}

/* ─── Stat Block ────────────────────────────────────────────── */
function Stat({ value, label }: { value: string; label: string }) {
  return (
    <div className="text-center">
      <p className="text-3xl font-bold text-white md:text-4xl">{value}</p>
      <p className="mt-1 text-sm text-gray-400">{label}</p>
    </div>
  );
}

/* ─── Landing Page ──────────────────────────────────────────── */
export default function Landing() {
  return (
    <div className="min-h-screen bg-grailiq-dark text-white">
      {/* Navigation */}
      <nav className="fixed top-0 z-50 w-full border-b border-white/5 bg-grailiq-dark/80 backdrop-blur-xl">
        <div className="mx-auto flex h-16 max-w-7xl items-center justify-between px-6">
          <Link to="/" className="flex items-center gap-1 text-xl font-bold tracking-tight">
            Grail<span className="text-grailiq-purple">IQ</span>
          </Link>
          <div className="hidden items-center gap-8 md:flex">
            <a href="#features" className="text-sm text-gray-400 transition-colors hover:text-white">
              Features
            </a>
            <a href="#how-it-works" className="text-sm text-gray-400 transition-colors hover:text-white">
              How It Works
            </a>
            <a href="#pricing" className="text-sm text-gray-400 transition-colors hover:text-white">
              Pricing
            </a>
          </div>
          <div className="flex items-center gap-3">
            <Link
              to="/sign-in"
              className="rounded-lg px-4 py-2 text-sm font-medium text-gray-300 transition-colors hover:text-white"
            >
              Sign In
            </Link>
            <Link
              to="/sign-in"
              className="rounded-lg bg-grailiq-purple px-5 py-2 text-sm font-semibold text-white shadow-lg shadow-grailiq-purple/25 transition-all hover:bg-grailiq-purple-light hover:shadow-grailiq-purple/40"
            >
              Get Started Free
            </Link>
          </div>
        </div>
      </nav>

      {/* Hero Section */}
      <section className="relative overflow-hidden pt-32 pb-20 md:pt-44 md:pb-32">
        {/* Background gradient effects */}
        <div className="pointer-events-none absolute inset-0">
          <div className="absolute top-20 left-1/2 h-[600px] w-[800px] -translate-x-1/2 rounded-full bg-grailiq-purple/10 blur-[128px]" />
          <div className="absolute -top-20 -right-40 h-96 w-96 rounded-full bg-grailiq-purple/5 blur-[96px]" />
        </div>

        <div className="relative mx-auto max-w-7xl px-6">
          <div className="mx-auto max-w-3xl text-center">
            {/* Badge */}
            <div className="mb-8 inline-flex items-center gap-2 rounded-full border border-grailiq-purple/30 bg-grailiq-purple/10 px-4 py-1.5 text-sm text-grailiq-purple-light">
              <Zap size={14} />
              <span>Pokemon TCG Price Intelligence</span>
            </div>

            <h1 className="text-4xl font-extrabold leading-tight tracking-tight md:text-6xl lg:text-7xl">
              Know what your{' '}
              <span className="bg-gradient-to-r from-grailiq-purple to-grailiq-purple-light bg-clip-text text-transparent">
                grails
              </span>{' '}
              are worth
            </h1>

            <p className="mx-auto mt-6 max-w-2xl text-lg leading-relaxed text-gray-400 md:text-xl">
              Real-time price tracking, investment signals, and portfolio analytics for Pokemon TCG
              sealed products. Stop guessing — start investing with data.
            </p>

            {/* CTA Buttons */}
            <div className="mt-10 flex flex-col items-center justify-center gap-4 sm:flex-row">
              <Link
                to="/sign-in"
                className="group flex items-center gap-2 rounded-xl bg-grailiq-purple px-8 py-3.5 text-base font-semibold text-white shadow-xl shadow-grailiq-purple/25 transition-all hover:bg-grailiq-purple-light hover:shadow-grailiq-purple/40"
              >
                Start Free
                <ArrowRight size={18} className="transition-transform group-hover:translate-x-0.5" />
              </Link>
              <a
                href="#features"
                className="flex items-center gap-2 rounded-xl border border-white/10 px-8 py-3.5 text-base font-medium text-gray-300 transition-all hover:border-white/20 hover:text-white"
              >
                See How It Works
              </a>
            </div>

            {/* Social proof */}
            <div className="mt-14 flex flex-wrap items-center justify-center gap-8 md:gap-12">
              <Stat value="500+" label="Products Tracked" />
              <div className="hidden h-8 w-px bg-white/10 md:block" />
              <Stat value="30+" label="TCG Sets" />
              <div className="hidden h-8 w-px bg-white/10 md:block" />
              <Stat value="24/7" label="Price Monitoring" />
            </div>
          </div>
        </div>
      </section>

      {/* Features Section */}
      <section id="features" className="relative py-24 md:py-32">
        <div className="mx-auto max-w-7xl px-6">
          <div className="mx-auto mb-16 max-w-2xl text-center">
            <p className="mb-3 text-sm font-semibold uppercase tracking-wider text-grailiq-purple">
              Features
            </p>
            <h2 className="text-3xl font-bold md:text-4xl">
              Everything you need to invest smarter
            </h2>
            <p className="mt-4 text-gray-400">
              From price tracking to investment signals — GrailIQ gives you the edge in the sealed
              product market.
            </p>
          </div>

          <div className="grid gap-6 md:grid-cols-2 lg:grid-cols-3">
            <FeatureCard
              icon={LineChart}
              title="Live Price Tracking"
              description="Monitor prices from TCGPlayer, eBay sold listings, and more. See historical trends across 7-day, 30-day, 90-day, and all-time windows."
            />
            <FeatureCard
              icon={TrendingUp}
              title="Investment Signals"
              description="AI-powered buy, hold, and sell signals based on price trends, volatility, and market sentiment. Know when to make your move."
            />
            <FeatureCard
              icon={BarChart3}
              title="GrailIQ Score"
              description="Every product gets a proprietary score combining price momentum, scarcity, demand, and long-term value potential."
            />
            <FeatureCard
              icon={Wallet}
              title="Portfolio Tracker"
              description="Track your entire sealed collection with purchase prices, current values, and P&L. See your total portfolio performance at a glance."
            />
            <FeatureCard
              icon={Bell}
              title="Price Alerts"
              description="Set custom alerts for price drops, buy signals, or when a product hits your target price. Never miss an opportunity."
            />
            <FeatureCard
              icon={Package}
              title="Set Explorer"
              description="Browse every Pokemon TCG set with all sealed products — booster boxes, ETBs, collection boxes, and more. Compare prices across retailers."
            />
          </div>
        </div>
      </section>

      {/* How It Works */}
      <section id="how-it-works" className="relative border-t border-white/5 py-24 md:py-32">
        <div className="mx-auto max-w-7xl px-6">
          <div className="mx-auto mb-16 max-w-2xl text-center">
            <p className="mb-3 text-sm font-semibold uppercase tracking-wider text-grailiq-purple">
              How It Works
            </p>
            <h2 className="text-3xl font-bold md:text-4xl">Three steps to smarter investing</h2>
          </div>

          <div className="grid gap-12 md:grid-cols-3 md:gap-8">
            {[
              {
                step: '01',
                icon: Eye,
                title: 'Track',
                desc: 'Browse products across all Pokemon TCG sets. We track sealed product prices from major retailers and marketplaces in real time.',
              },
              {
                step: '02',
                icon: BarChart3,
                title: 'Analyze',
                desc: 'See price history charts, GrailIQ scores, and investment signals. Our algorithms identify the best opportunities before the market catches on.',
              },
              {
                step: '03',
                icon: TrendingUp,
                title: 'Invest',
                desc: 'Build your portfolio, set price alerts, and make data-driven buying and selling decisions. Track your gains over time.',
              },
            ].map((item) => (
              <div key={item.step} className="relative text-center">
                <div className="mx-auto mb-6 flex h-16 w-16 items-center justify-center rounded-2xl bg-grailiq-purple/15 text-grailiq-purple">
                  <item.icon size={28} />
                </div>
                <span className="mb-2 block text-xs font-bold uppercase tracking-widest text-grailiq-purple/60">
                  Step {item.step}
                </span>
                <h3 className="mb-3 text-xl font-bold text-white">{item.title}</h3>
                <p className="text-sm leading-relaxed text-gray-400">{item.desc}</p>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* Pricing Teaser */}
      <section id="pricing" className="relative border-t border-white/5 py-24 md:py-32">
        <div className="mx-auto max-w-7xl px-6">
          <div className="mx-auto max-w-3xl text-center">
            <p className="mb-3 text-sm font-semibold uppercase tracking-wider text-grailiq-purple">
              Pricing
            </p>
            <h2 className="text-3xl font-bold md:text-4xl">Start free. Scale when you're ready.</h2>
            <p className="mt-4 text-gray-400">
              Get full access to price tracking, portfolio management, and investment signals.
            </p>
          </div>

          <div className="mx-auto mt-12 grid max-w-4xl gap-8 md:grid-cols-2">
            {/* Free Tier */}
            <div className="rounded-2xl border border-white/10 bg-white/[0.03] p-8">
              <h3 className="text-lg font-semibold text-white">Free</h3>
              <p className="mt-1 text-sm text-gray-400">Perfect for getting started</p>
              <p className="mt-6">
                <span className="text-4xl font-bold text-white">$0</span>
                <span className="text-gray-400"> / month</span>
              </p>
              <Link
                to="/sign-in"
                className="mt-8 block rounded-xl border border-white/10 py-3 text-center text-sm font-semibold text-white transition-all hover:border-white/20 hover:bg-white/5"
              >
                Get Started
              </Link>
              <ul className="mt-8 space-y-3 text-sm text-gray-400">
                {[
                  'Track up to 50 products',
                  'Price history (30 days)',
                  'Portfolio tracker',
                  '5 price alerts',
                  'GrailIQ scores',
                ].map((f) => (
                  <li key={f} className="flex items-start gap-2">
                    <Star size={14} className="mt-0.5 shrink-0 text-grailiq-purple" />
                    {f}
                  </li>
                ))}
              </ul>
            </div>

            {/* Pro Tier */}
            <div className="relative rounded-2xl border border-grailiq-purple/40 bg-grailiq-purple/5 p-8">
              <div className="absolute -top-3 right-8 rounded-full bg-grailiq-purple px-3 py-0.5 text-xs font-semibold text-white">
                Popular
              </div>
              <h3 className="text-lg font-semibold text-white">Pro</h3>
              <p className="mt-1 text-sm text-gray-400">For serious collectors & investors</p>
              <p className="mt-6">
                <span className="text-4xl font-bold text-white">$9</span>
                <span className="text-gray-400"> / month</span>
              </p>
              <Link
                to="/sign-in"
                className="mt-8 block rounded-xl bg-grailiq-purple py-3 text-center text-sm font-semibold text-white shadow-lg shadow-grailiq-purple/25 transition-all hover:bg-grailiq-purple-light"
              >
                Start Free Trial
              </Link>
              <ul className="mt-8 space-y-3 text-sm text-gray-400">
                {[
                  'Unlimited product tracking',
                  'Full price history (all time)',
                  'Advanced portfolio analytics',
                  'Unlimited price alerts',
                  'Investment signals (buy/hold/sell)',
                  'Priority data updates',
                  'Export to CSV',
                ].map((f) => (
                  <li key={f} className="flex items-start gap-2">
                    <Star size={14} className="mt-0.5 shrink-0 text-grailiq-purple" />
                    {f}
                  </li>
                ))}
              </ul>
            </div>
          </div>
        </div>
      </section>

      {/* Final CTA */}
      <section className="relative border-t border-white/5 py-24 md:py-32">
        <div className="pointer-events-none absolute inset-0">
          <div className="absolute bottom-0 left-1/2 h-[400px] w-[600px] -translate-x-1/2 rounded-full bg-grailiq-purple/8 blur-[120px]" />
        </div>
        <div className="relative mx-auto max-w-3xl px-6 text-center">
          <h2 className="text-3xl font-bold md:text-4xl">
            Ready to level up your collection?
          </h2>
          <p className="mt-4 text-lg text-gray-400">
            Join GrailIQ today and start making data-driven investment decisions for Pokemon TCG
            sealed products.
          </p>
          <Link
            to="/sign-in"
            className="group mt-10 inline-flex items-center gap-2 rounded-xl bg-grailiq-purple px-10 py-4 text-base font-semibold text-white shadow-xl shadow-grailiq-purple/25 transition-all hover:bg-grailiq-purple-light hover:shadow-grailiq-purple/40"
          >
            Create Free Account
            <ChevronRight size={18} className="transition-transform group-hover:translate-x-0.5" />
          </Link>
        </div>
      </section>

      {/* Footer */}
      <footer className="border-t border-white/5 py-12">
        <div className="mx-auto flex max-w-7xl flex-col items-center justify-between gap-4 px-6 md:flex-row">
          <div className="flex items-center gap-1 text-lg font-bold">
            Grail<span className="text-grailiq-purple">IQ</span>
          </div>
          <div className="flex gap-6 text-sm text-gray-500">
            <a href="#" className="transition-colors hover:text-gray-300">
              Privacy
            </a>
            <a href="#" className="transition-colors hover:text-gray-300">
              Terms
            </a>
            <a href="mailto:support@grailiq.com" className="transition-colors hover:text-gray-300">
              Contact
            </a>
          </div>
          <p className="text-sm text-gray-600">&copy; {new Date().getFullYear()} GrailIQ. All rights reserved.</p>
        </div>
      </footer>
    </div>
  );
}
