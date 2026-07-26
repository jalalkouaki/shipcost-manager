import React from 'react';
import { useScenario } from '../context/ScenarioContext';

export const ProductForm: React.FC = () => {
  const { activeScenario, updateActiveScenario, demandMultiplier, settings } = useScenario();

  if (!activeScenario) return null;

  const { product } = activeScenario;

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
        [name]: value === '' ? 0 : val // We store 0 internally if cleared
      }
    });
  };

  const isDemandAdjusted = demandMultiplier !== 1;
  const adjustedDemand = Math.round(product.annualDemand * demandMultiplier);
  const landedCost = product.unitCost * (1 + (product.dutyRate || 0) / 100);

  return (
    <div className="bg-white dark:bg-slate-800 p-6 rounded-xl border border-slate-200 dark:border-slate-700 shadow-sm transition-colors">
      <h2 className="text-xl font-semibold mb-4 text-slate-900 dark:text-white">Product Parameters</h2>
      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
        <div>
          <label className="block text-sm font-medium text-slate-700 dark:text-slate-300 mb-1">Unit Cost ({settings.currency})</label>
          <input
            type="number"
            name="unitCost"
            min="0"
            step="0.01"
            value={product.unitCost === 0 ? '' : product.unitCost}
            onChange={handleChange}
            className="w-full px-3 py-2 border border-slate-300 dark:border-slate-600 rounded-md bg-transparent text-slate-900 dark:text-white focus:outline-none focus:ring-2 focus:ring-brand-500"
          />
        </div>
        <div>
          <label className="block text-sm font-medium text-slate-700 dark:text-slate-300 mb-1 flex items-center justify-between">
            <span>Import Duty / Tariff (%)</span>
            {product.unitCost > 0 && (
              <span className="text-xs text-brand-600 dark:text-indigo-400 font-medium">
                Landed: {settings.currency}{landedCost.toFixed(2)}
              </span>
            )}
          </label>
          <input
            type="number"
            name="dutyRate"
            min="0"
            max="500"
            step="0.1"
            value={product.dutyRate === 0 ? '' : product.dutyRate}
            onChange={handleChange}
            placeholder="0"
            className="w-full px-3 py-2 border border-slate-300 dark:border-slate-600 rounded-md bg-transparent text-slate-900 dark:text-white focus:outline-none focus:ring-2 focus:ring-brand-500"
          />
        </div>
        <div>
          <label className="block text-sm font-medium text-slate-700 dark:text-slate-300 mb-1 flex items-center justify-between">
            <span>Annual Demand (Units)</span>
            {isDemandAdjusted && (
              <span className="text-xs text-amber-600 dark:text-amber-400 font-medium">
                Evaluating: {adjustedDemand.toLocaleString()}
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
            className={`w-full px-3 py-2 border rounded-md bg-transparent text-slate-900 dark:text-white focus:outline-none focus:ring-2 focus:ring-brand-500 ${isDemandAdjusted ? 'border-amber-500 dark:border-amber-500' : 'border-slate-300 dark:border-slate-600'}`}
          />
        </div>
        <div>
          <label className="block text-sm font-medium text-slate-700 dark:text-slate-300 mb-1">Holding Rate (%)</label>
          <input
            type="number"
            name="holdingRate"
            min="0"
            max="100"
            step="0.1"
            value={product.holdingRate === 0 ? '' : product.holdingRate}
            onChange={handleChange}
            className="w-full px-3 py-2 border border-slate-300 dark:border-slate-600 rounded-md bg-transparent text-slate-900 dark:text-white focus:outline-none focus:ring-2 focus:ring-brand-500"
          />
        </div>
        <div className="md:col-span-2">
          <label className="block text-sm font-medium text-slate-700 dark:text-slate-300 mb-1">Safety Stock (Units)</label>
          <input
            type="number"
            name="safetyStock"
            min="0"
            step="1"
            value={product.safetyStock === 0 ? '' : product.safetyStock}
            onChange={handleChange}
            className="w-full px-3 py-2 border border-slate-300 dark:border-slate-600 rounded-md bg-transparent text-slate-900 dark:text-white focus:outline-none focus:ring-2 focus:ring-brand-500"
          />
        </div>
      </div>
    </div>
  );
};
