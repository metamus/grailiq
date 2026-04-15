/**
 * Rip vs Hold signal for sealed products.
 *
 * Decision axis:
 * - If out-of-print AND current price > MSRP * 1.5 → "hold" (sealed value grows faster than card singles)
 * - If in-print AND price ≈ MSRP (within 10%) → "rip" (might as well open, will get more product soon)
 * - Else → "neutral"
 */

export type RipHoldSignal = 'rip' | 'hold' | 'neutral';

export interface Product {
  inPrint?: boolean;
  currentPrice?: number;
  msrp?: number;
}

export function computeRipHoldSignal(product: Product): RipHoldSignal {
  const { inPrint, currentPrice, msrp } = product;

  // Missing data → neutral
  if (currentPrice === undefined || msrp === undefined) {
    return 'neutral';
  }

  // Out-of-print AND current price significantly above MSRP → hold
  if (!inPrint && currentPrice > msrp * 1.5) {
    return 'hold';
  }

  // In-print AND price approximately at MSRP (within 10%) → rip
  if (inPrint && currentPrice >= msrp * 0.9 && currentPrice <= msrp * 1.1) {
    return 'rip';
  }

  // Everything else → neutral
  return 'neutral';
}
