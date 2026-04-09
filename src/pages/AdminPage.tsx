import React, { useState, useEffect } from 'react';
import { Link } from 'react-router-dom';
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

export function AdminPage() {
  const { categories } = useCategories();
  const { globalGoldPurity, setGlobalGoldPurity, globalDiamondQuality, setGlobalDiamondQuality } = useQualityContext();
  const [isAuthenticated, setIsAuthenticated] = useState(false);
  const [loading, setLoading] = useState(true);
  const [items, setItems] = useState<JewelleryItem[]>([]);
  const [activeTab, setActiveTab] = useState<'items' | 'categories' | 'settings'| 'diamonds'>('items');
  
  const { goldPrice } = useGoldPrice();
  const { 
      fallbackGoldPrice, 
      gstRate, 
      overrideLiveGoldPrice, 
      globalGoldMakingCharges, 
      updateSetting,
      diamondBaseCosts,    // <-- Grab it here!
      diamondTiers,        // <-- Grab it here!
      saveDiamondPricing   // <-- Grab it here!
    } = useAdminSettings();

  useEffect(() => {
    checkAuthStatus();
  }, []);

  useEffect(() => {
    if (isAuthenticated) loadData();
  }, [isAuthenticated]);

  const checkAuthStatus = async () => {
    try {
      const { data: { session } } = await supabase.auth.getSession();
      setIsAuthenticated(session !== null);
    } catch (error) {
      console.error('Error checking auth status:', error);
      setIsAuthenticated(false);
    } finally {
      setLoading(false);
    }
  };

  const handleLogout = async () => {
    try {
      await supabase.auth.signOut();
      setIsAuthenticated(false);
      setItems([]);
    } catch (error) {
      console.error('Error signing out:', error);
    }
  };

  const loadData = async () => {
    try {
      // We only need to fetch items now! Categories are handled by the hook.
      const { data } = await supabase
        .from('jewellery_items')
        .select('*')
        .order('created_at', { ascending: false });

      if (data) setItems(data);
    } catch (error) {
      console.error('Error loading items:', error);
    }
  };

  const effectiveGoldPrice = overrideLiveGoldPrice ? fallbackGoldPrice : goldPrice;

  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <div className="text-center">
          <Shield className="h-12 w-12 text-yellow-600 mx-auto animate-pulse" />
          <p className="mt-4 text-gray-600">Checking authentication...</p>
        </div>
      </div>
    );
  }

  if (!isAuthenticated) {
    return <AdminLogin onLoginSuccess={() => setIsAuthenticated(true)} />;
  }

  return (
    // 1. Removed max-w from the outer div so the sticky header can stretch 100% wide
    <div className="pb-8 bg-gray-50 min-h-screen">
      
      {/* --- UNIFIED SINGLE-ROW APP BAR --- */}
      <div className="sticky top-0 z-50 bg-white/95 backdrop-blur-md border-b border-gray-200 shadow-sm mb-4">
        {/* 2. The max-w here perfectly centers your header buttons */}
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-2 md:py-3 flex flex-wrap items-center justify-between gap-3">
          
          {/* LEFT SIDE: Branding & Navigation Tabs */}
          <div className="flex flex-wrap items-center gap-3 sm:gap-6">
            {/* Shortened Brand Name */}
            <Link to="/" className="text-lg font-black text-gray-900 hover:text-yellow-600 transition-colors tracking-tight">
              KWD<span className="text-yellow-600">Admin</span>
            </Link>

            {/* Integrated Tabs */}
            <div className="flex flex-wrap gap-1 sm:border-l sm:border-gray-200 sm:pl-6">
              {[
                { key: 'items', icon: Package, label: `Items (${items.length})` },
                { key: 'categories', icon: Folder, label: `Categories (${categories.length})` },
                { key: 'settings', icon: Settings, label: 'Settings' },
                { key: 'diamonds', icon: Gem, label: 'Diamond Pricing' }
              ].map(({ key, icon: Icon, label }) => (
                <button
                  key={key}
                  onClick={() => setActiveTab(key as 'items' | 'categories' | 'settings')}
                  className={`px-2.5 py-1.5 rounded-md flex items-center space-x-1.5 text-xs font-semibold whitespace-nowrap transition-colors ${
                    activeTab === key
                      ? 'bg-yellow-50 text-yellow-700'
                      : 'text-gray-600 hover:bg-gray-100'
                  }`}
                >
                  <Icon className="h-3.5 w-3.5" />
                  <span>{label}</span>
                </button>
              ))}
            </div>
          </div>

          {/* RIGHT SIDE: Tools, Status, & Logout */}
          <div className="flex flex-wrap items-center gap-2 sm:gap-3 ml-auto">
            
            {/* Micro Quality Selectors */}
            {activeTab === 'items' && (
              <div className="flex flex-wrap items-center gap-1.5 border-r border-gray-200 pr-3">
                <select
                  value={globalGoldPurity}
                  onChange={(e) => setGlobalGoldPurity(e.target.value)}
                  className="text-[11px] border-none bg-yellow-50 text-yellow-800 rounded py-0.5 pl-1.5 pr-5 focus:ring-0 cursor-pointer font-bold"
                >
                  {GOLD_QUALITIES.map((gold) => (
                    <option key={gold.value} value={gold.value}>{gold.value}</option>
                  ))}
                </select>

                <div className="flex items-center bg-blue-50 rounded pl-1.5 pr-0.5 py-0.5">
                  <Sparkles className="h-2.5 w-2.5 text-blue-500 mr-1" />
                  <select
                    value={globalDiamondQuality}
                    onChange={(e) => setGlobalDiamondQuality(e.target.value as DiamondQuality)}
                    className="text-[11px] border-none bg-transparent text-blue-800 p-0 pr-4 focus:ring-0 cursor-pointer font-bold"
                  >
                    {DIAMOND_QUALITIES.map((quality) => (
                      <option key={quality} value={quality}>{quality}</option>
                    ))}
                  </select>
                </div>
              </div>
            )}

            {/* Live Pricing Stats */}
            <div className="hidden sm:flex items-center space-x-2 text-[10px] sm:text-[11px] font-bold px-1 uppercase tracking-wider">
              <span className={overrideLiveGoldPrice ? 'text-orange-600' : 'text-gray-500'} title="Current Gold Price">
                Gold: ₹{effectiveGoldPrice.toLocaleString('en-IN')}/g
              </span>
              <span className="text-gray-300">|</span>
              <span className="text-gray-500" title="Current GST Rate">
                GST: {Math.round(gstRate * 100)}%
              </span>
            </div>

            {/* Icon-Only Logout Button */}
            <button
              onClick={handleLogout}
              title="Sign Out"
              className="p-1.5 text-gray-400 hover:text-red-600 hover:bg-red-50 rounded transition-colors"
            >
              <LogOut className="h-4 w-4" />
            </button>
          </div>

        </div>
      </div>

      {/* --- TAB CONTENT STARTS IMMEDIATELY HERE --- */}
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        {/* --- TAB CONTENT STARTS IMMEDIATELY HERE --- */}
        {activeTab === 'items' && <AdminItemsTab />}
        {activeTab === 'categories' && <AdminCategoriesTab />}
        {activeTab === 'settings' && (
          <AdminSettingsTab 
            fallbackGoldPrice={fallbackGoldPrice}
            gstRate={gstRate}
            goldPrice={goldPrice}
            overrideLiveGoldPrice={overrideLiveGoldPrice}
            globalGoldMakingCharges={globalGoldMakingCharges} // <-- NEW
            updateSetting={updateSetting}
          />
        )}
        {activeTab === 'diamonds' && (
          <AdminDiamondsTab initialBaseCosts={diamondBaseCosts} initialTiers={diamondTiers} saveDiamondPricing={saveDiamondPricing} />
        )}
      </div>
    </div>
  );
}