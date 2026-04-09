import React, { useState } from 'react';
import { Save, AlertCircle } from 'lucide-react';
import { formatCurrency } from '../../lib/goldPrice';

interface AdminSettingsTabProps {
  fallbackGoldPrice: number;
  gstRate: number;
  goldPrice: number;
  overrideLiveGoldPrice: boolean;
  globalGoldMakingCharges: number; // <-- NEW             
  updateSetting: (key: string, value: string) => Promise<boolean>;
}

export function AdminSettingsTab({ 
  fallbackGoldPrice, 
  gstRate, 
  goldPrice,
  overrideLiveGoldPrice,
  globalGoldMakingCharges,
  updateSetting 
}: AdminSettingsTabProps) {
  
  const [isSaving, setIsSaving] = useState(false);
  const [settingsFormData, setSettingsFormData] = useState({
    fallback_gold_price: fallbackGoldPrice.toString(),
    gst_rate: (gstRate * 100).toString(),
    override_live_gold_price: overrideLiveGoldPrice,
    gold_making_charges: globalGoldMakingCharges.toString(),
  });

  // Keep form synced if external data changes
  React.useEffect(() => {
    setSettingsFormData({
      fallback_gold_price: fallbackGoldPrice.toString(),
      gst_rate: (gstRate * 100).toString(),
      override_live_gold_price: overrideLiveGoldPrice,
      gold_making_charges: globalGoldMakingCharges.toString(),
    });
  }, [fallbackGoldPrice, gstRate, overrideLiveGoldPrice, globalGoldMakingCharges]);

  const handleSettingsSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setIsSaving(true);
    
    try {
      const fallbackPrice = parseFloat(settingsFormData.fallback_gold_price);
      const gstDecimal = parseFloat(settingsFormData.gst_rate) / 100;
      const overrideValue = settingsFormData.override_live_gold_price.toString();

      const success1 = await updateSetting('fallback_gold_price', fallbackPrice.toString());
      const success2 = await updateSetting('gst_rate', gstDecimal.toString());
      const success3 = await updateSetting('override_live_gold_price', overrideValue);
      const makingCharges = parseFloat(settingsFormData.gold_making_charges);
      const success4 = await updateSetting('gold_making_charges_per_gram', makingCharges.toString());

      if (success1 && success2 && success3 && success4) {
        alert('Settings updated successfully!');
      } else {
        alert('Error updating some settings. Please try again.');
      }
    } catch (error) {
      console.error('Error updating settings:', error);
      alert('Error updating settings. Please check your input values.');
    } finally {
      setIsSaving(false);
    }
  };

  const effectiveGoldPrice = overrideLiveGoldPrice ? fallbackGoldPrice : goldPrice;
  const isChanged = 
    settingsFormData.fallback_gold_price !== fallbackGoldPrice.toString() ||
    settingsFormData.gst_rate !== (gstRate * 100).toString() ||
    settingsFormData.override_live_gold_price !== overrideLiveGoldPrice||
    settingsFormData.gold_making_charges !== globalGoldMakingCharges.toString();

  return (
    <div className="grid grid-cols-1 lg:grid-cols-12 gap-8">
      
      {/* LEFT COLUMN: Editable Form */}
      <div className="lg:col-span-7 bg-white shadow-lg rounded-xl p-6 border border-gray-100">
        <div className="mb-6 border-b border-gray-100 pb-4">
          <h2 className="text-xl font-bold text-gray-900">Configure System Settings</h2>
          <p className="text-sm text-gray-500 mt-1">Updates to these values instantly affect pricing site-wide.</p>
        </div>

        <form onSubmit={handleSettingsSubmit} className="space-y-6">
          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            <div className="bg-yellow-50/50 p-4 rounded-lg border border-yellow-100">
              <label className="block text-sm font-semibold text-gray-700 mb-1">
                Fallback Gold Price (₹/gram)
              </label>
              <input
                type="number"
                step="0.01"
                required
                value={settingsFormData.fallback_gold_price}
                onChange={(e) => setSettingsFormData({ ...settingsFormData, fallback_gold_price: e.target.value })}
                className="w-full px-3 py-2 border border-gray-300 rounded-md focus:ring-2 focus:ring-yellow-500 bg-white"
              />
              <p className="text-xs text-gray-500 mt-2 leading-relaxed">
                Used if the live API fails, or if override is manually enabled.
              </p>
            </div>

            <div className="bg-green-50/50 p-4 rounded-lg border border-green-100">
              <label className="block text-sm font-semibold text-gray-700 mb-1">
                GST Rate (%)
              </label>
              <input
                type="number"
                step="0.01"
                required
                value={settingsFormData.gst_rate}
                onChange={(e) => setSettingsFormData({ ...settingsFormData, gst_rate: e.target.value })}
                className="w-full px-3 py-2 border border-gray-300 rounded-md focus:ring-2 focus:ring-yellow-500 bg-white"
              />
              <p className="text-xs text-gray-500 mt-2 leading-relaxed">
                Applied globally to the final cost of all jewellery items.
              </p>
            </div>

            {/* NEW: Global Making Charges Block */}
            <div className="bg-purple-50/50 p-4 rounded-lg border border-purple-100 mt-4">
              <label className="block text-sm font-semibold text-gray-700 mb-1">
                Global Gold Making Charges (₹/gram)
              </label>
              <input
                type="number"
                step="0.01"
                required
                value={settingsFormData.gold_making_charges}
                onChange={(e) => setSettingsFormData({ ...settingsFormData, gold_making_charges: e.target.value })}
                className="w-full px-3 py-2 border border-gray-300 rounded-md focus:ring-2 focus:ring-yellow-500 bg-white"
              />
              <p className="text-xs text-gray-500 mt-2 leading-relaxed">
                Applied site-wide to all jewellery items that do NOT have a manual override active.
              </p>
            </div>
          </div>


          <div className="bg-orange-50/50 p-4 rounded-lg border border-orange-100 mt-4">
            <div className="flex items-start">
              <div className="flex items-center h-5">
                <input
                  type="checkbox"
                  id="override_live_gold_price"
                  checked={settingsFormData.override_live_gold_price}
                  onChange={(e) => setSettingsFormData({ ...settingsFormData, override_live_gold_price: e.target.checked })}
                  className="h-4 w-4 text-orange-600 focus:ring-orange-500 border-gray-300 rounded cursor-pointer"
                />
              </div>
              <div className="ml-3 text-sm">
                <label htmlFor="override_live_gold_price" className="font-semibold text-gray-800 cursor-pointer">
                  Force Fallback Gold Price
                </label>
                <p className="text-gray-600 mt-1">
                  Enable this to stop using the live API and strictly use your Fallback Price defined above.
                </p>
              </div>
            </div>
          </div>

          <div className="pt-4 border-t border-gray-100 flex items-center justify-between">
            <span className="text-sm text-gray-500 italic">
              {isChanged ? "Unsaved changes..." : "All settings are up to date."}
            </span>
            <button
              type="submit"
              disabled={!isChanged || isSaving}
              className={`px-6 py-2.5 rounded-lg flex items-center space-x-2 font-medium transition-all ${
                isChanged 
                  ? 'bg-yellow-600 text-white hover:bg-yellow-700 shadow-md' 
                  : 'bg-gray-100 text-gray-400 cursor-not-allowed'
              }`}
            >
              <Save className="h-4 w-4" />
              <span>{isSaving ? 'Saving...' : 'Save Changes'}</span>
            </button>
          </div>
        </form>
      </div>

      {/* RIGHT COLUMN: Live Status Panel */}
      <div className="lg:col-span-5 space-y-6">
        <div className="bg-white shadow-lg rounded-xl p-6 border border-gray-100">
          <h3 className="text-lg font-bold text-gray-900 mb-4 flex items-center">
            <AlertCircle className="h-5 w-5 text-blue-500 mr-2" />
            Live System Status
          </h3>
          
          <div className="space-y-4">
            <div className="flex justify-between items-center pb-3 border-b border-gray-50">
              <span className="text-sm font-medium text-gray-500">Live API Readout</span>
              <span className="font-bold text-gray-900">{formatCurrency(goldPrice)}/g</span>
            </div>
            
            <div className="flex justify-between items-center pb-3 border-b border-gray-50">
              <span className="text-sm font-medium text-gray-500">Currently Applying</span>
              <span className={`font-bold text-lg ${overrideLiveGoldPrice ? 'text-orange-600' : 'text-green-600'}`}>
                {formatCurrency(effectiveGoldPrice)}/g
              </span>
            </div>

            <div className="flex justify-between items-center pb-3 border-b border-gray-50">
              <span className="text-sm font-medium text-gray-500">Data Source</span>
              <span className={`px-2.5 py-1 rounded-md text-xs font-bold ${
                overrideLiveGoldPrice ? 'bg-orange-100 text-orange-700' : 
                goldPrice === fallbackGoldPrice ? 'bg-red-100 text-red-700' : 
                'bg-green-100 text-green-700'
              }`}>
                {overrideLiveGoldPrice ? 'MANUAL OVERRIDE' : goldPrice === fallbackGoldPrice ? 'FALLBACK TRIGGERED' : 'LIVE API'}
              </span>
            </div>
          </div>
        </div>
      </div>

    </div>
  );
}