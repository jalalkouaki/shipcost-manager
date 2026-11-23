import * as XLSX from 'xlsx';
import { generateBrailleReport, type ScenarioReportData } from './braille';
import { formatCurrency } from './format';

export interface ExportContext {
  activeScenario: any;
  results: Record<string, any>;
  settings: { currency: string };
  demandMultiplier: number;
}

function sanitizeFilename(name: string): string {
  return name.replace(/[^a-z0-9]/gi, '_').toLowerCase();
}

function downloadBlob(content: BlobPart, filename: string, mimeType: string) {
  const blob = new Blob([content], { type: mimeType });
  const url = URL.createObjectURL(blob);
  const link = document.createElement('a');
  link.setAttribute('href', url);
  link.setAttribute('download', filename);
  document.body.appendChild(link);
  link.click();
  document.body.removeChild(link);
  URL.revokeObjectURL(url);
}

/**
 * 1. Excel (.xlsx) Export with multi-sheet enterprise model
 */
export function exportToExcel({ activeScenario, results, settings }: ExportContext) {
  const wb = XLSX.utils.book_new();
  const safeName = sanitizeFilename(activeScenario.name);

  const bestId = Object.entries(results).reduce((best, [id, res]: [string, any]) => {
    if (!best || res.minTotalCost < best.cost) {
      return { id, cost: res.minTotalCost };
    }
    return best;
  }, null as { id: string; cost: number } | null)?.id;

  // Sheet 1: Executive Logistics Summary
  const summaryRows = activeScenario.profiles.map((p: any) => {
    const res = results[p.id];
    if (!res) return null;
    const isBest = p.id === bestId;

    return {
      'Profile Name': p.name,
      'Freight Mode': p.type.toUpperCase(),
      'Optimal Order Qty (Q)': res.optimalQ,
      [`Total Annual Cost (${settings.currency})`]: Number(res.minTotalCost.toFixed(2)),
      [`Freight Spend (${settings.currency})`]: Number(res.shippingCost.toFixed(2)),
      [`Holding Cost (${settings.currency})`]: Number(res.holdingCost.toFixed(2)),
      [`Avg Inventory Value (${settings.currency})`]: Number(res.avgInventoryValue.toFixed(2)),
      [`Cash Tied Up (${settings.currency})`]: Number(res.cashTiedUp.toFixed(2)),
      'Days of Inventory (DOI)': Number(res.daysOfInventory.toFixed(1)),
      [`Landed Unit Cost (${settings.currency})`]: Number(res.effectiveLandedCost.toFixed(2)),
      'CO2 / Shipment (kg)': res.carbon?.co2PerShipmentKg || 0,
      'Annual CO2 (Tons)': res.carbon?.annualCo2MetricTons || 0,
      'ESG Rating': res.carbon?.emissionRating || 'B',
      'Stockout Risk (%)': res.stockout?.stockoutProbabilityPct || 0,
      'Rec. Safety Stock': res.stockout?.recommendedSafetyStock || 0,
      'Status': isBest ? 'RECOMMENDED' : 'Alternative',
    };
  }).filter(Boolean);

  const wsSummary = XLSX.utils.json_to_sheet(summaryRows);
  wsSummary['!cols'] = [
    { wch: 20 }, { wch: 14 }, { wch: 22 }, { wch: 22 }, { wch: 20 },
    { wch: 20 }, { wch: 22 }, { wch: 20 }, { wch: 20 }, { wch: 20 },
    { wch: 18 }, { wch: 18 }, { wch: 12 }, { wch: 16 }, { wch: 18 }, { wch: 16 }
  ];
  XLSX.utils.book_append_sheet(wb, wsSummary, 'Logistics Summary');

  // Sheet 2: Scenario Parameters & SKU Footprint
  const product = activeScenario.product;
  const paramRows = [
    { 'Parameter': 'Scenario Name', 'Value': activeScenario.name, 'Unit': 'Text' },
    { 'Parameter': 'Export Timestamp', 'Value': new Date().toISOString(), 'Unit': 'ISO Date' },
    { 'Parameter': 'Target Currency', 'Value': settings.currency, 'Unit': 'Currency' },
    { 'Parameter': 'Product Unit Cost', 'Value': product.unitCost, 'Unit': settings.currency },
    { 'Parameter': 'Annual Demand', 'Value': product.annualDemand, 'Unit': 'Units / Year' },
    { 'Parameter': 'Import Duty / Tariff', 'Value': product.dutyRate || 0, 'Unit': '%' },
    { 'Parameter': 'Annual Holding Cost Rate', 'Value': product.holdingRate, 'Unit': '%' },
    { 'Parameter': 'Safety Stock Level', 'Value': product.safetyStock, 'Unit': 'Units' },
    { 'Parameter': 'Unit Weight', 'Value': product.weightKg || 2.0, 'Unit': 'kg' },
    { 'Parameter': 'Unit Volume (CBM)', 'Value': product.cbm || 0.04, 'Unit': 'm³' },
    { 'Parameter': 'Price Breaks Configured', 'Value': product.priceBreaks?.length || 0, 'Unit': 'Tiers' },
  ];
  const wsParams = XLSX.utils.json_to_sheet(paramRows);
  wsParams['!cols'] = [{ wch: 28 }, { wch: 24 }, { wch: 16 }];
  XLSX.utils.book_append_sheet(wb, wsParams, 'Scenario Parameters');

  // Sheet 3: Multi-SKU Footprint (if configured)
  if (activeScenario.secondarySkus && activeScenario.secondarySkus.length > 0) {
    const skuRows = activeScenario.secondarySkus.map((s: any) => ({
      'SKU Name': s.name,
      'Annual Demand': s.annualDemand,
      [`Unit Cost (${settings.currency})`]: s.unitCost,
      'CBM / Unit': s.cbm,
      'Weight (kg) / Unit': s.weightKg,
      'Tariff (%)': s.dutyRate
    }));
    const wsSkus = XLSX.utils.json_to_sheet(skuRows);
    XLSX.utils.book_append_sheet(wb, wsSkus, 'Multi-SKU Breakdown');
  }

  // Sheet 4: Detailed Cost Curves (EOQ Range)
  const curveRows: any[] = [];
  activeScenario.profiles.forEach((p: any) => {
    const res = results[p.id];
    if (res?.costCurve) {
      res.costCurve.forEach((pt: any) => {
        curveRows.push({
          'Profile Name': p.name,
          'Order Quantity (Q)': pt.q,
          [`Total Cost (${settings.currency})`]: Number(pt.totalCost.toFixed(2)),
          [`Shipping Cost (${settings.currency})`]: Number(pt.shippingCost.toFixed(2)),
          [`Holding Cost (${settings.currency})`]: Number(pt.holdingCost.toFixed(2)),
          'Is Optimal Q': pt.q === res.optimalQ ? 'YES' : 'NO',
        });
      });
    }
  });

  if (curveRows.length > 0) {
    const wsCurves = XLSX.utils.json_to_sheet(curveRows);
    XLSX.utils.book_append_sheet(wb, wsCurves, 'Cost Curves Analysis');
  }

  XLSX.writeFile(wb, `shipcost_analysis_${safeName}.xlsx`);
}

/**
 * 2. Braille (.brf / .txt) Export with Grade 1 UEB and standard ASCII Braille
 */
export function exportToBraille({ activeScenario, results, settings }: ExportContext) {
  const safeName = sanitizeFilename(activeScenario.name);

  const bestId = Object.entries(results).reduce((best, [id, res]: [string, any]) => {
    if (!best || res.minTotalCost < best.cost) {
      return { id, cost: res.minTotalCost };
    }
    return best;
  }, null as { id: string; cost: number } | null)?.id;

  const reportData: ScenarioReportData = {
    scenarioName: activeScenario.name,
    product: {
      unitCost: activeScenario.product.unitCost,
      annualDemand: activeScenario.product.annualDemand,
      holdingRate: activeScenario.product.holdingRate,
      safetyStock: activeScenario.product.safetyStock,
      dutyRate: activeScenario.product.dutyRate,
    },
    profiles: activeScenario.profiles.map((p: any) => {
      const res = results[p.id] || {};
      return {
        id: p.id,
        name: p.name,
        type: p.type,
        optimalQ: res.optimalQ || 0,
        minTotalCost: res.minTotalCost || 0,
        shippingCost: res.shippingCost || 0,
        holdingCost: res.holdingCost || 0,
        daysOfInventory: res.daysOfInventory || 0,
        cashTiedUp: res.cashTiedUp || 0,
        isBest: p.id === bestId,
      };
    }),
    currency: settings.currency,
  };

  const brailleContent = generateBrailleReport(reportData);
  downloadBlob(brailleContent, `shipcost_braille_${safeName}.brf`, 'text/plain;charset=utf-8;');
}

/**
 * 3. Executive Markdown Briefing (.md) Export
 */
export function exportToMarkdown({ activeScenario, results, settings }: ExportContext) {
  const safeName = sanitizeFilename(activeScenario.name);
  const dateStr = new Date().toLocaleDateString('en-US', {
    year: 'numeric',
    month: 'long',
    day: 'numeric',
  });

  const bestProfile = activeScenario.profiles.reduce((best: any, p: any) => {
    const res = results[p.id];
    if (!res) return best;
    if (!best || res.minTotalCost < results[best.id]?.minTotalCost) return p;
    return best;
  }, null);

  const bestRes = bestProfile ? results[bestProfile.id] : null;

  const md = [
    `# 🚢 ShipCost Optimizer — Executive Logistics Briefing`,
    ``,
    `**Scenario:** ${activeScenario.name}  `,
    `**Date Generated:** ${dateStr}  `,
    `**Target Currency:** ${settings.currency}  `,
    ``,
    `---`,
    ``,
    `## Executive Recommendation`,
    bestProfile && bestRes ? [
      `The optimization solver recommends **${bestProfile.name}** (${bestProfile.type.toUpperCase()} mode).`,
      ``,
      `* **Optimal Order Quantity (EOQ):** **${bestRes.optimalQ.toLocaleString()} units** per cycle`,
      `* **Minimized Total Annual Cost:** **${formatCurrency(bestRes.minTotalCost, settings.currency)}**`,
      `* **Annual Freight Spend:** ${formatCurrency(bestRes.shippingCost, settings.currency)}`,
      `* **Annual Inventory Holding Cost:** ${formatCurrency(bestRes.holdingCost, settings.currency)}`,
      `* **Working Capital Tied Up:** ${formatCurrency(bestRes.cashTiedUp, settings.currency)}`,
      `* **Days of Inventory (DOI):** **${bestRes.daysOfInventory.toFixed(1)} days**`,
      `* **Effective Landed Unit Cost:** **${formatCurrency(bestRes.effectiveLandedCost, settings.currency)}**`,
      `* **Scope 3 Carbon Footprint:** **${bestRes.carbon?.annualCo2MetricTons || 0} Metric Tons CO₂e/yr** (Rating: ${bestRes.carbon?.emissionRating || 'B'})`,
      `* **Recommended Safety Buffer:** **${bestRes.stockout?.recommendedSafetyStock || activeScenario.product.safetyStock} units** (Fill Rate: ${bestRes.stockout?.simulatedFillRatePct || 95}%)`,
    ].join('\n') : `No analysis results available.`,
    ``,
    `---`,
    ``,
    `## Comparative Logistics Evaluation`,
    ``,
    `| Profile | Mode | Optimal Q | Total Annual Cost | Freight Spend | Holding Cost | DOI | CO₂e / Yr | Stockout Risk | Status |`,
    `| :--- | :--- | :---: | :---: | :---: | :---: | :---: | :---: | :---: | :---: |`,
    ...activeScenario.profiles.map((p: any) => {
      const res = results[p.id];
      if (!res) return '';
      const isBest = p.id === bestProfile?.id;
      return `| **${p.name}** | \`${p.type.toUpperCase()}\` | ${res.optimalQ.toLocaleString()} | **${formatCurrency(res.minTotalCost, settings.currency)}** | ${formatCurrency(res.shippingCost, settings.currency)} | ${formatCurrency(res.holdingCost, settings.currency)} | ${res.daysOfInventory.toFixed(1)}d | ${res.carbon?.annualCo2MetricTons || 0}T | ${res.stockout?.stockoutProbabilityPct || 0}% | ${isBest ? '**Recommended**' : 'Alternative'} |`;
    }).filter(Boolean),
    ``,
    `---`,
    ``,
    `## SKU Baseline & Assumptions`,
    ``,
    `- **Annual Product Demand:** ${activeScenario.product.annualDemand.toLocaleString()} units / year`,
    `- **Base Unit Purchase Cost:** ${formatCurrency(activeScenario.product.unitCost, settings.currency)}`,
    `- **Import Tariff / Duty Rate:** ${(activeScenario.product.dutyRate || 0).toFixed(1)}%`,
    `- **Annual Holding Rate:** ${activeScenario.product.holdingRate.toFixed(1)}% / year`,
    `- **Safety Stock Buffer:** ${activeScenario.product.safetyStock.toLocaleString()} units`,
    `- **Weight per Unit:** ${activeScenario.product.weightKg || 2.0} kg`,
    ``,
    `---`,
    `*Report generated by ShipCost Optimizer.*`,
  ].join('\n');

  downloadBlob(md, `shipcost_executive_brief_${safeName}.md`, 'text/markdown;charset=utf-8;');
}

/**
 * 4. Raw JSON Dataset (.json) Export
 */
export function exportToJSON({ activeScenario, results, settings }: ExportContext) {
  const safeName = sanitizeFilename(activeScenario.name);
  const payload = {
    exportedAt: new Date().toISOString(),
    generator: 'ShipCost Optimizer Enterprise',
    version: '2.1.0',
    settings,
    scenario: activeScenario,
    analysisResults: results,
  };

  const jsonStr = JSON.stringify(payload, null, 2);
  downloadBlob(jsonStr, `shipcost_dataset_${safeName}.json`, 'application/json;charset=utf-8;');
}

/**
 * 5. CSV Spreadsheet (.csv) Export
 */
export function exportToCSV({ activeScenario, results, settings }: ExportContext) {
  const safeName = sanitizeFilename(activeScenario.name);
  const p = activeScenario.product;
  const currency = settings?.currency || 'MAD';

  const sections: string[] = [];

  // Section 1: Scenario & Product Configuration
  sections.push('# SHIPCOST SCENARIO CONFIGURATION');
  sections.push('Parameter,Value');
  sections.push(`Scenario Name,"${activeScenario.name.replace(/"/g, '""')}"`);
  sections.push(`Currency,"${currency}"`);
  sections.push(`Base Unit Cost,${p.unitCost}`);
  sections.push(`Annual Demand,${p.annualDemand}`);
  sections.push(`Import Tariff Rate,${p.dutyRate || 0}`);
  sections.push(`Annual Holding Rate,${p.holdingRate || 20}`);
  sections.push(`Safety Stock,${p.safetyStock || 0}`);
  sections.push(`Weight Kg,${p.weightKg || 2.0}`);
  sections.push(`CBM,${p.cbm || 0.04}`);

  // Section 2: Shipping Profiles
  sections.push('');
  sections.push('# SHIPPING PROFILES');
  sections.push('Profile Name,Type,Fixed Handling,Variable Cost,Container Cost,Capacity,Distance Km,Lead Time Days,Lead Time Variance');
  activeScenario.profiles.forEach((prof: any) => {
    const isFcl = prof.type === 'fcl';
    sections.push([
      `"${prof.name.replace(/"/g, '""')}"`,
      prof.type,
      isFcl ? 0 : (prof.fixedHandling || 0),
      isFcl ? 0 : (prof.variablePerUnit || 0),
      isFcl ? (prof.containerCost || 0) : 0,
      isFcl ? (prof.capacity || 0) : 0,
      prof.distanceKm || 11000,
      prof.leadTimeDays || (isFcl ? 35 : 42),
      prof.leadTimeVarianceDays || (isFcl ? 6 : 8),
    ].join(','));
  });

  // Section 3: Secondary SKUs (if present)
  if (activeScenario.secondarySkus && activeScenario.secondarySkus.length > 0) {
    sections.push('');
    sections.push('# SECONDARY SKUS');
    sections.push('SKU Name,Annual Demand,Unit Cost,CBM,Weight Kg,Duty Rate');
    activeScenario.secondarySkus.forEach((sku: any) => {
      sections.push([
        `"${sku.name.replace(/"/g, '""')}"`,
        sku.annualDemand || 0,
        sku.unitCost || 0,
        sku.cbm || 0,
        sku.weightKg || 0,
        sku.dutyRate || 0,
      ].join(','));
    });
  }

  // Section 4: Optimization Results Summary
  sections.push('');
  sections.push('# OPTIMIZATION RESULTS SUMMARY');
  sections.push([
    'Profile Name',
    'Optimal Order Quantity',
    'Total Annual Cost',
    'Annual Freight Cost',
    'Annual Holding Cost',
    'Average Inventory Value',
    'Cash Tied Up',
    'Days of Inventory',
    'Landed Unit Cost',
    'Annual CO2 Tons',
    'Stockout Risk Pct'
  ].join(','));

  activeScenario.profiles.forEach((prof: any) => {
    const res = results[prof.id];
    if (!res) return;
    sections.push([
      `"${prof.name.replace(/"/g, '""')}"`,
      res.optimalQ,
      res.minTotalCost.toFixed(2),
      res.shippingCost.toFixed(2),
      res.holdingCost.toFixed(2),
      res.avgInventoryValue.toFixed(2),
      res.cashTiedUp.toFixed(2),
      res.daysOfInventory.toFixed(2),
      res.effectiveLandedCost.toFixed(2),
      res.carbon?.annualCo2MetricTons || 0,
      res.stockout?.stockoutProbabilityPct || 0
    ].join(','));
  });

  const csvContent = sections.join('\n');
  downloadBlob(csvContent, `shipcost_summary_${safeName}.csv`, 'text/csv;charset=utf-8;');
}

/**
 * 6. Print to PDF
 */
export function exportToPDF() {
  window.print();
}
