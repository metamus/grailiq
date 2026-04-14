import React from 'react';
import Svg, { Path, Defs, LinearGradient, Stop } from 'react-native-svg';
import { colors } from '../theme/colors';

interface SparklineProps {
  points: number[];
  width?: number;
  height?: number;
  color?: string;
  showArea?: boolean;
}

/**
 * Lightweight SVG sparkline for React Native. Renders a line with
 * an optional gradient-filled area underneath. Auto-scales to the
 * supplied points.
 */
export function Sparkline({
  points,
  width = 120,
  height = 40,
  color = colors.primary,
  showArea = true,
}: SparklineProps) {
  if (!points || points.length < 2) {
    return <Svg width={width} height={height} />;
  }

  const min = Math.min(...points);
  const max = Math.max(...points);
  const range = max - min || 1;
  const step = width / (points.length - 1);

  const pathD = points
    .map((p, i) => {
      const x = i * step;
      const y = height - ((p - min) / range) * (height - 6) - 3;
      return `${i === 0 ? 'M' : 'L'}${x.toFixed(2)},${y.toFixed(2)}`;
    })
    .join(' ');

  const areaD = `${pathD} L${width.toFixed(2)},${height.toFixed(2)} L0,${height.toFixed(2)} Z`;

  // Strip `#` for gradient id safety
  const safeId = `spark-${color.replace('#', '')}-${Math.round(width)}-${Math.round(height)}`;

  return (
    <Svg width={width} height={height}>
      <Defs>
        <LinearGradient id={safeId} x1="0" y1="0" x2="0" y2="1">
          <Stop offset="0%" stopColor={color} stopOpacity={0.4} />
          <Stop offset="100%" stopColor={color} stopOpacity={0} />
        </LinearGradient>
      </Defs>
      {showArea && <Path d={areaD} fill={`url(#${safeId})`} />}
      <Path d={pathD} fill="none" stroke={color} strokeWidth={2} strokeLinejoin="round" strokeLinecap="round" />
    </Svg>
  );
}
