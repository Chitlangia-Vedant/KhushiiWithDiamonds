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
    setIsSaving(true);
    try {
      const success = await saveDiamondPricing(baseCosts, tiers);
      if (success) {
        (window as any).isFormDirty = false; // Successfully saved! Clear the dirty flag.
        toast.success('Diamond pricing saved successfully!');
      } else {
        toast.error('Failed to save diamond pricing. Please try again.');
      }
    } catch (error) { 
      toast.error('An unexpected error occurred while saving.'); 
    } finally { 
      setIsSaving(false); 
    }
  };

  const getOffsetKey = (q: string): keyof DiamondPricingTier => {
    if (q === 'Lab Grown') return 'lab_grown_offset';
    if (q === 'GH/VS-SI') return 'gh_vs_si_offset';
    if (q === 'FG/VVS-SI') return 'fg_vvs_si_offset';
    return 'ef_vvs_offset'; 
  };

  const handleDeleteTier = (index: number) => {
    toast((t) => (
      <div className="flex flex-col p-1 min-w-[320px]">
        <div className="flex items-center gap-3 mb-3">
          <div className="w-10 h-10 bg-red-50 rounded-full flex items-center justify-center flex-shrink-0 border border-red-100"><Trash2 className="h-5 w-5 text-red-600" /></div>
          <h3 className="font-extrabold text-gray-900 text-lg">Delete Tier?</h3>
        </div>
        <div className="text-sm text-gray-800 mb-5 pl-[52px] leading-relaxed">
          <p className="mb-2 font-medium">Are you sure you want to permanently delete this carat tier?</p>
          <p className="bg-red-50/80 p-2 border border-red-100 rounded text-red-800 text-xs"><span className="font-bold text-red-600">Warning:</span> You must click "Save Grid" to apply this change.</p>
        </div>
        <div className="flex justify-end gap-3 mt-1">
          <button onClick={() => toast.dismiss(t.id)} className="px-5 py-2 text-sm font-bold text-gray-700 bg-white hover:bg-gray-50 rounded-lg transition-colors border border-gray-300 shadow-sm">Cancel</button>
          <button onClick={() => { toast.dismiss(t.id); setTiers(tiers.filter((_, i) => i !== index)); }} className="px-5 py-2 text-sm font-bold text-white bg-red-600 hover:bg-red-700 rounded-lg transition-colors shadow-sm border border-red-700">Yes, delete</button>
        </div>
      </div>
    ), { duration: Infinity, style: { maxWidth: '450px', padding: '16px', backgroundColor: '#ffffff', border: '1px solid #fecaca' } });
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
                {DIAMOND_QUALITIES.map(q => <th key={q} className="px-4 py-3 text-left text-xs font-semibold text-gray-600 uppercase tracking-wider">{q.replace(' Grown', '')} <span className="lowercase font-normal">(₹/ct)</span></th>)}
                <th className="px-4 py-3 text-center text-xs font-semibold text-gray-600 uppercase tracking-wider">Actions</th>
              </tr>
            </thead>
            <tbody className="bg-white divide-y divide-gray-100">
              
              {/* BASE COST ROW */}
              <tr className="bg-gray-50/50">
                <td className="px-4 py-3 sm:py-4 font-bold text-gray-800 text-xs sm:text-sm">BASE COST</td>
                {DIAMOND_QUALITIES.map(q => (
                  <td key={q} className="px-4 py-3 sm:py-4">
                    <div className="flex items-center">
                      <div className="w-6 h-6 sm:w-8 sm:h-8 mr-1 sm:mr-2 flex-shrink-0"></div>
                      <input type="number" min="0" step="any" value={baseCosts[q] === 0 || baseCosts[q] === undefined ? '' : baseCosts[q]} onChange={(e) => { const parsed = parseFloat(e.target.value); setBaseCosts({ ...baseCosts, [q]: isNaN(parsed) ? 0 : parsed }); }} placeholder="0" className={inputCss} />
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
                    const oKey = getOffsetKey(q);
                    const currentVal = tier[oKey];
                    const rawVal = currentVal === undefined || currentVal === null ? 0 : Number(currentVal);
                    const isNegative = rawVal < 0 || Object.is(rawVal, -0);
                    
                    return (
                      <td key={q} className="px-4 py-3 sm:py-4">
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