import React, { useState, useEffect } from 'react';
import { Link, Routes, Route, Navigate, useLocation, useNavigate } from 'react-router-dom';
import { supabase } from '../lib/supabase';
import { AdminLogin } from '../components/AdminLogin';
import { AdminItemsTab } from '../components/admin/AdminItemsTab';
import { AdminCategoriesTab } from '../components/admin/AdminCategoriesTab';
import { AdminSettingsTab } from '../components/admin/AdminSettingsTab';
import { AdminDiamondsTab } from '../components/admin/AdminDiamondsTab';
import { LogOut, Shield, Folder, Package, Settings, Sparkles, Gem, AlertTriangle } from 'lucide-react';
import { useGoldPrice } from '../hooks/useGoldPrice';
import { useAdminSettings } from '../hooks/useAdminSettings';
import { useQualityContext } from '../context/QualityContext';
import { GOLD_QUALITIES, DIAMOND_QUALITIES, DiamondQuality } from '../constants/jewellery';
import toast from 'react-hot-toast';

export function AdminPage() {
  const location = useLocation();
  const navigate = useNavigate();
  const currentTab = location.pathname.split('/').pop() || 'items';

  const { globalGoldPurity, setGlobalGoldPurity, globalDiamondQuality, setGlobalDiamondQuality } = useQualityContext();
  const [isAuthenticated, setIsAuthenticated] = useState(false);
  const [loading, setLoading] = useState(true);
  
  const { goldPrice, rawApiPrice } = useGoldPrice();
  const { fallbackGoldPrice, gstRate, overrideLiveGoldPrice, globalGoldMakingCharges, updateSetting, diamondBaseCosts, diamondTiers, saveDiamondPricing } = useAdminSettings();

  useEffect(() => { checkAuthStatus(); }, []);

  const checkAuthStatus = async () => {
    try {
      const { data: { session } } = await supabase.auth.getSession();
      setIsAuthenticated(session !== null);
    } catch (error) { setIsAuthenticated(false); } finally { setLoading(false); }
  };

  const handleLogout = async () => {
    try {
      await supabase.auth.signOut();
      setIsAuthenticated(false);
      toast.success('Logged out successfully.');
    } catch (error) { toast.error('Error signing out.'); }
  };

  const handleTabClick = (path: string) => {
    if ((window as any).isFormDirty) {
      toast((t) => (
        <div className="flex flex-col p-1 min-w-[320px]">
          <div className="flex items-center gap-3 mb-3">
            <div className="w-10 h-10 bg-orange-50 rounded-full flex items-center justify-center flex-shrink-0 border border-orange-100">
              <AlertTriangle className="h-5 w-5 text-orange-600" />
            </div>
            <h3 className="font-extrabold text-gray-900 text-lg">Unsaved Changes</h3>
          </div>
          <div className="text-sm text-gray-800 mb-5 pl-[52px] leading-relaxed">
            <p className="mb-2 font-medium">You have unsaved changes on this page.</p>
            <p className="bg-orange-50/80 p-2 border border-orange-100 rounded text-orange-900 text-xs">
              <span className="font-bold text-orange-600">Warning:</span> Are you sure you want to leave without saving?
            </p>
          </div>
          <div className="flex justify-end gap-3 mt-1">
            <button onClick={() => toast.dismiss(t.id)} className="px-5 py-2 text-sm font-bold text-gray-700 bg-white hover:bg-gray-50 rounded-lg transition-colors border border-gray-300 shadow-sm">
              Stay Here
            </button>
            <button 
              onClick={() => {
                toast.dismiss(t.id);
                (window as any).isFormDirty = false;
                navigate(path);
              }} 
              className="px-5 py-2 text-sm font-bold text-white bg-orange-500 hover:bg-orange-600 rounded-lg transition-colors shadow-sm border border-orange-600"
            >
              Discard & Leave
            </button>
          </div>
        </div>
      ), { duration: Infinity, style: { maxWidth: '450px', padding: '16px', backgroundColor: '#ffffff', border: '1px solid #fed7aa' } });
    } else {
      navigate(path);
    }
  };

  if (loading) {
    return <div className="min-h-screen flex items-center justify-center"><Shield className="h-12 w-12 text-yellow-600 mx-auto animate-pulse" /></div>;
  }

  if (!isAuthenticated) return <AdminLogin onLoginSuccess={() => setIsAuthenticated(true)} />;

  return (
    <div className="pb-8 bg-gray-50 min-h-screen">
      <div className="sticky top-0 z-50 bg-white/95 backdrop-blur-md border-b border-gray-200 shadow-sm mb-3 sm:mb-4">
        <div className="max-w-7xl mx-auto px-2 sm:px-6 lg:px-8 py-1.5 sm:py-2 flex items-center justify-between gap-2 overflow-x-auto no-scrollbar">
          
          <div className="flex items-center gap-2 sm:gap-4 flex-shrink-0">
            <Link to="/" className="text-base sm:text-lg font-black text-gray-900 hover:text-yellow-600 transition-colors tracking-tight">
              KWD<span className="hidden sm:inline text-yellow-600">Admin</span>
            </Link>

            <div className="flex items-center gap-1 sm:border-l sm:border-gray-200 sm:pl-3">
              {[
                { key: 'items', icon: Package, label: 'Items', path: '/admin/items' },
                { key: 'categories', icon: Folder, label: 'Categories', path: '/admin/categories' },
                { key: 'settings', icon: Settings, label: 'Settings', path: '/admin/settings' },
                { key: 'diamonds', icon: Gem, label: 'Diamond Pricing', path: '/admin/diamonds' }
              ].map(({ key, icon: Icon, label, path }) => (
                <button
                  key={key} 
                  onClick={() => handleTabClick(path)} 
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

          <div className="flex items-center gap-1.5 sm:gap-3 flex-shrink-0 ml-auto">
            {currentTab === 'items' && (
              <div className="flex items-center gap-1 sm:gap-1.5 border-r border-gray-200 pr-1.5 sm:pr-3">
                <select value={globalGoldPurity} onChange={(e) => setGlobalGoldPurity(e.target.value)} className="text-[10px] sm:text-[11px] border-none bg-yellow-50 text-yellow-800 rounded py-0.5 pl-1 pr-4 sm:pr-5 focus:ring-0 cursor-pointer font-bold">
                  {GOLD_QUALITIES.map((gold) => <option key={gold.value} value={gold.value}>{gold.value}</option>)}
                </select>
                <div className="flex items-center bg-blue-50 rounded pl-1 pr-0.5 py-0.5">
                  <Sparkles className="h-2.5 w-2.5 text-blue-500 mr-0.5 sm:mr-1" />
                  <select value={globalDiamondQuality} onChange={(e) => setGlobalDiamondQuality(e.target.value as DiamondQuality)} className="text-[10px] sm:text-[11px] border-none bg-transparent text-blue-800 p-0 pr-3 sm:pr-4 focus:ring-0 cursor-pointer font-bold">
                    {DIAMOND_QUALITIES.map((quality) => <option key={quality.value} value={quality.value}>{quality.value}</option>)}
                  </select>
                </div>
              </div>
            )}
            <div className="flex items-center space-x-1 sm:space-x-2 text-[9px] sm:text-[11px] font-bold px-1 uppercase tracking-wider whitespace-nowrap flex-shrink-0">
              <span className={(overrideLiveGoldPrice || rawApiPrice === 0) ? 'text-orange-600' : 'text-gray-500'}>Gold: ₹{goldPrice.toLocaleString('en-IN')}/g</span>
              <span className="text-gray-300">|</span>
              <span className="text-gray-500">GST: {Math.round(gstRate * 100)}%</span>
            </div>
            <button onClick={handleLogout} className="p-1 sm:p-1.5 text-gray-400 hover:text-red-600 hover:bg-red-50 rounded transition-colors flex-shrink-0"><LogOut className="h-4 w-4" /></button>
          </div>

        </div>
      </div>

      <div className="max-w-7xl mx-auto px-2 sm:px-6 lg:px-8">
        <Routes>
          <Route path="/" element={<Navigate to="items" replace />} />
          <Route path="items" element={<AdminItemsTab />} />
          <Route path="categories" element={<AdminCategoriesTab />} />
          <Route path="settings" element={<AdminSettingsTab fallbackGoldPrice={fallbackGoldPrice} gstRate={gstRate} goldPrice={rawApiPrice} overrideLiveGoldPrice={overrideLiveGoldPrice} globalGoldMakingCharges={globalGoldMakingCharges} updateSetting={updateSetting} />} />
          <Route path="diamonds" element={<AdminDiamondsTab initialBaseCosts={diamondBaseCosts} initialTiers={diamondTiers} saveDiamondPricing={saveDiamondPricing} />} />
        </Routes>
      </div>
    </div>
  );
}