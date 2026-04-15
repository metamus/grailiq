import { Share2, Link as LinkIcon, ChevronLeft, ChevronRight, Smartphone } from 'lucide-react';
import { useState, useEffect } from 'react';
import { ScoreRing } from '@/components/ScoreRing';
import { Sparkline } from '@/components/charts/Sparkline';
import { formatPrice, formatDate } from '@/lib/utils';
import { generateTrend } from '@/lib/sparkData';
import { affiliate } from '@/lib/affiliate';
import { Spinner } from '@/components/ui/Spinner';
import axios from 'axios';

// Fallback data for when API unavailable
const fallbackPick = {
  name: 'Prismatic Evolutions Elite Trainer Box',
  setName: 'Scarlet & Violet — Prismatic Evolutions',
  type: 'Elite Trainer Box',
  price: 89.99,
  delta24h: 6.4,
  score: 92,
  bias: 'bullish' as const,
  thesis:
    "Last week's Prismatic Evolutions ETB restock at Target cleared in 11 minutes. With official print status 'limited' and chase card demand rising, sealed liquidity is tightening fast.",
  retailers: [
    { name: 'Target', status: 'in_stock' as const, url: 'https://target.com' },
    { name: 'Pokémon Center', status: 'out_of_stock' as const, url: 'https://pokemoncenter.com' },
    { name: 'TCGPlayer', status: 'in_stock' as const, url: 'https://tcgplayer.com' },
  ],
};

export default function Today() {
  const [copied, setCopied] = useState(false);
  const [todaysPick, setTodaysPick] = useState<typeof fallbackPick | null>(null);

  // Update meta tags when data loads
  useEffect(() => {
    if (!todaysPick) return;

    document.title = `${todaysPick.name} — Today's Grail`;
    const setMeta = (property: string, content: string) => {
      let meta = document.querySelector(`meta[property="${property}"]`) || document.querySelector(`meta[name="${property}"]`);
      if (!meta) {
        meta = document.createElement('meta');
        document.head.appendChild(meta);
      }
      if (property.startsWith('og:') || property.startsWith('twitter:')) {
        meta.setAttribute('property', property);
      } else {
        meta.setAttribute('name', property);
      }
      meta.setAttribute('content', content);
    };
    setMeta('og:title', `${todaysPick.name} — Today's Grail`);
    setMeta('og:description', todaysPick.thesis);
    setMeta('og:type', 'article');
    setMeta('twitter:title', `${todaysPick.name} — Today's Grail`);
    setMeta('twitter:description', todaysPick.thesis);
    setMeta('twitter:card', 'summary_large_image');
  }, [todaysPick]);
  const [loading, setLoading] = useState(true);
  const trend = generateTrend('today-sparkline', 'up', 30);

  useEffect(() => {
    const fetchTodaysGrail = async () => {
      try {
        const response = await axios.get('/api/v1/daily');
        if (response.data?.data?.product) {
          const p = response.data.data.product;
          setTodaysPick({
            name: p.name,
            setName: p.set?.name || 'Unknown Set',
            type: p.type.replace(/_/g, ' ').replace(/\b\w/g, (c: string) => c.toUpperCase()),
            price: parseFloat(p.msrp || '0'),
            delta24h: 0,
            score: parseInt(p.grailiqScore || '0'),
            bias: 'bullish' as const,
            thesis: response.data.data.thesis || 'Auto-selected today\'s top-scored collectible.',
            retailers: [
              { name: 'Target', status: 'in_stock' as const, url: 'https://target.com' },
              { name: 'Pokémon Center', status: 'out_of_stock' as const, url: 'https://pokemoncenter.com' },
              { name: 'TCGPlayer', status: 'in_stock' as const, url: 'https://tcgplayer.com' },
            ],
          });
        } else {
          setTodaysPick(fallbackPick);
        }
      } catch (err) {
        console.error('Failed to fetch daily grail:', err);
        setTodaysPick(fallbackPick);
      } finally {
        setLoading(false);
      }
    };

    fetchTodaysGrail();
  }, []);

  const handleCopyLink = () => {
    navigator.clipboard.writeText(window.location.href);
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  };

  const handleShare = () => {
    if (navigator.share && todaysPick) {
      navigator.share({
        title: "Today's Grail — GrailIQ",
        text: todaysPick.name,
        url: window.location.href,
      });
    }
  };

  const handleSendToPhone = () => {
    const appUrl = 'https://apps.apple.com/us/app/grailiq/id6740123456';
    if (navigator.share) {
      navigator.share({
        title: 'GrailIQ Mobile App',
        text: 'Get push alerts for restock notifications',
        url: appUrl,
      });
    } else {
      navigator.clipboard.writeText(appUrl);
      setCopied(true);
      setTimeout(() => setCopied(false), 2000);
    }
  };

  if (loading) {
    return (
      <div className="min-h-screen bg-grailiq-dark text-white flex items-center justify-center">
        <Spinner size="lg" />
      </div>
    );
  }

  if (!todaysPick) {
    return (
      <div className="min-h-screen bg-grailiq-dark text-white flex items-center justify-center">
        <p className="text-gray-400">Unable to load today's grail</p>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-grailiq-dark text-white overflow-hidden">
      {/* Metadata for OpenGraph sharing */}
      <meta property="og:title" content={`${todaysPick.name} — Today's Grail`} />
      <meta property="og:description" content={todaysPick.thesis} />
      <meta property="og:type" content="article" />
      <meta property="og:url" content={typeof window !== 'undefined' ? window.location.href : ''} />
      <meta property="twitter:card" content="summary_large_image" />
      <meta property="twitter:title" content={`${todaysPick.name} — Today's Grail`} />
      <meta property="twitter:description" content={todaysPick.thesis} />

      {/* Background gradient */}
      <div className="fixed inset-0 bg-gradient-to-br from-grailiq-purple/10 via-grailiq-dark to-grailiq-gold/5 pointer-events-none" />
      <div className="fixed top-0 right-0 h-96 w-96 rounded-full bg-grailiq-purple/20 blur-3xl pointer-events-none" />

      {/* Content */}
      <div className="relative z-10 max-w-4xl mx-auto px-4 sm:px-6 py-8 sm:py-12">
        {/* Eyebrow */}
        <div className="mb-8">
          <p className="text-xs font-bold uppercase tracking-widest text-grailiq-gold-light">
            TODAY'S GRAIL · {formatDate(new Date().toISOString()).toUpperCase()}
          </p>
        </div>

        {/* Hero section */}
        <div className="mb-12">
          <h1 className="text-4xl sm:text-5xl lg:text-6xl font-display font-bold mb-3 leading-tight">
            {todaysPick?.name}
          </h1>
          <p className="text-lg sm:text-xl text-gray-400 mb-6">
            {todaysPick?.setName} • {todaysPick?.type}
          </p>

          {/* Stats row */}
          <div className="grid grid-cols-3 gap-4 sm:gap-6 mb-8">
            {/* Current price */}
            <div className="flex flex-col gap-2">
              <span className="text-xs font-bold uppercase tracking-wider text-gray-500">
                Current Price
              </span>
              <p className="text-2xl sm:text-3xl font-bold tabular-nums">
                {formatPrice(todaysPick?.price ?? 0)}
              </p>
            </div>

            {/* 24h delta */}
            <div className="flex flex-col gap-2">
              <span className="text-xs font-bold uppercase tracking-wider text-gray-500">
                24H Change
              </span>
              <div className="flex items-center gap-2">
                <span className="text-2xl sm:text-3xl font-bold tabular-nums text-grailiq-gold-light">
                  +{todaysPick?.delta24h?.toFixed(1)}%
                </span>
              </div>
            </div>

            {/* GrailIQ Score */}
            <div className="flex flex-col gap-2">
              <span className="text-xs font-bold uppercase tracking-wider text-gray-500">
                GrailIQ Score
              </span>
              <div className="flex items-center justify-start">
                <ScoreRing
                  score={todaysPick?.score ?? 0}
                  size={80}
                  bias={todaysPick?.bias ?? 'neutral'}
                />
              </div>
            </div>
          </div>
        </div>

        {/* Thesis paragraph */}
        <div className="mb-12 max-w-2xl">
          <p className="text-base sm:text-lg text-gray-300 leading-relaxed">
            {todaysPick?.thesis}
          </p>
        </div>

        {/* Where to buy */}
        <div className="mb-12">
          <h2 className="text-sm font-bold uppercase tracking-wider text-gray-500 mb-4">
            Where to Buy
          </h2>
          <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
            {todaysPick?.retailers?.map((retailer) => (
              <a
                key={retailer.name}
                href={affiliate(retailer.name, retailer.url)}
                target="_blank"
                rel="noopener noreferrer"
                className="flex items-center justify-between p-4 rounded-xl border border-white/10 bg-white/[0.02] hover:bg-white/5 hover:border-white/20 transition-all group"
              >
                <span className="font-semibold text-sm text-white">
                  {retailer.name}
                </span>
                <span
                  className={`text-xs font-bold px-2 py-1 rounded-full ${
                    retailer.status === 'in_stock'
                      ? 'bg-emerald-500/15 text-emerald-400'
                      : 'bg-rose-500/15 text-rose-400'
                  }`}
                >
                  {retailer.status === 'in_stock' ? 'In stock' : 'Out of stock'}
                </span>
              </a>
            ))}
          </div>
        </div>

        {/* 30-day sparkline */}
        <div className="mb-12">
          <h2 className="text-sm font-bold uppercase tracking-wider text-gray-500 mb-4">
            30-Day Trend
          </h2>
          <div className="p-6 rounded-xl border border-white/10 bg-white/[0.02]">
            <Sparkline
              points={trend}
              color="#FFDB6E"
              width={Math.min(window.innerWidth - 48, 800)}
              height={120}
            />
          </div>
        </div>

        {/* Share row */}
        <div className="flex flex-wrap items-center gap-3 mb-12">
          <button
            onClick={handleShare}
            className="inline-flex items-center gap-2 px-4 py-2 rounded-lg border border-grailiq-gold/30 bg-grailiq-gold/10 text-grailiq-gold-light hover:bg-grailiq-gold/15 transition-all text-sm font-semibold"
          >
            <Share2 className="h-4 w-4" />
            Share
          </button>
          <button
            onClick={handleSendToPhone}
            className="inline-flex items-center gap-2 px-4 py-2 rounded-lg border border-grailiq-purple/30 bg-grailiq-purple/10 text-grailiq-purple-light hover:bg-grailiq-purple/15 transition-all text-sm font-semibold"
          >
            <Smartphone className="h-4 w-4" />
            Send to my phone
          </button>
          <button
            onClick={handleCopyLink}
            className="inline-flex items-center gap-2 px-4 py-2 rounded-lg border border-white/20 bg-white/5 text-white hover:bg-white/10 transition-all text-sm font-semibold"
          >
            <LinkIcon className="h-4 w-4" />
            {copied ? 'Copied!' : 'Copy Link'}
          </button>
        </div>

        {/* Navigation footer */}
        <div className="flex items-center justify-between text-sm text-gray-400 border-t border-white/10 pt-6">
          <button className="flex items-center gap-1 hover:text-white transition-colors">
            <ChevronLeft className="h-4 w-4" />
            Yesterday's grail
          </button>
          <span>Every day at 9am UTC</span>
          <button className="flex items-center gap-1 hover:text-white transition-colors">
            Tomorrow at 9am
            <ChevronRight className="h-4 w-4" />
          </button>
        </div>
      </div>
    </div>
  );
}
