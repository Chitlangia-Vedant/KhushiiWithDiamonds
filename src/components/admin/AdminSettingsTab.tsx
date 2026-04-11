import React, { useState } from 'react';
import { Save, TrendingUp, Percent, Scissors } from 'lucide-react';
import toast from 'react-hot-toast';

interface Props {
  fallbackGoldPrice: number;
  gstRate: number;
  goldPrice: number;
  overrideLiveGoldPrice: boolean;
  globalGoldMakingCharges: number;
  updateSetting: (key: string, value: any) => Promise<boolean>;
}

export function AdminSettingsTab({ fallbackGoldPrice, gstRate, goldPrice, overrideLiveGoldPrice, globalGoldMakingCharges, updateSetting }: Props) {
  const [localFallback, setLocalFallback] = useState(fallbackGoldPrice);
  const [localGst, setLocalGst] = useState(gstRate * 100);
  const [localMaking, setLocalMaking] = useState(globalGoldMakingCharges);
  const [isSaving, setIsSaving] = useState(false);

  const handleSave = async () => {
    setIsSaving(true);
    const loadingToast = toast.loading('Saving settings...');
    try {
      await updateSetting('fallbackGoldPrice', localFallback);
      await updateSetting('gstRate', localGst / 100);
      await updateSetting('globalGoldMakingCharges', localMaking);
      toast.success('Settings updated successfully!', { id: loadingToast });
    } catch (error) { toast.error('Failed to save settings.', { id: loadingToast }); } finally { setIsSaving(false); }
  };

  return (
    <div className="bg-white rounded-xl shadow-sm border border-gray-100 overflow-hidden max-w-2xl mx-auto mt-2">
      {/* HEADER */}
      <div className="flex justify-between items-center p-3 sm:p-4 border-b border-gray-100 bg-gray-50">
        <h2 className="text-base sm:text-lg font-bold text-gray-800">Global System Settings</h2>
        <button onClick={handleSave} disabled={isSaving} className="bg-yellow-600 text-white p-1.5 sm:px-4 sm:py-1.5 rounded flex items-center hover:bg-yellow-700 transition font-medium text-sm shadow-sm">
          <Save className="h-4 w-4" /> <span className="hidden sm:inline ml-1.5">{isSaving ? 'Saving...' : 'Save All'}</span>
        </button>
      </div>

      <div className="p-3 sm:p-5 space-y-3 sm:space-y-4">
        
        {/* COMPACT GOLD PRICING */}
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 p-3 sm:p-4 border border-gray-100 rounded-lg bg-white shadow-sm">
          <div className="flex items-center gap-3">
            <div className="p-2 bg-yellow-50 rounded text-yellow-600"><TrendingUp className="h-4 w-4 sm:h-5 sm:w-5"/></div>
            <div>
              <h3 className="text-sm font-bold text-gray-800">Gold Price</h3>
              <p className="text-[10px] text-gray-500">Live API: ₹{goldPrice}/g</p>
            </div>
          </div>
          <div className="flex items-center gap-4 sm:gap-6">
            <div className="flex flex-col">
              <label className="text-[10px] font-semibold text-gray-500 mb-1">Fallback (₹/g)</label>
              <input type="number" value={localFallback} onChange={e=>setLocalFallback(Number(e.target.value))} className="w-20 sm:w-24 px-2 py-1 text-xs border border-gray-200 rounded focus:ring-1 focus:ring-yellow-500" />
            </div>
            <div className="flex flex-col items-center">
              <label className="text-[10px] font-semibold text-gray-500 mb-1">Override Live</label>
              <input type="checkbox" checked={overrideLiveGoldPrice} onChange={e=>updateSetting('overrideLiveGoldPrice', e.target.checked)} className="rounded border-gray-300 text-yellow-600 focus:ring-yellow-500 h-4 w-4 cursor-pointer" />
            </div>
          </div>
        </div>

        {/* COMPACT GST */}
        <div className="flex items-center justify-between gap-3 p-3 sm:p-4 border border-gray-100 rounded-lg bg-white shadow-sm">
           <div className="flex items-center gap-3">
            <div className="p-2 bg-blue-50 rounded text-blue-600"><Percent className="h-4 w-4 sm:h-5 sm:w-5"/></div>
            <h3 className="text-sm font-bold text-gray-800">GST Rate</h3>
          </div>
          <div className="flex items-center bg-gray-50 border border-gray-200 rounded px-1">
            <input type="number" value={localGst} onChange={e=>setLocalGst(Number(e.target.value))} className="w-12 sm:w-16 px-1 py-1 text-xs bg-transparent border-none focus:ring-0 text-right font-medium" />
            <span className="text-xs font-bold text-gray-500 pr-2">%</span>
          </div>
        </div>

        {/* COMPACT MAKING CHARGES */}
        <div className="flex items-center justify-between gap-3 p-3 sm:p-4 border border-gray-100 rounded-lg bg-white shadow-sm">
           <div className="flex items-center gap-3">
            <div className="p-2 bg-green-50 rounded text-green-600"><Scissors className="h-4 w-4 sm:h-5 sm:w-5"/></div>
            <div>
              <h3 className="text-sm font-bold text-gray-800">Making Charges</h3>
              <p className="text-[10px] text-gray-500">Global Base Rate</p>
            </div>
          </div>
          <div className="flex items-center bg-gray-50 border border-gray-200 rounded px-1">
            <span className="text-xs font-bold text-gray-500 pl-2">₹</span>
            <input type="number" value={localMaking} onChange={e=>setLocalMaking(Number(e.target.value))} className="w-16 sm:w-20 px-1 py-1 text-xs bg-transparent border-none focus:ring-0 text-right font-medium" />
            <span className="text-[10px] text-gray-500 pr-2">/g</span>
          </div>
        </div>

      </div>
    </div>
  );
}