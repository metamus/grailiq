import { LegalPage } from './Privacy';

/**
 * Terms of Service. Like Privacy, this is a reasonable baseline, not legal
 * advice. Replace boilerplate clauses (jurisdiction, arbitration, etc.) with
 * language vetted by counsel before meaningful commercial launch.
 */
export default function Terms() {
  return (
    <LegalPage title="Terms of Service" effectiveDate="April 14, 2026">
      <Section title="The short version">
        <p>
          GrailIQ provides information about sealed Pokémon TCG prices and market signals. It's a
          research tool, not investment advice. Use your own judgment. Don't try to break the
          service for other users. If you subscribe, you can cancel anytime.
        </p>
      </Section>

      <Section title="1. Who this is between">
        <p>
          These terms are between you and GrailIQ ("we", "us"). By creating an account or using
          any part of the platform, you agree to them.
        </p>
      </Section>

      <Section title="2. Not investment advice">
        <p>
          The GrailIQ Score, investment signals, price history, alerts, and all analysis on the
          platform are informational — they're based on public market data and a deterministic
          scoring formula. Nothing here is personalized investment advice. We don't know your
          financial situation, tax status, or risk tolerance. You are responsible for your own
          buy/sell/hold decisions.
        </p>
        <p>
          Pokémon TCG sealed products are a collectible with volatile secondary-market pricing.
          Past performance doesn't predict future value. You can lose money.
        </p>
      </Section>

      <Section title="3. Accounts">
        <p>
          You're responsible for keeping your login credentials secure. Don't share your account
          with anyone; one person per account. If you suspect unauthorized access, email{' '}
          <a href="mailto:support@grailiq.com" className="text-grailiq-purple-light hover:text-white underline">
            support@grailiq.com
          </a>{' '}
          immediately.
        </p>
      </Section>

      <Section title="4. Acceptable use">
        <ul>
          <li>Don't reverse-engineer or scrape the platform at scale.</li>
          <li>Don't use the restock-alert system to automate bulk purchases (anti-scalping).</li>
          <li>Don't misrepresent the GrailIQ Score as your own analysis.</li>
          <li>Don't use the service for anything illegal in your jurisdiction.</li>
        </ul>
      </Section>

      <Section title="5. Subscriptions">
        <p>
          Paid plans (Collector, Investor) auto-renew at the end of each billing period unless
          canceled. You can cancel anytime from the billing portal — cancellation takes effect at
          the end of the current paid period, and we don't pro-rate refunds for partial months.
        </p>
        <p>Free-tier limits apply to the free plan and may change with 30 days' notice.</p>
      </Section>

      <Section title="6. Data & content">
        <p>
          Price data is sourced from public market activity (TCGPlayer listings, eBay sold
          prices, retailer product pages). You retain ownership of your portfolio data. We keep
          a license to process it for running the service (displaying it back to you, computing
          your P&L, sending restock alerts, generating exports).
        </p>
      </Section>

      <Section title="7. No warranty">
        <p>
          The service is provided "as-is". We do our best to keep it running but don't guarantee
          uptime, accuracy, or completeness. Sold eBay prices and retailer availability may
          disagree with what we show — that's a known limitation of scraping public sources.
        </p>
      </Section>

      <Section title="8. Limitation of liability">
        <p>
          To the maximum extent permitted by law, our aggregate liability for any claim arising
          out of GrailIQ is limited to the greater of (a) $100 or (b) the amount you paid us in
          the 12 months preceding the claim. We're not liable for indirect, incidental, or
          consequential damages — including lost profits, missed investment opportunities, or
          tax liability.
        </p>
      </Section>

      <Section title="9. Termination">
        <p>
          You can delete your account at any time. We can suspend accounts for clear violations
          (scraping, scalping, payment fraud) and will give reasonable notice where possible.
        </p>
      </Section>

      <Section title="10. Changes">
        <p>
          Material changes to these terms get announced in our changelog and, when required,
          via email. Continuing to use the service after the effective date of a change means
          you accept the updated terms.
        </p>
      </Section>

      <Section title="11. Governing law">
        <p>
          These terms are governed by the laws of the State of Delaware, USA, without regard to
          conflict-of-laws principles. Disputes will be resolved in Delaware courts unless
          applicable consumer-protection law gives you other rights.
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
