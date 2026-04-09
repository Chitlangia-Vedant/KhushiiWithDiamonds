import { useGoldPrice } from './useGoldPrice';
import { useAdminSettings } from './useAdminSettings';
import { useQualityContext } from '../context/QualityContext';
import { getPriceBreakdownItem } from '../lib/goldPrice';
import { JewelleryItem } from '../types';

export function useItemPrice(item: JewelleryItem) {
  const { goldPrice } = useGoldPrice();
  const { globalGoldMakingCharges } = useAdminSettings();
  const { globalGoldPurity, globalDiamondQuality } = useQualityContext();

  // Returns the RAW object, exactly like you suggested!
  return getPriceBreakdownItem(
    item, globalGoldPurity, globalDiamondQuality, globalGoldMakingCharges, goldPrice
  );
}