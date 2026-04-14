interface ScoreRingProps {
  score: number | string;
  size?: number;
  bias?: 'bullish' | 'neutral' | 'bearish' | 'watch';
}

/**
 * Renders a score (0-100) as an SVG radial progress ring with centered number.
 * Color based on bias: gold for bullish, amber for neutral, slate for watch, rose for bearish.
 */
export function ScoreRing({ score, size = 64, bias = 'neutral' }: ScoreRingProps) {
  const numScore = typeof score === 'string' ? parseFloat(score) : score;
  const clampedScore = Math.min(Math.max(numScore, 0), 100);

  const colorMap = {
    bullish: { ring: '#FFDB6E', bg: 'rgba(244, 196, 48, 0.1)' },      // gold-light
    neutral: { ring: '#F59E0B', bg: 'rgba(245, 158, 11, 0.1)' },      // amber
    bearish: { ring: '#EF4444', bg: 'rgba(239, 68, 68, 0.1)' },       // rose
    watch: { ring: '#64748B', bg: 'rgba(100, 116, 139, 0.1)' },       // slate
  };

  const colors = colorMap[bias];
  const radius = 45;
  const circumference = 2 * Math.PI * radius;
  const offset = circumference - (clampedScore / 100) * circumference;

  const displayScore = clampedScore.toFixed(1);

  return (
    <div style={{ width: size, height: size, display: 'flex', alignItems: 'center', justifyContent: 'center', position: 'relative' }}>
      <svg
        width={size}
        height={size}
        viewBox={`0 0 ${size} ${size}`}
        style={{ transform: 'rotate(-90deg)' }}
      >
        {/* Background ring */}
        <circle
          cx={size / 2}
          cy={size / 2}
          r={radius}
          fill="none"
          stroke="white"
          strokeOpacity="0.05"
          strokeWidth="4"
        />

        {/* Progress ring */}
        <circle
          cx={size / 2}
          cy={size / 2}
          r={radius}
          fill="none"
          stroke={colors.ring}
          strokeWidth="4"
          strokeDasharray={circumference}
          strokeDashoffset={offset}
          strokeLinecap="round"
          style={{ transition: 'stroke-dashoffset 0.6s ease' }}
        />
      </svg>

      {/* Centered number */}
      <div
        style={{
          position: 'absolute',
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'center',
          flexDirection: 'column',
        }}
      >
        <span style={{ fontSize: `${size * 0.35}px`, fontWeight: '600', color: 'white' }}>
          {displayScore}
        </span>
      </div>
    </div>
  );
}
