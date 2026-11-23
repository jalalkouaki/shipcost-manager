import type { Scenario, ProductBase, ShippingProfile, SkuItem, LCLProfile, FCLProfile } from '../types';

export interface CsvImportResult {
  success: boolean;
  scenario?: Scenario;
  error?: string;
  importedItemsSummary?: string;
}

/**
 * Tokenizes a single CSV line according to RFC 4180
 */
export function tokenizeCsvLine(line: string): string[] {
  const row: string[] = [];
  let insideQuote = false;
  let entry = '';

  for (let i = 0; i < line.length; i++) {
    const char = line[i];
    if (char === '"') {
      if (insideQuote && line[i + 1] === '"') {
        entry += '"';
        i++;
      } else {
        insideQuote = !insideQuote;
      }
    } else if (char === ',' && !insideQuote) {
      row.push(entry.trim().replace(/^"|"$/g, ''));
      entry = '';
    } else {
      entry += char;
    }
  }
  row.push(entry.trim().replace(/^"|"$/g, ''));
  return row;
}

function cleanKey(str: string): string {
  return str.toLowerCase().replace(/[^a-z0-9]/g, '');
}

function parseNumber(val: any, fallback: number = 0): number {
  if (val === undefined || val === null) return fallback;
  const cleaned = String(val).replace(/[^0-9.-]/g, '');
  const parsed = parseFloat(cleaned);
  return isNaN(parsed) ? fallback : parsed;
}

const DEFAULT_PROFILES: ShippingProfile[] = [
  {
    id: 'prof_lcl_default',
    name: 'Standard LCL Ocean',
    type: 'lcl',
    fixedHandling: 150,
    variablePerUnit: 3.5,
    distanceKm: 11000,
    leadTimeDays: 40,
    leadTimeVarianceDays: 8,
  } as LCLProfile,
  {
    id: 'prof_fcl_default',
    name: '20ft FCL Container',
    type: 'fcl',
    containerCost: 2800,
    capacity: 1200,
    containerType: '20ft',
    distanceKm: 11000,
    leadTimeDays: 35,
    leadTimeVarianceDays: 6,
  } as FCLProfile,
];

/**
 * Parses any CSV file (multi-section exported CSV, legacy summary CSV, or custom spreadsheet)
 * into a complete, ready-to-run Scenario.
 */
export function parseCsvToScenario(csvContent: string, fileName: string = 'imported.csv'): CsvImportResult {
  if (!csvContent || !csvContent.trim()) {
    return {
      success: false,
      error: 'The CSV file is empty. Please select a valid CSV file with logistics data.',
    };
  }

  // Reject binary data
  if (csvContent.includes('\0') || /[\x00-\x08\x0E-\x1F]/.test(csvContent.slice(0, 500))) {
    return {
      success: false,
      error: 'The file contains binary or corrupted data and cannot be parsed as a text CSV.',
    };
  }

  const lines = csvContent.split(/\r?\n/).map(l => l.trim()).filter(l => l.length > 0);
  if (lines.length === 0) {
    return {
      success: false,
      error: 'No readable data rows found in the CSV file.',
    };
  }

  // Determine a default scenario name from filename (e.g. shipcost_summary_winter_wear.csv -> Winter Wear)
  const baseScenarioName = fileName
    .replace(/^shipcost_(summary_)?/i, '')
    .replace(/\.[^/.]+$/, '')
    .replace(/[_-]/g, ' ')
    .trim();

  let scenarioName = baseScenarioName
    ? baseScenarioName.charAt(0).toUpperCase() + baseScenarioName.slice(1)
    : 'Imported Scenario';

  const product: ProductBase = {
    unitCost: 50,
    annualDemand: 10000,
    dutyRate: 5,
    holdingRate: 20,
    safetyStock: 500,
    weightKg: 2.0,
    cbm: 0.04,
    priceBreaks: [],
  };

  const profiles: ShippingProfile[] = [];
  const secondarySkus: SkuItem[] = [];

  let matchedAny = false;

  // -------------------------------------------------------------
  // Case 1: Multi-Section CSV (Exported format with # or [ headers)
  // -------------------------------------------------------------
  const hasSections = lines.some(l => l.startsWith('#') || (l.startsWith('[') && l.endsWith(']')));

  if (hasSections) {
    let currentSection = 'config'; // default initial section
    const sectionRows: Record<string, string[][]> = {
      config: [],
      profiles: [],
      skus: [],
      results: [],
    };

    for (const rawLine of lines) {
      if (rawLine.startsWith('#') || (rawLine.startsWith('[') && rawLine.endsWith(']'))) {
        const header = cleanKey(rawLine);
        if (header.includes('profile') || header.includes('shipping')) {
          currentSection = 'profiles';
        } else if (header.includes('sku') || header.includes('productlist') || header.includes('secondary')) {
          currentSection = 'skus';
        } else if (header.includes('result') || header.includes('summary') || header.includes('optimization')) {
          currentSection = 'results';
        } else {
          currentSection = 'config';
        }
        continue;
      }

      const tokens = tokenizeCsvLine(rawLine);
      if (tokens.some(t => t.length > 0)) {
        if (!sectionRows[currentSection]) sectionRows[currentSection] = [];
        sectionRows[currentSection].push(tokens);
      }
    }

    // 1A. Process Configuration Section (Key-Value)
    if (sectionRows.config && sectionRows.config.length > 0) {
      matchedAny = true;
      for (const row of sectionRows.config) {
        if (row.length < 2) continue;
        const k = cleanKey(row[0]);
        const valStr = row[1];
        const val = parseNumber(valStr);

        if (k === 'scenarioname' || k === 'name') {
          scenarioName = valStr.trim() || scenarioName;
        } else if (k === 'baseunitcost' || k === 'unitcost' || k === 'price') {
          product.unitCost = val;
        } else if (k === 'annualdemand' || k === 'demand' || k === 'units') {
          product.annualDemand = Math.round(val);
        } else if (k === 'importtariffrate' || k === 'importtariff' || k === 'dutyrate' || k === 'tariff') {
          product.dutyRate = val;
        } else if (k === 'annualholdingrate' || k === 'holdingrate' || k === 'carryingcost') {
          product.holdingRate = val;
        } else if (k === 'safetystock' || k === 'buffer') {
          product.safetyStock = Math.round(val);
        } else if (k === 'weightkg' || k === 'weight') {
          product.weightKg = val;
        } else if (k === 'cbm' || k === 'volume') {
          product.cbm = val;
        }
      }
    }

    // 1B. Process Shipping Profiles Section
    if (sectionRows.profiles && sectionRows.profiles.length > 1) {
      matchedAny = true;
      const headerRow = sectionRows.profiles[0].map(cleanKey);
      const findCol = (keys: string[]) => headerRow.findIndex(h => keys.includes(h));

      const colName = findCol(['profilename', 'name', 'profile']);
      const colType = findCol(['type', 'mode']);
      const colFixed = findCol(['fixedhandling', 'handlingfee', 'fixedcost']);
      const colVar = findCol(['variablecost', 'variableperunit']);
      const colContainer = findCol(['containercost', 'fclcost']);
      const colCap = findCol(['capacity', 'maxunits']);
      const colDist = findCol(['distancekm', 'distance']);
      const colLead = findCol(['leadtimedays', 'leadtime']);
      const colLeadVar = findCol(['leadtimevariance', 'variance']);

      for (let i = 1; i < sectionRows.profiles.length; i++) {
        const row = sectionRows.profiles[i];
        const pName = colName !== -1 && row[colName] ? row[colName] : `Profile ${i}`;
        const rawType = colType !== -1 && row[colType] ? row[colType].toLowerCase().trim() : '';
        const isFcl = rawType.includes('fcl') || pName.toLowerCase().includes('fcl') || pName.toLowerCase().includes('container') || (colContainer !== -1 && parseNumber(row[colContainer]) > 0);

        if (isFcl) {
          profiles.push({
            id: `prof_imp_${Date.now()}_${i}`,
            name: pName,
            type: 'fcl',
            containerCost: colContainer !== -1 ? Math.max(1, parseNumber(row[colContainer], 2800)) : 2800,
            capacity: colCap !== -1 ? Math.max(1, parseNumber(row[colCap], 1200)) : 1200,
            containerType: pName.toLowerCase().includes('40') ? '40ft' : '20ft',
            distanceKm: colDist !== -1 ? parseNumber(row[colDist], 11000) : 11000,
            leadTimeDays: colLead !== -1 ? parseNumber(row[colLead], 35) : 35,
            leadTimeVarianceDays: colLeadVar !== -1 ? parseNumber(row[colLeadVar], 6) : 6,
          } as FCLProfile);
        } else {
          profiles.push({
            id: `prof_imp_${Date.now()}_${i}`,
            name: pName,
            type: 'lcl',
            fixedHandling: colFixed !== -1 ? parseNumber(row[colFixed], 150) : 150,
            variablePerUnit: colVar !== -1 ? parseNumber(row[colVar], 3.5) : 3.5,
            distanceKm: colDist !== -1 ? parseNumber(row[colDist], 11000) : 11000,
            leadTimeDays: colLead !== -1 ? parseNumber(row[colLead], 40) : 40,
            leadTimeVarianceDays: colLeadVar !== -1 ? parseNumber(row[colLeadVar], 8) : 8,
          } as LCLProfile);
        }
      }
    }

    // 1C. Process Secondary SKUs Section
    if (sectionRows.skus && sectionRows.skus.length > 1) {
      matchedAny = true;
      const headerRow = sectionRows.skus[0].map(cleanKey);
      const findCol = (keys: string[]) => headerRow.findIndex(h => keys.includes(h));

      const colName = findCol(['skuname', 'name', 'sku']);
      const colDemand = findCol(['annualdemand', 'demand', 'qty']);
      const colCost = findCol(['unitcost', 'cost', 'price']);
      const colCbm = findCol(['cbm', 'volume']);
      const colWeight = findCol(['weightkg', 'weight']);
      const colDuty = findCol(['dutyrate', 'tariff', 'duty']);

      for (let i = 1; i < sectionRows.skus.length; i++) {
        const row = sectionRows.skus[i];
        secondarySkus.push({
          id: `sku_imp_${Date.now()}_${i}`,
          name: colName !== -1 && row[colName] ? row[colName] : `SKU-${i + 1}`,
          annualDemand: colDemand !== -1 ? Math.round(parseNumber(row[colDemand], 5000)) : 5000,
          unitCost: colCost !== -1 ? parseNumber(row[colCost], 25.0) : 25.0,
          cbm: colCbm !== -1 ? parseNumber(row[colCbm], 0.03) : 0.03,
          weightKg: colWeight !== -1 ? parseNumber(row[colWeight], 1.5) : 1.5,
          dutyRate: colDuty !== -1 ? parseNumber(row[colDuty], 0) : 0,
        });
      }
    }
  } else {
    // -------------------------------------------------------------
    // Case 2: Flat CSV (Legacy Exported Summary or Custom Tabular)
    // -------------------------------------------------------------
    const allRows = lines.map(tokenizeCsvLine);
    const headerRow = allRows[0].map(cleanKey);
    const findCol = (keys: string[]) => headerRow.findIndex(h => keys.includes(h));

    // Check if this is the legacy exported summary table:
    // Profile Name, Optimal Order Quantity, Total Annual Cost, Annual Freight Cost, Annual Holding Cost...
    const isExportedSummary =
      findCol(['profilename', 'profile']) !== -1 &&
      findCol(['optimalorderquantity', 'optimalq']) !== -1 &&
      findCol(['totalannualcost', 'annualfreightcost']) !== -1;

    if (isExportedSummary) {
      matchedAny = true;
      const colName = findCol(['profilename', 'profile', 'name']);
      const colOptQ = findCol(['optimalorderquantity', 'optimalq']);
      const colFreight = findCol(['annualfreightcost', 'freightspend']);
      const colLanded = findCol(['landedunitcost', 'landedcost', 'unitcost']);

      const dataRows = allRows.slice(1);
      let bestEstimatedDemand = 10000;
      let maxLanded = 50;

      dataRows.forEach((row, idx) => {
        const pName = colName !== -1 && row[colName] ? row[colName] : `Profile ${idx + 1}`;
        const optQ = colOptQ !== -1 ? parseNumber(row[colOptQ], 1000) : 1000;
        const annualFreight = colFreight !== -1 ? parseNumber(row[colFreight], 10000) : 10000;
        const landed = colLanded !== -1 ? parseNumber(row[colLanded], 50) : 50;

        if (landed > 0) maxLanded = landed;

        // Estimate annual demand from holding cost: Holding Cost = (Q / 2) * Landed * 0.20
        // Or if optQ is known, estimate reasonable annual cycles:
        const estimatedCycles = Math.max(2, Math.round(annualFreight / Math.max(500, annualFreight / 8)));
        const rowDemand = Math.round(optQ * estimatedCycles);
        if (rowDemand > bestEstimatedDemand) bestEstimatedDemand = rowDemand;

        const isFcl = pName.toLowerCase().includes('fcl') || pName.toLowerCase().includes('container') || pName.toLowerCase().includes('40ft') || pName.toLowerCase().includes('20ft');

        if (isFcl) {
          // Reconstruct container cost: Freight Spend / Number of shipments
          const numShipments = Math.max(1, Math.round(bestEstimatedDemand / optQ));
          const containerCost = Math.round(annualFreight / numShipments) || 2800;

          profiles.push({
            id: `prof_imp_${Date.now()}_${idx}`,
            name: pName,
            type: 'fcl',
            containerCost: Math.max(100, containerCost),
            capacity: Math.max(optQ, 1200),
            containerType: pName.toLowerCase().includes('40') ? '40ft' : '20ft',
            distanceKm: 11000,
            leadTimeDays: 35,
            leadTimeVarianceDays: 6,
          } as FCLProfile);
        } else {
          const varCost = Math.max(0.5, Math.round((annualFreight / bestEstimatedDemand) * 100) / 100) || 3.5;
          profiles.push({
            id: `prof_imp_${Date.now()}_${idx}`,
            name: pName,
            type: 'lcl',
            fixedHandling: 150,
            variablePerUnit: varCost,
            distanceKm: 11000,
            leadTimeDays: 40,
            leadTimeVarianceDays: 8,
          } as LCLProfile);
        }
      });

      product.unitCost = maxLanded;
      product.annualDemand = bestEstimatedDemand;
      product.dutyRate = 0; // already included in landed
      product.holdingRate = 20;
    } else {
      // 2B. Check if 2-column key-value CSV (Parameter, Value)
      const isKeyValue = allRows.every(r => r.length <= 3) && allRows.some(r => {
        const k = cleanKey(r[0]);
        return ['unitcost', 'annualdemand', 'dutyrate', 'holdingrate', 'safetystock', 'demand', 'cbm'].includes(k);
      });

      if (isKeyValue) {
        matchedAny = true;
        for (const [rawKey, rawVal] of allRows) {
          if (!rawKey || rawVal === undefined) continue;
          const k = cleanKey(rawKey);
          const val = parseNumber(rawVal);

          if (k === 'name' || k === 'scenarioname') {
            scenarioName = rawVal.trim() || scenarioName;
          } else if (k === 'unitcost' || k === 'basecost' || k === 'price') {
            product.unitCost = val;
          } else if (k === 'annualdemand' || k === 'demand' || k === 'units') {
            product.annualDemand = Math.round(val);
          } else if (k === 'dutyrate' || k === 'tariff' || k === 'duty') {
            product.dutyRate = val;
          } else if (k === 'holdingrate' || k === 'carryingcost') {
            product.holdingRate = val;
          } else if (k === 'safetystock' || k === 'buffer') {
            product.safetyStock = Math.round(val);
          } else if (k === 'weightkg' || k === 'weight') {
            product.weightKg = val;
          } else if (k === 'cbm' || k === 'volume') {
            product.cbm = val;
          }
        }
      } else {
        // 2C. Generic Tabular Product / SKU / Profile Table
        const colName = findCol(['name', 'sku', 'product', 'profilename', 'description']);
        const colType = findCol(['type', 'mode', 'shippingmode']);
        const colUnitCost = findCol(['unitcost', 'basecost', 'cost', 'price', 'unitprice', 'landedunitcost']);
        const colDemand = findCol(['annualdemand', 'demand', 'qty', 'annualunits', 'volume']);
        const colDuty = findCol(['dutyrate', 'tariff', 'duty', 'tariffrate']);
        const colHolding = findCol(['holdingrate', 'holding', 'carryingrate']);
        const colSafety = findCol(['safetystock', 'safety', 'buffer']);
        const colWeight = findCol(['weightkg', 'weight', 'unitweight']);
        const colCbm = findCol(['cbm', 'unitcbm', 'volume', 'm3']);

        const colFixed = findCol(['fixedhandling', 'handlingfee', 'fixedcost']);
        const colVar = findCol(['variablecost', 'variableperunit']);
        const colContainer = findCol(['containercost', 'fclcost']);
        const colCap = findCol(['capacity', 'maxunits']);

        if (colUnitCost !== -1 || colDemand !== -1 || colType !== -1 || colContainer !== -1 || colFixed !== -1) {
          matchedAny = true;
          const dataRows = allRows.slice(1);

          dataRows.forEach((row, idx) => {
            const rowName = colName !== -1 && row[colName] ? row[colName] : `Item ${idx + 1}`;
            const rawType = colType !== -1 && row[colType] ? row[colType].toLowerCase().trim() : '';
            const isProfile = rawType.includes('fcl') || rawType.includes('lcl') || colContainer !== -1 || colFixed !== -1;

            if (isProfile) {
              const isFcl = rawType.includes('fcl') || (colContainer !== -1 && parseNumber(row[colContainer]) > 0);
              if (isFcl) {
                profiles.push({
                  id: `prof_imp_${Date.now()}_${idx}`,
                  name: rowName,
                  type: 'fcl',
                  containerCost: colContainer !== -1 ? Math.max(1, parseNumber(row[colContainer], 2800)) : 2800,
                  capacity: colCap !== -1 ? Math.max(1, parseNumber(row[colCap], 1200)) : 1200,
                  containerType: rowName.toLowerCase().includes('40') ? '40ft' : '20ft',
                  distanceKm: 11000,
                  leadTimeDays: 35,
                  leadTimeVarianceDays: 6,
                } as FCLProfile);
              } else {
                profiles.push({
                  id: `prof_imp_${Date.now()}_${idx}`,
                  name: rowName,
                  type: 'lcl',
                  fixedHandling: colFixed !== -1 ? parseNumber(row[colFixed], 150) : 150,
                  variablePerUnit: colVar !== -1 ? parseNumber(row[colVar], 3.5) : 3.5,
                  distanceKm: 11000,
                  leadTimeDays: 40,
                  leadTimeVarianceDays: 8,
                } as LCLProfile);
              }
            } else {
              if (idx === 0) {
                if (colUnitCost !== -1) product.unitCost = parseNumber(row[colUnitCost], 50);
                if (colDemand !== -1) product.annualDemand = Math.round(parseNumber(row[colDemand], 10000));
                if (colDuty !== -1) product.dutyRate = parseNumber(row[colDuty], 5);
                if (colHolding !== -1) product.holdingRate = parseNumber(row[colHolding], 20);
                if (colSafety !== -1) product.safetyStock = Math.round(parseNumber(row[colSafety], 500));
                if (colWeight !== -1) product.weightKg = parseNumber(row[colWeight], 2.0);
                if (colCbm !== -1) product.cbm = parseNumber(row[colCbm], 0.04);
                if (colName !== -1 && row[colName]) scenarioName = row[colName];
              } else {
                secondarySkus.push({
                  id: `sku_imp_${Date.now()}_${idx}`,
                  name: rowName,
                  annualDemand: colDemand !== -1 ? Math.round(parseNumber(row[colDemand], 5000)) : 5000,
                  unitCost: colUnitCost !== -1 ? parseNumber(row[colUnitCost], 25.0) : 25.0,
                  cbm: colCbm !== -1 ? parseNumber(row[colCbm], 0.03) : 0.03,
                  weightKg: colWeight !== -1 ? parseNumber(row[colWeight], 1.5) : 1.5,
                  dutyRate: colDuty !== -1 ? parseNumber(row[colDuty], 0) : 0,
                });
              }
            }
          });
        }
      }
    }
  }

  if (!matchedAny) {
    return {
      success: false,
      error: 'Cannot read file: Unrecognized CSV format. The file does not contain valid logistics parameters, product fields, or shipping profiles.',
    };
  }

  // Final sanity validation: ensure nonzero product financials and valid profiles
  const finalProduct: ProductBase = {
    ...product,
    unitCost: product.unitCost > 0 ? product.unitCost : 50,
    annualDemand: product.annualDemand > 0 ? product.annualDemand : 10000,
    holdingRate: product.holdingRate > 0 ? product.holdingRate : 20,
    dutyRate: Math.max(0, product.dutyRate || 0),
    safetyStock: Math.max(0, product.safetyStock || 0),
    weightKg: Math.max(0.01, product.weightKg || 2.0),
    cbm: Math.max(0.001, product.cbm || 0.04),
    priceBreaks: product.priceBreaks || [],
  };

  const finalProfiles = profiles.length > 0 ? profiles : DEFAULT_PROFILES;

  const scenario: Scenario = {
    id: `csv_imported_${Date.now()}`,
    name: scenarioName,
    product: finalProduct,
    profiles: finalProfiles,
    secondarySkus,
    incotermQuotes: [],
  };

  return {
    success: true,
    scenario,
    importedItemsSummary: `Imported "${scenario.name}" (${finalProfiles.length} shipping profiles, ${secondarySkus.length} secondary SKUs).`,
  };
}
