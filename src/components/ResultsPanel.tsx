import React from 'react';
import { useScenario } from '../context/ScenarioContext';
import { Package, TrendingDown, Clock, Layers } from 'lucide-react';

const formatCurrency = (value: number) => {
  return new Intl.NumberFormat('en-US', { style: 'currency', currency: 'USD' }).format(value);
};

const formatNumber = (value: number) => {
  return new Intl.NumberFormat('en-US', { maximumFractionDigits: 1 }).format(value);
};

export const ResultsPanel: React.FC = () => {
  const { activeScenario, results } = useScenario();

  if (!activeScenario || Object.keys(results).length === 0) return null;

  return (
    <div className="space-y-6 mt-8">
      <h2 className="text-2xl font-bold text-slate-900 dark:text-white">Optimization Results</h2>
      
      <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-3 gap-6">
        {activeScenario.profiles.map(profile => {
          const res = results[profile.id];
          if (!res) return null;
          
          const isBest = Object.values(results).every(r => res.minTotalCost <= r.minTotalCost);

          return (
            <div key={profile.id} className={`p-6 rounded-xl border ${isBest ? 'border-brand-500 shadow-md ring-1 ring-brand-500' : 'border-slate-200 dark:border-slate-700 shadow-sm'} bg-white dark:bg-slate-800 transition-colors relative overflow-hidden`}>
              {isBest && (
                <div className="absolute top-0 right-0 bg-brand-500 text-white text-xs font-bold px-3 py-1 rounded-bl-lg">
                  RECOMMENDED
                </div>
              )}
              
              <div className="flex justify-between items-start mb-6">
                <div>
                  <h3 className="text-lg font-bold text-slate-900 dark:text-white">{profile.name}</h3>
                  <span className="text-xs font-semibold px-2 py-1 bg-slate-100 dark:bg-slate-700 rounded-full text-slate-600 dark:text-slate-300 uppercase mt-2 inline-block">
                    {profile.type}
                  </span>
                </div>
                <div className="text-right">
                  <div className="text-sm text-slate-500 dark:text-slate-400">Total Annual Cost</div>
                  <div className={`text-2xl font-bold tabular-nums ${isBest ? 'text-brand-600 dark:text-indigo-400' : 'text-slate-900 dark:text-white'}`}>
                    {formatCurrency(res.minTotalCost)}
                  </div>
                </div>
              </div>

              <div className="grid grid-cols-2 gap-4 mb-6">
                <div className="bg-slate-50 dark:bg-slate-900 p-3 rounded-lg">
                  <div className="flex items-center gap-1.5 text-slate-500 dark:text-slate-400 text-xs mb-1">
                    <Package size={14} /> Optimal Q
                  </div>
                  <div className="font-semibold text-lg text-slate-900 dark:text-white tabular-nums">
                    {formatNumber(res.optimalQ)} <span className="text-sm font-normal text-slate-500">units</span>
                  </div>
                </div>
                <div className="bg-slate-50 dark:bg-slate-900 p-3 rounded-lg">
                  <div className="flex items-center gap-1.5 text-slate-500 dark:text-slate-400 text-xs mb-1">
                    <Layers size={14} /> Shipments/Yr
                  </div>
                  <div className="font-semibold text-lg text-slate-900 dark:text-white tabular-nums">
                    {formatNumber(res.shipmentsPerYear)}
                  </div>
                </div>
              </div>

              <div className="space-y-3">
                <div className="flex justify-between items-center text-sm">
                  <span className="flex items-center gap-1.5 text-slate-600 dark:text-slate-300">
                    <TrendingDown size={14} className="text-blue-500" /> Freight Spend
                  </span>
                  <span className="font-semibold tabular-nums text-slate-900 dark:text-white">{formatCurrency(res.shippingCost)}</span>
                </div>
                <div className="flex justify-between items-center text-sm">
                  <span className="flex items-center gap-1.5 text-slate-600 dark:text-slate-300">
                    <Clock size={14} className="text-orange-500" /> Holding Cost
                  </span>
                  <span className="font-semibold tabular-nums text-slate-900 dark:text-white">{formatCurrency(res.holdingCost)}</span>
                </div>
                <div className="border-t border-slate-100 dark:border-slate-700 pt-3 mt-3">
                  <div className="flex justify-between items-center text-sm">
                    <span className="text-slate-500 dark:text-slate-400">Avg Inventory Value</span>
                    <span className="font-medium tabular-nums text-slate-700 dark:text-slate-200">{formatCurrency(res.avgInventoryValue)}</span>
                  </div>
                  <div className="flex justify-between items-center text-sm mt-1">
                    <span className="text-slate-500 dark:text-slate-400">Days of Inventory</span>
                    <span className="font-medium tabular-nums text-slate-700 dark:text-slate-200">{formatNumber(res.daysOfInventory)} days</span>
                  </div>
                </div>
              </div>
            </div>
          );
        })}
      </div>
    </div>
  );
};
