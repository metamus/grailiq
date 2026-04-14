import { Link } from 'react-router-dom';
import { ArrowLeft } from 'lucide-react';

/**
 * Public privacy policy. App-store compliant skeleton.
 *
 * NOT legal advice — the user should have this reviewed by counsel before
 * submitting to the App Store / Play Store. It's written to cover the
 * categories that Apple and Google require, in plain language.
 */
export default function Privacy() {
  const effectiveDate = 'April 14, 2026';

  return (
    <LegalPage title="Privacy Policy" effectiveDate={effectiveDate}>
      <Section title="TL;DR">
        <p>
          We keep almost nothing about you. Your email and a hashed password (via Supabase Auth),
          the products you track, your cost basis if you choose to enter it, and anonymous
          page-view events to understand what works. That's it.
        </p>
        <p>
          No ad networks, no selling data, no creepy trackers. If we ever change that, we'll tell
          you in a changelog entry and via email before it takes effect.
        </p>
      </Section>

      <Section title="Who we are">
        <p>
          GrailIQ ("we", "us") is a price-intelligence platform for sealed Pokémon TCG products.
          Contact: <A href="mailto:privacy@grailiq.com">privacy@grailiq.com</A>.
        </p>
      </Section>

      <Section title="What we collect">
        <ul>
          <li>
            <strong>Account</strong>: email, optional display name, OAuth provider ID if you sign
            in with Google or Apple.
          </li>
          <li>
            <strong>Portfolio + watchlist</strong>: products you log, quantities, cost basis,
            purchase date (only if you enter them), and notes.
          </li>
          <li>
            <strong>Alerts</strong>: products + retailers you're watching, plus the Expo push
            token your device sent us.
          </li>
          <li>
            <strong>Usage analytics</strong>: page views, button clicks, tier upgrades.
            IP addresses are SHA-256-hashed before storage; we never see the raw IP.
          </li>
          <li>
            <strong>Billing</strong>: managed by Stripe. We store your Stripe customer ID but
            never see your card number.
          </li>
        </ul>
      </Section>

      <Section title="What we don't collect">
        <ul>
          <li>We don't use advertising SDKs, pixels, or remarketing tags.</li>
          <li>We don't sell personal data to anyone.</li>
          <li>We don't track you across other apps or websites.</li>
          <li>We don't use your data to train third-party AI models.</li>
        </ul>
      </Section>

      <Section title="Who we share data with (processors)">
        <ul>
          <li>
            <strong>Supabase</strong> — authentication + Postgres database. Stores your email,
            portfolio data, and alert settings.
          </li>
          <li>
            <strong>Stripe</strong> — subscription billing. Handles your card; we never see it.
          </li>
          <li>
            <strong>Resend</strong> — transactional email (restock notifications, weekly digest).
          </li>
          <li>
            <strong>Expo</strong> — push notification delivery for the mobile app.
          </li>
          <li>
            <strong>Cloudflare</strong> — web hosting + DDoS protection.
          </li>
          <li>
            <strong>Railway</strong> — API hosting.
          </li>
        </ul>
      </Section>

      <Section title="Your rights">
        <p>
          You can request a copy of all data we hold about you, correct anything that's wrong, or
          delete your account entirely. Email <A href="mailto:privacy@grailiq.com">privacy@grailiq.com</A>{' '}
          and we'll respond within 30 days (usually the same week).
        </p>
        <p>
          EU and UK users: this is your GDPR Article 15 (access), 16 (rectification), and 17
          (erasure) right. California users: this is your CCPA access + deletion right.
        </p>
      </Section>

      <Section title="Data retention">
        <p>
          Account + portfolio data lives as long as your account does. When you delete, we purge
          within 30 days. Analytics events are retained for 24 months in aggregated form
          (nothing personally identifiable remains after that window).
        </p>
      </Section>

      <Section title="Children">
        <p>
          GrailIQ is not directed at children under 13. If you believe a child under 13 has
          created an account, email <A href="mailto:privacy@grailiq.com">privacy@grailiq.com</A>{' '}
          and we'll delete it.
        </p>
      </Section>

      <Section title="Changes">
        <p>
          Material changes get announced in our <Link className="text-grailiq-purple-light hover:text-white" to="/changelog">changelog</Link>{' '}
          and, for anything that widens data collection, via email at least 30 days before the change
          takes effect.
        </p>
      </Section>
    </LegalPage>
  );
}

function Section({ title, children }: { title: string; children: React.ReactNode }) {
  return (
    <section className="mt-8">
      <h2 className="text-lg font-bold text-white">{title}</h2>
      <div className="mt-2 space-y-2 text-sm leading-relaxed text-gray-300">{children}</div>
    </section>
  );
}

function A({ href, children }: { href: string; children: React.ReactNode }) {
  return (
    <a
      href={href}
      className="text-grailiq-purple-light hover:text-white underline underline-offset-2"
    >
      {children}
    </a>
  );
}

export function LegalPage({
  title,
  effectiveDate,
  children,
}: {
  title: string;
  effectiveDate: string;
  children: React.ReactNode;
}) {
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

      <div className="pt-28 pb-20">
        <div className="mx-auto max-w-3xl px-5 sm:px-6">
          <Link
            to="/"
            className="inline-flex items-center gap-1.5 text-sm text-gray-400 hover:text-white transition-colors mb-6"
          >
            <ArrowLeft className="h-4 w-4" />
            Back to GrailIQ
          </Link>
          <h1 className="font-display text-4xl md:text-5xl">{title}</h1>
          <p className="mt-2 text-sm text-gray-500">Effective {effectiveDate}</p>
          {children}

          <hr className="my-12 border-white/5" />
          <p className="text-xs text-gray-500">
            Questions? Email{' '}
            <A href="mailto:privacy@grailiq.com">privacy@grailiq.com</A>.
          </p>
        </div>
      </div>
    </div>
  );
}
