import React, { useState, useEffect } from 'react';
import { Link, Routes, Route, Navigate, useLocation, useNavigate } from 'react-router-dom';
import { supabase } from '../lib/supabase';
import { JewelleryItem } from '../types';
import { AdminLogin } from '../components/AdminLogin';
import { AdminItemsTab } from '../components/admin/AdminItemsTab';
import { AdminCategoriesTab } from '../components/admin/AdminCategoriesTab';
import { AdminSettingsTab } from '../components/admin/AdminSettingsTab';
import { AdminDiamondsTab } from '../components/admin/AdminDiamondsTab';
import { LogOut, Shield, Folder, Package, Settings, Sparkles, Gem } from 'lucide-react';
import { useGoldPrice } from '../hooks/useGoldPrice';
import { useAdminSettings } from '../hooks/useAdminSettings';
import { useCategories } from '../hooks/useCategories';
import { useQualityContext } from '../context/QualityContext';
import { GOLD_QUALITIES, DIAMOND_QUALITIES, DiamondQuality } from '../constants/jewellery';
import toast from 'react-hot-toast';

export function AdminPage() {
  const location = useLocation();
  const navigate = useNavigate();
  const currentTab = location.pathname.split('/').pop() || 'items';

  const { categories } = useCategories();
  const { globalGoldPurity, setGlobalGoldPurity, globalDiamondQuality, setGlobalDiamondQuality } = useQualityContext();
  const [isAuthenticated, setIsAuthenticated] = useState(false);
  const [loading, setLoading] = useState(true);
  const [items, setItems] = useState<JewelleryItem[]>([]);
  
  const { goldPrice } = useGoldPrice();
  const { fallbackGoldPrice, gstRate, overrideLiveGoldPrice, globalGoldMakingCharges, updateSetting, diamondBaseCosts, diamondTiers, saveDiamondPricing } = useAdminSettings();

  useEffect(() => { checkAuthStatus(); }, []);
  useEffect(() => { if (isAuthenticated) loadData(); }, [isAuthenticated]);

  const checkAuthStatus = async () => {
    try {
      const { data: { session } } = await supabase.auth.getSession();
      setIsAuthenticated(session !== null);
    } catch (error) { setIsAuthenticated(false); } finally { setLoading(false); }
  };

  const handleLogout = async () => {
    try {
      await supabase.auth.signOut();
      setIsAuthenticated(false); setItems([]);
      toast.success('Logged out successfully.');
    } catch (error) { toast.error('Error signing out. Please try again.'); }
  };

  const loadData = async () => {
    try {
      const { data } = await supabase.from('jewellery_items').select('*').order('created_at', { ascending: false });
      if (data) setItems(data);
    } catch (error) { console.error('Error loading items:', error); }
  };

  const effectiveGoldPrice = overrideLiveGoldPrice ? fallbackGoldPrice : goldPrice;

  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <div className="text-center"><Shield className="h-12 w-12 text-yellow-600 mx-auto animate-pulse" /><p className="mt-4 text-gray-600">Checking authentication...</p></div>
      </div>
    );
  }

  if (!isAuthenticated) return <AdminLogin onLoginSuccess={() => setIsAuthenticated(true)} />;

  return (
    <div className="pb-8 bg-gray-50 min-h-screen">
      
      {/* --- ULTRA-COMPACT HEADER --- */}
      <div className="sticky top-0 z-50 bg-white/95 backdrop-blur-md border-b border-gray-200 shadow-sm mb-3 sm:mb-4">
        {/* Single Line, Scrollable on extra small screens */}
        <div className="max-w-7xl mx-auto px-2 sm:px-6 lg:px-8 py-1.5 sm:py-2 flex items-center justify-between gap-2 overflow-x-auto no-scrollbar">
          
          <div className="flex items-center gap-2 sm:gap-4 flex-shrink-0">
            <Link to="/" className="text-base sm:text-lg font-black text-gray-900 hover:text-yellow-600 transition-colors tracking-tight">
              KWD<span className="hidden sm:inline text-yellow-600">Admin</span>
            </Link>

            {/* ROUTE-BASED TABS */}
            <div className="flex items-center gap-1 sm:border-l sm:border-gray-200 sm:pl-3">
              {[
                { key: 'items', icon: Package, label: `Items (${items.length})`, path: '/admin/items' },
                { key: 'categories', icon: Folder, label: `Categories (${categories.length})`, path: '/admin/categories' },
                { key: 'settings', icon: Settings, label: 'Settings', path: '/admin/settings' },
                { key: 'diamonds', icon: Gem, label: 'Diamond Pricing', path: '/admin/diamonds' }
              ].map(({ key, icon: Icon, label, path }) => (
                <button
                  key={key} onClick={() => navigate(path)}
                  className={`p-1.5 sm:px-2.5 sm:py-1.5 rounded-md flex items-center text-[10px] sm:text-xs font-semibold whitespace-nowrap transition-colors ${
                    currentTab === key ? 'bg-yellow-50 text-yellow-700' : 'text-gray-600 hover:bg-gray-100'
                  }`}
                  title={label}
                >
                  <Icon className="h-4 w-4 sm:h-3.5 sm:w-3.5 sm:mr-1.5" />
                  <span className="hidden sm:inline">{label}</span>
                </button>
              ))}
            </div>
          </div>

          {/* Right Side Settings */}
          <div className="flex items-center gap-1.5 sm:gap-3 flex-shrink-0 ml-auto">
            {currentTab === 'items' && (
              <div className="flex items-center gap-1 sm:gap-1.5 border-r border-gray-200 pr-1.5 sm:pr-3">
                <select value={globalGoldPurity} onChange={(e) => setGlobalGoldPurity(e.target.value)} className="text-[10px] sm:text-[11px] border-none bg-yellow-50 text-yellow-800 rounded py-0.5 pl-1 pr-4 sm:pr-5 focus:ring-0 cursor-pointer font-bold">
                  {GOLD_QUALITIES.map((gold) => <option key={gold.value} value={gold.value}>{gold.value}</option>)}
                </select>
                <div className="flex items-center bg-blue-50 rounded pl-1 pr-0.5 py-0.5">
                  <Sparkles className="h-2.5 w-2.5 text-blue-500 mr-0.5 sm:mr-1" />
                  <select value={globalDiamondQuality} onChange={(e) => setGlobalDiamondQuality(e.target.value as DiamondQuality)} className="text-[10px] sm:text-[11px] border-none bg-transparent text-blue-800 p-0 pr-3 sm:pr-4 focus:ring-0 cursor-pointer font-bold">
                    {DIAMOND_QUALITIES.map((quality) => <option key={quality} value={quality}>{quality}</option>)}
                  </select>
                </div>
              </div>
            )}

            <div className="hidden sm:flex items-center space-x-2 text-[11px] font-bold px-1 uppercase tracking-wider">
              <span className={overrideLiveGoldPrice ? 'text-orange-600' : 'text-gray-500'}>Gold: ₹{effectiveGoldPrice.toLocaleString('en-IN')}/g</span>
              <span className="text-gray-300">|</span>
              <span className="text-gray-500">GST: {Math.round(gstRate * 100)}%</span>
            </div>

            <button onClick={handleLogout} className="p-1 sm:p-1.5 text-gray-400 hover:text-red-600 hover:bg-red-50 rounded transition-colors"><LogOut className="h-4 w-4" /></button>
          </div>

        </div>
      </div>

      {/* --- CONTENT --- */}
      <div className="max-w-7xl mx-auto px-2 sm:px-6 lg:px-8">
        <Routes>
          <Route path="/" element={<Navigate to="items" replace />} />
          <Route path="items" element={<AdminItemsTab />} />
          <Route path="categories" element={<AdminCategoriesTab />} />
          <Route path="settings" element={<AdminSettingsTab fallbackGoldPrice={fallbackGoldPrice} gstRate={gstRate} goldPrice={goldPrice} overrideLiveGoldPrice={overrideLiveGoldPrice} globalGoldMakingCharges={globalGoldMakingCharges} updateSetting={updateSetting} />} />
          <Route path="diamonds" element={<AdminDiamondsTab initialBaseCosts={diamondBaseCosts} initialTiers={diamondTiers} saveDiamondPricing={saveDiamondPricing} />} />
        </Routes>
      </div>
    </div>
  );
}