import React from 'react';
import { useScenario } from '../context/ScenarioContext';
import { Package, TrendingDown, Clock, Layers, CheckCircle2, Award } from 'lucide-react';
import { formatCurrency as formatCurr } from '../utils/format';

export const ResultsPanel: React.FC = () => {
  const { activeScenario, results, settings } = useScenario();

  if (!activeScenario || Object.keys(results).length === 0) return null;

  const currencySymbol = settings?.currency || 'MAD';

  const formatCurrency = (value: number) => {
    return formatCurr(value, currencySymbol);
  };

  const formatNumber = (value: number) => {
    return new Intl.NumberFormat('en-US', { maximumFractionDigits: 1 }).format(value);
  };

  // Find lowest total cost
  const bestCost = Math.min(...Object.values(results).map((r: any) => r.minTotalCost));

  return (
    <div className="space-y-6 mt-6">
      <div className="flex items-center justify-between">
        <div>
          <h2 className="text-xl font-extrabold text-slate-900 dark:text-slate-50 tracking-tight">
            Logistics Optimization Results
          </h2>
          <p className="text-xs text-slate-500 dark:text-slate-400 mt-0.5">
            Evaluated across trade lanes, container constraints, and inventory holding costs
          </p>
        </div>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-3 gap-6">
        {activeScenario.profiles.map(profile => {
          const res = results[profile.id];
          if (!res) return null;

          const isBest = res.minTotalCost === bestCost;

          return (
            <div
              key={profile.id}
              className={`p-6 rounded-2xl border transition-all relative overflow-hidden flex flex-col justify-between ${
                isBest
                  ? 'border-emerald-500/80 dark:border-emerald-500/60 shadow-lg shadow-emerald-500/5 ring-1 ring-emerald-500/40 bg-white dark:bg-slate-900'
                  : 'border-slate-200/80 dark:border-slate-800 shadow-sm bg-white dark:bg-slate-900/90 hover:border-slate-300 dark:hover:border-slate-700'
              }`}
            >
              {isBest && (
                <div className="absolute top-0 right-0 bg-gradient-to-r from-emerald-600 to-teal-600 text-white text-[11px] font-bold px-3 py-1 rounded-bl-xl shadow-sm flex items-center gap-1 uppercase tracking-wide">
                  <Award size={13} />
                  Recommended
                </div>
              )}

              <div>
                <div className="flex justify-between items-start mb-6">
                  <div>
                    <h3 className="text-lg font-bold text-slate-900 dark:text-white tracking-tight">
                      {profile.name}
                    </h3>
                    <span className="text-[11px] font-semibold px-2.5 py-0.5 bg-slate-100 dark:bg-slate-800 text-slate-600 dark:text-slate-300 rounded-md uppercase tracking-wider mt-2 inline-block border border-slate-200/60 dark:border-slate-700/60">
                      {profile.type} Freight
                    </span>
                  </div>
                  <div className="text-right">
                    <div className="text-xs font-medium text-slate-500 dark:text-slate-400 uppercase tracking-wider">
                      Total Annual Cost
                    </div>
                    <div
                      className={`text-2xl font-extrabold tabular-nums tracking-tight mt-0.5 ${
                        isBest ? 'text-emerald-600 dark:text-emerald-400' : 'text-slate-900 dark:text-slate-100'
                      }`}
                    >
                      {formatCurrency(res.minTotalCost)}
                    </div>
                  </div>
                </div>

                <div className="grid grid-cols-2 gap-3 mb-6">
                  <div className="bg-slate-50 dark:bg-slate-950/60 p-3.5 rounded-xl border border-slate-100 dark:border-slate-800/80">
                    <div className="flex items-center gap-1.5 text-slate-500 dark:text-slate-400 text-xs font-medium mb-1">
                      <Package size={14} className="text-brand-500" /> Optimal Order (Q)
                    </div>
                    <div className="font-bold text-lg text-slate-900 dark:text-slate-100 tabular-nums">
                      {formatNumber(res.optimalQ)}{' '}
                      <span className="text-xs font-normal text-slate-500 dark:text-slate-400">units</span>
                    </div>
                  </div>

                  <div className="bg-slate-50 dark:bg-slate-950/60 p-3.5 rounded-xl border border-slate-100 dark:border-slate-800/80">
                    <div className="flex items-center gap-1.5 text-slate-500 dark:text-slate-400 text-xs font-medium mb-1">
                      <Layers size={14} className="text-emerald-500" /> Shipments / Yr
                    </div>
                    <div className="font-bold text-lg text-slate-900 dark:text-slate-100 tabular-nums">
                      {formatNumber(res.shipmentsPerYear)}{' '}
                      <span className="text-xs font-normal text-slate-500 dark:text-slate-400">orders</span>
                    </div>
                  </div>
                </div>

                <div className="space-y-2.5 text-sm">
                  <div className="flex justify-between items-center py-1">
                    <span className="flex items-center gap-1.5 text-slate-600 dark:text-slate-300 text-xs font-medium">
                      <TrendingDown size={14} className="text-blue-500" /> Annual Freight Spend
                    </span>
                    <span className="font-semibold tabular-nums text-slate-900 dark:text-slate-100 text-sm">
                      {formatCurrency(res.shippingCost)}
                    </span>
                  </div>

                  <div className="flex justify-between items-center py-1">
                    <span className="flex items-center gap-1.5 text-slate-600 dark:text-slate-300 text-xs font-medium">
                      <Clock size={14} className="text-amber-500" /> Annual Holding Cost
                    </span>
                    <span className="font-semibold tabular-nums text-slate-900 dark:text-slate-100 text-sm">
                      {formatCurrency(res.holdingCost)}
                    </span>
                  </div>

                  <div className="border-t border-slate-100 dark:border-slate-800/80 pt-2.5 mt-2 space-y-2">
                    <div className="flex justify-between items-center text-xs">
                      <span className="text-slate-500 dark:text-slate-400">Avg Inventory Value</span>
                      <span className="font-semibold tabular-nums text-slate-700 dark:text-slate-300">
                        {formatCurrency(res.avgInventoryValue)}
                      </span>
                    </div>
                    <div className="flex justify-between items-center text-xs">
                      <span className="text-slate-500 dark:text-slate-400">Days of Inventory</span>
                      <span className="font-semibold tabular-nums text-slate-700 dark:text-slate-300">
                        {formatNumber(res.daysOfInventory)} days
                      </span>
                    </div>
                    <div className="flex justify-between items-center text-xs">
                      <span className="text-slate-500 dark:text-slate-400">Landed Unit Cost</span>
                      <span className="font-semibold tabular-nums text-brand-600 dark:text-brand-400">
                        {formatCurrency(res.effectiveLandedCost)} / unit
                      </span>
                    </div>
                  </div>
                </div>
              </div>

              {isBest && (
                <div className="mt-4 pt-3 border-t border-emerald-100 dark:border-emerald-950/60 flex items-center gap-1.5 text-emerald-700 dark:text-emerald-400 text-xs font-semibold">
                  <CheckCircle2 size={15} />
                  Minimizes total annual logistics expenditure
                </div>
              )}
            </div>
          );
        })}
      </div>
    </div>
  );
};
