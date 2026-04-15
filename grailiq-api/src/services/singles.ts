/**
 * Chase card (high-value single) service.
 *
 * Fetches popular chase cards from major sets. Currently uses hardcoded stubs
 * until TCGPlayer commercial API or CardLadder integration is available.
 *
 * TODO: Replace with real TCGPlayer API or CardLadder data once commercial
 * access is granted.
 */

export interface SinglePrice {
  cardId: string;
  name: string;
  marketPrice: number;
  tcgplayerUrl?: string;
  imageUrl?: string;
}

/**
 * Get chase cards (high-value singles) for a given set.
 * Returns hardcoded stubs for major sets to exercise the UI.
 */
export async function getChaseCards(setId: string): Promise<SinglePrice[]> {
  // Hardcoded stubs for major sets
  const stubData: Record<string, SinglePrice[]> = {
    'prismatic-evolutions': [
      {
        cardId: 'prismatic-001',
        name: 'Charizard ex',
        marketPrice: 48.5,
        tcgplayerUrl: 'https://tcgplayer.com/product/...',
        imageUrl: 'https://...',
      },
      {
        cardId: 'prismatic-002',
        name: 'Lugia VSTAR',
        marketPrice: 35.2,
        tcgplayerUrl: 'https://tcgplayer.com/product/...',
        imageUrl: 'https://...',
      },
      {
        cardId: 'prismatic-003',
        name: 'Ho-Oh ex',
        marketPrice: 24.8,
        tcgplayerUrl: 'https://tcgplayer.com/product/...',
        imageUrl: 'https://...',
      },
    ],
    'surging-sparks': [
      {
        cardId: 'surging-001',
        name: 'Pikachu ex',
        marketPrice: 56.3,
        tcgplayerUrl: 'https://tcgplayer.com/product/...',
        imageUrl: 'https://...',
      },
      {
        cardId: 'surging-002',
        name: 'Zapdos ex',
        marketPrice: 42.1,
        tcgplayerUrl: 'https://tcgplayer.com/product/...',
        imageUrl: 'https://...',
      },
      {
        cardId: 'surging-003',
        name: 'Raikou VSTAR',
        marketPrice: 31.5,
        tcgplayerUrl: 'https://tcgplayer.com/product/...',
        imageUrl: 'https://...',
      },
    ],
    'journey-together': [
      {
        cardId: 'journey-001',
        name: 'Rayquaza ex',
        marketPrice: 52.8,
        tcgplayerUrl: 'https://tcgplayer.com/product/...',
        imageUrl: 'https://...',
      },
      {
        cardId: 'journey-002',
        name: 'Kyogre ex',
        marketPrice: 38.7,
        tcgplayerUrl: 'https://tcgplayer.com/product/...',
        imageUrl: 'https://...',
      },
      {
        cardId: 'journey-003',
        name: 'Groudon ex',
        marketPrice: 29.2,
        tcgplayerUrl: 'https://tcgplayer.com/product/...',
        imageUrl: 'https://...',
      },
    ],
  };

  return stubData[setId] ?? [];
}
