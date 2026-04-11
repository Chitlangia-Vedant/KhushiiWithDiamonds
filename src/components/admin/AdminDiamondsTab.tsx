import React, { useState, useEffect } from 'react';
import { Save, Plus, Trash2 } from 'lucide-react';
import toast from 'react-hot-toast';
import { DIAMOND_QUALITIES } from '../../constants/jewellery';
import { DiamondPricingTier } from '../../types';

interface Props {
  initialBaseCosts: Record<string, number>;
  initialTiers: DiamondPricingTier[];
  saveDiamondPricing: (baseCosts: Record<string, number>, tiers: DiamondPricingTier[]) => Promise<boolean>;
}

export function AdminDiamondsTab({ initialBaseCosts, initialTiers, saveDiamondPricing }: Props) {
  const [baseCosts, setBaseCosts] = useState<Record<string, number>>(initialBaseCosts);
  const [tiers, setTiers] = useState<DiamondPricingTier[]>(initialTiers);
  const [isSaving, setIsSaving] = useState(false);

  useEffect(() => { setBaseCosts(initialBaseCosts); setTiers(initialTiers); }, [initialBaseCosts, initialTiers]);

  const handleSave = async () => {
    setIsSaving(true);
    try {
      const success = await saveDiamondPricing(baseCosts, tiers);
      if (success) {
        toast.success('Diamond pricing saved successfully!');
      } else {
        toast.error('Failed to save diamond pricing. Please try again.');
      }
    } catch (error) {
      console.error('Error saving diamond pricing:', error);
      toast.error('An unexpected error occurred while saving.');
    } finally {
      setIsSaving(false);
    }
  };

  const getOffsetKey = (q: string): keyof DiamondPricingTier => {
    if (q === 'Lab Grown') return 'lab_grown_offset';
    if (q === 'GH/VS-SI') return 'gh_vs_si_offset';
    if (q === 'FG/VVS-SI') return 'fg_vvs_si_offset';
    return 'ef_vvs_offset'; // EF/VVS
  };

  const handleDeleteTier = (index: number) => {
    toast((t) => (
      <div className="flex flex-col p-2 min-w-[300px]">
        <div className="flex items-center gap-3 mb-3">
          <div className="w-10 h-10 bg-red-100 rounded-full flex items-center justify-center flex-shrink-0 border border-red-200 shadow-inner">
            <Trash2 className="h-5 w-5 text-red-600" />
          </div>
          <h3 className="font-extrabold text-gray-900 text-lg">Delete Tier?</h3>
        </div>
        <div className="text-sm text-gray-800 mb-5 pl-13 leading-relaxed">
          <p className="mb-2">Are you sure you want to remove this carat tier?</p>
          <p className="bg-red-50 p-2 border border-red-100 rounded text-red-800 text-xs">
            <span className="font-bold text-red-600">Note:</span> You must click "Save Pricing Grid" to apply this change.
          </p>
        </div>
        <div className="flex justify-end gap-3 mt-2">
          <button
            onClick={() => toast.dismiss(t.id)}
            className="px-5 py-2 text-sm font-bold text-gray-700 bg-white hover:bg-gray-50 rounded-lg transition-colors border border-gray-300 shadow-sm"
          >
            Cancel
          </button>
          <button
            onClick={() => {
              toast.dismiss(t.id);
              setTiers(tiers.filter((_, i) => i !== index));
            }}
            className="px-5 py-2 text-sm font-bold text-white bg-red-600 hover:bg-red-700 rounded-lg transition-colors shadow-sm border border-red-700"
          >
            Yes, remove
          </button>
        </div>
      </div>
    ), {
      duration: Infinity, 
      style: { maxWidth: '450px', padding: '16px', border: '1px solid #fee2e2' }
    });
  };

  const inputCss = "w-24 px-3 py-1.5 border border-gray-300 rounded shadow-sm text-sm focus:ring-2 focus:ring-purple-500 focus:border-purple-500 outline-none transition-all font-medium text-gray-800";

  return (
    <div className="bg-white shadow-lg rounded-xl p-6 border border-gray-100">
      <div className="flex justify-between items-center mb-6">
        <div>
          <h2 className="text-xl font-bold text-gray-900">Universal Diamond Pricing</h2>
          <p className="text-sm text-gray-500">Set base costs and dynamic offsets per carat range.</p>
        </div>
        <button onClick={handleSave} disabled={isSaving} className="bg-purple-600 text-white px-4 py-2 rounded-lg flex items-center hover:bg-purple-700 shadow-sm transition-colors">
          <Save className="h-4 w-4 mr-2" /> {isSaving ? 'Saving...' : 'Save Pricing Grid'}
        </button>
      </div>

      <div className="overflow-x-auto rounded-lg border border-gray-200">
        <table className="w-full text-sm text-left whitespace-nowrap">
          <thead className="bg-purple-50 text-purple-900 font-semibold uppercase text-xs tracking-wider border-b border-gray-200">
            <tr>
              <th className="px-6 py-4">Carat Range</th>
              {DIAMOND_QUALITIES.map(q => <th key={q} className="px-6 py-4">{q} (₹/ct)</th>)}
              <th className="px-6 py-4 text-center">Actions</th>
            </tr>
          </thead>
          <tbody className="divide-y divide-gray-100">
            
            {/* --- BASE COSTS ROW --- */}
            <tr className="bg-purple-50/20 hover:bg-purple-50/40 transition-colors">
              <td className="px-6 py-4 font-bold text-gray-800">BASE COST</td>
              {DIAMOND_QUALITIES.map(q => (
                <td key={q} className="px-6 py-4">
                  <div className="flex items-center">
                    {/* INVISIBLE SPACER: Keeps Base Costs perfectly aligned with the Tier +/- buttons */}
                    <div className="w-8 h-8 mr-2 flex-shrink-0"></div>
                    <input 
                      type="number" 
                      value={baseCosts[q] || 0} 
                      onChange={(e) => setBaseCosts({ ...baseCosts, [q]: parseFloat(e.target.value) || 0 })} 
                      className={inputCss} 
                    />
                  </div>
                </td>
              ))}
              <td></td>
            </tr>

            {/* --- TIERS ROWS --- */}
            {tiers.map((tier, index) => (
              <tr key={index} className="hover:bg-gray-50 transition-colors">
                <td className="px-6 py-4 flex items-center space-x-2">
                  <input 
                    type="number" step="0.01" 
                    value={tier.min_carat} 
                    onChange={(e) => { const nt = [...tiers]; nt[index].min_carat = parseFloat(e.target.value) || 0; setTiers(nt); }} 
                    className="w-20 px-2 py-1.5 border border-gray-300 rounded shadow-sm text-sm focus:ring-2 focus:ring-purple-500 focus:border-purple-500 outline-none text-center transition-all font-medium" 
                  />
                  <span className="text-gray-500 font-bold px-1">to</span>
                  <input 
                    type="number" step="0.01" 
                    value={tier.max_carat} 
                    onChange={(e) => { const nt = [...tiers]; nt[index].max_carat = parseFloat(e.target.value) || 0; setTiers(nt); }} 
                    className="w-20 px-2 py-1.5 border border-gray-300 rounded shadow-sm text-sm focus:ring-2 focus:ring-purple-500 focus:border-purple-500 outline-none text-center transition-all font-medium" 
                  />
                </td>
                
                {DIAMOND_QUALITIES.map(q => {
                  const oKey = getOffsetKey(q);
                  const isNegative = Number(tier[oKey]) < 0;
                  
                  return (
                    <td key={q} className="px-6 py-4">
                      <div className="flex items-center">
                        {/* THE TOGGLE BUTTON: Replaces the floating text and keeps the sign outside */}
                        <button 
                          type="button"
                          onClick={() => {
                            const nt = [...tiers];
                            const currentVal = Number((nt[index] as any)[oKey]) || 0;
                            // Multiplies by -1. If 0, it behaves neutrally until user types
                            (nt[index] as any)[oKey] = currentVal === 0 ? 0 : currentVal * -1; 
                            setTiers(nt);
                          }}
                          className={`w-8 h-8 flex items-center justify-center rounded text-lg font-extrabold mr-2 transition-colors border flex-shrink-0 cursor-pointer ${
                            !isNegative 
                              ? 'bg-green-50 text-green-700 border-green-200 hover:bg-green-100 shadow-sm' 
                              : 'bg-red-50 text-red-700 border-red-200 hover:bg-red-100 shadow-sm'
                          }`}
                          title="Click to toggle Plus/Minus"
                        >
                          {!isNegative ? '+' : '-'}
                        </button>
                        
                        {/* ABSOLUTE VALUE INPUT: Strips negative signs from inside the box natively */}
                        <input 
                          type="number" 
                          value={Math.abs(Number(tier[oKey]))} 
                          onChange={(e) => { 
                            const rawStr = e.target.value;
                            // If user hits the '-' key on their keyboard, we detect it and flip the button!
                            const userTypedNegative = rawStr.includes('-');
                            
                            const val = Math.abs(parseFloat(rawStr) || 0);
                            const shouldBeNegative = userTypedNegative ? true : isNegative;
                            
                            const nt = [...tiers]; 
                            (nt[index] as any)[oKey] = shouldBeNegative ? -val : val; 
                            setTiers(nt); 
                          }} 
                          className={inputCss}
                        />
                      </div>
                    </td>
                  );
                })}
                
                <td className="px-6 py-4 text-center">
                  <button onClick={() => handleDeleteTier(index)} className="text-red-500 hover:bg-red-50 p-2 rounded-md transition-colors inline-flex items-center justify-center shadow-sm border border-transparent hover:border-red-100" title="Delete Tier">
                    <Trash2 className="h-5 w-5" />
                  </button>
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
      
      <button onClick={() => setTiers([...tiers, { min_carat: 0, max_carat: 0.99, ef_vvs_offset: 0, fg_vvs_si_offset: 0, gh_vs_si_offset: 0, lab_grown_offset: 0 }])} className="mt-5 text-sm font-bold text-purple-700 flex items-center hover:text-purple-900 transition-colors bg-purple-50 hover:bg-purple-100 px-5 py-2.5 rounded-lg w-fit border border-purple-200 shadow-sm">
        <Plus className="h-4 w-4 mr-2" /> Add Carat Tier
      </button>
    </div>
  );
}