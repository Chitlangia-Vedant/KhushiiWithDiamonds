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

  useEffect(() => { return () => { toast.dismiss(); }; }, []);
  useEffect(() => { setBaseCosts(initialBaseCosts); setTiers(initialTiers); }, [initialBaseCosts, initialTiers]);

  const handleSave = async () => {
    setIsSaving(true);
    try {
      const success = await saveDiamondPricing(baseCosts, tiers);
      if (success) toast.success('Diamond pricing saved successfully!');
      else toast.error('Failed to save diamond pricing. Please try again.');
    } catch (error) { toast.error('An unexpected error occurred while saving.'); } finally { setIsSaving(false); }
  };

  const getOffsetKey = (q: string): keyof DiamondPricingTier => {
    if (q === 'Lab Grown') return 'lab_grown_offset';
    if (q === 'GH/VS-SI') return 'gh_vs_si_offset';
    if (q === 'FG/VVS-SI') return 'fg_vvs_si_offset';
    return 'ef_vvs_offset'; 
  };

  const handleDeleteTier = (index: number) => {
    toast((t) => (
      <div className="flex flex-col p-1 min-w-[300px]">
        <div className="flex items-center gap-3 mb-3">
          <div className="w-10 h-10 bg-red-50 rounded-full flex items-center justify-center flex-shrink-0 border border-red-100"><Trash2 className="h-5 w-5 text-red-600" /></div>
          <h3 className="font-extrabold text-gray-900 text-lg">Delete Tier?</h3>
        </div>
        <div className="flex justify-end gap-2 mt-1 pl-[52px]">
          <button onClick={() => toast.dismiss(t.id)} className="px-4 py-2 text-sm font-bold text-gray-700 bg-white border border-gray-300 rounded-lg">Cancel</button>
          <button onClick={() => { toast.dismiss(t.id); setTiers(tiers.filter((_, i) => i !== index)); }} className="px-4 py-2 text-sm font-bold text-white bg-red-600 hover:bg-red-700 rounded-lg">Yes, delete</button>
        </div>
      </div>
    ), { duration: Infinity, style: { maxWidth: '400px', padding: '16px' } });
  };

  // Highly responsive CSS for inputs inside the grid
  const inputCss = "w-14 sm:w-24 px-1 sm:px-3 py-1 sm:py-1.5 border border-gray-300 rounded shadow-sm text-xs sm:text-sm focus:ring-1 focus:ring-purple-500 outline-none transition-all font-medium text-gray-800 text-center sm:text-left";

  return (
    <div className="bg-white shadow-sm sm:shadow-lg rounded-xl p-3 sm:p-6 border border-gray-100">
      
      {/* HEADER */}
      <div className="flex justify-between items-center mb-3 sm:mb-6">
        <div>
          <h2 className="text-lg sm:text-xl font-bold text-gray-900">Universal Diamond Pricing</h2>
          <p className="text-[10px] sm:text-sm text-gray-500 hidden sm:block">Set base costs and dynamic offsets per carat range.</p>
        </div>
        <button onClick={handleSave} disabled={isSaving} className="bg-purple-600 text-white p-2 sm:px-4 sm:py-2 rounded-lg flex items-center hover:bg-purple-700 shadow-sm transition-colors flex-shrink-0">
          <Save className="h-4 w-4" /> <span className="hidden sm:inline ml-1.5 font-medium">{isSaving ? 'Saving...' : 'Save Grid'}</span>
        </button>
      </div>

      {/* MOBILE-FRIENDLY RESPONSIVE GRID */}
      <div className="overflow-x-auto rounded-lg border border-gray-200 -mx-3 sm:mx-0">
        <table className="w-full text-sm text-left whitespace-nowrap">
          <thead className="bg-purple-50 text-purple-900 font-semibold uppercase text-[9px] sm:text-xs tracking-wider border-b border-gray-200">
            <tr>
              <th className="px-2 py-2 sm:px-6 sm:py-4">Carat Range</th>
              {DIAMOND_QUALITIES.map(q => <th key={q} className="px-2 py-2 sm:px-6 sm:py-4">{q.replace(' Grown', '')} <span className="lowercase text-gray-500 font-normal">(₹/ct)</span></th>)}
              <th className="px-2 py-2 sm:px-6 sm:py-4 text-center">Actions</th>
            </tr>
          </thead>
          <tbody className="divide-y divide-gray-100">
            
            {/* BASE COST ROW */}
            <tr className="bg-purple-50/20">
              <td className="px-2 py-2 sm:px-6 sm:py-4 font-bold text-gray-800 text-[10px] sm:text-sm">BASE COST</td>
              {DIAMOND_QUALITIES.map(q => (
                <td key={q} className="px-2 py-2 sm:px-6 sm:py-4">
                  <div className="flex items-center">
                    <div className="w-6 h-6 sm:w-8 sm:h-8 mr-1 sm:mr-2 flex-shrink-0"></div>
                    <input 
                      type="number" min="0" step="any"
                      value={baseCosts[q] === 0 || baseCosts[q] === undefined ? '' : baseCosts[q]} 
                      onChange={(e) => { const parsed = parseFloat(e.target.value); setBaseCosts({ ...baseCosts, [q]: isNaN(parsed) ? 0 : parsed }); }} 
                      placeholder="0" className={inputCss} 
                    />
                  </div>
                </td>
              ))}
              <td></td>
            </tr>

            {/* TIER ROWS */}
            {tiers.map((tier, index) => (
              <tr key={index} className="hover:bg-gray-50">
                <td className="px-2 py-2 sm:px-6 sm:py-4 flex items-center space-x-1 sm:space-x-2">
                  <input 
                    type="number" min="0" step="any" 
                    value={tier.min_carat === 0 ? '' : tier.min_carat} 
                    onChange={(e) => { const parsed = parseFloat(e.target.value); const nt = [...tiers]; nt[index].min_carat = isNaN(parsed) ? 0 : parsed; setTiers(nt); }} 
                    placeholder="0" className="w-12 sm:w-20 px-1 sm:px-2 py-1 sm:py-1.5 border border-gray-300 rounded shadow-sm text-xs sm:text-sm focus:ring-1 focus:ring-purple-500 outline-none text-center font-medium" 
                  />
                  <span className="text-gray-400 font-bold text-[10px] sm:text-sm">-</span>
                  <input 
                    type="number" min="0" step="any" 
                    value={tier.max_carat === 0 ? '' : tier.max_carat} 
                    onChange={(e) => { const parsed = parseFloat(e.target.value); const nt = [...tiers]; nt[index].max_carat = isNaN(parsed) ? 0 : parsed; setTiers(nt); }} 
                    placeholder="0" className="w-12 sm:w-20 px-1 sm:px-2 py-1 sm:py-1.5 border border-gray-300 rounded shadow-sm text-xs sm:text-sm focus:ring-1 focus:ring-purple-500 outline-none text-center font-medium" 
                  />
                </td>
                
                {DIAMOND_QUALITIES.map(q => {
                  const oKey = getOffsetKey(q);
                  const currentVal = tier[oKey];
                  const rawVal = currentVal === undefined || currentVal === null ? 0 : Number(currentVal);
                  const isNegative = rawVal < 0 || Object.is(rawVal, -0);
                  
                  return (
                    <td key={q} className="px-2 py-2 sm:px-6 sm:py-4">
                      <div className="flex items-center">
                        <button 
                          type="button"
                          onClick={() => { const nt = [...tiers]; (nt[index] as any)[oKey] = isNegative ? Math.abs(rawVal) : (rawVal === 0 ? -0 : -Math.abs(rawVal)); setTiers(nt); }}
                          className={`w-6 h-6 sm:w-8 sm:h-8 flex items-center justify-center rounded text-sm sm:text-lg font-extrabold mr-1 sm:mr-2 transition-colors border flex-shrink-0 cursor-pointer ${!isNegative ? 'bg-green-50 text-green-700 border-green-200' : 'bg-red-50 text-red-700 border-red-200'}`}
                        >
                          {!isNegative ? '+' : '-'}
                        </button>
                        <input 
                          type="number" min="0" step="any"
                          value={rawVal === 0 ? '' : Math.abs(rawVal)} placeholder="0"
                          onKeyDown={(e) => {
                            if (e.key === '-') { e.preventDefault(); const nt = [...tiers]; (nt[index] as any)[oKey] = isNegative ? Math.abs(rawVal) : (rawVal === 0 ? -0 : -Math.abs(rawVal)); setTiers(nt); } 
                            else if (e.key === '+') { e.preventDefault(); const nt = [...tiers]; (nt[index] as any)[oKey] = Math.abs(rawVal); setTiers(nt); }
                          }}
                          onChange={(e) => { 
                            const rawStr = e.target.value;
                            if (rawStr === '') { const nt = [...tiers]; (nt[index] as any)[oKey] = isNegative ? -0 : 0; setTiers(nt); return; }
                            const parsed = parseFloat(rawStr); const val = isNaN(parsed) ? 0 : Math.abs(parsed);
                            const nt = [...tiers]; (nt[index] as any)[oKey] = isNegative ? (val === 0 ? -0 : -val) : val; setTiers(nt); 
                          }} 
                          className={inputCss}
                        />
                      </div>
                    </td>
                  );
                })}
                
                <td className="px-2 py-2 sm:px-6 sm:py-4 text-center">
                  <button onClick={() => handleDeleteTier(index)} className="text-red-500 hover:bg-red-50 p-1.5 sm:p-2 rounded-md transition-colors"><Trash2 className="h-4 w-4 sm:h-5 sm:w-5" /></button>
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
      
      <button onClick={() => setTiers([...tiers, { min_carat: 0, max_carat: 0.99, ef_vvs_offset: 0, fg_vvs_si_offset: 0, gh_vs_si_offset: 0, lab_grown_offset: 0 }])} className="mt-3 sm:mt-5 text-xs sm:text-sm font-bold text-purple-700 flex items-center hover:text-purple-900 bg-purple-50 hover:bg-purple-100 px-3 sm:px-5 py-2 sm:py-2.5 rounded-lg w-fit border border-purple-200">
        <Plus className="h-3 w-3 sm:h-4 sm:w-4 mr-1.5 sm:mr-2" /> Add Carat Tier
      </button>
    </div>
  );
}