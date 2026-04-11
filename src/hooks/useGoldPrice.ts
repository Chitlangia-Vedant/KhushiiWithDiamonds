import { useState, useEffect } from 'react';
import { getCurrentGoldPrice } from '../lib/goldPrice';

export function useGoldPrice() {
  const [goldPrice, setGoldPrice] = useState(0); // Start at 0
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    let mounted = true;

    const fetchGoldPrice = async () => {
      try {
        setLoading(true);
        setError(null);
        
        const price = await getCurrentGoldPrice();
        
        if (mounted) {
          setGoldPrice(price);
          // If price is 0, we know the API failed
          if (price === 0) setError('Failed to fetch live gold price API');
        }
      } catch (err) {
        if (mounted) {
          setError('Failed to fetch gold price');
          setGoldPrice(0);
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

  return { goldPrice, loading, error };
}