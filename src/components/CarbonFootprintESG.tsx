import React from 'react';
import { useScenario } from '../context/ScenarioContext';
import { Leaf, Award, Trees, Info } from 'lucide-react';

export const CarbonFootprintESG: React.FC = () => {
  const { activeScenario, results, isAnalysisFresh } = useScenario();

  if (!activeScenario || !isAnalysisFresh || Object.keys(results).length === 0) return null;

  return (
    <div className="bg-white dark:bg-slate-900 p-6 rounded-2xl border border-slate-200/80 dark:border-slate-800 shadow-sm transition-colors mt-8">
      <div className="flex items-center gap-2 mb-2">
        <div className="p-1.5 rounded-lg bg-emerald-50 dark:bg-emerald-950/60 text-emerald-600 dark:text-emerald-400">
          <Leaf size={18} />
        </div>
        <div>
          <h3 className="text-base font-bold text-slate-900 dark:text-slate-100 tracking-tight">
            Scope 3 Transport Carbon Footprint & ESG Analysis
          </h3>
          <p className="text-xs text-slate-500 dark:text-slate-400">
            GLEC framework greenhouse gas emissions per order & annual corporate sustainability score
          </p>
        </div>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-3 gap-4 mt-5">
        {activeScenario.profiles.map(p => {
          const res = results[p.id];
          if (!res || !res.carbon) return null;
          const c = res.carbon;

          // Trees needed to offset annual emissions (~21 kg CO2 absorbed per tree per year)
          const treesNeeded = Math.round((c.annualCo2MetricTons * 1000) / 21);

          return (
            <div
              key={p.id}
              className="p-5 rounded-2xl border border-slate-200/80 dark:border-slate-800 bg-slate-50/60 dark:bg-slate-950/50 flex flex-col justify-between"
            >
              <div>
                <div className="flex justify-between items-start mb-3">
                  <div>
                    <h4 className="font-bold text-sm text-slate-900 dark:text-slate-100">{p.name}</h4>
                    <span className="text-[10px] font-bold text-slate-500 dark:text-slate-400 uppercase tracking-wider">
                      {p.type} Freight &bull; {p.distanceKm || 11000} km
                    </span>
                  </div>

                  <div className="flex items-center gap-1.5 bg-emerald-100 dark:bg-emerald-950/80 text-emerald-700 dark:text-emerald-300 font-extrabold text-xs px-2.5 py-1 rounded-lg border border-emerald-200/80 dark:border-emerald-800/60">
                    <Award size={13} />
                    <span>Rating: {c.emissionRating}</span>
                  </div>
                </div>

                <div className="grid grid-cols-2 gap-3 my-4">
                  <div className="p-3 bg-white dark:bg-slate-900 rounded-xl border border-slate-100 dark:border-slate-800/80">
                    <span className="text-[10px] font-semibold text-slate-400 uppercase tracking-wider block mb-0.5">
                      Per Shipment
                    </span>
                    <span className="text-base font-extrabold text-slate-900 dark:text-slate-100 tabular-nums">
                      {c.co2PerShipmentKg.toLocaleString()}{' '}
                      <span className="text-xs font-normal text-slate-500">kg CO₂e</span>
                    </span>
                  </div>

                  <div className="p-3 bg-white dark:bg-slate-900 rounded-xl border border-slate-100 dark:border-slate-800/80">
                    <span className="text-[10px] font-semibold text-slate-400 uppercase tracking-wider block mb-0.5">
                      Annual Total
                    </span>
                    <span className="text-base font-extrabold text-emerald-600 dark:text-emerald-400 tabular-nums">
                      {c.annualCo2MetricTons.toFixed(2)}{' '}
                      <span className="text-xs font-normal text-slate-500">Tons</span>
                    </span>
                  </div>
                </div>
              </div>

              <div className="pt-3 border-t border-slate-200/50 dark:border-slate-800/60 flex items-center justify-between text-xs text-slate-600 dark:text-slate-400">
                <span className="flex items-center gap-1.5">
                  <Trees size={14} className="text-emerald-500" /> Tree Offset:
                </span>
                <span className="font-bold text-slate-800 dark:text-slate-200 tabular-nums">
                  ~{treesNeeded.toLocaleString()} seedlings / yr
                </span>
              </div>
            </div>
          );
        })}
      </div>

      <div className="mt-4 p-3 bg-slate-50 dark:bg-slate-950/40 rounded-xl border border-slate-200/60 dark:border-slate-800 text-xs text-slate-500 dark:text-slate-400 flex items-center gap-2">
        <Info size={14} className="shrink-0 text-slate-400" />
        <span>
          GLEC-compliant Scope 3 emissions factors: Ocean FCL (~0.012 kg CO₂e/ton-km), Ocean LCL (~0.018 kg CO₂e/ton-km).
          Integrated with corporate CSRD sustainability disclosures.
        </span>
      </div>
    </div>
  );
};
