import React, { useState } from 'react';
import { useScenario } from '../context/ScenarioContext';
import type { SkuItem } from '../types';
import { Boxes, Plus, Trash2, ChevronDown, ChevronUp, AlertTriangle, Scale } from 'lucide-react';

const CONTAINER_SPECS = {
  '20ft': { name: '20ft Standard Container', maxCbm: 33.2, maxWeightKg: 28000 },
  '40ft': { name: '40ft Standard Container', maxCbm: 67.7, maxWeightKg: 28800 },
  '40ft_hc': { name: '40ft High Cube Container', maxCbm: 76.2, maxWeightKg: 28600 }
};

export const MultiSkuConsolidation: React.FC = () => {
  const { activeScenario, updateActiveScenario } = useScenario();
  const [isOpen, setIsOpen] = useState(false);
  const [selectedContainer, setSelectedContainer] = useState<'20ft' | '40ft' | '40ft_hc'>('40ft');

  if (!activeScenario) return null;

  const primaryProduct = activeScenario.product;
  const secondarySkus: SkuItem[] = activeScenario.secondarySkus || [];

  // Consolidate primary SKU + added SKUs
  const allSkus = [
    {
      id: 'primary',
      name: `${activeScenario.name} (Primary)`,
      annualDemand: primaryProduct.annualDemand,
      unitCost: primaryProduct.unitCost,
      cbm: primaryProduct.cbm || 0.04,
      weightKg: primaryProduct.weightKg || 2.0
    },
    ...secondarySkus
  ];

  const addSku = () => {
    const newSku: SkuItem = {
      id: Date.now().toString(),
      name: `SKU-${secondarySkus.length + 2}`,
      annualDemand: 5000,
      unitCost: 25.0,
      cbm: 0.03,
      weightKg: 1.5,
      dutyRate: primaryProduct.dutyRate || 0
    };
    updateActiveScenario({
      ...activeScenario,
      secondarySkus: [...secondarySkus, newSku]
    });
  };

  const removeSku = (id: string) => {
    updateActiveScenario({
      ...activeScenario,
      secondarySkus: secondarySkus.filter(s => s.id !== id)
    });
  };

  const updateSku = (id: string, updates: Partial<SkuItem>) => {
    updateActiveScenario({
      ...activeScenario,
      secondarySkus: secondarySkus.map(s => (s.id === id ? { ...s, ...updates } : s))
    });
  };

  // Calculations for container stuffing
  const spec = CONTAINER_SPECS[selectedContainer];
  const totalAnnualCbm = allSkus.reduce((sum, s) => sum + s.annualDemand * s.cbm, 0);
  const totalAnnualWeightKg = allSkus.reduce((sum, s) => sum + s.annualDemand * s.weightKg, 0);

  // Approximate per-shipment requirements assuming 12 shipments/year baseline
  const estimatedShipments = 12;
  const perShipmentCbm = totalAnnualCbm / estimatedShipments;
  const perShipmentWeightKg = totalAnnualWeightKg / estimatedShipments;

  const cbmUtilizationPct = Math.min(100, (perShipmentCbm / spec.maxCbm) * 100);
  const weightUtilizationPct = Math.min(100, (perShipmentWeightKg / spec.maxWeightKg) * 100);

  const isVolumeOverloaded = perShipmentCbm > spec.maxCbm;
  const isWeightOverloaded = perShipmentWeightKg > spec.maxWeightKg;

  return (
    <div className="bg-white dark:bg-slate-900 p-6 rounded-2xl border border-slate-200/80 dark:border-slate-800 shadow-sm transition-colors mt-6">
      <div
        className="flex items-center justify-between cursor-pointer"
        onClick={() => setIsOpen(!isOpen)}
      >
        <div className="flex items-center gap-2">
          <div className="p-1.5 rounded-lg bg-indigo-50 dark:bg-indigo-950/60 text-indigo-600 dark:text-indigo-400">
            <Boxes size={18} />
          </div>
          <div>
            <div className="flex items-center gap-2">
              <h2 className="text-base font-bold text-slate-900 dark:text-slate-100 tracking-tight">
                Multi-SKU Container Consolidation
              </h2>
              <span className="text-[10px] font-bold px-2 py-0.5 bg-indigo-50 dark:bg-indigo-950/80 text-indigo-700 dark:text-indigo-300 rounded-md border border-indigo-200/60 dark:border-indigo-800/60 uppercase">
                {allSkus.length} SKUs &bull; CBM Allocator
              </span>
            </div>
            <p className="text-xs text-slate-500 dark:text-slate-400">
              Add and delete SKUs, monitor CBM volume fill %, and allocate container costs
            </p>
          </div>
        </div>
        <button className="p-1.5 text-slate-400 hover:text-slate-700 dark:hover:text-slate-200 rounded-lg">
          {isOpen ? <ChevronUp size={18} /> : <ChevronDown size={18} />}
        </button>
      </div>

      {isOpen && (
        <div className="mt-6 pt-5 border-t border-slate-100 dark:border-slate-800/80 space-y-6 animate-in fade-in duration-200">
          {/* Container Selector & Meter Card */}
          <div className="p-4 bg-slate-50/80 dark:bg-slate-950/60 rounded-xl border border-slate-200/80 dark:border-slate-800">
            <div className="flex flex-wrap items-center justify-between gap-3 mb-4">
              <span className="text-xs font-bold text-slate-700 dark:text-slate-300 uppercase tracking-wider flex items-center gap-1.5">
                <Scale size={14} className="text-brand-500" /> Target Container Model
              </span>
              <div className="flex gap-1.5">
                {(['20ft', '40ft', '40ft_hc'] as const).map(type => (
                  <button
                    key={type}
                    onClick={() => setSelectedContainer(type)}
                    className={`px-2.5 py-1 text-xs font-bold rounded-lg transition-colors cursor-pointer ${
                      selectedContainer === type
                        ? 'bg-brand-600 text-white shadow-sm'
                        : 'bg-white dark:bg-slate-900 text-slate-600 dark:text-slate-300 border border-slate-200 dark:border-slate-700 hover:bg-slate-100'
                    }`}
                  >
                    {CONTAINER_SPECS[type].name.split(' ')[0]}
                  </button>
                ))}
              </div>
            </div>

            {/* Utilization Bars */}
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div>
                <div className="flex justify-between items-center text-xs mb-1.5 font-semibold">
                  <span className="text-slate-600 dark:text-slate-400">CBM Volume Fill</span>
                  <span className={`tabular-nums ${isVolumeOverloaded ? 'text-red-500 font-bold' : 'text-slate-900 dark:text-slate-100'}`}>
                    {perShipmentCbm.toFixed(1)} / {spec.maxCbm} m³ ({cbmUtilizationPct.toFixed(0)}%)
                  </span>
                </div>
                <div className="w-full h-2.5 bg-slate-200 dark:bg-slate-800 rounded-full overflow-hidden">
                  <div
                    className={`h-full transition-all duration-300 rounded-full ${
                      isVolumeOverloaded ? 'bg-red-500' : cbmUtilizationPct > 85 ? 'bg-emerald-500' : 'bg-brand-500'
                    }`}
                    style={{ width: `${Math.min(100, cbmUtilizationPct)}%` }}
                  />
                </div>
              </div>

              <div>
                <div className="flex justify-between items-center text-xs mb-1.5 font-semibold">
                  <span className="text-slate-600 dark:text-slate-400">Payload Weight</span>
                  <span className={`tabular-nums ${isWeightOverloaded ? 'text-red-500 font-bold' : 'text-slate-900 dark:text-slate-100'}`}>
                    {(perShipmentWeightKg / 1000).toFixed(1)} / {(spec.maxWeightKg / 1000).toFixed(1)} Tons ({weightUtilizationPct.toFixed(0)}%)
                  </span>
                </div>
                <div className="w-full h-2.5 bg-slate-200 dark:bg-slate-800 rounded-full overflow-hidden">
                  <div
                    className={`h-full transition-all duration-300 rounded-full ${
                      isWeightOverloaded ? 'bg-red-500' : weightUtilizationPct > 85 ? 'bg-emerald-500' : 'bg-brand-500'
                    }`}
                    style={{ width: `${Math.min(100, weightUtilizationPct)}%` }}
                  />
                </div>
              </div>
            </div>

            {(isVolumeOverloaded || isWeightOverloaded) && (
              <div className="mt-3 flex items-center gap-1.5 text-xs font-semibold text-amber-600 dark:text-amber-400 bg-amber-50 dark:bg-amber-950/40 p-2 rounded-lg border border-amber-200 dark:border-amber-800/60">
                <AlertTriangle size={14} className="shrink-0" />
                <span>
                  Shipment demands exceed a single {CONTAINER_SPECS[selectedContainer].name}. Consider upgrading to High Cube or splitting into multiple containers.
                </span>
              </div>
            )}
          </div>

          {/* SKU Table */}
          <div className="overflow-x-auto rounded-xl border border-slate-200 dark:border-slate-800">
            <table className="w-full text-left text-xs text-slate-700 dark:text-slate-300">
              <thead className="bg-slate-50 dark:bg-slate-950 text-slate-700 dark:text-slate-300 font-bold uppercase tracking-wider text-[10px]">
                <tr>
                  <th className="px-3.5 py-2.5">SKU Description</th>
                  <th className="px-3.5 py-2.5 text-right">Annual Units</th>
                  <th className="px-3.5 py-2.5 text-right">CBM / Unit</th>
                  <th className="px-3.5 py-2.5 text-right">Kg / Unit</th>
                  <th className="px-3.5 py-2.5 text-right">Vol Share</th>
                  <th className="px-3.5 py-2.5 text-center">Delete</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-100 dark:divide-slate-800">
                {allSkus.map((sku) => {
                  const skuCbmTotal = sku.annualDemand * sku.cbm;
                  const volSharePct = totalAnnualCbm > 0 ? (skuCbmTotal / totalAnnualCbm) * 100 : 0;
                  const isPrimary = sku.id === 'primary';

                  return (
                    <tr key={sku.id} className="hover:bg-slate-50 dark:hover:bg-slate-800/40">
                      <td className="px-3.5 py-2 font-semibold">
                        {isPrimary ? (
                          <span className="text-slate-900 dark:text-slate-100 font-bold">{sku.name}</span>
                        ) : (
                          <input
                            type="text"
                            value={sku.name}
                            onChange={(e) => updateSku(sku.id, { name: e.target.value })}
                            className="bg-transparent border-b border-transparent hover:border-slate-300 focus:border-brand-500 focus:outline-none py-0.5 text-xs font-semibold"
                          />
                        )}
                      </td>
                      <td className="px-3.5 py-2 text-right tabular-nums">
                        {isPrimary ? (
                          sku.annualDemand.toLocaleString()
                        ) : (
                          <input
                            type="number"
                            value={sku.annualDemand}
                            onChange={(e) => updateSku(sku.id, { annualDemand: Math.max(0, parseInt(e.target.value) || 0) })}
                            className="w-20 text-right bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-700 rounded px-1.5 py-0.5 text-xs font-semibold"
                          />
                        )}
                      </td>
                      <td className="px-3.5 py-2 text-right tabular-nums">
                        {isPrimary ? (
                          sku.cbm.toFixed(3)
                        ) : (
                          <input
                            type="number"
                            step="0.005"
                            value={sku.cbm}
                            onChange={(e) => updateSku(sku.id, { cbm: Math.max(0.001, parseFloat(e.target.value) || 0) })}
                            className="w-16 text-right bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-700 rounded px-1.5 py-0.5 text-xs font-semibold"
                          />
                        )}
                      </td>
                      <td className="px-3.5 py-2 text-right tabular-nums">
                        {isPrimary ? (
                          sku.weightKg.toFixed(1)
                        ) : (
                          <input
                            type="number"
                            step="0.1"
                            value={sku.weightKg}
                            onChange={(e) => updateSku(sku.id, { weightKg: Math.max(0.1, parseFloat(e.target.value) || 0) })}
                            className="w-16 text-right bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-700 rounded px-1.5 py-0.5 text-xs font-semibold"
                          />
                        )}
                      </td>
                      <td className="px-3.5 py-2 text-right tabular-nums font-bold text-brand-600 dark:text-brand-400">
                        {volSharePct.toFixed(1)}%
                      </td>
                      <td className="px-3.5 py-2 text-center">
                        {!isPrimary ? (
                          <button
                            onClick={() => removeSku(sku.id)}
                            className="inline-flex items-center gap-1 text-[11px] font-semibold text-red-500 hover:text-red-700 dark:hover:text-red-400 bg-red-50 hover:bg-red-100 dark:bg-red-950/40 dark:hover:bg-red-900/60 px-2 py-1 rounded-lg transition-colors cursor-pointer border border-red-200/60 dark:border-red-900/40"
                            title="Delete this SKU"
                          >
                            <Trash2 size={12} />
                            <span>Delete</span>
                          </button>
                        ) : (
                          <span className="text-[10px] text-slate-400 font-medium italic">Base SKU</span>
                        )}
                      </td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          </div>

          <div className="flex flex-wrap items-center justify-between gap-3 pt-1">
            <span className="text-xs text-slate-500 dark:text-slate-400">
              You can add or delete SKUs to model multi-product container consolidation.
            </span>
            <button
              onClick={addSku}
              className="flex items-center gap-1.5 px-3.5 py-2 bg-indigo-600 hover:bg-indigo-700 active:bg-indigo-800 text-white rounded-xl text-xs font-bold transition-all shadow-sm shadow-indigo-600/20 cursor-pointer"
            >
              <Plus size={14} /> Add SKU
            </button>
          </div>
        </div>
      )}
    </div>
  );
};
