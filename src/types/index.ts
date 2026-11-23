export interface VolumeTier {
  minQty: number;
  unitCost: number;
}

export interface ProductBase {
  unitCost: number;
  dutyRate: number;
  annualDemand: number;
  holdingRate: number; // percentage, e.g. 20 for 20%
  safetyStock: number;
  weightKg?: number; // per unit weight in kg
  cbm?: number; // per unit volume in cubic meters
  priceBreaks?: VolumeTier[]; // Supplier quantity discounts
}

export interface SkuItem {
  id: string;
  name: string;
  unitCost: number;
  annualDemand: number;
  cbm: number; // m³ per unit
  weightKg: number; // kg per unit
  dutyRate: number;
}

export interface LCLProfile {
  id: string;
  type: 'lcl';
  name: string;
  fixedHandling: number;
  variablePerUnit: number;
  leadTimeDays?: number;
  leadTimeVarianceDays?: number;
  distanceKm?: number;
}

export interface FCLProfile {
  id: string;
  type: 'fcl';
  name: string;
  containerCost: number;
  capacity: number; // max units capacity
  containerType?: '20ft' | '40ft' | '40ft_hc';
  leadTimeDays?: number;
  leadTimeVarianceDays?: number;
  distanceKm?: number;
}

export type ShippingProfile = LCLProfile | FCLProfile;

export interface IncotermQuote {
  term: 'FOB' | 'CIF' | 'DDP';
  supplierQuotePerUnit: number;
  includesTariff: boolean;
  notes?: string;
}

export interface Scenario {
  id: string;
  name: string;
  product: ProductBase;
  profiles: ShippingProfile[];
  secondarySkus?: SkuItem[];
  incotermQuotes?: IncotermQuote[];
}

export interface CostCurvePoint {
  q: number;
  shippingCost: number;
  holdingCost: number;
  totalCost: number;
  unitCostAtQ?: number;
}

export interface CarbonMetrics {
  co2PerShipmentKg: number;
  annualCo2MetricTons: number;
  emissionRating: 'A+' | 'A' | 'B' | 'C' | 'D' | 'E';
}

export interface StockoutMetrics {
  recommendedSafetyStock: number;
  stockoutProbabilityPct: number;
  simulatedFillRatePct: number;
  reorderPoint: number;
}

export interface OptimizationResult {
  profileId: string;
  optimalQ: number;
  minTotalCost: number;
  shippingCost: number;
  holdingCost: number;
  effectiveUnitCostAtQ: number;

  // Derived KPIs
  shipmentsPerYear: number;
  avgInventoryValue: number;
  daysOfInventory: number;
  cashTiedUp: number;
  effectiveLandedCost: number;

  // ESG & Risk Metrics
  carbon?: CarbonMetrics;
  stockout?: StockoutMetrics;

  costCurve: CostCurvePoint[];
}

export interface AppSettings {
  currency: string;
  defaultHoldingRate: number;
}
