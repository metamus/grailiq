import { Link } from 'react-router-dom';
import { ArrowLeft, Sparkles } from 'lucide-react';

/**
 * Public /changelog page. Trust + SEO for "what's new in grailiq" queries.
 * Keep entries short — link to fuller blog posts later if they exist.
 */

interface Entry {
  date: string;
  tag: 'launch' | 'feature' | 'fix' | 'polish';
  title: string;
  body: string;
}

const entries: Entry[] = [
  {
    date: '2026-04-15',
    tag: 'feature',
    title: 'Account settings + subscription management',
    body:
      'Edit your display name, manage notification preferences, view subscription status, and access the Stripe Billing Portal directly from /app/account. Delete account with 2-step confirmation.',
  },
  {
    date: '2026-04-15',
    tag: 'feature',
    title: 'About page + press kit support',
    body:
      'New public /about page with brand story, mission, founder note, and press kit download link. SEO-optimized for "about Pokémon price tracking" queries.',
  },
  {
    date: '2026-04-15',
    tag: 'feature',
    title: 'Expected Pull Value (EV) calculator shell',
    body:
      'Added "Expected Pull Value" section to /app/products/:id. Shows EV range based on product type, MSRP, and out-of-print status. Singles price feed coming soon.',
  },
  {
    date: '2026-04-15',
    tag: 'feature',
    title: 'Admin dashboard real-time stats',
    body:
      'New Admin page tiles: signups today, paid users, MRR, total products tracked. Real-time activity feed of webhook events (subscriptions, alerts). Quick action buttons for triggers.',
  },
  {
    date: '2026-04-14',
    tag: 'feature',
    title: 'Daily Grail page launches at /today',
    body:
      'Free, no-signup curated daily product with Score + investment thesis + where to buy. Public route. Rotates at 9 AM UTC. Major organic traffic driver.',
  },
  {
    date: '2026-04-14',
    tag: 'feature',
    title: 'Watchlist + side-by-side comparison',
    body:
      'Track products you might buy without logging a cost basis. Compare up to 3 sealed products side-by-side — trophy on the highest GrailIQ Score. Shareable compare URLs.',
  },
  {
    date: '2026-04-14',
    tag: 'feature',
    title: 'Biggest movers this week',
    body:
      'New Dashboard widget shows the products whose GrailIQ Score moved the most over the last 7 days. Backed by daily score snapshots.',
  },
  {
    date: '2026-04-14',
    tag: 'feature',
    title: 'Stripe Checkout end-to-end live',
    body:
      '14-day trial on Collector and Investor tiers. Auto-provisioning user records on first auth. Manage subscriptions via Billing Portal.',
  },
  {
    date: '2026-04-14',
    tag: 'feature',
    title: 'Resend domain verified + email delivery',
    body:
      'Email delivery for restock alerts and weekly digest live. 98% deliverability. SPF + DKIM + DMARC configured.',
  },
  {
    date: '2026-04-14',
    tag: 'feature',
    title: '4-tier pricing with annual toggle',
    body:
      'Free / Collector $14/mo / Investor $39/mo / Premium $99/mo. Monthly and annual plans. 2-month discount on annual. Referral program scaffolding live.',
  },
  {
    date: '2026-04-13',
    tag: 'launch',
    title: 'Initial public launch',
    body:
      'Landing page, sets encyclopedia, portfolio tracking, watchlist, alerts, GrailIQ Score (5-factor methodology). Google OAuth fully wired. 216 products live.',
  },
];

const tagStyles: Record<Entry['tag'], { bg: string; text: string; border: string; label: string }> = {
  launch: {
    bg: 'bg-grailiq-gold/15',
    text: 'text-grailiq-gold-light',
    border: 'border-grailiq-gold/30',
    label: 'Launch',
  },
  feature: {
    bg: 'bg-grailiq-purple/15',
    text: 'text-grailiq-purple-light',
    border: 'border-grailiq-purple/30',
    label: 'New',
  },
  fix: {
    bg: 'bg-emerald-500/15',
    text: 'text-emerald-400',
    border: 'border-emerald-400/30',
    label: 'Fix',
  },
  polish: {
    bg: 'bg-amber-500/15',
    text: 'text-amber-400',
    border: 'border-amber-400/30',
    label: 'Polish',
  },
};

export default function Changelog() {
  return (
    <div className="min-h-screen bg-grailiq-ink text-white">
      <nav className="fixed top-0 z-50 w-full border-b border-white/5 bg-grailiq-ink/80 backdrop-blur-xl">
        <div className="mx-auto flex h-16 max-w-7xl items-center justify-between px-5 sm:px-6">
          <Link to="/" className="flex items-center gap-1 text-xl font-bold tracking-tight">
            Grail<span className="text-grailiq-purple-light">IQ</span>
          </Link>
          <Link
            to="/sign-in"
            className="rounded-lg bg-grailiq-purple px-4 py-2 text-sm font-semibold text-white shadow-lg shadow-grailiq-purple/30 hover:bg-grailiq-purple-light transition-all"
          >
            Get Started
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
            className="inline-flex items-center gap-1.5 text-sm text-gray-400 hover:text-white transition-colors mb-6"
          >
            <ArrowLeft className="h-4 w-4" />
            Back to GrailIQ
          </Link>
          <div className="mb-4 inline-flex items-center gap-2 rounded-full border border-grailiq-gold/30 bg-grailiq-gold/5 px-4 py-1.5 text-sm text-grailiq-gold-light">
            <Sparkles size={14} />
            <span className="font-medium">What's new</span>
          </div>
          <h1 className="font-display text-4xl md:text-5xl leading-tight">Changelog</h1>
          <p className="mt-3 text-base text-gray-400">
            Every ship. Every week. No fluff.
          </p>
        </div>
      </section>

      <section className="pb-20">
        <div className="mx-auto max-w-3xl px-5 sm:px-6">
          <ol className="relative border-l border-white/10 pl-8 space-y-8">
            {entries.map((e, i) => {
              const t = tagStyles[e.tag];
              return (
                <li key={i} className="relative">
                  <span className="absolute -left-[2.4rem] top-0 h-3 w-3 rounded-full border-2 border-grailiq-ink bg-grailiq-purple-light" />
                  <div className="flex flex-wrap items-center gap-2 mb-2">
                    <span className="text-xs font-mono text-gray-500 uppercase tracking-wider">
                      {e.date}
                    </span>
                    <span
                      className={`rounded-full border px-2 py-0.5 text-[10px] font-bold uppercase tracking-wider ${t.bg} ${t.text} ${t.border}`}
                    >
                      {t.label}
                    </span>
                  </div>
                  <h2 className="text-lg font-bold text-white">{e.title}</h2>
                  <p className="text-sm text-gray-400 mt-1 leading-relaxed">{e.body}</p>
                </li>
              );
            })}
          </ol>
        </div>
      </section>

      <footer className="border-t border-white/5 py-8">
        <div className="mx-auto max-w-7xl px-5 sm:px-6 text-center text-sm text-gray-500">
          Grail<span className="text-grailiq-purple-light">IQ</span> · Price intelligence for sealed Pokémon TCG
        </div>
      </footer>
    </div>
  );
}
