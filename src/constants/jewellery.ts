// Centralized Gold Options
export const GOLD_QUALITIES = [
  { value: '14K', label: '14K Gold', purity: '58.3%', multiplier: 0.600 },
  { value: '18K', label: '18K Gold', purity: '75.0%', multiplier: 0.780 },
  { value: '22K', label: '22K Gold', purity: '91.6%', multiplier: 0.916 },
  { value: '24K', label: '24K Gold', purity: '99.9%', multiplier: 1.000 },
] as const;

export const DEFAULT_MAKING_CHARGES = 500;

// Centralized Diamond Options
export const DIAMOND_QUALITIES = [
  { value: 'EF/VVS', label: 'EF / VVS', offsetKey: 'ef_vvs_offset' },
  { value: 'FG/VVS-SI', label: 'FG / VVS-SI', offsetKey: 'fg_vvs_si_offset' },
  { value: 'GH/VS-SI', label: 'GH / VS-SI', offsetKey: 'gh_vs_si_offset' },
  { value: 'Lab Grown', label: 'Lab Grown', offsetKey: 'lab_grown_offset' },
] as const;

// Dynamically extract just the string values for strict TypeScript typing
export type DiamondQuality = typeof DIAMOND_QUALITIES[number]['value'];

// Update default costs to match
export const DEFAULT_DIAMOND_COSTS: Record<DiamondQuality, number> = {
  'EF/VVS': 0,
  'FG/VVS-SI': 0,
  'GH/VS-SI': 0,
  'Lab Grown': 0
};