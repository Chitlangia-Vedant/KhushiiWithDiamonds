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

  useEffect(() => { 
    setBaseCosts(initialBaseCosts); 
    setTiers(initialTiers); 
  }, [initialBaseCosts, initialTiers]);

  // --- UNSAVED CHANGES PROTECTION LOGIC ---
  const hasUnsavedChanges = () => {
    return JSON.stringify(baseCosts) !== JSON.stringify(initialBaseCosts) ||
           JSON.stringify(tiers) !== JSON.stringify(initialTiers);
  };

  useEffect(() => {
    const isDirty = hasUnsavedChanges();
    (window as any).isFormDirty = isDirty; 

    const handleBeforeUnload = (e: BeforeUnloadEvent) => {
      if (isDirty) {
        e.preventDefault();
        e.returnValue = '';
      }
    };

    window.addEventListener('beforeunload', handleBeforeUnload);
    return () => {
      window.removeEventListener('beforeunload', handleBeforeUnload);
      (window as any).isFormDirty = false; 
    };
  }, [baseCosts, tiers, initialBaseCosts, initialTiers]);
  // ----------------------------------------

  const handleSave = async () => {
    // 1. Trigger the indestructible background toast
    const loadingToastId = toast.loading('Saving diamond pricing...');
    
    try {
      // 2. Capture the result from the hook
      // The hook now uses RPC for an atomic transaction
      const success = await saveDiamondPricing(baseCosts, tiers); 
      
      if (success) {
        // 3. Clear dirty state only on actual success
        (window as any).isFormDirty = false;
        
        // 4. Transform the loading toast into a success toast
        toast.success('Diamond pricing saved successfully!', { id: loadingToastId });
      } else {
        // Handle the case where the hook caught an error and returned false
        throw new Error('Database operation failed');
      }
    } catch (error) {
      console.error('Save failed:', error);
      toast.error('Failed to save diamond pricing. Data was preserved.', { id: loadingToastId });
    }
  };

  const getOffsetKey = (q: string): keyof DiamondPricingTier => {
    // Dynamically find the matching diamond quality from the master constant
    const quality = DIAMOND_QUALITIES.find(diamond => diamond.value === q);
    
    // Return its specific database key (fallback to EF/VVS just in case)
    return (quality?.offsetKey || 'ef_vvs_offset') as keyof DiamondPricingTier;
  };

  const handleDeleteTier = (index: number) => {
    setTiers(tiers.filter((_, i) => i !== index));
    // Mark the form as dirty so the user remembers to hit "Save Grid"
    (window as any).isFormDirty = true;
    
    // Optional: Add a quick, non-intrusive success toast
    toast.success('Row removed (Click Save to apply)');
  };

  const inputCss = "w-16 sm:w-24 px-2 sm:px-3 py-1 sm:py-1.5 border border-gray-300 rounded shadow-sm text-xs sm:text-sm focus:ring-1 focus:ring-yellow-500 outline-none transition-all font-medium text-gray-800 text-center sm:text-left";

  return (
    <>
      <div className="flex justify-between items-center mb-4 sm:mb-6">
        <div>
          <h2 className="text-xl sm:text-2xl font-bold text-gray-900">Diamond Pricing</h2>
          <p className="text-[10px] sm:text-sm text-gray-500 mt-0.5 sm:mt-1 hidden sm:block">Set base costs and dynamic offsets per carat range.</p>
        </div>
        <button onClick={handleSave} disabled={isSaving} className="bg-yellow-600 text-white p-2 sm:px-4 sm:py-2 rounded-lg hover:bg-yellow-700 flex items-center shadow-sm flex-shrink-0 transition-colors">
          <Save className="h-5 w-5" /> <span className="hidden sm:inline ml-1.5 font-medium">{isSaving ? 'Saving...' : 'Save Grid'}</span>
        </button>
      </div>

      <div className="bg-white shadow-sm border border-gray-200 rounded-lg overflow-hidden mb-6">
        <div className="overflow-x-auto no-scrollbar">
          <table className="min-w-full divide-y divide-gray-200">
            <thead className="bg-gray-50">
              <tr>
                <th className="px-4 py-3 text-left text-xs font-semibold text-gray-600 uppercase tracking-wider">Carat Range</th>
                {DIAMOND_QUALITIES.map(q => (
                  <th key={q.value} className="...">
                    {q.value.replace(' Grown', '')} <span className="..."> (₹/ct)</span>
                  </th>
                ))}
                <th className="px-4 py-3 text-center text-xs font-semibold text-gray-600 uppercase tracking-wider">Actions</th>
              </tr>
            </thead>
            <tbody className="bg-white divide-y divide-gray-100">
              
              {/* BASE COST ROW */}
              <tr className="bg-gray-50/50">
                <td className="px-4 py-3 sm:py-4 font-bold text-gray-800 text-xs sm:text-sm">BASE COST</td>
                {DIAMOND_QUALITIES.map(q => (
                  <td key={q.value} className="...">
                    <div className="flex items-center">
                      <div className="..."></div>
                      <input 
                        type="number" 
                        value={baseCosts[q.value] === 0 ? '' : baseCosts[q.value]} 
                        onChange={(e) => { 
                          const parsed = parseFloat(e.target.value); 
                          setBaseCosts({ ...baseCosts, [q.value]: isNaN(parsed) ? 0 : parsed }); 
                        }} 
                        className={inputCss} 
                      />
                    </div>
                  </td>
                ))}
                <td></td>
              </tr>

              {/* TIER ROWS */}
              {tiers.map((tier, index) => (
                <tr key={index} className="hover:bg-gray-50 transition-colors">
                  <td className="px-4 py-3 sm:py-4 flex items-center space-x-1 sm:space-x-2">
                    <input type="number" min="0" step="any" value={tier.min_carat === 0 ? '' : tier.min_carat} onChange={(e) => { const parsed = parseFloat(e.target.value); const nt = [...tiers]; nt[index].min_carat = isNaN(parsed) ? 0 : parsed; setTiers(nt); }} placeholder="0" className="w-14 sm:w-20 px-1 sm:px-2 py-1 sm:py-1.5 border border-gray-300 rounded shadow-sm text-xs sm:text-sm focus:ring-1 focus:ring-yellow-500 outline-none text-center font-medium" />
                    <span className="text-gray-400 font-bold text-[10px] sm:text-sm">-</span>
                    <input type="number" min="0" step="any" value={tier.max_carat === 0 ? '' : tier.max_carat} onChange={(e) => { const parsed = parseFloat(e.target.value); const nt = [...tiers]; nt[index].max_carat = isNaN(parsed) ? 0 : parsed; setTiers(nt); }} placeholder="0" className="w-14 sm:w-20 px-1 sm:px-2 py-1 sm:py-1.5 border border-gray-300 rounded shadow-sm text-xs sm:text-sm focus:ring-1 focus:ring-yellow-500 outline-none text-center font-medium" />
                  </td>
                  
                  {DIAMOND_QUALITIES.map(q => {
                    const oKey = getOffsetKey(q.value);
                    const currentVal = tier[oKey];
                    const rawVal = currentVal === undefined || currentVal === null ? 0 : Number(currentVal);
                    const isNegative = rawVal < 0 || Object.is(rawVal, -0);
                    
                    return (
                      <td key={q.value} className="px-4 py-3 sm:py-4">
                        <div className="flex items-center">
                          <button 
                            type="button"
                            onClick={() => { const nt = [...tiers]; (nt[index] as any)[oKey] = isNegative ? Math.abs(rawVal) : (rawVal === 0 ? -0 : -Math.abs(rawVal)); setTiers(nt); }}
                            className={`w-6 h-6 sm:w-8 sm:h-8 flex items-center justify-center rounded text-sm sm:text-lg font-extrabold mr-1 sm:mr-2 transition-colors border flex-shrink-0 cursor-pointer ${!isNegative ? 'bg-gray-100 text-gray-700 border-gray-200 hover:bg-gray-200' : 'bg-red-50 text-red-600 border-red-200 hover:bg-red-100'}`}
                          >
                            {!isNegative ? '+' : '-'}
                          </button>
                          <input 
                            type="number" min="0" step="any" value={rawVal === 0 ? '' : Math.abs(rawVal)} placeholder="0"
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
                  
                  <td className="px-4 py-3 sm:py-4 text-center">
                    <button onClick={() => handleDeleteTier(index)} className="text-gray-400 hover:text-red-600 p-1 sm:p-1.5 rounded-md transition-colors"><Trash2 className="h-4 w-4 sm:h-5 sm:w-5" /></button>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
        
        <div className="px-4 py-3 border-t border-gray-200 bg-gray-50 flex items-center justify-start">
          <button onClick={() => setTiers([...tiers, { min_carat: 0, max_carat: 0.99, ef_vvs_offset: 0, fg_vvs_si_offset: 0, gh_vs_si_offset: 0, lab_grown_offset: 0 }])} className="text-xs sm:text-sm font-semibold text-yellow-700 flex items-center hover:text-yellow-900 transition-colors bg-yellow-50 hover:bg-yellow-100 px-3 sm:px-4 py-2 rounded-md border border-yellow-200 shadow-sm">
            <Plus className="h-3 w-3 sm:h-4 sm:w-4 mr-1.5" /> Add Carat Tier
          </button>
        </div>
      </div>
    </>
  );
}