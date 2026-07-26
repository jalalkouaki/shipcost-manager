import React from 'react';
import { useScenario } from '../context/ScenarioContext';

export const SensitivitySlider: React.FC = () => {
  const { demandMultiplier, setDemandMultiplier } = useScenario();

  return (
    <div className="bg-white dark:bg-slate-800 p-6 rounded-xl border border-slate-200 dark:border-slate-700 shadow-sm transition-colors mt-6">
      <h2 className="text-xl font-semibold mb-2 text-slate-900 dark:text-white">Sensitivity Analysis ("What-If")</h2>
      <p className="text-sm text-slate-500 dark:text-slate-400 mb-6">
        Adjust the annual demand by ±50% to see how the optimal shipping strategy changes without affecting the saved scenario.
      </p>
      
      <div className="flex items-center gap-4">
        <span className="text-sm font-medium text-slate-600 dark:text-slate-300 w-12 text-right">-50%</span>
        <input
          type="range"
          min="0.5"
          max="1.5"
          step="0.05"
          value={demandMultiplier}
          onChange={(e) => setDemandMultiplier(parseFloat(e.target.value))}
          className="w-full h-2 bg-slate-200 rounded-lg appearance-none cursor-pointer dark:bg-slate-700 accent-brand-500"
        />
        <span className="text-sm font-medium text-slate-600 dark:text-slate-300 w-12 text-left">+50%</span>
      </div>
      
      <div className="text-center mt-4 flex items-center justify-center gap-4">
        <span className="inline-block px-3 py-1 bg-brand-50 dark:bg-indigo-500/10 text-brand-600 dark:text-indigo-400 font-semibold rounded-full text-sm border border-brand-200 dark:border-indigo-500/20">
          Current Multiplier: {(demandMultiplier * 100).toFixed(0)}%
        </span>
        {demandMultiplier !== 1 && (
          <button 
            onClick={() => setDemandMultiplier(1)}
            className="text-sm text-slate-500 hover:text-slate-700 dark:text-slate-400 dark:hover:text-slate-200 transition-colors underline cursor-pointer"
          >
            Reset
          </button>
        )}
      </div>
    </div>
  );
};
