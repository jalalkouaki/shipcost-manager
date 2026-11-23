import type {
  ProductBase,
  ShippingProfile,
  OptimizationResult,
  CostCurvePoint,
  LCLProfile,
  FCLProfile,
  CarbonMetrics,
  StockoutMetrics
} from '../types';

/**
 * Returns the effective base unit cost at order quantity q based on price breaks.
 */
export function getUnitCostForQ(q: number, product: ProductBase): number {
  if (!product.priceBreaks || product.priceBreaks.length === 0) {
    return product.unitCost;
  }

  // Sort tiers ascending by minQty
  const sortedTiers = [...product.priceBreaks].sort((a, b) => a.minQty - b.minQty);
  let appliedCost = product.unitCost;

  for (const tier of sortedTiers) {
    if (q >= tier.minQty) {
      appliedCost = tier.unitCost;
    }
  }

  return appliedCost;
}

export function calculateTotalCost(
  q: number,
  profile: ShippingProfile,
  product: ProductBase,
  adjustedDemand?: number
): Omit<CostCurvePoint, 'q'> {
  const d = adjustedDemand ?? product.annualDemand;
  const baseCost = getUnitCostForQ(q, product);
  const effectiveLandedCost = baseCost * (1 + (product.dutyRate || 0) / 100);
  const h = product.holdingRate / 100;
  const ss = product.safetyStock;

  if (d === 0 || q <= 0) {
    return { shippingCost: 0, holdingCost: 0, totalCost: 0, unitCostAtQ: baseCost };
  }

  let shippingCost = 0;

  if (profile.type === 'lcl') {
    const lcl = profile as LCLProfile;
    shippingCost = (d / q) * lcl.fixedHandling + d * lcl.variablePerUnit;
  } else if (profile.type === 'fcl') {
    const fcl = profile as FCLProfile;
    // single container limit means Q <= capacity
    shippingCost = (d / q) * fcl.containerCost;
  }

  const holdingCost = (q / 2 + ss) * effectiveLandedCost * h;
  const totalCost = shippingCost + holdingCost;

  return { shippingCost, holdingCost, totalCost, unitCostAtQ: baseCost };
}

/**
 * Calculates Scope 3 transport greenhouse gas emissions (GLEC framework).
 */
export function calculateCarbonMetrics(
  q: number,
  annualDemand: number,
  profile: ShippingProfile,
  product: ProductBase
): CarbonMetrics {
  const distanceKm = profile.distanceKm || 11000; // Trans-Pacific/Atlantic baseline
  const unitWeightKg = product.weightKg || 2.0; // default 2kg if unstated
  const shipmentWeightTons = (q * unitWeightKg) / 1000;

  // Emissions factor in kg CO2e per ton-km
  const factor = profile.type === 'lcl' ? 0.018 : 0.012;

  const co2PerShipmentKg = shipmentWeightTons * distanceKm * factor;
  const annualShipments = q > 0 ? annualDemand / q : 0;
  const annualCo2MetricTons = (co2PerShipmentKg * annualShipments) / 1000;

  let emissionRating: CarbonMetrics['emissionRating'] = 'B';
  if (annualCo2MetricTons <= 2.5) emissionRating = 'A+';
  else if (annualCo2MetricTons <= 6) emissionRating = 'A';
  else if (annualCo2MetricTons <= 18) emissionRating = 'B';
  else if (annualCo2MetricTons <= 40) emissionRating = 'C';
  else if (annualCo2MetricTons <= 80) emissionRating = 'D';
  else emissionRating = 'E';

  return {
    co2PerShipmentKg: Math.round(co2PerShipmentKg * 10) / 10,
    annualCo2MetricTons: Math.round(annualCo2MetricTons * 100) / 100,
    emissionRating
  };
}

/**
 * Calculates transit lead time stockout risk and recommended safety buffer.
 */
export function calculateStockoutMetrics(
  _q: number,
  annualDemand: number,
  profile: ShippingProfile,
  safetyStock: number
): StockoutMetrics {
  const leadTimeDays = profile.leadTimeDays || (profile.type === 'fcl' ? 35 : 42);
  const leadTimeVarianceDays = profile.leadTimeVarianceDays || (profile.type === 'fcl' ? 6 : 8);

  const dailyDemand = annualDemand / 365;
  const dailyDemandStdDev = dailyDemand * 0.20; // 20% CV demand variability

  // Combined lead time demand variance: Var(LTD) = L * Var(D) + D^2 * Var(L)
  const ltdVariance =
    leadTimeDays * Math.pow(dailyDemandStdDev, 2) +
    Math.pow(dailyDemand, 2) * Math.pow(leadTimeVarianceDays, 2);
  const ltdStdDev = Math.sqrt(Math.max(1, ltdVariance));

  // Z-score for 95% service level = 1.645
  const recommendedSafetyStock = Math.round(1.645 * ltdStdDev);
  const reorderPoint = Math.round(dailyDemand * leadTimeDays + safetyStock);

  // Current Z-score of user's safety stock
  const zScore = ltdStdDev > 0 ? (safetyStock - 0) / ltdStdDev : 3;

  // Normal CDF approximation: P(Z <= z)
  const cdf = 1 / (1 + Math.exp(-1.702 * zScore));
  const stockoutProbabilityPct = Math.max(0.2, Math.min(99.0, (1 - cdf) * 100));

  // Expected fill rate
  const cycleServiceLevel = Math.max(50.0, Math.min(99.9, (1 - stockoutProbabilityPct / 100) * 100));

  return {
    recommendedSafetyStock,
    stockoutProbabilityPct: Math.round(stockoutProbabilityPct * 10) / 10,
    simulatedFillRatePct: Math.round(cycleServiceLevel * 10) / 10,
    reorderPoint
  };
}

export function findOptimalQ(
  profile: ShippingProfile,
  product: ProductBase,
  adjustedDemand?: number
): OptimizationResult {
  const d = adjustedDemand ?? product.annualDemand;
  const initialBaseCost = getUnitCostForQ(1, product);
  const initialLandedCost = initialBaseCost * (1 + (product.dutyRate || 0) / 100);
  const h = product.holdingRate / 100;

  if (d <= 0 || initialLandedCost <= 0) {
    return {
      profileId: profile.id,
      optimalQ: 0,
      minTotalCost: 0,
      shippingCost: 0,
      holdingCost: 0,
      effectiveUnitCostAtQ: initialBaseCost,
      shipmentsPerYear: 0,
      avgInventoryValue: 0,
      daysOfInventory: 0,
      cashTiedUp: 0,
      effectiveLandedCost: initialLandedCost,
      costCurve: []
    };
  }

  let maxQ = d;
  if (profile.type === 'fcl') {
    const capacity = (profile as FCLProfile).capacity;
    if (capacity <= 0) {
      return {
        profileId: profile.id,
        optimalQ: 0,
        minTotalCost: 0,
        shippingCost: 0,
        holdingCost: 0,
        effectiveUnitCostAtQ: initialBaseCost,
        shipmentsPerYear: 0,
        avgInventoryValue: 0,
        daysOfInventory: 0,
        cashTiedUp: 0,
        effectiveLandedCost: initialLandedCost,
        costCurve: []
      };
    }
    maxQ = Math.min(d, capacity);
  }

  // Generate evaluation points
  const pointsSet = new Set<number>();
  pointsSet.add(1);
  pointsSet.add(maxQ);

  // Add all price break minimums within valid range
  if (product.priceBreaks) {
    for (const tier of product.priceBreaks) {
      if (tier.minQty >= 1 && tier.minQty <= maxQ) {
        pointsSet.add(tier.minQty);
        if (tier.minQty > 1) pointsSet.add(tier.minQty - 1);
      }
    }
  }

  if (maxQ <= 200) {
    for (let i = 1; i <= maxQ; i++) {
      pointsSet.add(i);
    }
  } else {
    const numPoints = 200;
    const logMin = Math.log(1);
    const logMax = Math.log(maxQ);
    const step = (logMax - logMin) / (numPoints - 1);

    for (let i = 0; i < numPoints; i++) {
      const q = Math.round(Math.exp(logMin + i * step));
      if (q >= 1 && q <= maxQ) {
        pointsSet.add(q);
      }
    }

    // Add unconstrained classical EOQs as reference points
    if (h > 0) {
      const costForEoq = initialLandedCost;
      if (profile.type === 'fcl') {
        const fcl = profile as FCLProfile;
        const eoq = Math.round(Math.sqrt((2 * d * fcl.containerCost) / (costForEoq * h)));
        if (eoq >= 1 && eoq <= maxQ) pointsSet.add(eoq);
      } else {
        const lcl = profile as LCLProfile;
        if (lcl.fixedHandling > 0) {
          const eoq = Math.round(Math.sqrt((2 * d * lcl.fixedHandling) / (costForEoq * h)));
          if (eoq >= 1 && eoq <= maxQ) pointsSet.add(eoq);
        }
      }
    }
  }

  const sortedPoints = Array.from(pointsSet).sort((a, b) => a - b);

  let minTotalCost = Infinity;
  let optimalQ = 1;
  let optShippingCost = 0;
  let optHoldingCost = 0;
  let optUnitCost = initialBaseCost;

  const costCurve: CostCurvePoint[] = [];

  for (const q of sortedPoints) {
    const { shippingCost, holdingCost, totalCost, unitCostAtQ } = calculateTotalCost(
      q,
      profile,
      product,
      adjustedDemand
    );

    costCurve.push({ q, shippingCost, holdingCost, totalCost, unitCostAtQ });

    if (totalCost < minTotalCost) {
      minTotalCost = totalCost;
      optimalQ = q;
      optShippingCost = shippingCost;
      optHoldingCost = holdingCost;
      optUnitCost = unitCostAtQ || initialBaseCost;
    }
  }

  const effectiveLandedCost = optUnitCost * (1 + (product.dutyRate || 0) / 100);
  const shipmentsPerYear = d / optimalQ;
  const avgInventoryValue = (optimalQ / 2 + product.safetyStock) * effectiveLandedCost;
  const daysOfInventory = (avgInventoryValue / effectiveLandedCost) / (d / 365);
  const cashTiedUp = (optimalQ / 2) * effectiveLandedCost;

  const carbon = calculateCarbonMetrics(optimalQ, d, profile, product);
  const stockout = calculateStockoutMetrics(optimalQ, d, profile, product.safetyStock);

  return {
    profileId: profile.id,
    optimalQ,
    minTotalCost,
    shippingCost: optShippingCost,
    holdingCost: optHoldingCost,
    effectiveUnitCostAtQ: optUnitCost,
    shipmentsPerYear,
    avgInventoryValue,
    daysOfInventory,
    cashTiedUp,
    effectiveLandedCost,
    carbon,
    stockout,
    costCurve
  };
}
