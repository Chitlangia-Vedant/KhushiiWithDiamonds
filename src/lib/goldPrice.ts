import { supabase } from './supabase';
import { Diamond, JewelleryItem, DiamondPricingTier } from '../types/index';
import { DiamondQuality } from '../constants/jewellery';


const GOLD_API_KEY = import.meta.env.VITE_GOLD_API_KEY || '9886e90c5c52f1a75a3ca50daccd91d4';
const GOLD_API_URL = `https://api.metalpriceapi.com/v1/latest?api_key=${GOLD_API_KEY}&base=INR&currencies=XAU`;
const CACHE_DURATION = 24 * 60 * 60 * 1000;

let cachedPrice: { price: number; timestamp: Date } | null = null;

const getAdminSettings = async () => {
  try {
    const { data } = await supabase
      .from('admin_settings')
      .select('setting_key, setting_value')
      .in('setting_key', ['fallback_gold_price', 'gst_rate', 'override_live_gold_price']);

    const settings = { fallbackPrice: 5450, gstRate: 0.18, overrideLivePrice: false };
    
    data?.forEach(setting => {
      if (setting.setting_key === 'fallback_gold_price') {
        settings.fallbackPrice = parseFloat(setting.setting_value) || 5450;
      } else if (setting.setting_key === 'gst_rate') {
        settings.gstRate = parseFloat(setting.setting_value) || 0.18;
      } else if (setting.setting_key === 'override_live_gold_price') {
        settings.overrideLivePrice = setting.setting_value === 'true';
      }
    });
    
    return settings;
  } catch (error) {
    console.warn('Failed to load admin settings:', error);
    return { fallbackPrice: 5450, gstRate: 0.18, overrideLivePrice: false };
  }
};

export const getCurrentGoldPrice = async (overrideLivePrice?: boolean): Promise<number> => {
  const { fallbackPrice, overrideLivePrice: settingsOverride } = await getAdminSettings();
  
  // Use the override parameter if provided, otherwise use the setting from database
  const shouldOverride = overrideLivePrice !== undefined ? overrideLivePrice : settingsOverride;
  
  // If override is enabled, return fallback price immediately
  if (shouldOverride) {
    console.log('Gold price override enabled, using fallback price:', fallbackPrice);
    cachedPrice = { price: fallbackPrice, timestamp: new Date() };
    return fallbackPrice;
  }

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

  // Fallback to admin setting
  console.log('Using fallback gold price due to API failure:', fallbackPrice);
  cachedPrice = { price: fallbackPrice, timestamp: new Date() };
  return fallbackPrice;
};

const purityMultipliers = {
  '14K': 0.600, '18K': 0.780, '24K': 1.000
};

export const getPriceBreakdown = (
  basePrice: number,
  goldWeight: number,
  goldQuality: string,
  diamondsData: { diamonds: Diamond[], quality: DiamondQuality | null },
  globalGoldMakingCharges: number,
  makingChargesPerGram: number,
  goldPricePerGram: number,
  gstRate: number = 0.18
) => {
  const purity = purityMultipliers[goldQuality as keyof typeof purityMultipliers] || 0.583;
  const goldValue = goldWeight * goldPricePerGram * purity;
  
  const totalDiamondCost = diamondsData.diamonds.reduce((total, diamond) => {
    return total + (diamond.carat * diamond.cost_per_carat);
  }, 0);
  
  const effectiveMakingCharges = makingChargesPerGram === -1 
    ? globalGoldMakingCharges 
    : makingChargesPerGram;
  
  const makingCharges = goldWeight * effectiveMakingCharges;
  const subtotal = goldValue + totalDiamondCost + makingCharges + basePrice;
  const gst = subtotal * gstRate;

  return { 
    goldValue, 
    diamondCost: totalDiamondCost, 
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
  gstRate: number = 0.18
): number => {
  // THE FIX: Let the breakdown function do all the heavy lifting!
  return getPriceBreakdown(
    basePrice, 
    goldWeight, 
    goldQuality, 
    diamondsData, 
    globalGoldMakingCharges, 
    makingChargesPerGram, 
    goldPricePerGram, 
    gstRate
  ).total;
};

// ------------------------------------------------------------------
// 2. FULL ITEM FUNCTIONS (Best for Storefront & Tables)
// ------------------------------------------------------------------

export const getPriceBreakdownItem = (
  item: JewelleryItem, 
  goldQuality: string,
  diamondQuality: DiamondQuality | null,
  globalGoldMakingCharges: number, 
  goldPricePerGram: number,
  gstRate: number = 0.18,
  diamondBaseCosts?: Record<string, number>, // Pass these in from your hook!
  diamondTiers?: DiamondPricingTier[]
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
      // Manual mode
      cost_per_carat = diamondQuality && slot.costs ? (slot.costs[diamondQuality] || 0) : 0;
    } else if (diamondBaseCosts && diamondTiers && diamondQuality) {
      // Grid Mode
      const baseCost = diamondBaseCosts[diamondQuality] || 0;
      const matchingTier = diamondTiers.find(t => slot.carat >= t.min_carat && slot.carat <= t.max_carat);
      const offsetKey = getOffsetKey(diamondQuality);
      const offset = matchingTier ? (Number(matchingTier[offsetKey]) || 0) : 0;
      
      cost_per_carat = baseCost + offset;
    }

    return { name: slot.name || 'Diamond', carat: slot.carat, cost_per_carat };
  }) || [];

  // 2. Pass everything into the master math engine!
  return getPriceBreakdown(
    item.base_price,
    item.gold_weight,
    goldQuality,
    { diamonds: mappedDiamonds, quality: diamondQuality },
    globalGoldMakingCharges,
    item.making_charges_per_gram,
    goldPricePerGram,
    gstRate
  );
};

export const calculateJewelleryPriceSyncItem = (
  item: JewelleryItem,
  goldQuality: string,
  diamondQuality: DiamondQuality | null,
  globalGoldMakingCharges: number,
  goldPricePerGram: number,
  gstRate: number = 0.18
): number => {
  // We can just use the breakdown function to keep the math DRY!
  return getPriceBreakdownItem(
    item, 
    goldQuality, 
    diamondQuality, 
    globalGoldMakingCharges, 
    goldPricePerGram, 
    gstRate
  ).total;
};

export const formatCurrency = (amount: number): string => 
  new Intl.NumberFormat('en-IN', {
    style: 'currency',
    currency: 'INR',
    minimumFractionDigits: 0,
    maximumFractionDigits: 0,
  }).format(amount);

export const formatWeight = (weight: number): string => `${weight.toFixed(2)} grams`;

// Helper function to get total diamond weight
export const getTotalDiamondWeight = (diamonds: Diamond[]): number => {
  return diamonds.reduce((total, diamond) => total + diamond.carat, 0);
};

// Helper function to format diamond summary
export const formatDiamondSummary = (diamonds: Diamond[], quality?: DiamondQuality | null): string => {
  if (diamonds.length === 0) return 'No diamonds';
  if (diamonds.length === 1) {
    const diamond = diamonds[0];
    return `${diamond.carat}ct ${quality || ''}`.trim();
  }
  const totalCarats = getTotalDiamondWeight(diamonds);
  return `${totalCarats.toFixed(2)}ct (${diamonds.length} stones)`.trim();
};