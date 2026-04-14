/**
 * Deterministic trend generator so repeat visits show the same shape
 * for a given seed. Used as a fallback when real price history isn't
 * available yet.
 */
function hashSeed(seed: string): number {
  let h = 2166136261;
  for (let i = 0; i < seed.length; i++) {
    h ^= seed.charCodeAt(i);
    h = Math.imul(h, 16777619);
  }
  return h >>> 0;
}

function mulberry32(a: number) {
  return function () {
    let t = (a += 0x6d2b79f5);
    t = Math.imul(t ^ (t >>> 15), t | 1);
    t ^= t + Math.imul(t ^ (t >>> 7), t | 61);
    return ((t ^ (t >>> 14)) >>> 0) / 4294967296;
  };
}

export type TrendBias = 'up' | 'flat' | 'down';

export function generateTrend(seed: string, bias: TrendBias = 'flat', points = 18): number[] {
  const rand = mulberry32(hashSeed(seed));
  const slope = bias === 'up' ? 0.8 : bias === 'down' ? -0.8 : 0;
  const base = 50;
  const arr: number[] = [];
  for (let i = 0; i < points; i++) {
    const trend = (i / (points - 1)) * slope * 40;
    const noise = (rand() - 0.5) * 12;
    arr.push(base + trend + noise);
  }
  return arr;
}

export function signalToBias(signal: string | null | undefined): TrendBias {
  if (signal === 'buy') return 'up';
  if (signal === 'avoid') return 'down';
  return 'flat';
}

export function signalToColor(signal: string | null | undefined): string {
  switch (signal) {
    case 'buy':
      return '#22C55E';
    case 'hold':
      return '#F59E0B';
    case 'watch':
      return '#64748B';
    case 'avoid':
      return '#EF4444';
    default:
      return '#7F77DD';
  }
}

/** Number-safe pnl-to-color helper (positive → green, negative → red). */
export function pnlColor(pnl: number): string {
  if (pnl > 0) return '#22C55E';
  if (pnl < 0) return '#EF4444';
  return '#7F77DD';
}
