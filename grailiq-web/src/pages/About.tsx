import { Link } from 'react-router-dom';
import { Download } from 'lucide-react';

export default function About() {
  return (
    <div className="min-h-screen bg-grailiq-ink">
      {/* Header */}
      <div className="border-b border-white/10 bg-grailiq-dark/50">
        <div className="max-w-4xl mx-auto px-6 py-12">
          <h1 className="text-4xl font-bold text-white mb-4">About GrailIQ</h1>
          <p className="text-lg text-gray-400">Built by collectors, for collectors</p>
        </div>
      </div>

      {/* Main Content */}
      <div className="max-w-4xl mx-auto px-6 py-12 space-y-12">
        {/* Brand Story */}
        <section className="space-y-4">
          <h2 className="text-2xl font-bold text-white">Our Story</h2>
          <div className="space-y-4 text-gray-300 leading-relaxed">
            <p>
              GrailIQ was born from frustration. We spent years collecting sealed Pokémon TCG products, but the market felt opaque.
              How do you know if that booster box is undervalued? When should you hold? When should you sell? Real-time prices exist,
              but investment signals don't.
            </p>
            <p>
              We built the signal system we wished existed: a proprietary 5-factor methodology that scores every sealed Pokémon product
              on a 0–100 scale. Now collectors and investors can make informed decisions, not guesses.
            </p>
            <p>
              Every feature we ship answers a real question from our community. Price tracking, restock alerts, portfolio analytics,
              daily Grail recommendations — all designed for the people who built their childhood pulling cards and grew into serious collectors.
            </p>
          </div>
        </section>

        {/* Stats */}
        <section className="bg-grailiq-dark border border-white/10 rounded-lg p-8 grid grid-cols-3 gap-6">
          <div>
            <p className="text-3xl font-bold text-grailiq-gold-light">2,847+</p>
            <p className="text-sm text-gray-400 mt-2">Active collectors tracking</p>
          </div>
          <div>
            <p className="text-3xl font-bold text-grailiq-gold-light">216</p>
            <p className="text-sm text-gray-400 mt-2">Sealed products analyzed</p>
          </div>
          <div>
            <p className="text-3xl font-bold text-grailiq-gold-light">$48M+</p>
            <p className="text-sm text-gray-400 mt-2">Portfolio value tracked</p>
          </div>
        </section>

        {/* Mission */}
        <section className="space-y-4">
          <h2 className="text-2xl font-bold text-white">Mission</h2>
          <p className="text-gray-300 leading-relaxed">
            Bring transparency, data, and investment rigor to the sealed Pokémon TCG market. Every product deserves a clear Buy/Hold/Watch/Avoid
            signal. Every collector deserves to know what their grails are actually worth.
          </p>
        </section>

        {/* Press Kit */}
        <section className="space-y-4">
          <h2 className="text-2xl font-bold text-white">Press & Media</h2>
          <p className="text-gray-300 mb-4">
            For interviews, coverage, or media assets, download our press kit.
          </p>
          <button
            onClick={() => {
              const link = document.createElement('a');
              link.href = '/press.zip';
              link.download = 'grailiq-press-kit.zip';
              document.body.appendChild(link);
              link.click();
              document.body.removeChild(link);
            }}
            onError={() => {
              alert('Press kit not yet available. Contact press@grailiq.com');
            }}
            className="inline-flex items-center gap-2 px-6 py-3 bg-grailiq-gold-light text-black font-semibold rounded-lg hover:bg-grailiq-gold transition-colors"
          >
            <Download className="h-5 w-5" />
            Download Press Kit
          </button>
        </section>

        {/* Founder Note */}
        <section className="space-y-4 bg-grailiq-dark border border-white/10 rounded-lg p-8">
          <h3 className="text-lg font-semibold text-white">From the Founder</h3>
          <p className="text-gray-300 italic leading-relaxed">
            "We've been paying attention since 1999. Every set, every era, every chase card matters. GrailIQ is the intelligence layer
            the community built for itself. Collect smarter."
          </p>
        </section>

        {/* CTA */}
        <section className="text-center space-y-4 py-8">
          <p className="text-gray-400">Ready to know what your grails are actually worth?</p>
          <Link
            to="/sign-in"
            className="inline-flex items-center gap-2 px-8 py-3 bg-grailiq-purple text-white font-semibold rounded-lg hover:bg-grailiq-purple-light transition-colors"
          >
            Get Started Free
          </Link>
        </section>
      </div>
    </div>
  );
}
