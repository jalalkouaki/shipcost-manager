import React from 'react';
import { useScenario } from '../context/ScenarioContext';
import { Play, CheckCircle2, AlertCircle, RefreshCw } from 'lucide-react';

export const RunAnalysisButton: React.FC = () => {
  const { activeScenario, isAnalysisFresh, runAnalysis } = useScenario();

  if (!activeScenario) return null;

  const { product, profiles } = activeScenario;

  // Validation logic
  let isValid = true;
  let invalidReason = '';

  if (product.unitCost <= 0) { isValid = false; invalidReason = 'Unit cost must be > 0'; }
  else if (product.annualDemand <= 0) { isValid = false; invalidReason = 'Annual demand must be > 0'; }
  else if (product.holdingRate <= 0) { isValid = false; invalidReason = 'Holding rate must be > 0'; }
  else if (profiles.length === 0) { isValid = false; invalidReason = 'Add at least one shipping profile'; }
  else {
    for (const p of profiles) {
      if (p.type === 'fcl' && (p as any).capacity <= 0) {
        isValid = false;
        invalidReason = `FCL Profile "${p.name}" must have capacity > 0`;
        break;
      }
    }
  }

  return (
    <div className="bg-white dark:bg-slate-900 p-5 rounded-2xl border border-slate-200/80 dark:border-slate-800 shadow-sm transition-colors mt-6 flex flex-col items-center justify-center relative">
      <button
        onClick={runAnalysis}
        disabled={!isValid}
        className={`w-full flex items-center justify-center gap-2.5 py-3.5 px-6 rounded-xl font-bold text-sm transition-all cursor-pointer ${
          !isValid
            ? 'bg-slate-100 dark:bg-slate-800 text-slate-400 dark:text-slate-600 cursor-not-allowed border border-slate-200 dark:border-slate-800 shadow-none'
            : isAnalysisFresh
            ? 'bg-slate-100 hover:bg-slate-200 dark:bg-slate-800 dark:hover:bg-slate-700 text-slate-700 dark:text-slate-200 border border-slate-200 dark:border-slate-700'
            : 'bg-gradient-to-r from-brand-600 to-blue-600 hover:from-brand-700 hover:to-blue-700 text-white shadow-lg shadow-brand-500/25 hover:-translate-y-0.5 active:translate-y-0'
        }`}
      >
        {isAnalysisFresh ? (
          <>
            <CheckCircle2 size={18} className="text-emerald-500" />
            <span>Analysis Up to Date (Re-run)</span>
          </>
        ) : (
          <>
            <Play size={18} fill="currentColor" />
            <span>Run EOQ Optimization</span>
          </>
        )}
      </button>

      {!isValid && (
        <div className="mt-3 flex items-center justify-center gap-1.5 text-red-500 dark:text-red-400 text-xs font-semibold">
          <AlertCircle size={15} />
          {invalidReason}
        </div>
      )}

      {isValid && !isAnalysisFresh && (
        <div className="mt-3 flex items-center justify-center gap-1.5 text-brand-600 dark:text-brand-400 text-xs font-semibold">
          <RefreshCw size={13} className="animate-spin" />
          Parameters changed &bull; Ready to recalculate
        </div>
      )}
    </div>
  );
};
