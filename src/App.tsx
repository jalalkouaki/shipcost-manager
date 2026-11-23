import { useEffect, useState, useRef } from 'react';
import {
  Ship,
  Moon,
  Sun,
  Download,
  Upload,
  Trash,
  Settings as SettingsIcon,
  MousePointerClick,
  AlertCircle,
  CheckCircle2,
  X
} from 'lucide-react';
import { useScenario, ScenarioProvider } from './context/ScenarioContext';
import { parseCsvToScenario } from './utils/csvImporter';
import { ProductForm } from './components/ProductForm';
import { ShippingProfilesForm } from './components/ShippingProfilesForm';
import { SensitivitySlider } from './components/SensitivitySlider';
import { MultiSkuConsolidation } from './components/MultiSkuConsolidation';
import { ResultsPanel } from './components/ResultsPanel';
import { CostComparisonChart } from './components/charts/CostComparisonChart';
import { CostCurveChart } from './components/charts/CostCurveChart';
import { SettingsPanel } from './components/SettingsPanel';
import { RunAnalysisButton } from './components/RunAnalysisButton';
import { InventoryImpact } from './components/InventoryImpact';
import { EvaluationTable } from './components/EvaluationTable';
import { ExportButtons } from './components/ExportButtons';
import { LeadTimeStockoutSimulator } from './components/LeadTimeStockoutSimulator';
import { CarbonFootprintESG } from './components/CarbonFootprintESG';
import { IncotermsComparison } from './components/IncotermsComparison';

const Dashboard = () => {
  const {
    scenarios,
    activeScenarioId,
    setActiveScenarioId,
    createScenario,
    deleteScenario,
    isAnalysisFresh,
    importScenario
  } = useScenario();

  const [isDark, setIsDark] = useState<boolean>(() => {
    if (typeof window !== 'undefined') {
      const saved = localStorage.getItem('shipcost-theme');
      if (saved) return saved === 'dark';
      return document.documentElement.classList.contains('dark') || window.matchMedia('(prefers-color-scheme: dark)').matches;
    }
    return false;
  });

  const [isSettingsOpen, setIsSettingsOpen] = useState(false);
  const fileInputRef = useRef<HTMLInputElement>(null);
  const [importNotification, setImportNotification] = useState<{
    type: 'success' | 'error';
    message: string;
  } | null>(null);

  useEffect(() => {
    const root = document.documentElement;
    if (isDark) {
      root.classList.add('dark');
      root.style.colorScheme = 'dark';
      localStorage.setItem('shipcost-theme', 'dark');
    } else {
      root.classList.remove('dark');
      root.style.colorScheme = 'light';
      localStorage.setItem('shipcost-theme', 'light');
    }
  }, [isDark]);

  const toggleTheme = () => setIsDark(prev => !prev);

  const handleCreateScenario = () => {
    const name = prompt('Enter new scenario name (cloned from current):');
    if (name) {
      createScenario(name);
    }
  };

  const handleCsvFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    // Reset input so same file can be re-selected if updated
    e.target.value = '';

    const reader = new FileReader();
    reader.onload = (event) => {
      try {
        const text = event.target?.result as string;
        const result = parseCsvToScenario(text, file.name);

        if (result.success && result.scenario) {
          importScenario(result.scenario);
          setImportNotification({
            type: 'success',
            message: `Successfully imported "${result.scenario.name}" from ${file.name}.`
          });
          setTimeout(() => setImportNotification(null), 6000);
        } else {
          const errMsg = result.error || 'Cannot read file: Unrecognized or invalid CSV format.';
          setImportNotification({
            type: 'error',
            message: errMsg
          });
          alert(errMsg);
        }
      } catch (err: any) {
        const errMsg = `Cannot read file: ${err?.message || 'Unexpected parsing error.'}`;
        setImportNotification({
          type: 'error',
          message: errMsg
        });
        alert(errMsg);
      }
    };

    reader.onerror = () => {
      const errMsg = 'Cannot read file: Failed to read file from disk.';
      setImportNotification({
        type: 'error',
        message: errMsg
      });
      alert(errMsg);
    };

    reader.readAsText(file);
  };

  return (
    <div className="min-h-screen bg-slate-50 dark:bg-slate-950 text-slate-800 dark:text-slate-200 transition-colors selection:bg-brand-500/25">
      <header className="bg-white/90 dark:bg-slate-900/90 backdrop-blur-md border-b border-slate-200/80 dark:border-slate-800 sticky top-0 z-20 print:hidden shadow-sm">
        <div className="max-w-screen-2xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="flex items-center justify-between h-16">
            <div className="flex items-center gap-3">
              <div className="bg-gradient-to-tr from-brand-600 to-blue-500 p-2 rounded-xl text-white shadow-md shadow-brand-500/20">
                <Ship size={22} />
              </div>
              <div>
                <div className="flex items-center gap-2">
                  <h1 className="text-lg font-extrabold text-slate-900 dark:text-white tracking-tight">
                    {import.meta.env.VITE_APP_TITLE || 'ShipCost Optimizer'}
                  </h1>
                </div>
                <p className="text-[11px] text-slate-500 dark:text-slate-400 -mt-0.5 hidden sm:block">
                  Logistics & Landed Cost Optimization
                </p>
              </div>
            </div>

            <div className="flex items-center gap-3 sm:gap-6">
              <div className="flex items-center gap-2">
                <select
                  value={activeScenarioId}
                  onChange={(e) => setActiveScenarioId(e.target.value)}
                  className="bg-slate-100 hover:bg-slate-200/80 dark:bg-slate-800 dark:hover:bg-slate-700/80 border border-slate-200 dark:border-slate-700 text-xs sm:text-sm rounded-lg px-3 py-1.5 font-semibold text-slate-700 dark:text-slate-200 focus:ring-2 focus:ring-brand-500 cursor-pointer outline-none max-w-[130px] sm:max-w-[190px] truncate transition-colors"
                >
                  {scenarios.map(s => (
                    <option key={s.id} value={s.id}>{s.name}</option>
                  ))}
                </select>

                <button
                  onClick={handleCreateScenario}
                  className="text-xs flex items-center bg-slate-100 dark:bg-slate-800 hover:bg-slate-200 dark:hover:bg-slate-700 border border-slate-200 dark:border-slate-700 px-2.5 py-1.5 rounded-lg text-slate-700 dark:text-slate-200 transition-colors cursor-pointer font-semibold"
                  title="Duplicate as new scenario"
                >
                  <Download size={13} className="mr-1 text-brand-600 dark:text-brand-400" /> Clone
                </button>

                {/* Hidden CSV file input */}
                <input
                  type="file"
                  ref={fileInputRef}
                  onChange={handleCsvFileChange}
                  accept=".csv,text/csv"
                  className="hidden"
                />

                <button
                  onClick={() => fileInputRef.current?.click()}
                  className="text-xs flex items-center bg-brand-50 dark:bg-brand-950/60 hover:bg-brand-100 dark:hover:bg-brand-900/40 text-brand-700 dark:text-brand-300 border border-brand-200/70 dark:border-brand-800/80 px-2.5 py-1.5 rounded-lg transition-colors cursor-pointer font-semibold"
                  title="Import scenario or SKUs from CSV file"
                >
                  <Upload size={13} className="mr-1 text-brand-600 dark:text-brand-400" />
                  <span>Import</span>
                </button>

                <button
                  onClick={() => deleteScenario(activeScenarioId)}
                  className="text-xs flex items-center text-red-500 hover:bg-red-50 dark:hover:bg-red-500/10 p-1.5 rounded-lg transition-colors cursor-pointer"
                  title="Delete current scenario"
                >
                  <Trash size={15} />
                </button>
              </div>

              <div className="w-px h-5 bg-slate-200 dark:border-slate-800"></div>

              <div className="flex items-center gap-1.5">
                <button
                  onClick={() => setIsSettingsOpen(true)}
                  className="p-1.5 text-slate-500 hover:text-slate-900 dark:text-slate-400 dark:hover:text-white rounded-lg hover:bg-slate-100 dark:hover:bg-slate-800 transition-colors cursor-pointer"
                  title="Settings"
                >
                  <SettingsIcon size={18} />
                </button>

                <button
                  onClick={toggleTheme}
                  className="p-1.5 text-slate-500 hover:text-slate-900 dark:text-slate-400 dark:hover:text-white rounded-lg hover:bg-slate-100 dark:hover:bg-slate-800 transition-colors cursor-pointer"
                  title="Toggle Theme"
                >
                  {isDark ? <Sun size={18} /> : <Moon size={18} />}
                </button>
              </div>
            </div>
          </div>
        </div>
      </header>

      {/* CSV Import Notification Banner */}
      {importNotification && (
        <div className="max-w-screen-2xl mx-auto px-4 sm:px-6 lg:px-8 mt-4 animate-in fade-in slide-in-from-top-2 duration-150 print:hidden">
          <div
            className={`p-3.5 rounded-xl border flex items-center justify-between gap-3 text-xs font-semibold shadow-sm ${
              importNotification.type === 'error'
                ? 'bg-red-50 dark:bg-red-950/70 border-red-200 dark:border-red-900/80 text-red-700 dark:text-red-300'
                : 'bg-emerald-50 dark:bg-emerald-950/70 border-emerald-200 dark:border-emerald-900/80 text-emerald-700 dark:text-emerald-300'
            }`}
          >
            <div className="flex items-center gap-2">
              {importNotification.type === 'error' ? (
                <AlertCircle size={16} className="text-red-500 shrink-0" />
              ) : (
                <CheckCircle2 size={16} className="text-emerald-500 shrink-0" />
              )}
              <span>{importNotification.message}</span>
            </div>
            <button
              onClick={() => setImportNotification(null)}
              className="p-1 rounded hover:bg-black/5 dark:hover:bg-white/10 transition-colors cursor-pointer"
              title="Dismiss"
            >
              <X size={14} />
            </button>
          </div>
        </div>
      )}

      {/* Print-only header */}
      <div className="hidden print:block mb-8 border-b-2 border-slate-900 pb-4">
        <h1 className="text-3xl font-extrabold text-slate-900">ShipCost Optimizer &ndash; Executive Summary</h1>
        <p className="text-slate-600 mt-2">
          Scenario: {scenarios.find(s => s.id === activeScenarioId)?.name} | Date: {new Date().toLocaleDateString()}
        </p>
      </div>

      <main className="max-w-screen-2xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        <div className="flex flex-col xl:flex-row gap-8 items-start">
          {/* Left Column Controls */}
          <div className="w-full xl:w-[460px] shrink-0 space-y-6 xl:sticky top-24 print:hidden">
            <ProductForm />
            <ShippingProfilesForm />
            <SensitivitySlider />
            <MultiSkuConsolidation />
            <RunAnalysisButton />
          </div>

          {/* Results Column */}
          <div className="flex-1 w-full min-w-0 pb-16">
            {isAnalysisFresh ? (
              <>
                {/* Export Options */}
                <div className="flex flex-wrap items-center justify-between gap-4 mb-6 print:hidden bg-white dark:bg-slate-900 p-4 rounded-2xl border border-slate-200/80 dark:border-slate-800 shadow-sm">
                  <div>
                    <h2 className="text-sm font-bold text-slate-900 dark:text-slate-100 tracking-tight">
                      Export Reports
                    </h2>
                    <p className="text-xs text-slate-500 dark:text-slate-400">
                      Export reports to Excel, Braille, Markdown, or JSON
                    </p>
                  </div>
                  <ExportButtons />
                </div>

                {/* Primary Results */}
                <ResultsPanel />

                {/* Charts */}
                <div className="grid grid-cols-1 2xl:grid-cols-2 gap-6 mt-6">
                  <CostComparisonChart />
                  <CostCurveChart />
                </div>

                {/* Incoterms Matrix */}
                <IncotermsComparison />

                {/* Lead Time & Stockout Simulator */}
                <LeadTimeStockoutSimulator />

                {/* Scope 3 Carbon Emissions */}
                <CarbonFootprintESG />

                {/* Working Capital & Cycle Stock */}
                <InventoryImpact />

                {/* Evaluation Table */}
                <EvaluationTable />
              </>
            ) : (
              <div className="h-full min-h-[460px] flex flex-col items-center justify-center text-slate-400 dark:text-slate-500 border-2 border-dashed border-slate-200 dark:border-slate-800 rounded-3xl print:hidden bg-white/40 dark:bg-slate-900/30 p-8">
                <div className="w-16 h-16 rounded-2xl bg-brand-50 dark:bg-brand-950/60 text-brand-600 dark:text-brand-400 flex items-center justify-center mb-4 shadow-inner">
                  <MousePointerClick size={32} />
                </div>
                <h2 className="text-xl font-bold mb-2 text-slate-800 dark:text-slate-200 tracking-tight">
                  Ready for Logistics Analysis
                </h2>
                <p className="max-w-md text-center text-sm text-slate-500 dark:text-slate-400 leading-relaxed">
                  Configure your product financials, shipping profiles, and container constraints on the left, then click{' '}
                  <strong className="text-brand-600 dark:text-brand-400 font-semibold">Run EOQ Optimization</strong> to evaluate landed costs, ESG emissions, and stockout risks.
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
