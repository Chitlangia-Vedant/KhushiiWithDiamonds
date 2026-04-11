import React, { useState, useEffect } from 'react';
import { Save, TrendingUp, Percent, Scissors, AlertCircle } from 'lucide-react';
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
  // Use local states for the form so we can save everything at once
  const [localFallback, setLocalFallback] = useState(fallbackGoldPrice);
  const [localGst, setLocalGst] = useState(gstRate * 100);
  const [localMaking, setLocalMaking] = useState(globalGoldMakingCharges);
  const [localOverride, setLocalOverride] = useState(overrideLiveGoldPrice);
  const [isSaving, setIsSaving] = useState(false);

  // Sync props to local state in case the database data loads slightly after the component mounts
  useEffect(() => {
    setLocalFallback(fallbackGoldPrice);
    setLocalGst(gstRate * 100);
    setLocalMaking(globalGoldMakingCharges);
    setLocalOverride(overrideLiveGoldPrice);
  }, [fallbackGoldPrice, gstRate, globalGoldMakingCharges, overrideLiveGoldPrice]);

  const handleSave = async () => {
    setIsSaving(true);
    const loadingToast = toast.loading('Saving settings...');
    try {
      await updateSetting('fallbackGoldPrice', localFallback);
      await updateSetting('gstRate', localGst / 100);
      await updateSetting('globalGoldMakingCharges', localMaking);
      await updateSetting('overrideLiveGoldPrice', localOverride); // Saves the checkbox properly!
      
      toast.success('Settings updated successfully!', { id: loadingToast });
    } catch (error) { 
      toast.error('Failed to save settings.', { id: loadingToast }); 
    } finally { 
      setIsSaving(false); 
    }
  };

  return (
    <>
      {/* STANDARD HEADER */}
      <div className="flex justify-between items-center mb-4 sm:mb-6">
        <div>
          <h2 className="text-xl sm:text-2xl font-bold text-gray-900">Settings</h2>
          <p className="text-[10px] sm:text-sm text-gray-500 mt-0.5 sm:mt-1 hidden sm:block">Manage global pricing parameters.</p>
        </div>
        <button onClick={handleSave} disabled={isSaving} className="bg-yellow-600 text-white p-2 sm:px-4 sm:py-2 rounded-lg hover:bg-yellow-700 flex items-center shadow-sm flex-shrink-0 transition-colors">
          <Save className="h-5 w-5" /> <span className="hidden sm:inline ml-1.5 font-medium">{isSaving ? 'Saving...' : 'Save Settings'}</span>
        </button>
      </div>

      {/* MATCHING TABLE CONTAINER */}
      <div className="bg-white shadow-sm border border-gray-200 rounded-lg overflow-hidden mb-6">
        <div className="divide-y divide-gray-100">

          {/* Gold Price Row */}
          <div className="p-4 sm:p-6 flex flex-col sm:flex-row sm:items-center justify-between gap-4 hover:bg-gray-50 transition-colors">
            <div className="flex items-center gap-3 sm:gap-4">
              <div className="h-10 w-10 sm:h-12 sm:w-12 bg-yellow-50 text-yellow-600 rounded-lg flex items-center justify-center flex-shrink-0 border border-yellow-100">
                <TrendingUp className="h-5 w-5 sm:h-6 sm:w-6"/>
              </div>
              <div>
                <h3 className="text-sm sm:text-base font-bold text-gray-900">Gold Price Configuration</h3>
                <p className="text-[10px] sm:text-xs text-gray-500 mt-0.5 sm:mt-1 flex items-center flex-wrap">
                  Live API Rate: 
                  {goldPrice > 0 ? (
                    <span className="font-bold text-gray-700 ml-1">₹{goldPrice}/g</span>
                  ) : (
                    <span className="font-bold text-red-500 flex items-center ml-1 bg-red-50 px-1.5 py-0.5 rounded border border-red-100">
                      <AlertCircle className="h-3 w-3 mr-1" /> Error / Unavailable
                    </span>
                  )}
                </p>
              </div>
            </div>
            <div className="flex items-center gap-4 sm:gap-8 bg-white sm:bg-transparent p-3 sm:p-0 border border-gray-100 sm:border-none rounded-lg shadow-sm sm:shadow-none">
              <div className="flex flex-col">
                <label className="text-[9px] sm:text-[10px] font-bold text-gray-500 uppercase tracking-wider mb-1 sm:mb-1.5">Fallback (₹/g)</label>
                <input type="number" value={localFallback} onChange={e=>setLocalFallback(Number(e.target.value))} className="w-20 sm:w-28 px-2 sm:px-3 py-1 sm:py-1.5 text-xs sm:text-sm border border-gray-300 rounded-md focus:ring-1 focus:ring-yellow-500 outline-none font-medium" />
              </div>
              <div className="w-px h-8 bg-gray-200 hidden sm:block"></div>
              <div className="flex flex-col items-center">
                <label className="text-[9px] sm:text-[10px] font-bold text-gray-500 uppercase tracking-wider mb-1 sm:mb-1.5">Override Live</label>
                <input type="checkbox" checked={localOverride} onChange={e=>setLocalOverride(e.target.checked)} className="rounded border-gray-300 text-yellow-600 focus:ring-yellow-500 h-4 w-4 sm:h-5 sm:w-5 cursor-pointer mt-0.5 sm:mt-1" />
              </div>
            </div>
          </div>

          {/* GST Rate Row */}
          <div className="p-4 sm:p-6 flex flex-col sm:flex-row sm:items-center justify-between gap-4 hover:bg-gray-50 transition-colors">
            <div className="flex items-center gap-3 sm:gap-4">
              <div className="h-10 w-10 sm:h-12 sm:w-12 bg-blue-50 text-blue-600 rounded-lg flex items-center justify-center flex-shrink-0 border border-blue-100">
                <Percent className="h-5 w-5 sm:h-6 sm:w-6"/>
              </div>
              <div>
                <h3 className="text-sm sm:text-base font-bold text-gray-900">Tax Settings</h3>
                <p className="text-[10px] sm:text-xs text-gray-500 mt-0.5 sm:mt-1">Global GST applied at checkout</p>
              </div>
            </div>
            <div className="flex items-center bg-white border border-gray-300 rounded-md px-2 py-1 sm:px-3 sm:py-1.5 shadow-sm w-fit self-start sm:self-auto">
              <input type="number" value={localGst} onChange={e=>setLocalGst(Number(e.target.value))} className="w-12 sm:w-16 px-1 py-0.5 text-xs sm:text-sm bg-transparent border-none focus:ring-0 text-right font-bold text-gray-800 outline-none" />
              <span className="text-xs sm:text-sm font-bold text-gray-500 pr-1">%</span>
            </div>
          </div>

          {/* Making Charges Row */}
          <div className="p-4 sm:p-6 flex flex-col sm:flex-row sm:items-center justify-between gap-4 hover:bg-gray-50 transition-colors">
            <div className="flex items-center gap-3 sm:gap-4">
              <div className="h-10 w-10 sm:h-12 sm:w-12 bg-emerald-50 text-emerald-600 rounded-lg flex items-center justify-center flex-shrink-0 border border-emerald-100">
                <Scissors className="h-5 w-5 sm:h-6 sm:w-6"/>
              </div>
              <div>
                <h3 className="text-sm sm:text-base font-bold text-gray-900">Making Charges</h3>
                <p className="text-[10px] sm:text-xs text-gray-500 mt-0.5 sm:mt-1">Global baseline rate per gram</p>
              </div>
            </div>
            <div className="flex items-center bg-white border border-gray-300 rounded-md px-2 py-1 sm:px-3 sm:py-1.5 shadow-sm w-fit self-start sm:self-auto">
              <span className="text-xs sm:text-sm font-bold text-gray-500 pl-1">₹</span>
              <input type="number" value={localMaking} onChange={e=>setLocalMaking(Number(e.target.value))} className="w-16 sm:w-20 px-1 py-0.5 text-xs sm:text-sm bg-transparent border-none focus:ring-0 text-right font-bold text-gray-800 outline-none" />
              <span className="text-[10px] sm:text-xs text-gray-500 pr-1">/g</span>
            </div>
          </div>

        </div>
      </div>
    </>
  );
}