import React from 'react';
import { useScenario } from '../context/ScenarioContext';
import { Sliders } from 'lucide-react';

export const SensitivitySlider: React.FC = () => {
  const { demandMultiplier, setDemandMultiplier } = useScenario();

  return (
    <div className="bg-white dark:bg-slate-900 p-6 rounded-2xl border border-slate-200/80 dark:border-slate-800 shadow-sm transition-colors mt-6">
      <div className="flex items-center gap-2 mb-2">
        <div className="p-1.5 rounded-lg bg-amber-50 dark:bg-amber-950/60 text-amber-600 dark:text-amber-400">
          <Sliders size={18} />
        </div>
        <div>
          <h2 className="text-base font-bold text-slate-900 dark:text-slate-100 tracking-tight">
            Sensitivity Analysis (&plusmn;50% Demand)
          </h2>
          <p className="text-xs text-slate-500 dark:text-slate-400">
            Simulate demand shocks to test policy resilience
          </p>
        </div>
      </div>

      <div className="flex items-center gap-4 mt-5">
        <span className="text-xs font-bold text-slate-500 dark:text-slate-400 w-10 text-right tabular-nums">-50%</span>
        <input
          type="range"
          min="0.5"
          max="1.5"
          step="0.05"
          value={demandMultiplier}
          onChange={(e) => setDemandMultiplier(parseFloat(e.target.value))}
          className="w-full h-2 bg-slate-200 rounded-lg appearance-none cursor-pointer dark:bg-slate-800 accent-brand-500"
        />
        <span className="text-xs font-bold text-slate-500 dark:text-slate-400 w-10 text-left tabular-nums">+50%</span>
      </div>

      <div className="text-center mt-4 flex items-center justify-center gap-3">
        <span className="inline-flex items-center px-3 py-1 bg-brand-50 dark:bg-brand-950/60 text-brand-700 dark:text-brand-300 font-bold rounded-full text-xs border border-brand-200/60 dark:border-brand-800/60 tabular-nums">
          Multiplier: {(demandMultiplier * 100).toFixed(0)}% ({demandMultiplier >= 1 ? `+${((demandMultiplier - 1) * 100).toFixed(0)}%` : `-${((1 - demandMultiplier) * 100).toFixed(0)}%`})
        </span>
        {demandMultiplier !== 1 && (
          <button
            onClick={() => setDemandMultiplier(1)}
            className="text-xs font-semibold text-slate-500 hover:text-slate-800 dark:text-slate-400 dark:hover:text-slate-200 transition-colors underline cursor-pointer"
          >
            Reset
          </button>
        )}
      </div>
    </div>
  );
};
