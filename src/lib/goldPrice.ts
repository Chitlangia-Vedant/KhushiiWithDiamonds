import { Diamond, JewelleryItem, DiamondPricingTier, StoneSlot } from '../types/index';
import { DiamondQuality, GOLD_QUALITIES } from '../constants/jewellery';

const GOLD_API_KEY = import.meta.env.VITE_GOLD_API_KEY || '9886e90c5c52f1a75a3ca50daccd91d4';
const GOLD_API_URL = `https://api.metalpriceapi.com/v1/latest?api_key=${GOLD_API_KEY}&base=INR&currencies=XAU`;
const CACHE_DURATION = 24 * 60 * 60 * 1000;

let cachedPrice: { price: number; timestamp: Date } | null = null;

export const getCurrentGoldPrice = async (): Promise<number> => {
  // Check cache first
  if (cachedPrice && Date.now() - cachedPrice.timestamp.getTime() < CACHE_DURATION) {
    return cachedPrice.price;
  }

  try {
    const response = await fetch(GOLD_API_URL);
    if (response.ok) {
      const data = await response.json();
      
      if (data.rates?.XAU) {
        const pricePerGramINR = (1 / data.rates.XAU) / 31.1035;
        cachedPrice = { price: pricePerGramINR, timestamp: new Date() };
        console.log('Live gold price fetched successfully:', pricePerGramINR);
        return pricePerGramINR;
      }
    }
  } catch (error) {
    console.warn('Failed to fetch live gold price:', error);
  }

  // Return 0 if the API fails so the Settings Tab knows to show the Error Badge!
  return 0; 
};

const getGoldMultiplier = (qualityValue: string): number => {
  const quality = GOLD_QUALITIES.find(q => q.value === qualityValue);
  return quality ? quality.multiplier : 1.000; // Defaults to 24K multiplier if not found
};

export const getPriceBreakdown = (
  basePrice: number,
  goldWeight: number,
  goldQuality: string,
  diamondsData: { diamonds: Diamond[], quality: DiamondQuality | null },
  globalGoldMakingCharges: number,
  makingChargesPerGram: number,
  goldPricePerGram: number,
  gstRate: number = 0.18,
  otherStones: StoneSlot[] = []
) => {
  const goldMultiplier = getGoldMultiplier(goldQuality);  
  const goldValue = goldWeight * goldPricePerGram * goldMultiplier;

  const totalDiamondCost = diamondsData.diamonds.reduce((total, diamond) => {
    return total + (diamond.carat * diamond.cost_per_carat);
  }, 0);
  
  const effectiveMakingCharges = makingChargesPerGram === -1 
    ? globalGoldMakingCharges 
    : makingChargesPerGram;

  const totalOtherStonesCost = otherStones.reduce((total, stone) => total + (stone.carat * stone.cost_per_carat), 0);
  const makingCharges = goldWeight * effectiveMakingCharges;
  const subtotal = goldValue + totalDiamondCost + totalOtherStonesCost + makingCharges + basePrice;
  const gst = subtotal * gstRate;

  return { 
    goldValue, 
    diamondCost: totalDiamondCost, 
    otherStonesCost: totalOtherStonesCost,
    makingCharges, 
    basePrice, 
    subtotal, 
    gst, 
    total: subtotal + gst,
    diamonds: diamondsData.diamonds
  };
};

export const calculateJewelleryPriceSync = (
  basePrice: number,
  goldWeight: number,
  goldQuality: string,
  diamondsData: { diamonds: Diamond[], quality: DiamondQuality | null },
  globalGoldMakingCharges: number,
  makingChargesPerGram: number,
  goldPricePerGram: number,
  gstRate: number = 0.18,
  otherStones: StoneSlot[] = []
): number => {
  return getPriceBreakdown(
    basePrice, goldWeight, goldQuality, diamondsData, globalGoldMakingCharges, 
    makingChargesPerGram, goldPricePerGram, gstRate, otherStones
  ).total;
};

export const getPriceBreakdownItem = (
  item: JewelleryItem, 
  goldQuality: string,
  diamondQuality: DiamondQuality | null,
  globalGoldMakingCharges: number, 
  goldPricePerGram: number,
  gstRate: number = 0.18,
  diamondBaseCosts?: Record<string, number>, 
  diamondTiers?: DiamondPricingTier[],
) => {
  const getOffsetKey = (q: string): keyof DiamondPricingTier => {
    if (q === 'Lab Grown') return 'lab_grown_offset';
    if (q === 'GH/VS-SI') return 'gh_vs_si_offset';
    if (q === 'FG/VVS-SI') return 'fg_vvs_si_offset';
    return 'ef_vvs_offset'; 
  };

  const mappedDiamonds = item.diamonds?.map(slot => {
    let cost_per_carat = 0;
    const isOverride = item.override_diamond_costs !== false; 

    if (isOverride) {
      cost_per_carat = diamondQuality && slot.costs ? (slot.costs[diamondQuality] || 0) : 0;
    } else if (diamondBaseCosts && diamondTiers && diamondQuality) {
      const baseCost = diamondBaseCosts[diamondQuality] || 0;
      const matchingTier = diamondTiers.find(t => slot.carat >= t.min_carat && slot.carat <= t.max_carat);
      const offsetKey = getOffsetKey(diamondQuality);
      const offset = matchingTier ? (Number(matchingTier[offsetKey]) || 0) : 0;
      cost_per_carat = baseCost + offset;
    }
    return { name: slot.name || 'Diamond', carat: slot.carat, cost_per_carat };
  }) || [];

  return getPriceBreakdown(
    item.base_price, item.gold_weight, goldQuality, { diamonds: mappedDiamonds, quality: diamondQuality },
    globalGoldMakingCharges, item.making_charges_per_gram, goldPricePerGram, gstRate, item.other_stones || []
  );
};

export const calculateJewelleryPriceSyncItem = (
  item: JewelleryItem, goldQuality: string, diamondQuality: DiamondQuality | null,
  globalGoldMakingCharges: number, goldPricePerGram: number, gstRate: number = 0.18,
  diamondBaseCosts?: Record<string, number>, diamondTiers?: DiamondPricingTier[]
): number => {
  return getPriceBreakdownItem(
    item, goldQuality, diamondQuality, globalGoldMakingCharges, 
    goldPricePerGram, gstRate, diamondBaseCosts, diamondTiers
  ).total;
};

export const formatCurrency = (amount: number): string => 
  new Intl.NumberFormat('en-IN', { style: 'currency', currency: 'INR', minimumFractionDigits: 0, maximumFractionDigits: 0 }).format(amount);

export const formatWeight = (weight: number): string => `${weight.toFixed(2)} grams`;
export const getTotalDiamondWeight = (diamonds: Diamond[]): number => diamonds.reduce((total, diamond) => total + diamond.carat, 0);

export const formatDiamondSummary = (diamonds: Diamond[], quality?: DiamondQuality | null): string => {
  if (diamonds.length === 0) return 'No diamonds';
  if (diamonds.length === 1) return `${diamonds[0].carat}ct ${quality || ''}`.trim();
  return `${getTotalDiamondWeight(diamonds).toFixed(2)}ct (${diamonds.length} stones)`.trim();
};