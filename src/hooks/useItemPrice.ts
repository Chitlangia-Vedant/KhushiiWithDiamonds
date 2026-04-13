import { useGoldPrice } from './useGoldPrice';
import { useAdminSettings } from './useAdminSettings';
import { useQualityContext } from '../context/QualityContext';
import { getPriceBreakdownItem } from '../lib/goldPrice';
import { JewelleryItem } from '../types';

export function useItemPrice(item: JewelleryItem) {
  const { goldPrice } = useGoldPrice();
  
  // 1. Grab ALL dynamic variables from Admin Settings
  const { 
    globalGoldMakingCharges, 
    diamondBaseCosts, 
    diamondTiers,
    gstRate,                 // <-- FIX 1: Extract dynamic GST rate
    fallbackGoldPrice,       // <-- FIX 2: Extract override settings
    overrideLiveGoldPrice 
  } = useAdminSettings();
  
  const { globalGoldPurity, globalDiamondQuality } = useQualityContext();

  // 2. Calculate the effective gold price based on Admin override
  const effectiveGoldPrice = overrideLiveGoldPrice ? fallbackGoldPrice : goldPrice;

  // 3. Pass everything to the breakdown function
  return getPriceBreakdownItem(
    item, 
    globalGoldPurity, 
    globalDiamondQuality, 
    globalGoldMakingCharges, 
    effectiveGoldPrice, // <-- Uses Admin override if active
    gstRate,            // <-- No longer hardcoded to 0.18!
    diamondBaseCosts, 
    diamondTiers      
  );
}