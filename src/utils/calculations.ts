import type { ProductBase, ShippingProfile, OptimizationResult, CostCurvePoint, LCLProfile, FCLProfile } from '../types';

export function calculateTotalCost(
  q: number,
  profile: ShippingProfile,
  product: ProductBase,
  adjustedDemand?: number
): Omit<CostCurvePoint, 'q'> {
  const d = adjustedDemand ?? product.annualDemand;
  const effectiveLandedCost = product.unitCost * (1 + (product.dutyRate || 0) / 100);
  const h = product.holdingRate / 100;
  const ss = product.safetyStock;

  if (d === 0) {
    return { shippingCost: 0, holdingCost: 0, totalCost: 0 };
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

  return { shippingCost, holdingCost, totalCost };
}

export function findOptimalQ(
  profile: ShippingProfile,
  product: ProductBase,
  adjustedDemand?: number
): OptimizationResult {
  const d = adjustedDemand ?? product.annualDemand;
  const effectiveLandedCost = product.unitCost * (1 + (product.dutyRate || 0) / 100);
  const h = product.holdingRate / 100;
  
  if (d <= 0 || effectiveLandedCost <= 0) {
    return {
      profileId: profile.id,
      optimalQ: 0,
      minTotalCost: 0,
      shippingCost: 0,
      holdingCost: 0,
      shipmentsPerYear: 0,
      avgInventoryValue: 0,
      daysOfInventory: 0,
      cashTiedUp: 0,
      effectiveLandedCost,
      costCurve: []
    };
  }

  let maxQ = d;
  if (profile.type === 'fcl') {
    const capacity = (profile as FCLProfile).capacity;
    if (capacity <= 0) {
       return { profileId: profile.id, optimalQ: 0, minTotalCost: 0, shippingCost: 0, holdingCost: 0, shipmentsPerYear: 0, avgInventoryValue: 0, daysOfInventory: 0, cashTiedUp: 0, effectiveLandedCost, costCurve: [] };
    }
    maxQ = Math.min(d, capacity);
  }

  // Generate evaluation points
  const points: number[] = [];
  if (maxQ <= 200) {
    for (let i = 1; i <= maxQ; i++) {
      points.push(i);
    }
  } else {
    // Log-spaced points
    const numPoints = 200;
    const logMin = Math.log(1);
    const logMax = Math.log(maxQ);
    const step = (logMax - logMin) / (numPoints - 1);
    
    const uniquePoints = new Set<number>();
    for (let i = 0; i < numPoints; i++) {
      const q = Math.round(Math.exp(logMin + i * step));
      if (q >= 1 && q <= maxQ) {
        uniquePoints.add(q);
      }
    }
    uniquePoints.add(1);
    uniquePoints.add(maxQ);
    
    // Add the unconstrained EOQ for precision around the minimum
    if (h > 0) {
        if (profile.type === 'fcl') {
          const fcl = profile as FCLProfile;
          const eoq = Math.round(Math.sqrt((2 * d * fcl.containerCost) / (effectiveLandedCost * h)));
          if (eoq >= 1 && eoq <= maxQ) {
              uniquePoints.add(eoq);
          }
        } else {
          const lcl = profile as LCLProfile;
          if (lcl.fixedHandling > 0) {
             const eoq = Math.round(Math.sqrt((2 * d * lcl.fixedHandling) / (effectiveLandedCost * h)));
             if (eoq >= 1 && eoq <= maxQ) {
                 uniquePoints.add(eoq);
             }
          }
        }
    }

    points.push(...Array.from(uniquePoints).sort((a, b) => a - b));
  }

  let minTotalCost = Infinity;
  let optimalQ = 1;
  let optShippingCost = 0;
  let optHoldingCost = 0;
  
  const costCurve: CostCurvePoint[] = [];

  for (const q of points) {
    const { shippingCost, holdingCost, totalCost } = calculateTotalCost(q, profile, product, adjustedDemand);
    
    costCurve.push({ q, shippingCost, holdingCost, totalCost });
    
    if (totalCost < minTotalCost) {
      minTotalCost = totalCost;
      optimalQ = q;
      optShippingCost = shippingCost;
      optHoldingCost = holdingCost;
    }
  }

  // Derive KPIs
  const shipmentsPerYear = d / optimalQ;
  const avgInventoryValue = (optimalQ / 2 + product.safetyStock) * effectiveLandedCost;
  const daysOfInventory = ((avgInventoryValue / effectiveLandedCost) / (d / 365));
  const cashTiedUp = (optimalQ / 2) * effectiveLandedCost;

  return {
    profileId: profile.id,
    optimalQ,
    minTotalCost,
    shippingCost: optShippingCost,
    holdingCost: optHoldingCost,
    shipmentsPerYear,
    avgInventoryValue,
    daysOfInventory,
    cashTiedUp,
    effectiveLandedCost,
    costCurve
  };
}
