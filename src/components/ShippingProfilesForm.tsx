import React from 'react';
import { useScenario } from '../context/ScenarioContext';
import type { ShippingProfile, LCLProfile, FCLProfile } from '../types';
import { Trash2, Plus } from 'lucide-react';

export const ShippingProfilesForm: React.FC = () => {
  const { activeScenario, updateActiveScenario } = useScenario();

  if (!activeScenario) return null;

  const { profiles } = activeScenario;

  const updateProfile = (id: string, updates: Partial<ShippingProfile>) => {
    updateActiveScenario({
      ...activeScenario,
      profiles: profiles.map(p => (p.id === id ? { ...p, ...updates } as ShippingProfile : p))
    });
  };

  const removeProfile = (id: string) => {
    updateActiveScenario({
      ...activeScenario,
      profiles: profiles.filter(p => p.id !== id)
    });
  };

  const addProfile = (type: 'lcl' | 'fcl') => {
    const newProfile: ShippingProfile = type === 'lcl' 
      ? { id: Date.now().toString(), type: 'lcl', name: 'New LCL', fixedHandling: 0, variablePerUnit: 0 }
      : { id: Date.now().toString(), type: 'fcl', name: 'New FCL', containerCost: 0, capacity: 1000 };
    
    updateActiveScenario({
      ...activeScenario,
      profiles: [...profiles, newProfile]
    });
  };

  return (
    <div className="bg-white dark:bg-slate-800 p-6 rounded-xl border border-slate-200 dark:border-slate-700 shadow-sm transition-colors mt-6">
      <div className="flex justify-between items-center mb-4">
        <h2 className="text-xl font-semibold text-slate-900 dark:text-white">Shipping Profiles</h2>
        <div className="flex gap-2">
          <button onClick={() => addProfile('lcl')} className="flex items-center cursor-pointer gap-1 text-sm bg-slate-100 dark:bg-slate-700 hover:bg-slate-200 dark:hover:bg-slate-600 px-3 py-1.5 rounded-md transition-colors text-slate-700 dark:text-slate-200">
            <Plus size={16} /> LCL
          </button>
          <button onClick={() => addProfile('fcl')} className="flex items-center cursor-pointer gap-1 text-sm bg-slate-100 dark:bg-slate-700 hover:bg-slate-200 dark:hover:bg-slate-600 px-3 py-1.5 rounded-md transition-colors text-slate-700 dark:text-slate-200">
            <Plus size={16} /> FCL
          </button>
        </div>
      </div>

      <div className="space-y-4">
        {profiles.map(profile => (
          <div key={profile.id} className="p-4 border border-slate-200 dark:border-slate-700 rounded-lg bg-slate-50 dark:bg-slate-800/50 relative group">
            <button 
              onClick={() => removeProfile(profile.id)}
              className="absolute top-4 right-4 text-slate-400 hover:text-red-500 transition-colors cursor-pointer"
              title="Remove profile"
            >
              <Trash2 size={18} />
            </button>
            
            <div className="mb-3 pr-8 flex items-center">
              <input
                type="text"
                value={profile.name}
                onChange={(e) => updateProfile(profile.id, { name: e.target.value })}
                className="font-medium text-lg bg-transparent border-b border-transparent hover:border-slate-300 dark:hover:border-slate-600 focus:border-brand-500 focus:outline-none px-1 py-0.5 text-slate-900 dark:text-white w-full max-w-[200px]"
              />
              <span className="ml-2 text-xs font-semibold px-2 py-1 bg-slate-200 dark:bg-slate-700 rounded-full text-slate-600 dark:text-slate-300 uppercase">
                {profile.type}
              </span>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              {profile.type === 'lcl' ? (
                <>
                  <div>
                    <label className="block text-xs font-medium text-slate-500 dark:text-slate-400 mb-1">Fixed Handling Fee ($/shipment)</label>
                    <input
                      type="number"
                      min="0"
                      step="0.01"
                      value={(profile as LCLProfile).fixedHandling === 0 ? '' : (profile as LCLProfile).fixedHandling}
                      onChange={(e) => updateProfile(profile.id, { fixedHandling: Math.max(0, parseFloat(e.target.value) || 0) })}
                      className="w-full px-3 py-2 border border-slate-300 dark:border-slate-600 rounded-md bg-white dark:bg-slate-900 text-slate-900 dark:text-white focus:outline-none focus:ring-2 focus:ring-brand-500"
                    />
                  </div>
                  <div>
                    <label className="block text-xs font-medium text-slate-500 dark:text-slate-400 mb-1">Variable Cost ($/unit)</label>
                    <input
                      type="number"
                      min="0"
                      step="0.01"
                      value={(profile as LCLProfile).variablePerUnit === 0 ? '' : (profile as LCLProfile).variablePerUnit}
                      onChange={(e) => updateProfile(profile.id, { variablePerUnit: Math.max(0, parseFloat(e.target.value) || 0) })}
                      className="w-full px-3 py-2 border border-slate-300 dark:border-slate-600 rounded-md bg-white dark:bg-slate-900 text-slate-900 dark:text-white focus:outline-none focus:ring-2 focus:ring-brand-500"
                    />
                  </div>
                </>
              ) : (
                <>
                  <div>
                    <label className="block text-xs font-medium text-slate-500 dark:text-slate-400 mb-1">Total Container Cost ($)</label>
                    <input
                      type="number"
                      min="0"
                      step="0.01"
                      value={(profile as FCLProfile).containerCost === 0 ? '' : (profile as FCLProfile).containerCost}
                      onChange={(e) => updateProfile(profile.id, { containerCost: Math.max(0, parseFloat(e.target.value) || 0) })}
                      className="w-full px-3 py-2 border border-slate-300 dark:border-slate-600 rounded-md bg-white dark:bg-slate-900 text-slate-900 dark:text-white focus:outline-none focus:ring-2 focus:ring-brand-500"
                    />
                  </div>
                  <div>
                    <label className="block text-xs font-medium text-slate-500 dark:text-slate-400 mb-1">Container Capacity (Units)</label>
                    <input
                      type="number"
                      min="1"
                      step="1"
                      value={(profile as FCLProfile).capacity === 0 ? '' : (profile as FCLProfile).capacity}
                      onChange={(e) => updateProfile(profile.id, { capacity: Math.max(1, parseInt(e.target.value) || 1) })}
                      className="w-full px-3 py-2 border border-slate-300 dark:border-slate-600 rounded-md bg-white dark:bg-slate-900 text-slate-900 dark:text-white focus:outline-none focus:ring-2 focus:ring-brand-500"
                    />
                  </div>
                </>
              )}
            </div>
          </div>
        ))}
        {profiles.length === 0 && (
          <div className="text-center p-8 border-2 border-dashed border-slate-300 dark:border-slate-600 rounded-lg text-slate-500 dark:text-slate-400">
            No shipping profiles configured. Add one to compare costs.
          </div>
        )}
      </div>
    </div>
  );
};
