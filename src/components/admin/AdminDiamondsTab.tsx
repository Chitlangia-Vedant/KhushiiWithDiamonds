import React, { useState, useEffect } from 'react';
import { Save, Plus, Trash2 } from 'lucide-react';
import { DIAMOND_QUALITIES } from '../../constants/jewellery';
import { DiamondPricingTier } from '../../types';
import toast from 'react-hot-toast';

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
        // If the database function fails but doesn't throw a hard error
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

  return (
    <div className="bg-white shadow-lg rounded-xl p-6 border border-gray-100">
      <div className="flex justify-between items-center mb-6">
        <div>
          <h2 className="text-xl font-bold text-gray-900">Universal Diamond Pricing</h2>
          <p className="text-sm text-gray-500">Set base costs and dynamic offsets per carat range.</p>
        </div>
        <button onClick={handleSave} disabled={isSaving} className="bg-purple-600 text-white px-4 py-2 rounded-lg flex items-center hover:bg-purple-700">
          <Save className="h-4 w-4 mr-2" /> {isSaving ? 'Saving...' : 'Save Pricing Grid'}
        </button>
      </div>

      <div className="overflow-x-auto">
        <table className="w-full text-sm text-left">
          <thead className="bg-purple-50 text-purple-900 font-semibold uppercase text-xs">
            <tr>
              <th className="px-4 py-3">Carat Range</th>
              {DIAMOND_QUALITIES.map(q => <th key={q} className="px-4 py-3">{q} (₹/ct)</th>)}
              <th className="px-4 py-3">Actions</th>
            </tr>
          </thead>
          <tbody className="divide-y divide-gray-100">
            {/* BASE COSTS */}
            <tr className="bg-purple-50/30">
              <td className="px-4 py-4 font-bold text-gray-800">BASE COST</td>
              {DIAMOND_QUALITIES.map(q => (
                <td key={q} className="px-4 py-4">
                  <input type="number" value={baseCosts[q] || 0} onChange={(e) => setBaseCosts({ ...baseCosts, [q]: parseFloat(e.target.value) || 0 })} className="w-24 px-2 py-1 border rounded" />
                </td>
              ))}
              <td></td>
            </tr>
            {/* TIERS */}
            {tiers.map((tier, index) => (
              <tr key={index} className="hover:bg-gray-50">
                <td className="px-4 py-4 flex items-center space-x-2">
                  <input type="number" step="0.01" value={tier.min_carat} onChange={(e) => { const nt = [...tiers]; nt[index].min_carat = parseFloat(e.target.value) || 0; setTiers(nt); }} className="w-16 px-2 py-1 border rounded" />
                  <span>to</span>
                  <input type="number" step="0.01" value={tier.max_carat} onChange={(e) => { const nt = [...tiers]; nt[index].max_carat = parseFloat(e.target.value) || 0; setTiers(nt); }} className="w-16 px-2 py-1 border rounded" />
                </td>
                {DIAMOND_QUALITIES.map(q => {
                  const oKey = getOffsetKey(q);
                  return (
                    <td key={q} className="px-4 py-4">
                      <div className="flex items-center">
                        <span className="text-gray-400 mr-1">{Number(tier[oKey]) >= 0 ? '+' : ''}</span>
                        <input type="number" value={Number(tier[oKey]) || 0} onChange={(e) => { const nt = [...tiers]; (nt[index] as any)[oKey] = parseFloat(e.target.value) || 0; setTiers(nt); }} className="w-24 px-2 py-1 border rounded" />
                      </div>
                    </td>
                  );
                })}
                <td className="px-4 py-4">
                  <button onClick={() => setTiers(tiers.filter((_, i) => i !== index))} className="text-red-500 hover:bg-red-50 p-1 rounded"><Trash2 className="h-4 w-4" /></button>
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
      <button onClick={() => setTiers([...tiers, { min_carat: 0, max_carat: 0.99, ef_vvs_offset: 0, fg_vvs_si_offset: 0, gh_vs_si_offset: 0, lab_grown_offset: 0 }])} className="mt-4 text-sm font-semibold text-purple-600 flex items-center"><Plus className="h-4 w-4 mr-1" /> Add Carat Tier</button>
    </div>
  );
}