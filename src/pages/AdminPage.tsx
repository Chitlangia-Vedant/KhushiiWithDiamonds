import React, { useState, useEffect } from 'react';
import { Link } from 'react-router-dom';
import { supabase } from '../lib/supabase';
import { JewelleryItem } from '../types';
import { AdminLogin } from '../components/AdminLogin';
import { AdminItemsTab } from '../components/admin/AdminItemsTab';
import { AdminCategoriesTab } from '../components/admin/AdminCategoriesTab';
import { AdminSettingsTab } from '../components/admin/AdminSettingsTab';
import { LogOut, Shield, Folder, Package, Settings, Sparkles } from 'lucide-react';
import { formatCurrency } from '../lib/goldPrice';
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
    <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
      <div className="flex justify-between items-center mb-8">
        <div className="flex flex-col lg:flex-row justify-between items-start lg:items-center mb-5 space-y-4 lg:space-y-0">
        
        {/* 1. Clickable Storefront Branding */}
        <Link to="/" className="group flex flex-col hover:opacity-80 transition-opacity">
          <h1 className="text-xl md:text-2xl font-bold text-gray-900 group-hover:text-yellow-600 transition-colors">
            KhushiiWithDiamonds
          </h1>
          <p className="text-[10px] sm:text-xs font-semibold text-yellow-600 uppercase tracking-widest mt-0.5">
            Premium Indian Jewellery
          </p>
        </Link>

        {/* 2. Controls & Status Container */}
        <div className="flex flex-wrap items-center gap-3 md:gap-4">
          
          {/* Global Quality Selectors */}
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

          {/* Pricing Status */}
          <div className="flex items-center space-x-3 text-xs md:text-sm text-gray-600">
            <div>
              Gold: <span className={`font-semibold ${overrideLiveGoldPrice ? 'text-orange-600' : 'text-yellow-600'}`}>
                {formatCurrency(effectiveGoldPrice)}/g
              </span>
            </div>
            <div>
              GST: <span className="font-semibold text-green-600">{Math.round(gstRate * 100)}%</span>
            </div>
          </div>

          {/* Logout Button (Shrunk slightly) */}
          <button
            onClick={handleLogout}
            className="bg-gray-800 text-white px-3 py-1.5 md:px-4 md:py-2 rounded-lg hover:bg-gray-900 flex items-center space-x-2 text-sm"
          >
            <LogOut className="h-4 w-4" />
            <span className="hidden sm:inline">Sign Out</span>
          </button>
        </div>
      </div>
      </div>

      {/* Tabs */}
      <div className="flex space-x-1 mb-4">
        {[
          { key: 'items', icon: Package, label: `Items (${items.length})` },
          { key: 'categories', icon: Folder, label: `Categories (${categories.length})` },
          { key: 'settings', icon: Settings, label: 'Settings' }
        ].map(({ key, icon: Icon, label }) => (
          <button
            key={key}
            onClick={() => setActiveTab(key as 'items' | 'categories' | 'settings')}
            className={`px-4 py-2 rounded-lg flex items-center space-x-2 ${
              activeTab === key
                ? 'bg-yellow-600 text-white'
                : 'bg-gray-200 text-gray-700 hover:bg-gray-300'
            }`}
          >
            <Icon className="h-5 w-5" />
            <span>{label}</span>
          </button>
        ))}
      </div>

      {/* Tab Content */}
      {activeTab === 'items' && (
        <AdminItemsTab />
      )}

      {activeTab === 'categories' && (
        <AdminCategoriesTab 
          items={items}
        />
      )}

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