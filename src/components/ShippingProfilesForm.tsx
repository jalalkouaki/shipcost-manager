import React from 'react';
import { useScenario } from '../context/ScenarioContext';
import type { ShippingProfile, LCLProfile, FCLProfile } from '../types';
import { Trash2, Plus, Anchor } from 'lucide-react';

export const ShippingProfilesForm: React.FC = () => {
  const { activeScenario, updateActiveScenario, settings } = useScenario();

  if (!activeScenario) return null;

  const { profiles } = activeScenario;
  const currencySymbol = settings?.currency || 'MAD';

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
      ? { id: Date.now().toString(), type: 'lcl', name: 'LCL Freight', fixedHandling: 0, variablePerUnit: 0 }
      : { id: Date.now().toString(), type: 'fcl', name: 'FCL 40ft', containerCost: 0, capacity: 0 };

    updateActiveScenario({
      ...activeScenario,
      profiles: [...profiles, newProfile]
    });
  };

  const inputClass =
    "w-full px-3 py-2 border border-slate-200 dark:border-slate-700/80 rounded-xl bg-white dark:bg-slate-900 text-slate-900 dark:text-slate-100 placeholder:text-slate-400 focus:outline-none focus:ring-2 focus:ring-brand-500/20 focus:border-brand-500 transition-all text-sm font-semibold tabular-nums";

  return (
    <div className="bg-white dark:bg-slate-900 p-6 rounded-2xl border border-slate-200/80 dark:border-slate-800 shadow-sm transition-colors mt-6">
      <div className="flex justify-between items-center mb-4">
        <div className="flex items-center gap-2">
          <div className="p-1.5 rounded-lg bg-blue-50 dark:bg-blue-950/60 text-blue-600 dark:text-blue-400">
            <Anchor size={18} />
          </div>
          <div>
            <h2 className="text-base font-bold text-slate-900 dark:text-slate-100 tracking-tight">
              Shipping & Freight Profiles
            </h2>
            <p className="text-xs text-slate-500 dark:text-slate-400">
              Configure LCL/FCL rate cards & container capacities
            </p>
          </div>
        </div>

        <div className="flex gap-1.5">
          <button
            onClick={() => addProfile('lcl')}
            className="flex items-center cursor-pointer gap-1 text-xs font-semibold bg-slate-100 dark:bg-slate-800 hover:bg-slate-200 dark:hover:bg-slate-700 px-2.5 py-1.5 rounded-lg transition-colors text-slate-700 dark:text-slate-200 border border-slate-200 dark:border-slate-700"
          >
            <Plus size={14} className="text-brand-500" /> LCL
          </button>
          <button
            onClick={() => addProfile('fcl')}
            className="flex items-center cursor-pointer gap-1 text-xs font-semibold bg-slate-100 dark:bg-slate-800 hover:bg-slate-200 dark:hover:bg-slate-700 px-2.5 py-1.5 rounded-lg transition-colors text-slate-700 dark:text-slate-200 border border-slate-200 dark:border-slate-700"
          >
            <Plus size={14} className="text-emerald-500" /> FCL
          </button>
        </div>
      </div>

      <div className="space-y-3.5">
        {profiles.map(profile => (
          <div
            key={profile.id}
            className="p-4 border border-slate-200/90 dark:border-slate-800 rounded-xl bg-slate-50/60 dark:bg-slate-950/50 relative group transition-colors"
          >
            <button
              onClick={() => removeProfile(profile.id)}
              className="absolute top-4 right-4 text-slate-400 hover:text-red-500 p-1 rounded-md hover:bg-red-50 dark:hover:bg-red-500/10 transition-colors cursor-pointer"
              title="Remove profile"
            >
              <Trash2 size={16} />
            </button>

            <div className="mb-3 pr-8 flex items-center">
              <input
                type="text"
                value={profile.name}
                onChange={(e) => updateProfile(profile.id, { name: e.target.value })}
                className="font-bold text-base bg-transparent border-b border-transparent hover:border-slate-300 dark:hover:border-slate-600 focus:border-brand-500 focus:outline-none px-1 py-0.5 text-slate-900 dark:text-white w-full max-w-[210px] tracking-tight"
              />
              <span className="ml-2 text-[10px] font-bold px-2 py-0.5 bg-slate-200 dark:bg-slate-800 rounded-md text-slate-600 dark:text-slate-300 uppercase tracking-wider border border-slate-300/40 dark:border-slate-700">
                {profile.type}
              </span>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
              {profile.type === 'lcl' ? (
                <>
                  <div>
                    <label className="block text-[11px] font-semibold text-slate-500 dark:text-slate-400 mb-1 uppercase tracking-wider">
                      Fixed Handling Fee ({currencySymbol})
                    </label>
                    <input
                      type="number"
                      min="0"
                      step="0.01"
                      value={(profile as LCLProfile).fixedHandling === 0 ? '' : (profile as LCLProfile).fixedHandling}
                      onChange={(e) => updateProfile(profile.id, { fixedHandling: Math.max(0, parseFloat(e.target.value) || 0) })}
                      placeholder="0.00"
                      className={inputClass}
                    />
                  </div>
                  <div>
                    <label className="block text-[11px] font-semibold text-slate-500 dark:text-slate-400 mb-1 uppercase tracking-wider">
                      Variable Cost ({currencySymbol}/unit)
                    </label>
                    <input
                      type="number"
                      min="0"
                      step="0.01"
                      value={(profile as LCLProfile).variablePerUnit === 0 ? '' : (profile as LCLProfile).variablePerUnit}
                      onChange={(e) => updateProfile(profile.id, { variablePerUnit: Math.max(0, parseFloat(e.target.value) || 0) })}
                      placeholder="0.00"
                      className={inputClass}
                    />
                  </div>
                </>
              ) : (
                <>
                  <div>
                    <label className="block text-[11px] font-semibold text-slate-500 dark:text-slate-400 mb-1 uppercase tracking-wider">
                      Container Cost ({currencySymbol})
                    </label>
                    <input
                      type="number"
                      min="0"
                      step="0.01"
                      value={(profile as FCLProfile).containerCost === 0 ? '' : (profile as FCLProfile).containerCost}
                      onChange={(e) => updateProfile(profile.id, { containerCost: Math.max(0, parseFloat(e.target.value) || 0) })}
                      placeholder="0.00"
                      className={inputClass}
                    />
                  </div>
                  <div>
                    <label className="block text-[11px] font-semibold text-slate-500 dark:text-slate-400 mb-1 uppercase tracking-wider">
                      Container Capacity (Units)
                    </label>
                    <input
                      type="number"
                      min="0"
                      step="1"
                      value={(profile as FCLProfile).capacity === 0 ? '' : (profile as FCLProfile).capacity}
                      onChange={(e) => updateProfile(profile.id, { capacity: Math.max(0, parseInt(e.target.value) || 0) })}
                      placeholder="e.g. 5,000"
                      className={inputClass}
                    />
                  </div>
                </>
              )}
            </div>
          </div>
        ))}

        {profiles.length === 0 && (
          <div className="text-center p-6 border-2 border-dashed border-slate-200 dark:border-slate-800 rounded-xl text-slate-500 dark:text-slate-400 text-xs">
            No shipping profiles configured. Click <strong>+ LCL</strong> or <strong>+ FCL</strong> above to start comparing.
          </div>
        )}
      </div>
    </div>
  );
};
