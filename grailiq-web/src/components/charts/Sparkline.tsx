/**
 * Minimal SVG sparkline for dashboards and list rows.
 * Auto-scales points, renders line + soft gradient area fill.
 */
export interface SparklineProps {
  points: number[];
  color?: string;
  width?: number;
  height?: number;
  strokeWidth?: number;
  showArea?: boolean;
  className?: string;
}

export function Sparkline({
  points,
  color = '#7F77DD',
  width = 280,
  height = 64,
  strokeWidth = 2,
  showArea = true,
  className,
}: SparklineProps) {
  if (!points || points.length < 2) {
    return <svg width={width} height={height} className={className} />;
  }

  const min = Math.min(...points);
  const max = Math.max(...points);
  const range = max - min || 1;
  const step = width / (points.length - 1);
  const pad = 4;

  const d = points
    .map((p, i) => {
      const x = i * step;
      const y = height - ((p - min) / range) * (height - pad * 2) - pad;
      return `${i === 0 ? 'M' : 'L'}${x.toFixed(1)},${y.toFixed(1)}`;
    })
    .join(' ');
  const area = `${d} L${width},${height} L0,${height} Z`;
  const gradId = `spark-grad-${color.replace('#', '')}-${width}-${height}`;

  return (
    <svg
      width={width}
      height={height}
      viewBox={`0 0 ${width} ${height}`}
      className={`overflow-visible ${className ?? ''}`}
    >
      <defs>
        <linearGradient id={gradId} x1="0" y1="0" x2="0" y2="1">
          <stop offset="0%" stopColor={color} stopOpacity="0.35" />
          <stop offset="100%" stopColor={color} stopOpacity="0" />
        </linearGradient>
      </defs>
      {showArea && <path d={area} fill={`url(#${gradId})`} />}
      <path
        d={d}
        fill="none"
        stroke={color}
        strokeWidth={strokeWidth}
        strokeLinecap="round"
        strokeLinejoin="round"
      />
    </svg>
  );
}
