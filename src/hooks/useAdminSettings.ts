import { useState, useEffect } from 'react';
import { supabase } from '../lib/supabase';
import { DiamondPricingTier } from '../types';

export function useAdminSettings() {
  const [fallbackGoldPrice, setFallbackGoldPrice] = useState(0);
  const [gstRate, setGstRate] = useState(0.18);
  const [overrideLiveGoldPrice, setOverrideLiveGoldPrice] = useState(false);
  const [globalGoldMakingCharges, setGlobalGoldMakingCharges] = useState(0);
  const [loading, setLoading] = useState(true);
  
  // NEW Diamond State
  const [diamondBaseCosts, setDiamondBaseCosts] = useState<Record<string, number>>({
    'EF/VVS': 0, 'FG/VVS-SI': 0, 'GH/VS-SI': 0, 'Lab Grown': 0
  });
  const [diamondTiers, setDiamondTiers] = useState<DiamondPricingTier[]>([]);

  const loadSettings = async () => {
    try {
      const [settingsRes, tiersRes] = await Promise.all([
        supabase
          .from('admin_settings')
          .select('setting_key, setting_value')
          .in('setting_key', [
            'fallback_gold_price', 'gst_rate', 'override_live_gold_price', 'gold_making_charges_per_gram',
            'EF/VVS_base_costs', 'FG/VVS-SI_base_costs', 'GH/VS-SI_base_costs', 'Lab Grown_base_costs'
          ]),
        supabase.from('diamond_pricing_tiers').select('*').order('min_carat', { ascending: true })
      ]);

      const newBaseCosts = { ...diamondBaseCosts };
      
      settingsRes.data?.forEach(setting => {
        if (setting.setting_key === 'fallback_gold_price') setFallbackGoldPrice(parseFloat(setting.setting_value) || 0);
        else if (setting.setting_key === 'gst_rate') setGstRate(parseFloat(setting.setting_value) || 0.18);
        else if (setting.setting_key === 'override_live_gold_price') setOverrideLiveGoldPrice(setting.setting_value === 'true');
        else if (setting.setting_key === 'gold_making_charges_per_gram') setGlobalGoldMakingCharges(parseFloat(setting.setting_value));
        else if (setting.setting_key.endsWith('_base_costs')) {
          const qName = setting.setting_key.replace('_base_costs', '');
          newBaseCosts[qName] = parseFloat(setting.setting_value) || 0;
        }
      });
      
      setDiamondBaseCosts(newBaseCosts);
      if (tiersRes.data) setDiamondTiers(tiersRes.data);

    } catch (err) {
      console.error('Fetch error:', err);
    } finally {
      setLoading(false);
    }
  };

  const updateSetting = async (key: string, value: string) => {
    try {
      await supabase.from('admin_settings').upsert({ setting_key: key, setting_value: value }, { onConflict: 'setting_key' });
      if (key === 'fallback_gold_price') setFallbackGoldPrice(parseFloat(value) || 0);
      else if (key === 'gst_rate') setGstRate(parseFloat(value) || 0.18);
      else if (key === 'override_live_gold_price') setOverrideLiveGoldPrice(value === 'true');
      else if (key === 'gold_making_charges_per_gram') setGlobalGoldMakingCharges(parseFloat(value));
      return true;
    } catch (err) {
      return false;
    }
  };

  const saveDiamondPricing = async (baseCosts: Record<string, number>, tiers: DiamondPricingTier[]) => {
    try {
      const baseCostUpserts = Object.entries(baseCosts).map(([quality, cost]) => ({
        setting_key: `${quality}_base_costs`, 
        setting_value: cost.toString()
      }));
      
      // FIX 1: Added the onConflict parameter so Supabase knows how to overwrite!
      const { error: baseError } = await supabase
        .from('admin_settings')
        .upsert(baseCostUpserts, { onConflict: 'setting_key' });
        
      if (baseError) throw baseError;

      const { error: deleteError } = await supabase
        .from('diamond_pricing_tiers')
        .delete()
        .neq('min_carat', -1);
        
      if (deleteError) throw deleteError;
      
      if (tiers.length > 0) {
        const cleanTiers = tiers.map(({ id, ...rest }) => rest);
        const { error: insertError } = await supabase
          .from('diamond_pricing_tiers')
          .insert(cleanTiers);
          
        if (insertError) throw insertError;
      }
      
      await loadSettings(); 
      return true;
    } catch (err) {
      // FIX 2: Actually log the error so you can see it in F12 Developer Tools
      console.error('Error saving diamond grid:', err);
      return false;
    }
  };

  useEffect(() => { loadSettings(); }, []);

  return { 
    fallbackGoldPrice, gstRate, overrideLiveGoldPrice, globalGoldMakingCharges, 
    diamondBaseCosts, diamondTiers, loading, updateSetting, saveDiamondPricing,
    refreshSettings: loadSettings
  };
}