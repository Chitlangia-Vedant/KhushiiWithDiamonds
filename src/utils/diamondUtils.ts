import { JewelleryItem, DiamondQuality } from '../types';

// 1. Find which qualities actually have diamonds in them
export const getAvailableDiamondQualities = (item: JewelleryItem): DiamondQuality[] => {
  const qualities: DiamondQuality[] = [];
  if (item.diamonds_lab_grown && item.diamonds_lab_grown.length > 0) qualities.push('Lab Grown');
  if (item.diamonds_gh_vs_si && item.diamonds_gh_vs_si.length > 0) qualities.push('GH/VS-SI');
  if (item.diamonds_fg_vvs_si && item.diamonds_fg_vvs_si.length > 0) qualities.push('FG/VVS-SI');
  if (item.diamonds_ef_vvs && item.diamonds_ef_vvs.length > 0) qualities.push('EF/VVS');
  return qualities;
};

// 2. Fetch the specific diamond array for a selected quality
export const getDiamondsForQuality = (item: JewelleryItem, quality: DiamondQuality | null) => {
  switch (quality) {
    case 'Lab Grown': return { diamonds: item.diamonds_lab_grown || [], quality };
    case 'GH/VS-SI': return { diamonds: item.diamonds_gh_vs_si || [], quality };
    case 'FG/VVS-SI': return { diamonds: item.diamonds_fg_vvs_si || [], quality };
    case 'EF/VVS': return { diamonds: item.diamonds_ef_vvs || [], quality };
    default: return { diamonds: [], quality: null };
  }
};

// 3. Format raw form slots into the 4 distinct database columns (for JewelleryForm)
export const groupDiamondSlotsForDatabase = (diamondSlots: any[]) => {
  return {
    diamonds_lab_grown: diamondSlots.filter(d => d.quality === 'Lab Grown'),
    diamonds_gh_vs_si: diamondSlots.filter(d => d.quality === 'GH/VS-SI'),
    diamonds_fg_vvs_si: diamondSlots.filter(d => d.quality === 'FG/VVS-SI'),
    diamonds_ef_vvs: diamondSlots.filter(d => d.quality === 'EF/VVS'),
  };
};