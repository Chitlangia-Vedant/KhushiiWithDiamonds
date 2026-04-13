import { useState, useEffect } from 'react';
import { getCurrentGoldPrice } from '../lib/goldPrice';
import { useAdminSettings } from './useAdminSettings';

export function useGoldPrice() {
  const [rawApiPrice, setRawApiPrice] = useState(0);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  
  // Bring the settings in so the hook can make smart decisions
  const { fallbackGoldPrice, overrideLiveGoldPrice } = useAdminSettings();

  useEffect(() => {
    let mounted = true;

    const fetchGoldPrice = async () => {
      try {
        setLoading(true);
        setError(null);
        
        const price = await getCurrentGoldPrice();
        
        if (mounted) {
          setRawApiPrice(price);
          if (price === 0) setError('Failed to fetch live gold price API');
        }
      } catch (err) {
        if (mounted) {
          setError('Failed to fetch gold price');
          setRawApiPrice(0);
          console.error('Gold price fetch error:', err);
        }
      } finally {
        if (mounted) setLoading(false);
      }
    };

    fetchGoldPrice();
    const interval = setInterval(fetchGoldPrice, 24 * 60 * 60 * 1000);

    return () => {
      mounted = false;
      clearInterval(interval);
    };
  }, []);

  // --- THE MAGIC AUTO-FALLBACK ---
  // If the admin checked "Override", OR if the API failed (returned 0), use the Fallback!
  const safeGoldPrice = (overrideLiveGoldPrice || rawApiPrice === 0) 
    ? fallbackGoldPrice 
    : rawApiPrice;

  return { 
    goldPrice: safeGoldPrice, // Guaranteed safe price for all math globally
    rawApiPrice,              // The pure API response for the Settings UI to check
    loading, 
    error 
  };
}