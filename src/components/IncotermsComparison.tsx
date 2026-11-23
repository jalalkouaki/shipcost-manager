import React, { useState } from 'react';
import { useScenario } from '../context/ScenarioContext';
import { Landmark, CheckCircle2 } from 'lucide-react';
import { formatCurrency } from '../utils/format';

export const IncotermsComparison: React.FC = () => {
  const { activeScenario, results, isAnalysisFresh, settings } = useScenario();
  const [cifSupplierQuote, setCifSupplierQuote] = useState<number>(0);
  const [ddpSupplierQuote, setDdpSupplierQuote] = useState<number>(0);

  if (!activeScenario || !isAnalysisFresh || Object.keys(results).length === 0) return null;

  const currency = settings.currency || 'MAD';
  const bestProfile = activeScenario.profiles.reduce((best: any, p: any) => {
    const res = results[p.id];
    if (!res) return best;
    if (!best || res.minTotalCost < results[best.id]?.minTotalCost) return p;
    return best;
  }, null);

  const bestRes = bestProfile ? results[bestProfile.id] : null;
  const fobLandedUnitCost = bestRes?.effectiveLandedCost || 0;
  const annualDemand = activeScenario.product.annualDemand;

  // Initialize defaults if unset
  const effectiveCif = cifSupplierQuote > 0 ? cifSupplierQuote : Math.round(fobLandedUnitCost * 1.08 * 100) / 100;
  const effectiveDdp = ddpSupplierQuote > 0 ? ddpSupplierQuote : Math.round(fobLandedUnitCost * 1.15 * 100) / 100;

  const fobAnnualTotal = fobLandedUnitCost * annualDemand;
  const cifAnnualTotal = effectiveCif * annualDemand;
  const ddpAnnualTotal = effectiveDdp * annualDemand;

  const cifSavings = cifAnnualTotal - fobAnnualTotal;
  const ddpSavings = ddpAnnualTotal - fobAnnualTotal;

  return (
    <div className="bg-white dark:bg-slate-900 p-6 rounded-2xl border border-slate-200/80 dark:border-slate-800 shadow-sm transition-colors mt-8">
      <div className="flex items-center gap-2 mb-2">
        <div className="p-1.5 rounded-lg bg-blue-50 dark:bg-blue-950/60 text-blue-600 dark:text-blue-400">
          <Landmark size={18} />
        </div>
        <div>
          <h3 className="text-base font-bold text-slate-900 dark:text-slate-100 tracking-tight">
            Incoterms Strategic Decision Matrix (FOB vs. CIF vs. DDP)
          </h3>
          <p className="text-xs text-slate-500 dark:text-slate-400">
            Compare buyer-managed forwarder contracts against supplier all-inclusive freight quotes
          </p>
        </div>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-3 gap-4 mt-5">
        {/* FOB (Buyer Controlled - Optimal Mode) */}
        <div className="p-5 rounded-2xl border border-brand-500/80 dark:border-brand-500/60 bg-brand-50/20 dark:bg-brand-950/20 ring-1 ring-brand-500/30 flex flex-col justify-between">
          <div>
            <div className="flex justify-between items-center mb-3">
              <span className="text-xs font-bold px-2 py-0.5 rounded bg-brand-600 text-white uppercase tracking-wider">
                FOB &bull; BUYER CONTROLLED
              </span>
              <span className="text-[11px] font-bold text-emerald-600 dark:text-emerald-400">
                Self-Managed
              </span>
            </div>
            <h4 className="font-extrabold text-base text-slate-900 dark:text-slate-100 mb-1">
              FOB via {bestProfile?.name}
            </h4>
            <p className="text-xs text-slate-500 dark:text-slate-400 mb-4">
              Buyer arranges freight with forwarder. Full schedule and demurrage visibility.
            </p>

            <div className="space-y-2 text-xs">
              <div className="flex justify-between items-center">
                <span className="text-slate-500">Effective Landed Cost:</span>
                <span className="font-extrabold text-base text-brand-600 dark:text-brand-400 tabular-nums">
                  {formatCurrency(fobLandedUnitCost, currency)} / unit
                </span>
              </div>
              <div className="flex justify-between items-center pt-2 border-t border-brand-100 dark:border-brand-900/40">
                <span className="text-slate-500 font-medium">Total Landed Spend:</span>
                <span className="font-bold text-slate-900 dark:text-slate-100 tabular-nums">
                  {formatCurrency(fobAnnualTotal, currency)} / yr
                </span>
              </div>
            </div>
          </div>

          <div className="mt-4 pt-3 border-t border-brand-100 dark:border-brand-900/40 flex items-center gap-1.5 text-xs text-brand-700 dark:text-brand-300 font-bold">
            <CheckCircle2 size={14} className="text-brand-500" />
            Optimal logistics control & lowest cost
          </div>
        </div>

        {/* CIF (Supplier Arranged Ocean Freight) */}
        <div className="p-5 rounded-2xl border border-slate-200/80 dark:border-slate-800 bg-slate-50/60 dark:bg-slate-950/50 flex flex-col justify-between">
          <div>
            <div className="flex justify-between items-center mb-3">
              <span className="text-xs font-bold px-2 py-0.5 rounded bg-slate-200 dark:bg-slate-800 text-slate-700 dark:text-slate-300 uppercase tracking-wider">
                CIF &bull; PORT OF ENTRY
              </span>
            </div>
            <h4 className="font-extrabold text-base text-slate-900 dark:text-slate-100 mb-1">
              Supplier CIF Quote
            </h4>
            <p className="text-xs text-slate-500 dark:text-slate-400 mb-3">
              Supplier arranges ocean voyage and insurance to your destination port.
            </p>

            <div className="mb-3">
              <label className="block text-[11px] font-semibold text-slate-500 mb-1">
                Supplier CIF Quote / Unit ({currency}):
              </label>
              <input
                type="number"
                step="0.05"
                value={cifSupplierQuote || effectiveCif}
                onChange={(e) => setCifSupplierQuote(parseFloat(e.target.value) || 0)}
                className="w-full px-2.5 py-1.5 bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-700 rounded-lg text-xs font-bold tabular-nums"
              />
            </div>

            <div className="space-y-1.5 text-xs">
              <div className="flex justify-between items-center">
                <span className="text-slate-500">Total Landed Spend:</span>
                <span className="font-bold text-slate-900 dark:text-slate-100 tabular-nums">
                  {formatCurrency(cifAnnualTotal, currency)} / yr
                </span>
              </div>
              <div className="flex justify-between items-center text-red-500 font-semibold">
                <span>Supplier Markup vs FOB:</span>
                <span className="tabular-nums">
                  +{formatCurrency(Math.max(0, cifSavings), currency)}
                </span>
              </div>
            </div>
          </div>

          <div className="mt-4 pt-3 border-t border-slate-200/60 dark:border-slate-800/80 text-[11px] text-slate-500">
            {cifSavings > 0
              ? `Switching to FOB saves ${formatCurrency(cifSavings, currency)}/year`
              : 'CIF quote is competitive with FOB'}
          </div>
        </div>

        {/* DDP (Delivered Duty Paid - Full Supplier Turnkey) */}
        <div className="p-5 rounded-2xl border border-slate-200/80 dark:border-slate-800 bg-slate-50/60 dark:bg-slate-950/50 flex flex-col justify-between">
          <div>
            <div className="flex justify-between items-center mb-3">
              <span className="text-xs font-bold px-2 py-0.5 rounded bg-slate-200 dark:bg-slate-800 text-slate-700 dark:text-slate-300 uppercase tracking-wider">
                DDP &bull; DOOR-TO-DOOR
              </span>
            </div>
            <h4 className="font-extrabold text-base text-slate-900 dark:text-slate-100 mb-1">
              Supplier DDP Quote
            </h4>
            <p className="text-xs text-slate-500 dark:text-slate-400 mb-3">
              Turnkey supplier delivery: all tariffs, customs, and domestic drayage paid.
            </p>

            <div className="mb-3">
              <label className="block text-[11px] font-semibold text-slate-500 mb-1">
                Supplier DDP Quote / Unit ({currency}):
              </label>
              <input
                type="number"
                step="0.05"
                value={ddpSupplierQuote || effectiveDdp}
                onChange={(e) => setDdpSupplierQuote(parseFloat(e.target.value) || 0)}
                className="w-full px-2.5 py-1.5 bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-700 rounded-lg text-xs font-bold tabular-nums"
              />
            </div>

            <div className="space-y-1.5 text-xs">
              <div className="flex justify-between items-center">
                <span className="text-slate-500">Total Landed Spend:</span>
                <span className="font-bold text-slate-900 dark:text-slate-100 tabular-nums">
                  {formatCurrency(ddpAnnualTotal, currency)} / yr
                </span>
              </div>
              <div className="flex justify-between items-center text-red-500 font-semibold">
                <span>Supplier Convenience Markup:</span>
                <span className="tabular-nums">
                  +{formatCurrency(Math.max(0, ddpSavings), currency)}
                </span>
              </div>
            </div>
          </div>

          <div className="mt-4 pt-3 border-t border-slate-200/60 dark:border-slate-800/80 text-[11px] text-slate-500">
            {ddpSavings > 0
              ? `Managing your own freight saves ${formatCurrency(ddpSavings, currency)}/year`
              : 'DDP quote is cost-effective'}
          </div>
        </div>
      </div>
    </div>
  );
};
