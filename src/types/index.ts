export interface ProductBase {
  unitCost: number;
  dutyRate: number;
  annualDemand: number;
  holdingRate: number; // as percentage, e.g., 25 for 25%
  safetyStock: number;
}

export interface LCLProfile {
  id: string;
  type: 'lcl';
  name: string;
  fixedHandling: number;
  variablePerUnit: number;
}

export interface FCLProfile {
  id: string;
  type: 'fcl';
  name: string;
  containerCost: number;
  capacity: number;
}

export type ShippingProfile = LCLProfile | FCLProfile;

export interface Scenario {
  id: string;
  name: string;
  product: ProductBase;
  profiles: ShippingProfile[];
}

export interface CostCurvePoint {
  q: number;
  shippingCost: number;
  holdingCost: number;
  totalCost: number;
}

export interface OptimizationResult {
  profileId: string;
  optimalQ: number;
  minTotalCost: number;
  shippingCost: number;
  holdingCost: number;
  
  // Derived KPIs
  shipmentsPerYear: number;
  avgInventoryValue: number;
  daysOfInventory: number;
  cashTiedUp: number;
  effectiveLandedCost: number;
  
  costCurve: CostCurvePoint[];
}

export interface AppSettings {
  currency: string;
  defaultHoldingRate: number;
}
