import { useEffect, useState } from 'react';
import { Ship, Moon, Sun, Download, Trash, Settings as SettingsIcon, MousePointerClick } from 'lucide-react';
import { useScenario, ScenarioProvider } from './context/ScenarioContext';
import { ProductForm } from './components/ProductForm';
import { ShippingProfilesForm } from './components/ShippingProfilesForm';
import { SensitivitySlider } from './components/SensitivitySlider';
import { ResultsPanel } from './components/ResultsPanel';
import { CostComparisonChart } from './components/charts/CostComparisonChart';
import { CostCurveChart } from './components/charts/CostCurveChart';
import { SettingsPanel } from './components/SettingsPanel';
import { RunAnalysisButton } from './components/RunAnalysisButton';
import { InventoryImpact } from './components/InventoryImpact';
import { EvaluationTable } from './components/EvaluationTable';
import { ExportButtons } from './components/ExportButtons';

const Dashboard = () => {
  const { scenarios, activeScenarioId, setActiveScenarioId, createScenario, deleteScenario, isAnalysisFresh } = useScenario();
  const [isDark, setIsDark] = useState<boolean>(() => {
    if (typeof window !== 'undefined') {
      return document.documentElement.classList.contains('dark') || true;
    }
    return true;
  });
  
  const [isSettingsOpen, setIsSettingsOpen] = useState(false);

  useEffect(() => {
    if (isDark) {
      document.documentElement.classList.add('dark');
    } else {
      document.documentElement.classList.remove('dark');
    }
  }, [isDark]);

  const toggleTheme = () => setIsDark(!isDark);

  const handleCreateScenario = () => {
    const name = prompt('Enter new scenario name (cloned from current):');
    if (name) {
      createScenario(name);
    }
  };

  return (
    <div className="min-h-screen bg-slate-50 dark:bg-slate-900 transition-colors selection:bg-brand-500/30">
      <header className="bg-white/80 dark:bg-slate-950/80 backdrop-blur-md border-b border-slate-200 dark:border-slate-800 sticky top-0 z-20 print:hidden">
        <div className="max-w-screen-2xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="flex items-center justify-between h-16">
            <div className="flex items-center gap-3">
              <div className="bg-brand-500 p-2 rounded-lg text-white shadow-lg shadow-brand-500/20">
                <Ship size={24} />
              </div>
              <h1 className="text-xl font-bold text-slate-900 dark:text-white tracking-tight">
                {import.meta.env.VITE_APP_TITLE || 'ShipCost Optimizer'}
              </h1>
            </div>
            
            <div className="flex items-center gap-6">
              <div className="flex items-center gap-2">
                <select
                  value={activeScenarioId}
                  onChange={(e) => setActiveScenarioId(e.target.value)}
                  className="bg-slate-100 dark:bg-slate-800 border-none text-sm rounded-md px-3 py-1.5 font-medium text-slate-700 dark:text-slate-200 focus:ring-2 focus:ring-brand-500 cursor-pointer outline-none max-w-[150px] sm:max-w-[200px] truncate"
                >
                  {scenarios.map(s => (
                    <option key={s.id} value={s.id}>{s.name}</option>
                  ))}
                </select>
                <button
                  onClick={handleCreateScenario}
                  className="text-xs flex items-center bg-slate-200 dark:bg-slate-700 hover:bg-slate-300 dark:hover:bg-slate-600 px-2.5 py-1.5 rounded-md text-slate-700 dark:text-slate-300 transition-colors cursor-pointer font-medium"
                  title="Duplicate as new scenario"
                >
                  <Download size={14} className="mr-1.5"/> Clone
                </button>
                <button
                  onClick={() => deleteScenario(activeScenarioId)}
                  className="text-xs flex items-center text-red-500 hover:bg-red-50 dark:hover:bg-red-500/10 px-2 py-1.5 rounded-md transition-colors cursor-pointer"
                  title="Delete current scenario"
                >
                  <Trash size={16} />
                </button>
              </div>

              <div className="w-px h-6 bg-slate-300 dark:bg-slate-700"></div>

              <button
                onClick={() => setIsSettingsOpen(true)}
                className="text-slate-500 hover:text-brand-500 dark:text-slate-400 dark:hover:text-brand-400 transition-colors cursor-pointer"
                title="Settings"
              >
                <SettingsIcon size={20} />
              </button>

              <button
                onClick={toggleTheme}
                className="text-slate-500 hover:text-slate-900 dark:text-slate-400 dark:hover:text-white transition-colors cursor-pointer"
                title="Toggle Theme"
              >
                {isDark ? <Sun size={20} /> : <Moon size={20} />}
              </button>
            </div>
          </div>
        </div>
      </header>
      
      {/* Print-only header */}
      <div className="hidden print:block mb-8 border-b-2 border-slate-900 pb-4">
        <h1 className="text-3xl font-bold text-slate-900">ShipCost Optimizer &ndash; Executive Summary</h1>
        <p className="text-slate-600 mt-2">Scenario: {scenarios.find(s => s.id === activeScenarioId)?.name} | Date: {new Date().toLocaleDateString()}</p>
      </div>

      <main className="max-w-screen-2xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        <div className="flex flex-col xl:flex-row gap-8 items-start">
          <div className="w-full xl:w-[450px] shrink-0 space-y-6 xl:sticky top-24 print:hidden">
            <ProductForm />
            <ShippingProfilesForm />
            <SensitivitySlider />
            <RunAnalysisButton />
          </div>
          
          <div className="flex-1 w-full min-w-0 pb-16">
            {isAnalysisFresh ? (
              <>
                <div className="flex justify-end mb-6 print:hidden">
                  <ExportButtons />
                </div>
                <ResultsPanel />
                <div className="grid grid-cols-1 2xl:grid-cols-2 gap-6 mt-6">
                  <CostComparisonChart />
                  <CostCurveChart />
                </div>
                <InventoryImpact />
                <EvaluationTable />
              </>
            ) : (
              <div className="h-full min-h-[400px] flex flex-col items-center justify-center text-slate-400 dark:text-slate-500 border-2 border-dashed border-slate-200 dark:border-slate-800 rounded-2xl print:hidden">
                <MousePointerClick size={48} className="mb-4 opacity-50" />
                <h2 className="text-xl font-semibold mb-2 text-slate-600 dark:text-slate-300">Ready for Analysis</h2>
                <p className="max-w-md text-center text-sm">
                  Configure your product parameters and shipping profiles on the left, then click <strong>Run Analysis</strong> to generate optimal insights.
                </p>
              </div>
            )}
          </div>
        </div>
      </main>
      
      <SettingsPanel isOpen={isSettingsOpen} onClose={() => setIsSettingsOpen(false)} />
    </div>
  );
};

export default function App() {
  return (
    <ScenarioProvider>
      <Dashboard />
    </ScenarioProvider>
  );
}
