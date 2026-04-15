/**
 * Generate PSA and CGC pop report search links for cards.
 * Used to link directly to pop/population reports on grading services.
 */

export function psaPopUrl(setCode: string, cardName: string, cardNumber?: string): string {
  const q = encodeURIComponent(`${cardName} ${setCode} ${cardNumber ?? ''}`.trim());
  return `https://www.psacard.com/pop/search?q=${q}`;
}

export function cgcPopUrl(_setCode: string, cardName: string, cardNumber?: string): string {
  const q = encodeURIComponent(`${cardName} ${cardNumber ?? ''}`.trim());
  return `https://www.cgccards.com/submissions/search?q=${q}`;
}
