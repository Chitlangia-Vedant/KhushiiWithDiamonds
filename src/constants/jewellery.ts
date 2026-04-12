// Centralized Gold Options
export const GOLD_QUALITIES = [
  { value: '14K', label: '14K Gold', purity: '58.3%' },
  { value: '18K', label: '18K Gold', purity: '75.0%' },
  { value: '22K', label: '22K Gold', purity: '91.6%' },
] as const;

export const DEFAULT_MAKING_CHARGES = 500;

// Centralized Diamond Options
export const DIAMOND_QUALITIES = ['EF/VVS', 'FG/VVS-SI', 'GH/VS-SI', 'Lab Grown'] as const;
export type DiamondQuality = typeof DIAMOND_QUALITIES[number];

// Update default costs to match
export const DEFAULT_DIAMOND_COSTS: Record<DiamondQuality, number> = {
  'EF/VVS': 0,
  'FG/VVS-SI': 0,
  'GH/VS-SI': 0,
  'Lab Grown': 0
};