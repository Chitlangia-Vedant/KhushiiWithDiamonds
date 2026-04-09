import { useGoldPrice } from './useGoldPrice';
import { useAdminSettings } from './useAdminSettings';
import { useQualityContext } from '../context/QualityContext';
import { getPriceBreakdownItem } from '../lib/goldPrice';
import { JewelleryItem } from '../types';

export function useItemPrice(item: JewelleryItem) {
  const { goldPrice } = useGoldPrice();
  
  // 1. Grab the diamond grid variables!
  const { globalGoldMakingCharges, diamondBaseCosts, diamondTiers } = useAdminSettings();
  const { globalGoldPurity, globalDiamondQuality } = useQualityContext();

  // 2. Pass them to the breakdown function
  return getPriceBreakdownItem(
    item, 
    globalGoldPurity, 
    globalDiamondQuality, 
    globalGoldMakingCharges, 
    goldPrice, 
    0.18, 
    diamondBaseCosts, // <-- Added
    diamondTiers      // <-- Added
  );
}