import React, { useState, useEffect } from 'react';
import { useScenario } from '../context/ScenarioContext';
import { Table, CheckCircle2 } from 'lucide-react';
import { formatCurrency as formatCurr } from '../utils/format';

export const EvaluationTable: React.FC = () => {
  const { activeScenario, results, isAnalysisFresh, settings } = useScenario();
  const [activeProfileId, setActiveProfileId] = useState<string>('');

  useEffect(() => {
    if (activeScenario && activeScenario.profiles.length > 0 && !activeScenario.profiles.find(p => p.id === activeProfileId)) {
      setActiveProfileId(activeScenario.profiles[0].id);
    }
  }, [activeScenario, activeProfileId]);

  if (!activeScenario || !isAnalysisFresh || Object.keys(results).length === 0) return null;

  const formatCurrency = (val: number) => formatCurr(val, settings?.currency || 'MAD');

  const activeResult = results[activeProfileId];
  if (!activeResult) return null;

  return (
    <div className="bg-white dark:bg-slate-900 p-6 rounded-2xl border border-slate-200/80 dark:border-slate-800 shadow-sm mt-8 transition-colors">
      <div className="flex items-center gap-2 mb-4">
        <div className="p-1.5 rounded-lg bg-brand-50 dark:bg-brand-950/60 text-brand-600 dark:text-brand-400">
          <Table size={18} />
        </div>
        <div>
          <h3 className="text-base font-bold text-slate-900 dark:text-slate-100 tracking-tight">
            Detailed Cost Curve Evaluation Table
          </h3>
          <p className="text-xs text-slate-500 dark:text-slate-400">
            Step-by-step logistical cost trade-off matrix across order quantities
          </p>
        </div>
      </div>

      <div className="flex flex-wrap gap-2 mb-4">
        {activeScenario.profiles.map(p => (
          <button
            key={p.id}
            onClick={() => setActiveProfileId(p.id)}
            className={`px-3.5 py-1.5 text-xs font-bold rounded-lg transition-all cursor-pointer ${
              activeProfileId === p.id
                ? 'bg-brand-600 text-white shadow-sm'
                : 'bg-slate-100 dark:bg-slate-800/80 text-slate-600 dark:text-slate-300 hover:bg-slate-200 dark:hover:bg-slate-700 border border-slate-200 dark:border-slate-700/80'
            }`}
          >
            {p.name}
          </button>
        ))}
      </div>

      <div className="overflow-x-auto rounded-xl border border-slate-200 dark:border-slate-800 max-h-[460px]">
        <table className="w-full text-left text-sm text-slate-600 dark:text-slate-300 relative">
          <thead className="bg-slate-50 dark:bg-slate-950/80 text-slate-700 dark:text-slate-200 font-bold uppercase text-[11px] tracking-wider sticky top-0 shadow-sm backdrop-blur-md">
            <tr>
              <th className="px-4 py-3 whitespace-nowrap">Order Quantity (Q)</th>
              <th className="px-4 py-3 text-right whitespace-nowrap">Annual Freight Spend</th>
              <th className="px-4 py-3 text-right whitespace-nowrap">Annual Holding Cost</th>
              <th className="px-4 py-3 text-right whitespace-nowrap">Total Annual Cost</th>
            </tr>
          </thead>
          <tbody className="divide-y divide-slate-100 dark:divide-slate-800/80">
            {activeResult.costCurve.map((pt, idx) => {
              const isOptimal = pt.q === activeResult.optimalQ;
              return (
                <tr
                  key={idx}
                  className={`transition-colors ${
                    isOptimal
                      ? 'bg-emerald-50/80 dark:bg-emerald-950/25 font-semibold text-emerald-900 dark:text-emerald-200'
                      : 'hover:bg-slate-50 dark:hover:bg-slate-800/40'
                  }`}
                >
                  <td className="px-4 py-2.5 tabular-nums font-medium">
                    <span className="font-bold">{pt.q.toLocaleString()}</span>
                    {isOptimal && (
                      <span className="ml-2 inline-flex items-center gap-1 text-[10px] font-bold bg-emerald-600 text-white px-2 py-0.5 rounded-full uppercase tracking-wider">
                        <CheckCircle2 size={10} /> Optimal EOQ
                      </span>
                    )}
                  </td>
                  <td className="px-4 py-2.5 text-right tabular-nums">{formatCurrency(pt.shippingCost)}</td>
                  <td className="px-4 py-2.5 text-right tabular-nums">{formatCurrency(pt.holdingCost)}</td>
                  <td
                    className={`px-4 py-2.5 text-right tabular-nums font-bold ${
                      isOptimal ? 'text-emerald-700 dark:text-emerald-400 text-base' : 'text-slate-900 dark:text-slate-100'
                    }`}
                  >
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
