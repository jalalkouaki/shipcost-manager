import React, { useState, useEffect } from 'react';
import { useScenario } from '../context/ScenarioContext';

export const EvaluationTable: React.FC = () => {
  const { activeScenario, results, isAnalysisFresh, settings } = useScenario();
  const [activeProfileId, setActiveProfileId] = useState<string>('');

  useEffect(() => {
    if (activeScenario && activeScenario.profiles.length > 0 && !activeScenario.profiles.find(p => p.id === activeProfileId)) {
      setActiveProfileId(activeScenario.profiles[0].id);
    }
  }, [activeScenario, activeProfileId]);

  if (!activeScenario || !isAnalysisFresh || Object.keys(results).length === 0) return null;
  
  const formatCurrency = (val: number) => 
    new Intl.NumberFormat('en-US', { style: 'currency', currency: 'USD' }).format(val).replace('$', settings.currency);

  const activeResult = results[activeProfileId];
  if (!activeResult) return null;

  return (
    <div className="bg-white dark:bg-slate-800 p-6 rounded-xl border border-slate-200 dark:border-slate-700 shadow-sm mt-8">
      <h3 className="text-xl font-bold mb-4 text-slate-900 dark:text-white">Detailed Evaluation Table</h3>
      
      <div className="flex flex-wrap gap-2 mb-4">
        {activeScenario.profiles.map(p => (
          <button
            key={p.id}
            onClick={() => setActiveProfileId(p.id)}
            className={`px-4 py-2 text-sm font-medium rounded-lg transition-colors cursor-pointer ${
              activeProfileId === p.id 
                ? 'bg-brand-500 text-white shadow-md' 
                : 'bg-slate-100 dark:bg-slate-900 text-slate-600 dark:text-slate-400 hover:bg-slate-200 dark:hover:bg-slate-800'
            }`}
          >
            {p.name}
          </button>
        ))}
      </div>

      <div className="overflow-x-auto rounded-lg border border-slate-200 dark:border-slate-700 max-h-[500px]">
        <table className="w-full text-left text-sm text-slate-600 dark:text-slate-300 relative">
          <thead className="bg-slate-50 dark:bg-slate-900 text-slate-900 dark:text-slate-200 font-semibold uppercase text-xs sticky top-0 shadow-sm">
            <tr>
              <th className="px-4 py-3 whitespace-nowrap">Order Qty (Q)</th>
              <th className="px-4 py-3 text-right whitespace-nowrap">Shipping Cost</th>
              <th className="px-4 py-3 text-right whitespace-nowrap">Holding Cost</th>
              <th className="px-4 py-3 text-right whitespace-nowrap">Total Cost</th>
            </tr>
          </thead>
          <tbody className="divide-y divide-slate-200 dark:divide-slate-700">
            {activeResult.costCurve.map((pt, idx) => {
              const isOptimal = pt.q === activeResult.optimalQ;
              return (
                <tr key={idx} className={`hover:bg-slate-50 dark:hover:bg-slate-800/50 ${isOptimal ? 'bg-brand-50 dark:bg-brand-900/10' : ''}`}>
                  <td className="px-4 py-3 tabular-nums font-medium">
                    {pt.q.toLocaleString()}
                    {isOptimal && <span className="ml-2 text-[10px] font-bold bg-brand-500 text-white px-1.5 py-0.5 rounded uppercase tracking-wider">Optimal</span>}
                  </td>
                  <td className="px-4 py-3 text-right tabular-nums">{formatCurrency(pt.shippingCost)}</td>
                  <td className="px-4 py-3 text-right tabular-nums">{formatCurrency(pt.holdingCost)}</td>
                  <td className={`px-4 py-3 text-right tabular-nums font-semibold ${isOptimal ? 'text-brand-600 dark:text-brand-400' : ''}`}>
                    {formatCurrency(pt.totalCost)}
                  </td>
                </tr>
              );
            })}
          </tbody>
        </table>
      </div>
    </div>
  );
};
