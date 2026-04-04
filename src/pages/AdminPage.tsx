import React, { useState, useEffect } from 'react';
import { Link } from 'react-router-dom';
import { supabase } from '../lib/supabase';
import { JewelleryItem } from '../types';
import { AdminLogin } from '../components/AdminLogin';
import { AdminItemsTab } from '../components/admin/AdminItemsTab';
import { AdminCategoriesTab } from '../components/admin/AdminCategoriesTab';
import { AdminSettingsTab } from '../components/admin/AdminSettingsTab';
import { LogOut, Shield, Folder, Package, Settings, Sparkles } from 'lucide-react';
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
  const [activeTab, setActiveTab] = useState<'items' | 'categories' | 'settings'>('items');
  
  const { goldPrice } = useGoldPrice();
  const { fallbackGoldPrice, gstRate, overrideLiveGoldPrice, updateSetting } = useAdminSettings();

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
    // Reduced vertical padding from py-8 to py-4 sm:py-6
    <div className="max-w-[95rem] mx-auto px-4 sm:px-6 lg:px-8 py-4 sm:py-6">
      
      {/* --- UNIFIED SINGLE-ROW APP BAR --- */}
      <div className="flex flex-col xl:flex-row justify-between items-start xl:items-center bg-white p-2 sm:p-3 rounded-xl shadow-sm mb-6 border border-gray-100 gap-4">
        
        {/* LEFT SIDE: Branding & Navigation Tabs */}
        <div className="flex flex-col sm:flex-row items-start sm:items-center gap-4 sm:gap-6 w-full xl:w-auto">
          {/* Shortened Brand Name */}
          <Link to="/" className="text-xl font-black text-gray-900 hover:text-yellow-600 transition-colors tracking-tight px-2">
            KWD<span className="text-yellow-600">Admin</span>
          </Link>

          {/* Integrated Tabs */}
          <div className="flex space-x-1 sm:border-l sm:border-gray-200 sm:pl-6 w-full sm:w-auto overflow-x-auto pb-1 sm:pb-0">
            {[
              { key: 'items', icon: Package, label: `Items (${items.length})` },
              { key: 'categories', icon: Folder, label: `Categories (${categories.length})` },
              { key: 'settings', icon: Settings, label: 'Settings' }
            ].map(({ key, icon: Icon, label }) => (
              <button
                key={key}
                onClick={() => setActiveTab(key as 'items' | 'categories' | 'settings')}
                className={`px-3 py-1.5 rounded-md flex items-center space-x-1.5 text-sm font-medium whitespace-nowrap transition-colors ${
                  activeTab === key
                    ? 'bg-yellow-50 text-yellow-700'
                    : 'text-gray-600 hover:bg-gray-50'
                }`}
              >
                <Icon className="h-4 w-4" />
                <span>{label}</span>
              </button>
            ))}
          </div>
        </div>

        {/* RIGHT SIDE: Tools, Status, & Logout */}
        <div className="flex flex-wrap items-center gap-3 w-full xl:w-auto justify-between xl:justify-end border-t xl:border-t-0 border-gray-100 pt-3 xl:pt-0">
          
          {/* Micro Quality Selectors */}
          {activeTab === 'items' && (
            <div className="flex items-center space-x-2 border-r border-gray-200 pr-3 md:pr-4">
              <select
                value={globalGoldPurity}
                onChange={(e) => setGlobalGoldPurity(e.target.value)}
                className="text-xs border-none bg-yellow-50 text-yellow-800 rounded-md py-1 pl-2 pr-6 focus:ring-0 cursor-pointer font-medium"
              >
                {GOLD_QUALITIES.map((gold) => (
                  <option key={gold.value} value={gold.value}>{gold.value}</option>
                ))}
              </select>

              <div className="flex items-center space-x-1 bg-blue-50 rounded-md pl-2">
                <Sparkles className="h-3 w-3 text-blue-500" />
                <select
                  value={globalDiamondQuality}
                  onChange={(e) => setGlobalDiamondQuality(e.target.value as DiamondQuality)}
                  className="text-xs border-none bg-transparent text-blue-800 py-1 pl-1 pr-6 focus:ring-0 cursor-pointer font-medium"
                >
                  {DIAMOND_QUALITIES.map((quality) => (
                    <option key={quality} value={quality}>{quality}</option>
                  ))}
                </select>
              </div>
            </div>
          )}

          {/* Live Pricing Stats */}
          <div className="flex items-center space-x-3 text-[11px] sm:text-xs font-medium px-2">
            <span className={overrideLiveGoldPrice ? 'text-orange-600' : 'text-gray-600'} title="Current Gold Price">
              Gold: ₹{effectiveGoldPrice.toLocaleString('en-IN')}/g
            </span>
            <span className="text-gray-300">|</span>
            <span className="text-gray-600" title="Current GST Rate">
              GST: {Math.round(gstRate * 100)}%
            </span>
          </div>

          {/* Icon-Only Logout Button */}
          <button
            onClick={handleLogout}
            title="Sign Out"
            className="p-1.5 text-gray-400 hover:text-red-600 hover:bg-red-50 rounded-md transition-colors ml-auto xl:ml-2"
          >
            <LogOut className="h-4 w-4 md:h-5 md:w-5" />
          </button>
        </div>

      </div>

      {/* --- TAB CONTENT STARTS IMMEDIATELY HERE --- */}
      {activeTab === 'items' && <AdminItemsTab />}
      {activeTab === 'categories' && <AdminCategoriesTab />}
      {activeTab === 'settings' && (
        <AdminSettingsTab 
          fallbackGoldPrice={fallbackGoldPrice}
          gstRate={gstRate}
          goldPrice={goldPrice}
          overrideLiveGoldPrice={overrideLiveGoldPrice}
          updateSetting={updateSetting}
        />
      )}
    </div>
  );
}