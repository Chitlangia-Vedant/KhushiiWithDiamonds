// Centralized Gold Options
export const GOLD_QUALITIES = [
  { value: '14K', label: '14K Gold', purity: '58.3%' },
  { value: '18K', label: '18K Gold', purity: '75.0%' },
  { value: '24K', label: '24K Gold', purity: '100%' },
] as const;

export const DEFAULT_MAKING_CHARGES = 500;

// Centralized Diamond Options
export const DIAMOND_QUALITIES = [
  'Lab Grown',
  'GH/VS-SI',
  'FG/VVS-SI',
  'EF/VVS'
] as const;

export type DiamondQuality = typeof DIAMOND_QUALITIES[number];

export const DEFAULT_DIAMOND_COSTS: Record<DiamondQuality, number> = {
  'Lab Grown': 15000,
  'GH/VS-SI': 25000,
  'FG/VVS-SI': 35000,
  'EF/VVS': 50000
};