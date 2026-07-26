import React, { useMemo } from 'react';
import { useScenario } from '../context/ScenarioContext';
import { Coins, PackageCheck, Banknote } from 'lucide-react';

export const InventoryImpact: React.FC = () => {
  const { activeScenario, results, isAnalysisFresh, settings } = useScenario();

  if (!activeScenario || !isAnalysisFresh || Object.keys(results).length === 0) return null;

  const formatCurrency = (val: number) => 
    new Intl.NumberFormat('en-US', { style: 'currency', currency: 'USD' }).format(val).replace('$', settings.currency);

  const insight = useMemo(() => {
    const sorted = Object.values(results).sort((a, b) => a.cashTiedUp - b.cashTiedUp);
    if (sorted.length >= 2) {
      const min = sorted[0];
      const max = sorted[sorted.length - 1];
      const diff = max.cashTiedUp - min.cashTiedUp;
      if (diff > 0) {
        const minProfile = activeScenario.profiles.find(p => p.id === min.profileId)?.name;
        const maxProfile = activeScenario.profiles.find(p => p.id === max.profileId)?.name;
        return `${maxProfile} ties up ${formatCurrency(diff)} more in cycle stock than ${minProfile}.`;
      }
    }
    return 'Inventory impact is similar across profiles.';
  }, [results, activeScenario, settings.currency]);

  return (
    <div className="bg-white dark:bg-slate-800 p-6 rounded-xl border border-slate-200 dark:border-slate-700 shadow-sm mt-8">
      <h3 className="text-xl font-bold mb-2 text-slate-900 dark:text-white">Inventory Impact & Cash Flow</h3>
      <div className="bg-brand-50 dark:bg-brand-900/20 p-3 rounded-md border border-brand-100 dark:border-brand-800/50 mb-6 flex items-start gap-3">
        <Coins size={18} className="text-brand-600 dark:text-brand-400 mt-0.5 shrink-0" />
        <p className="text-sm font-medium text-brand-800 dark:text-brand-300">
          {insight}
        </p>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-2 xl:grid-cols-3 gap-6">
        {activeScenario.profiles.map(profile => {
          const res = results[profile.id];
          if (!res) return null;
          
          return (
            <div key={profile.id} className="p-4 bg-slate-50 dark:bg-slate-900 rounded-lg border border-slate-100 dark:border-slate-800 hover:border-slate-300 dark:hover:border-slate-600 transition-colors">
              <h4 className="font-semibold text-slate-800 dark:text-slate-200 mb-4 pb-2 border-b border-slate-200 dark:border-slate-700 flex justify-between items-center">
                {profile.name}
                <span className="text-xs font-semibold px-2 py-0.5 bg-slate-200 dark:bg-slate-800 rounded-full text-slate-600 dark:text-slate-400 uppercase">
                  {profile.type}
                </span>
              </h4>
              
              <div className="space-y-4">
                <div className="flex justify-between items-center text-sm">
                  <span className="flex items-center gap-2 text-slate-600 dark:text-slate-400">
                    <PackageCheck size={16} /> Avg Cycle Stock
                  </span>
                  <span className="font-medium text-slate-900 dark:text-white tabular-nums">{formatCurrency(res.cashTiedUp)}</span>
                </div>
                
                <div className="flex justify-between items-center text-sm">
                  <span className="flex items-center gap-2 text-slate-600 dark:text-slate-400">
                    <Banknote size={16} /> Total Avg Inv Value
                  </span>
                  <span className="font-bold text-slate-900 dark:text-white tabular-nums">{formatCurrency(res.avgInventoryValue)}</span>
                </div>
                
                <div className="flex justify-between items-center text-sm pt-3 mt-1 border-t border-slate-200 dark:border-slate-800">
                  <span className="text-slate-500 dark:text-slate-400">Days of Inventory</span>
                  <span className="font-semibold text-slate-700 dark:text-slate-300 tabular-nums">
                    {res.daysOfInventory.toFixed(1)} days
                  </span>
                </div>
              </div>
            </div>
          );
        })}
      </div>
    </div>
  );
};
