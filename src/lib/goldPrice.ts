import { supabase } from './supabase';
import { Diamond, DiamondQuality, JewelleryItem, DIAMOND_QUALITIES } from '../types/index.ts';

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

// Helper function to get all diamonds from an item
export const getAllDiamondsFromItem = (item: Partial<JewelleryItem>): { diamonds: Diamond[], quality: DiamondQuality | null } => {
  const allDiamonds: Diamond[] = [];
  let quality: DiamondQuality | null = null;

  // Map the strict qualities to their database column names
  const qualityKeys: Record<DiamondQuality, keyof JewelleryItem> = {
    'Lab Grown': 'diamonds_lab_grown',
    'GH/VS-SI': 'diamonds_gh_vs_si',
    'FG/VVS-SI': 'diamonds_fg_vvs_si',
    'EF/VVS': 'diamonds_ef_vvs'
  };

  // Loop through your single source of truth
  DIAMOND_QUALITIES.forEach((q) => {
    const diamonds = item[qualityKeys[q]] as Diamond[] | undefined;
    
    if (diamonds && diamonds.length > 0) {
      allDiamonds.push(...diamonds);
      quality = quality ? null : q; // If a quality is already set, it becomes null (mixed)
    }
  });

  return { diamonds: allDiamonds, quality };
};

// Updated function to handle multiple diamond qualities
export const calculateJewelleryPriceSync = (
  basePrice: number,
  goldWeight: number,
  goldQuality: string,
  diamondsData: { diamonds: Diamond[], quality: DiamondQuality | null },
  makingChargesPerGram: number,
  goldPricePerGram: number,
  gstRate: number = 0.18
): number => {
  const purity = purityMultipliers[goldQuality as keyof typeof purityMultipliers] || 0.583;
  const goldValue = goldWeight * goldPricePerGram * purity;
  
  // Calculate total diamond cost from all diamonds
  const totalDiamondCost = diamondsData.diamonds.reduce((total, diamond) => {
    return total + (diamond.carat * diamond.cost_per_carat);
  }, 0);
  
  const makingCharges = goldWeight * makingChargesPerGram;
  const subtotal = goldValue + totalDiamondCost + makingCharges + basePrice;
  
  return subtotal * (1 + gstRate);
};

export const formatCurrency = (amount: number): string => 
  new Intl.NumberFormat('en-IN', {
    style: 'currency',
    currency: 'INR',
    minimumFractionDigits: 0,
    maximumFractionDigits: 0,
  }).format(amount);

export const formatWeight = (weight: number): string => `${weight.toFixed(2)} grams`;

export const getPriceBreakdown = (
  basePrice: number,
  goldWeight: number,
  goldQuality: string,
  diamondsData: { diamonds: Diamond[], quality: DiamondQuality | null },
  makingChargesPerGram: number,
  goldPricePerGram: number,
  gstRate: number = 0.18
) => {
  const purity = purityMultipliers[goldQuality as keyof typeof purityMultipliers] || 0.583;
  const goldValue = goldWeight * goldPricePerGram * purity;
  
  // Calculate total diamond cost and breakdown
  const totalDiamondCost = diamondsData.diamonds.reduce((total, diamond) => {
    return total + (diamond.carat * diamond.cost_per_carat);
  }, 0);
  
  const makingCharges = goldWeight * makingChargesPerGram;
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