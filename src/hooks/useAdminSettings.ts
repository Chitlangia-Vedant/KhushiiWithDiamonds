import { useState, useEffect } from 'react';
import { supabase } from '../lib/supabase';

export function useAdminSettings() {
  const [fallbackGoldPrice, setFallbackGoldPrice] = useState(5450);
  const [gstRate, setGstRate] = useState(0.18);
  const [overrideLiveGoldPrice, setOverrideLiveGoldPrice] = useState(false);
  const [loading, setLoading] = useState(true);

  const loadSettings = async () => {
    try {
      const { data } = await supabase
        .from('admin_settings')
        .select('setting_key, setting_value')
        .in('setting_key', ['fallback_gold_price', 'gst_rate', 'override_live_gold_price']);

      data?.forEach(setting => {
        if (setting.setting_key === 'fallback_gold_price') {
          setFallbackGoldPrice(parseFloat(setting.setting_value) || 5450);
        } else if (setting.setting_key === 'gst_rate') {
          setGstRate(parseFloat(setting.setting_value) || 0.18);
        } else if (setting.setting_key === 'override_live_gold_price') {
          setOverrideLiveGoldPrice(setting.setting_value === 'true');
        }
      });
    } catch (err) {
      console.error('Admin settings fetch error:', err);
    } finally {
      setLoading(false);
    }
  };

  const updateSetting = async (key: string, value: string) => {
    try {
      const { error } = await supabase
        .from('admin_settings')
        .upsert({ 
          setting_key: key, 
          setting_value: value 
        }, { 
          onConflict: 'setting_key' 
        });

      if (error) throw error;

      if (key === 'fallback_gold_price') {
        setFallbackGoldPrice(parseFloat(value) || 5450);
      } else if (key === 'gst_rate') {
        setGstRate(parseFloat(value) || 0.18);
      } else if (key === 'override_live_gold_price') {
        setOverrideLiveGoldPrice(value === 'true');
      }

      return true;
    } catch (err) {
      console.error('Error updating setting:', err);
      return false;
    }
  };

  useEffect(() => {
    loadSettings();
  }, []);

  return { 
    fallbackGoldPrice, 
    gstRate, 
    overrideLiveGoldPrice,
    loading, 
    updateSetting, 
    refreshSettings: loadSettings 
  };
}