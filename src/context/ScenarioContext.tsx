import React, { createContext, useContext, useState, useEffect, useMemo, useCallback } from 'react';
import type { Scenario, ProductBase, ShippingProfile, OptimizationResult, AppSettings } from '../types';
import { findOptimalQ } from '../utils/calculations';

const defaultSettings: AppSettings = {
  currency: '$',
  defaultHoldingRate: 20,
};

const defaultProduct: ProductBase = {
  unitCost: 50,
  dutyRate: 0,
  annualDemand: 10000,
  holdingRate: 20,
  safetyStock: 500,
};

const defaultProfiles: ShippingProfile[] = [
  {
    id: '1',
    type: 'lcl',
    name: 'Standard LCL',
    fixedHandling: 300,
    variablePerUnit: 2,
  },
  {
    id: '2',
    type: 'fcl',
    name: '20ft FCL',
    containerCost: 4000,
    capacity: 3000,
  }
];

const defaultScenario: Scenario = {
  id: 'default',
  name: 'Base Scenario',
  product: defaultProduct,
  profiles: defaultProfiles,
};

interface ScenarioContextType {
  scenarios: Scenario[];
  activeScenarioId: string;
  activeScenario: Scenario | undefined;
  results: Record<string, OptimizationResult>;
  demandMultiplier: number;
  setDemandMultiplier: (val: number) => void;
  
  settings: AppSettings;
  updateSettings: (newSettings: Partial<AppSettings>) => void;
  
  isAnalysisFresh: boolean;
  runAnalysis: () => void;

  createScenario: (name: string) => void;
  updateActiveScenario: (updated: Scenario) => void;
  deleteScenario: (id: string) => void;
  setActiveScenarioId: (id: string) => void;
  renameActiveScenario: (name: string) => void;
}

const ScenarioContext = createContext<ScenarioContextType | undefined>(undefined);

export const useScenario = () => {
  const ctx = useContext(ScenarioContext);
  if (!ctx) throw new Error('useScenario must be used within a ScenarioProvider');
  return ctx;
};

export const ScenarioProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const [settings, setSettings] = useState<AppSettings>(() => {
    const saved = localStorage.getItem('shipcost-settings');
    if (saved) {
      try {
        return { ...defaultSettings, ...JSON.parse(saved) };
      } catch (e) {
        console.error('Failed to load settings', e);
      }
    }
    return defaultSettings;
  });

  const [scenarios, setScenarios] = useState<Scenario[]>(() => {
    const saved = localStorage.getItem('shipcost-scenarios');
    if (saved) {
      try {
        const parsed = JSON.parse(saved);
        if (Array.isArray(parsed) && parsed.length > 0) return parsed;
      } catch (e) {
        console.error('Failed to load scenarios', e);
      }
    }
    return [{
      ...defaultScenario,
      product: { ...defaultScenario.product, holdingRate: settings.defaultHoldingRate }
    }];
  });

  const [activeScenarioId, setActiveScenarioId] = useState<string>(scenarios[0]?.id || 'default');
  const [demandMultiplier, setDemandMultiplier] = useState<number>(1);
  const [isAnalysisFresh, setIsAnalysisFresh] = useState<boolean>(false);

  useEffect(() => {
    try {
      localStorage.setItem('shipcost-settings', JSON.stringify(settings));
    } catch (e) {
      console.error('Failed to save settings', e);
    }
  }, [settings]);

  useEffect(() => {
    try {
      localStorage.setItem('shipcost-scenarios', JSON.stringify(scenarios));
    } catch (e) {
      if (e instanceof DOMException && e.name === 'QuotaExceededError') {
        alert('Storage quota exceeded. Unable to save scenarios.');
      } else {
        console.error('Failed to save scenarios', e);
      }
    }
  }, [scenarios]);

  const activeScenario = useMemo(() => {
    return scenarios.find(s => s.id === activeScenarioId) || scenarios[0];
  }, [scenarios, activeScenarioId]);

  const results = useMemo(() => {
    const res: Record<string, OptimizationResult> = {};
    if (!activeScenario) return res;
    
    const adjustedDemand = Math.round(activeScenario.product.annualDemand * demandMultiplier);
    
    for (const profile of activeScenario.profiles) {
      res[profile.id] = findOptimalQ(profile, activeScenario.product, adjustedDemand);
    }
    return res;
  }, [activeScenario, demandMultiplier]);

  const updateSettings = useCallback((newSettings: Partial<AppSettings>) => {
    setSettings(prev => ({ ...prev, ...newSettings }));
  }, []);

  const runAnalysis = useCallback(() => {
    setIsAnalysisFresh(true);
  }, []);

  const createScenario = useCallback((name: string) => {
    if (!activeScenario) return;
    const newScenario: Scenario = {
      id: Date.now().toString(),
      name,
      product: { ...activeScenario.product, holdingRate: settings.defaultHoldingRate },
      profiles: activeScenario.profiles.map(p => ({ ...p, id: Date.now().toString() + Math.random().toString().slice(2,5) }))
    };
    setScenarios(prev => [...prev, newScenario]);
    setActiveScenarioId(newScenario.id);
    setIsAnalysisFresh(false);
  }, [activeScenario, settings.defaultHoldingRate]);

  const updateActiveScenario = useCallback((updated: Scenario) => {
    setScenarios(prev => prev.map(s => s.id === updated.id ? updated : s));
    setIsAnalysisFresh(false);
  }, []);

  const renameActiveScenario = useCallback((name: string) => {
    setScenarios(prev => prev.map(s => s.id === activeScenarioId ? { ...s, name } : s));
  }, [activeScenarioId]);

  const deleteScenario = useCallback((id: string) => {
    if (scenarios.length === 1) {
      alert('Cannot delete the last scenario.');
      return;
    }
    setScenarios(prev => prev.filter(s => s.id !== id));
    if (activeScenarioId === id) {
      const nextActive = scenarios.find(s => s.id !== id);
      if (nextActive) setActiveScenarioId(nextActive.id);
      setIsAnalysisFresh(false);
    }
  }, [scenarios, activeScenarioId]);
  
  const handleSetActiveScenarioId = useCallback((id: string) => {
    setActiveScenarioId(id);
    setIsAnalysisFresh(false);
  }, []);

  return (
    <ScenarioContext.Provider value={{
      scenarios,
      activeScenarioId,
      activeScenario,
      results,
      demandMultiplier,
      setDemandMultiplier,
      settings,
      updateSettings,
      isAnalysisFresh,
      runAnalysis,
      createScenario,
      updateActiveScenario,
      deleteScenario,
      setActiveScenarioId: handleSetActiveScenarioId,
      renameActiveScenario
    }}>
      {children}
    </ScenarioContext.Provider>
  );
};
