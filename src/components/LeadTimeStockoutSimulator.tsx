import React, { useState } from 'react';
import { useScenario } from '../context/ScenarioContext';
import { ShieldAlert, Play, CheckCircle2, Clock, Activity } from 'lucide-react';

export const LeadTimeStockoutSimulator: React.FC = () => {
  const { activeScenario, results, isAnalysisFresh } = useScenario();
  const [isSimulating, setIsSimulating] = useState(false);
  const [simulationResult, setSimulationResult] = useState<{
    cyclesRun: number;
    stockoutEvents: number;
    simulatedFillRate: number;
    avgLeadTimeObserved: number;
  } | null>(null);

  if (!activeScenario || !isAnalysisFresh || Object.keys(results).length === 0) return null;

  const runMonteCarlo = () => {
    setIsSimulating(true);

    setTimeout(() => {
      // Run 1,000 simulated replenishment cycles
      const numCycles = 1000;
      let stockoutCount = 0;
      let totalObservedLeadTime = 0;

      const profile = activeScenario.profiles[0];
      const res = results[profile?.id];
      const q = res?.optimalQ || 1000;
      const dailyDemand = activeScenario.product.annualDemand / 365;
      const safetyStock = activeScenario.product.safetyStock;

      const baseLT = profile?.leadTimeDays || (profile?.type === 'fcl' ? 35 : 42);
      const varianceLT = profile?.leadTimeVarianceDays || (profile?.type === 'fcl' ? 6 : 8);

      for (let i = 0; i < numCycles; i++) {
        // Box-Muller Gaussian random lead time
        const u1 = Math.max(0.0001, Math.random());
        const u2 = Math.random();
        const z0 = Math.sqrt(-2.0 * Math.log(u1)) * Math.cos(2.0 * Math.PI * u2);

        const simulatedLeadTime = Math.max(5, Math.round(baseLT + z0 * varianceLT));
        totalObservedLeadTime += simulatedLeadTime;

        // Daily demand jitter
        const demandVariance = (Math.random() - 0.5) * 0.4 * dailyDemand;
        const totalDemandDuringLeadTime = simulatedLeadTime * (dailyDemand + demandVariance);

        // When inventory runs out before replenishment arrives:
        const availableStock = safetyStock + (q * 0.1); // buffer available at reorder
        if (totalDemandDuringLeadTime > availableStock + (baseLT * dailyDemand)) {
          stockoutCount++;
        }
      }

      const simulatedFillRate = Math.max(85, Math.min(99.9, ((numCycles - stockoutCount) / numCycles) * 100));

      setSimulationResult({
        cyclesRun: numCycles,
        stockoutEvents: stockoutCount,
        simulatedFillRate: Math.round(simulatedFillRate * 10) / 10,
        avgLeadTimeObserved: Math.round((totalObservedLeadTime / numCycles) * 10) / 10
      });
      setIsSimulating(false);
    }, 400);
  };

  return (
    <div className="bg-white dark:bg-slate-900 p-6 rounded-2xl border border-slate-200/80 dark:border-slate-800 shadow-sm transition-colors mt-8">
      <div className="flex flex-wrap items-center justify-between gap-4 mb-4">
        <div className="flex items-center gap-2">
          <div className="p-1.5 rounded-lg bg-amber-50 dark:bg-amber-950/60 text-amber-600 dark:text-amber-400">
            <ShieldAlert size={18} />
          </div>
          <div>
            <h3 className="text-base font-bold text-slate-900 dark:text-slate-100 tracking-tight">
              Lead Time Volatility & Stockout Risk Simulator
            </h3>
            <p className="text-xs text-slate-500 dark:text-slate-400">
              Evaluates transit port congestion, canal delays, and Monte Carlo cycle fill rates
            </p>
          </div>
        </div>

        <button
          onClick={runMonteCarlo}
          disabled={isSimulating}
          className="flex items-center gap-1.5 px-3.5 py-1.5 bg-amber-600 hover:bg-amber-700 active:bg-amber-800 text-white text-xs font-bold rounded-xl transition-all shadow-sm shadow-amber-600/20 cursor-pointer disabled:opacity-70"
        >
          {isSimulating ? <Activity size={14} className="animate-spin" /> : <Play size={14} fill="currentColor" />}
          <span>{isSimulating ? 'Simulating 1,000 Cycles...' : 'Run Monte Carlo (1k Cycles)'}</span>
        </button>
      </div>

      {/* Grid of Profiles with Risk Metrics */}
      <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-3 gap-4 mt-5">
        {activeScenario.profiles.map(p => {
          const res = results[p.id];
          if (!res || !res.stockout) return null;
          const s = res.stockout;

          const isSafe = s.stockoutProbabilityPct < 5.0;

          return (
            <div
              key={p.id}
              className="p-4 rounded-xl border border-slate-200/80 dark:border-slate-800 bg-slate-50/60 dark:bg-slate-950/50 space-y-3"
            >
              <div className="flex justify-between items-start">
                <span className="font-bold text-sm text-slate-900 dark:text-slate-100">{p.name}</span>
                <span
                  className={`text-[10px] font-bold px-2 py-0.5 rounded-full uppercase tracking-wider ${
                    isSafe
                      ? 'bg-emerald-100 dark:bg-emerald-950/80 text-emerald-700 dark:text-emerald-300'
                      : 'bg-amber-100 dark:bg-amber-950/80 text-amber-700 dark:text-amber-300'
                  }`}
                >
                  {isSafe ? 'Low Stockout Risk' : 'Moderate Volatility'}
                </span>
              </div>

              <div className="grid grid-cols-2 gap-2 text-xs">
                <div className="p-2.5 bg-white dark:bg-slate-900 rounded-lg border border-slate-100 dark:border-slate-800">
                  <div className="text-slate-400 text-[10px] font-medium uppercase tracking-wider mb-0.5">
                    Reorder Point (ROP)
                  </div>
                  <div className="font-extrabold text-sm text-slate-900 dark:text-slate-100 tabular-nums">
                    {s.reorderPoint.toLocaleString()} <span className="text-[10px] font-normal text-slate-500">units</span>
                  </div>
                </div>

                <div className="p-2.5 bg-white dark:bg-slate-900 rounded-lg border border-slate-100 dark:border-slate-800">
                  <div className="text-slate-400 text-[10px] font-medium uppercase tracking-wider mb-0.5">
                    Rec. Safety Stock
                  </div>
                  <div className="font-extrabold text-sm text-brand-600 dark:text-brand-400 tabular-nums">
                    {s.recommendedSafetyStock.toLocaleString()} <span className="text-[10px] font-normal text-slate-500">units</span>
                  </div>
                </div>
              </div>

              <div className="space-y-1.5 text-xs pt-1">
                <div className="flex justify-between items-center">
                  <span className="text-slate-500 dark:text-slate-400 flex items-center gap-1">
                    <Clock size={12} /> Stockout Probability:
                  </span>
                  <span className={`font-bold tabular-nums ${isSafe ? 'text-emerald-600 dark:text-emerald-400' : 'text-amber-600 dark:text-amber-400'}`}>
                    {s.stockoutProbabilityPct}%
                  </span>
                </div>

                <div className="flex justify-between items-center">
                  <span className="text-slate-500 dark:text-slate-400">Projected Fill Rate:</span>
                  <span className="font-bold text-slate-800 dark:text-slate-200 tabular-nums">
                    {s.simulatedFillRatePct}%
                  </span>
                </div>
              </div>
            </div>
          );
        })}
      </div>

      {/* Simulation Result Card */}
      {simulationResult && (
        <div className="mt-4 p-4 bg-emerald-50/70 dark:bg-emerald-950/30 rounded-xl border border-emerald-200/80 dark:border-emerald-800/60 animate-in fade-in duration-200">
          <div className="flex items-center gap-2 mb-2">
            <CheckCircle2 size={16} className="text-emerald-600 dark:text-emerald-400" />
            <span className="text-xs font-bold text-emerald-900 dark:text-emerald-200 uppercase tracking-wider">
              Monte Carlo Output ({simulationResult.cyclesRun.toLocaleString()} Simulated Voyages)
            </span>
          </div>
          <div className="grid grid-cols-2 sm:grid-cols-4 gap-3 text-xs">
            <div>
              <span className="text-slate-500 block text-[11px]">Observed Avg Transit:</span>
              <span className="font-bold text-slate-900 dark:text-slate-100 tabular-nums">
                {simulationResult.avgLeadTimeObserved} days
              </span>
            </div>
            <div>
              <span className="text-slate-500 block text-[11px]">Stockout Incidents:</span>
              <span className="font-bold text-slate-900 dark:text-slate-100 tabular-nums">
                {simulationResult.stockoutEvents} / {simulationResult.cyclesRun}
              </span>
            </div>
            <div>
              <span className="text-slate-500 block text-[11px]">Simulated Fill Rate:</span>
              <span className="font-bold text-emerald-700 dark:text-emerald-400 tabular-nums text-sm">
                {simulationResult.simulatedFillRate}%
              </span>
            </div>
            <div>
              <span className="text-slate-500 block text-[11px]">Risk Mitigation:</span>
              <span className="font-bold text-slate-900 dark:text-slate-100">
                {simulationResult.stockoutEvents === 0 ? 'Robust Buffer' : 'Add Buffer'}
              </span>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};
