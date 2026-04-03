import React, { useState, useEffect } from 'react';
import { supabase } from '../lib/supabase';
import { Category, JewelleryItem } from '../types';
import { AdminLogin } from '../components/AdminLogin';
import { AdminItemsTab } from '../components/admin/AdminItemsTab';
import { AdminCategoriesTab } from '../components/admin/AdminCategoriesTab';
import { AdminSettingsTab } from '../components/admin/AdminSettingsTab';
import { LogOut, Shield, Folder, Package, Settings } from 'lucide-react';
import { formatCurrency } from '../lib/goldPrice';
import { useGoldPrice } from '../hooks/useGoldPrice';
import { useAdminSettings } from '../hooks/useAdminSettings';

export function AdminPage() {
  const [isAuthenticated, setIsAuthenticated] = useState(false);
  const [loading, setLoading] = useState(true);
  const [items, setItems] = useState<JewelleryItem[]>([]);
  const [categories, setCategories] = useState<Category[]>([]);
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
      setCategories([]);
    } catch (error) {
      console.error('Error signing out:', error);
    }
  };

  const loadData = async () => {
    try {
      const [itemsResponse, categoriesResponse] = await Promise.all([
        supabase.from('jewellery_items').select('*').order('created_at', { ascending: false }),
        supabase.from('categories').select('*').order('name')
      ]);

      if (itemsResponse.data) setItems(itemsResponse.data);
      if (categoriesResponse.data) setCategories(categoriesResponse.data);
    } catch (error) {
      console.error('Error loading data:', error);
    }
  };

  const handleCategoriesChange = () => {
    loadData();
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
        <div>
          <h1 className="text-3xl font-bold text-gray-900">Jewellery Admin Panel</h1>
          <p className="text-gray-600 mt-1">Manage your jewellery catalog</p>
        </div>
        <div className="flex items-center space-x-4">
          <div className="text-sm text-gray-600">
            Gold Price: <span className={`font-semibold ${overrideLiveGoldPrice ? 'text-orange-600' : 'text-yellow-600'}`}>
              {formatCurrency(effectiveGoldPrice)}/gram
            </span>
            {overrideLiveGoldPrice && (
              <span className="text-xs text-orange-600 block">Override Active</span>
            )}
          </div>
          <div className="text-sm text-gray-600">
            GST: <span className="font-semibold text-green-600">{Math.round(gstRate * 100)}%</span>
          </div>
          <button
            onClick={handleLogout}
            className="bg-gray-600 text-white px-4 py-2 rounded-lg hover:bg-gray-700 flex items-center space-x-2"
          >
            <LogOut className="h-5 w-5" />
            <span>Sign Out</span>
          </button>
        </div>
      </div>

      {/* Tabs */}
      <div className="flex space-x-1 mb-8">
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
        <AdminItemsTab 
          categories={categories}
          goldPrice={effectiveGoldPrice}
          gstRate={gstRate}
        />
      )}

      {activeTab === 'categories' && (
        <AdminCategoriesTab 
          items={items}
          onCategoriesChange={handleCategoriesChange}
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