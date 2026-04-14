/**
 * Deterministic sparkline trend generator based on a seed string
 * (product id, name, etc.). Useful as a stand-in until the API
 * exposes real price history on the dashboard/list endpoints.
 *
 * The "bias" pushes the trend upward, flat, or downward so we can
 * mirror the investment signal coming from the API.
 */
export function generateTrend(seed: string, bias: 'up' | 'flat' | 'down' = 'flat', points = 16): number[] {
  let h = 0;
  for (let i = 0; i < seed.length; i++) {
    h = (h * 31 + seed.charCodeAt(i)) & 0xffffffff;
  }

  const rand = () => {
    h = (h * 9301 + 49297) & 0xffffffff;
    return ((h % 233280) + 233280) % 233280 / 233280;
  };

  const base = 50 + rand() * 20;
  const biasDelta = bias === 'up' ? 1.2 : bias === 'down' ? -1.2 : 0;

  const values: number[] = [];
  let value = base;
  for (let i = 0; i < points; i++) {
    const noise = (rand() - 0.5) * 4;
    value += noise + biasDelta;
    values.push(Math.max(10, value));
  }
  return values;
}

/** Map an investment signal string to a sparkline bias. */
export function signalToBias(signal: string | null): 'up' | 'flat' | 'down' {
  if (signal === 'buy') return 'up';
  if (signal === 'avoid') return 'down';
  return 'flat';
}

/** Map an investment signal to a sparkline color. */
import { colors } from '../theme/colors';
export function signalToColor(signal: string | null): string {
  switch (signal) {
    case 'buy':
      return colors.buy;
    case 'hold':
      return colors.hold;
    case 'avoid':
      return colors.avoid;
    case 'watch':
      return colors.watch;
    default:
      return colors.primary;
  }
}
