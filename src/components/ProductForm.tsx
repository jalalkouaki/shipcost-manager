import React, { useState } from 'react';
import { useScenario } from '../context/ScenarioContext';
import type { VolumeTier } from '../types';
import { Box, Plus, Trash2, Tag, ChevronDown, ChevronUp } from 'lucide-react';
import { formatCurrency } from '../utils/format';

export const ProductForm: React.FC = () => {
  const { activeScenario, updateActiveScenario, demandMultiplier, settings } = useScenario();
  const [showTiers, setShowTiers] = useState(false);

  if (!activeScenario) return null;

  const { product } = activeScenario;
  const priceBreaks: VolumeTier[] = product.priceBreaks || [];

  const handleChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const { name, value } = e.target;
    let val = parseFloat(value);

    // Treat empty string as 0 for calculation but allow empty state in UI visually
    if (isNaN(val)) val = 0;
    if (val < 0) val = 0;

    if (name === 'dutyRate' && val > 500) val = 500;

    if (name === 'annualDemand' || name === 'safetyStock') {
      val = Math.round(val);
    }

    updateActiveScenario({
      ...activeScenario,
      product: {
        ...product,
        [name]: value === '' ? 0 : val
      }
    });
  };

  const addPriceTier = () => {
    const highestMin = priceBreaks.length > 0 ? Math.max(...priceBreaks.map(t => t.minQty)) : 1000;
    const lastCost = priceBreaks.length > 0 ? priceBreaks[priceBreaks.length - 1].unitCost : product.unitCost;
    const newTier: VolumeTier = {
      minQty: highestMin + 2000,
      unitCost: Math.max(0.01, Math.round(lastCost * 0.9 * 100) / 100)
    };
    updateActiveScenario({
      ...activeScenario,
      product: {
        ...product,
        priceBreaks: [...priceBreaks, newTier].sort((a, b) => a.minQty - b.minQty)
      }
    });
  };

  const removePriceTier = (index: number) => {
    const updated = priceBreaks.filter((_, i) => i !== index);
    updateActiveScenario({
      ...activeScenario,
      product: {
        ...product,
        priceBreaks: updated
      }
    });
  };

  const updatePriceTier = (index: number, updates: Partial<VolumeTier>) => {
    const updated = priceBreaks.map((tier, i) => (i === index ? { ...tier, ...updates } : tier));
    updateActiveScenario({
      ...activeScenario,
      product: {
        ...product,
        priceBreaks: updated
      }
    });
  };

  const isDemandAdjusted = demandMultiplier !== 1;
  const adjustedDemand = Math.round(product.annualDemand * demandMultiplier);

  const inputClass =
    "w-full px-3.5 py-2.5 border border-slate-200 dark:border-slate-700/80 rounded-xl bg-slate-50/60 dark:bg-slate-950/60 text-slate-900 dark:text-slate-100 placeholder:text-slate-400 focus:outline-none focus:ring-2 focus:ring-brand-500/20 focus:border-brand-500 transition-all text-sm font-semibold tabular-nums";

  return (
    <div className="bg-white dark:bg-slate-900 p-6 rounded-2xl border border-slate-200/80 dark:border-slate-800 shadow-sm transition-colors">
      <div className="flex items-center gap-2 mb-4">
        <div className="p-1.5 rounded-lg bg-brand-50 dark:bg-brand-950/60 text-brand-600 dark:text-brand-400">
          <Box size={18} />
        </div>
        <div>
          <h2 className="text-base font-bold text-slate-900 dark:text-slate-100 tracking-tight">
            Product & Inventory Baseline
          </h2>
          <p className="text-xs text-slate-500 dark:text-slate-400">
            Define SKU financials, import tariffs, and carrying rates
          </p>
        </div>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
        <div>
          <label className="block text-xs font-semibold text-slate-600 dark:text-slate-300 mb-1.5 uppercase tracking-wider">
            Base Unit Cost ({settings.currency})
          </label>
          <input
            type="number"
            name="unitCost"
            min="0"
            step="0.01"
            value={product.unitCost === 0 ? '' : product.unitCost}
            onChange={handleChange}
            placeholder="0.00"
            className={inputClass}
          />
        </div>

        <div>
          <label className="block text-xs font-semibold text-slate-600 dark:text-slate-300 mb-1.5 uppercase tracking-wider">
            Import Tariff (%)
          </label>
          <input
            type="number"
            name="dutyRate"
            min="0"
            max="500"
            step="0.1"
            value={product.dutyRate === 0 ? '' : product.dutyRate}
            onChange={handleChange}
            placeholder="0.0"
            className={inputClass}
          />
        </div>

        <div>
          <label className="block text-xs font-semibold text-slate-600 dark:text-slate-300 mb-1.5 flex items-center justify-between uppercase tracking-wider">
            <span>Annual Demand</span>
            {isDemandAdjusted && (
              <span className="text-[11px] text-amber-600 dark:text-amber-400 font-bold">
                evaluating: {adjustedDemand.toLocaleString()}
              </span>
            )}
          </label>
          <input
            type="number"
            name="annualDemand"
            min="0"
            step="1"
            value={product.annualDemand === 0 ? '' : product.annualDemand}
            onChange={handleChange}
            placeholder="e.g. 10,000"
            className={`${inputClass} ${isDemandAdjusted ? 'border-amber-500 dark:border-amber-500 ring-1 ring-amber-500/20' : ''}`}
          />
        </div>

        <div>
          <label className="block text-xs font-semibold text-slate-600 dark:text-slate-300 mb-1.5 uppercase tracking-wider">
            Holding Rate (% / yr)
          </label>
          <input
            type="number"
            name="holdingRate"
            min="0"
            max="100"
            step="0.1"
            value={product.holdingRate === 0 ? '' : product.holdingRate}
            onChange={handleChange}
            placeholder="e.g. 20.0"
            className={inputClass}
          />
        </div>

        <div>
          <label className="block text-xs font-semibold text-slate-600 dark:text-slate-300 mb-1.5 uppercase tracking-wider">
            Safety Stock Buffer (Units)
          </label>
          <input
            type="number"
            name="safetyStock"
            min="0"
            step="1"
            value={product.safetyStock === 0 ? '' : product.safetyStock}
            onChange={handleChange}
            placeholder="e.g. 500"
            className={inputClass}
          />
        </div>

        <div>
          <label className="block text-xs font-semibold text-slate-600 dark:text-slate-300 mb-1.5 uppercase tracking-wider">
            Unit Weight (kg)
          </label>
          <input
            type="number"
            name="weightKg"
            min="0.01"
            step="0.1"
            value={product.weightKg || 2.0}
            onChange={handleChange}
            placeholder="2.0"
            className={inputClass}
          />
        </div>
      </div>

      <div className="mt-5 pt-4 border-t border-slate-100 dark:border-slate-800">
        <button
          type="button"
          onClick={() => setShowTiers(!showTiers)}
          className="w-full flex items-center justify-between text-xs font-bold text-slate-700 dark:text-slate-300 hover:text-brand-600 dark:hover:text-brand-400 py-1 transition-colors cursor-pointer"
        >
          <span className="flex items-center gap-1.5 uppercase tracking-wider">
            <Tag size={13} className="text-emerald-500" />
            Supplier Tiered Volume Discounts ({priceBreaks.length} brackets)
          </span>
          {showTiers ? <ChevronUp size={16} /> : <ChevronDown size={16} />}
        </button>

        {showTiers && (
          <div className="mt-3 space-y-3 bg-slate-50/80 dark:bg-slate-950/60 p-3.5 rounded-xl border border-slate-200/80 dark:border-slate-800 animate-in fade-in duration-150">
            <div className="flex justify-between items-center text-xs">
              <span className="text-slate-500 dark:text-slate-400">
                Define price discounts triggered at specific order quantities:
              </span>
              <button
                type="button"
                onClick={addPriceTier}
                className="flex items-center gap-1 text-[11px] font-bold px-2 py-1 bg-emerald-600 hover:bg-emerald-700 text-white rounded-lg transition-colors cursor-pointer"
              >
                <Plus size={12} /> Add Tier
              </button>
            </div>

            {priceBreaks.length === 0 ? (
              <p className="text-xs text-slate-400 italic text-center py-2">
                No quantity price tiers active. The base cost of {formatCurrency(product.unitCost, settings.currency)} applies across all quantities.
              </p>
            ) : (
              <div className="space-y-2">
                {priceBreaks.map((tier, idx) => (
                  <div key={idx} className="flex items-center gap-2 text-xs">
                    <span className="text-slate-500 font-medium w-16">Min Qty:</span>
                    <input
                      type="number"
                      min="1"
                      step="50"
                      value={tier.minQty}
                      onChange={(e) => updatePriceTier(idx, { minQty: Math.max(1, parseInt(e.target.value) || 1) })}
                      className="w-24 px-2 py-1 bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-700 rounded-lg text-slate-900 dark:text-slate-100 font-bold tabular-nums"
                    />
                    <span className="text-slate-500 font-medium">units &rarr; Cost:</span>
                    <input
                      type="number"
                      min="0.01"
                      step="0.05"
                      value={tier.unitCost}
                      onChange={(e) => updatePriceTier(idx, { unitCost: Math.max(0.01, parseFloat(e.target.value) || 0) })}
                      className="w-20 px-2 py-1 bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-700 rounded-lg text-slate-900 dark:text-slate-100 font-bold tabular-nums"
                    />
                    <button
                      type="button"
                      onClick={() => removePriceTier(idx)}
                      className="text-slate-400 hover:text-red-500 p-1 transition-colors cursor-pointer ml-auto"
                    >
                      <Trash2 size={14} />
                    </button>
                  </div>
                ))}
              </div>
            )}
          </div>
        )}
      </div>
    </div>
  );
};
