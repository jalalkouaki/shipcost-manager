import React from 'react';
import { useScenario } from '../context/ScenarioContext';
import { Play, CheckCircle2, AlertCircle } from 'lucide-react';

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
    <div className="bg-white dark:bg-slate-800 p-6 rounded-xl border border-slate-200 dark:border-slate-700 shadow-sm transition-colors mt-6 flex flex-col items-center justify-center relative">
      <button
        onClick={runAnalysis}
        disabled={!isValid || isAnalysisFresh}
        className={`w-full flex items-center justify-center gap-2 py-3 px-6 rounded-lg font-bold text-white transition-all shadow-md
          ${(!isValid || isAnalysisFresh) 
            ? 'bg-slate-400 dark:bg-slate-600 cursor-not-allowed opacity-80 shadow-none' 
            : 'bg-brand-500 hover:bg-brand-600 hover:-translate-y-0.5 active:translate-y-0 shadow-brand-500/25 cursor-pointer'
          }
        `}
      >
        {isAnalysisFresh ? <CheckCircle2 size={20} /> : <Play size={20} className={!isValid ? 'opacity-50' : ''} />}
        {isAnalysisFresh ? 'Analysis Complete' : 'Run Analysis'}
      </button>

      {!isValid && (
        <div className="mt-3 flex items-center justify-center gap-1.5 text-red-500 dark:text-red-400 text-sm font-medium">
          <AlertCircle size={16} />
          {invalidReason}
        </div>
      )}
      
      {isValid && !isAnalysisFresh && (
        <div className="mt-3 flex items-center justify-center gap-1.5 text-brand-600 dark:text-indigo-400 text-sm font-medium animate-pulse">
          <Play size={16} className="rotate-90" />
          Ready to analyze
        </div>
      )}
    </div>
  );
};
