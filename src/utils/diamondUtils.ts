import { JewelleryItem } from '../types';
import { DIAMOND_QUALITIES, DiamondQuality } from '../constants/jewellery';

// 1. If the item has diamonds, all qualities are available!
export const getAvailableDiamondQualities = (item: JewelleryItem): DiamondQuality[] => {
  if (!item.diamonds || item.diamonds.length === 0) return [];
  // Since the admin enters costs for all 4 qualities per slot, they are all available
  return [...DIAMOND_QUALITIES];
};

// 2. Fetch the specific diamond array for a selected quality
export const getDiamondsForQuality = (item: JewelleryItem, quality: DiamondQuality | null) => {
  if (!quality || !item.diamonds || item.diamonds.length === 0) {
    return { diamonds: [], quality: null };
  }

  // Map the rich DiamondSlots down into the simple format
  const mappedDiamonds = item.diamonds.map(slot => ({
    name: slot.name || 'Diamond', // <-- Pass the name along
    carat: slot.carat,
    cost_per_carat: slot.costs[quality] || 0
  }));

  return { diamonds: mappedDiamonds, quality };
};

// NOTICE: groupDiamondSlotsForDatabase is completely deleted! We don't need it!