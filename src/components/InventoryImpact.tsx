import React, { useMemo } from 'react';
import { useScenario } from '../context/ScenarioContext';
import { Coins, PackageCheck, Banknote, Calendar } from 'lucide-react';
import { formatCurrency as formatCurr } from '../utils/format';

export const InventoryImpact: React.FC = () => {
  const { activeScenario, results, isAnalysisFresh, settings } = useScenario();

  const formatCurrency = (val: number) => formatCurr(val, settings?.currency || 'MAD');

  const insight = useMemo(() => {
    if (!activeScenario || !results) return '';
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
    return 'Inventory impact is balanced across analyzed freight profiles.';
  }, [results, activeScenario, settings.currency]);

  if (!activeScenario || !isAnalysisFresh || Object.keys(results).length === 0) return null;

  return (
    <div className="bg-white dark:bg-slate-900 p-6 rounded-2xl border border-slate-200/80 dark:border-slate-800 shadow-sm mt-8 transition-colors">
      <div className="flex items-center gap-2 mb-2">
        <div className="p-1.5 rounded-lg bg-emerald-50 dark:bg-emerald-950/60 text-emerald-600 dark:text-emerald-400">
          <Banknote size={18} />
        </div>
        <div>
          <h3 className="text-base font-bold text-slate-900 dark:text-slate-100 tracking-tight">
            Inventory Impact & Working Capital Exposure
          </h3>
          <p className="text-xs text-slate-500 dark:text-slate-400">
            Cash tied up in transit and warehouse buffers vs. liquidity risk
          </p>
        </div>
      </div>

      <div className="bg-emerald-50/80 dark:bg-emerald-950/30 p-3.5 rounded-xl border border-emerald-200/60 dark:border-emerald-800/40 my-4 flex items-start gap-3">
        <Coins size={18} className="text-emerald-600 dark:text-emerald-400 mt-0.5 shrink-0" />
        <p className="text-xs sm:text-sm font-semibold text-emerald-900 dark:text-emerald-200">
          {insight}
        </p>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-2 xl:grid-cols-3 gap-4">
        {activeScenario.profiles.map(profile => {
          const res = results[profile.id];
          if (!res) return null;

          return (
            <div
              key={profile.id}
              className="p-4 bg-slate-50/80 dark:bg-slate-950/60 rounded-xl border border-slate-200/70 dark:border-slate-800/80 hover:border-slate-300 dark:hover:border-slate-700 transition-colors"
            >
              <h4 className="font-bold text-slate-900 dark:text-slate-100 mb-3 pb-2 border-b border-slate-200/60 dark:border-slate-800 flex justify-between items-center text-sm tracking-tight">
                {profile.name}
                <span className="text-[10px] font-bold px-2 py-0.5 bg-slate-200/70 dark:bg-slate-800 rounded-md text-slate-600 dark:text-slate-300 uppercase tracking-wider border border-slate-300/40 dark:border-slate-700">
                  {profile.type}
                </span>
              </h4>

              <div className="space-y-2.5 text-xs">
                <div className="flex justify-between items-center">
                  <span className="flex items-center gap-1.5 text-slate-600 dark:text-slate-400 font-medium">
                    <PackageCheck size={14} className="text-brand-500" /> Avg Cycle Stock Capital
                  </span>
                  <span className="font-bold text-slate-900 dark:text-slate-100 tabular-nums">
                    {formatCurrency(res.cashTiedUp)}
                  </span>
                </div>

                <div className="flex justify-between items-center">
                  <span className="flex items-center gap-1.5 text-slate-600 dark:text-slate-400 font-medium">
                    <Calendar size={14} className="text-amber-500" /> Days of Inventory (DOI)
                  </span>
                  <span className="font-bold text-slate-900 dark:text-slate-100 tabular-nums">
                    {res.daysOfInventory.toFixed(1)} days
                  </span>
                </div>

                <div className="flex justify-between items-center pt-1 border-t border-slate-200/40 dark:border-slate-800/60">
                  <span className="text-slate-500 dark:text-slate-400 font-medium">
                    Total Inventory Asset Value
                  </span>
                  <span className="font-bold text-slate-800 dark:text-slate-200 tabular-nums">
                    {formatCurrency(res.avgInventoryValue)}
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
