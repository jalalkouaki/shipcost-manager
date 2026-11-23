import React, { useState, useEffect } from 'react';
import { useScenario } from '../context/ScenarioContext';
import { X, Save, SlidersHorizontal, DollarSign } from 'lucide-react';

export interface CurrencyPreset {
  code: string;
  symbol: string;
  label: string;
  region: string;
}

export const CURRENCY_PRESETS: CurrencyPreset[] = [
  { code: 'MAD', symbol: 'MAD', label: 'MAD – Moroccan Dirham (درهم مغربي)', region: 'Morocco' },
  { code: '$', symbol: '$', label: '$ – US Dollar (USD)', region: 'United States' },
  { code: '€', symbol: '€', label: '€ – Euro (EUR)', region: 'European Union' },
  { code: 'SAR', symbol: 'SAR', label: 'SAR – Saudi Arabian Riyal (ريال سعودي)', region: 'Saudi Arabia' },
  { code: 'AED', symbol: 'AED', label: 'AED – United Arab Emirates Dirham (درهم إماراتي)', region: 'United Arab Emirates' },
  { code: '¥', symbol: '¥', label: '¥ – Japanese Yen (JPY / 円)', region: 'Japan' },
  { code: '£', symbol: '£', label: '£ – British Pound Sterling (GBP)', region: 'United Kingdom' },
  { code: 'CHF', symbol: 'CHF', label: 'CHF – Swiss Franc (Safe-Haven Currency)', region: 'Switzerland' },
];

export const SettingsPanel: React.FC<{ isOpen: boolean; onClose: () => void }> = ({ isOpen, onClose }) => {
  const { activeScenario, settings, updateSettings, renameActiveScenario } = useScenario();

  const [scenarioName, setScenarioName] = useState('');
  const [selectedCurrencyOption, setSelectedCurrencyOption] = useState('MAD');
  const [customCurrency, setCustomCurrency] = useState('');
  const [defaultHolding, setDefaultHolding] = useState(20);

  useEffect(() => {
    if (isOpen && activeScenario) {
      setScenarioName(activeScenario.name);
      const activeCurr = settings.currency || 'MAD';
      const isPreset = CURRENCY_PRESETS.some(p => p.code === activeCurr || p.symbol === activeCurr);
      if (isPreset) {
        setSelectedCurrencyOption(activeCurr);
        setCustomCurrency('');
      } else {
        setSelectedCurrencyOption('CUSTOM');
        setCustomCurrency(activeCurr);
      }
      setDefaultHolding(settings.defaultHoldingRate);
    }
  }, [isOpen, activeScenario, settings]);

  if (!isOpen || !activeScenario) return null;

  const handleSave = () => {
    if (scenarioName.trim()) {
      renameActiveScenario(scenarioName.trim());
    }

    const finalCurrency = selectedCurrencyOption === 'CUSTOM'
      ? (customCurrency.trim() || 'MAD')
      : selectedCurrencyOption;

    updateSettings({
      currency: finalCurrency,
      defaultHoldingRate: defaultHolding,
    });

    // Also persist to localStorage
    localStorage.setItem('shipcost-settings', JSON.stringify({
      ...settings,
      currency: finalCurrency,
      defaultHoldingRate: defaultHolding,
    }));

    onClose();
  };

  const inputClass =
    "w-full px-3.5 py-2.5 border border-slate-200 dark:border-slate-700/80 rounded-xl bg-slate-50/60 dark:bg-slate-950/60 text-slate-900 dark:text-slate-100 placeholder:text-slate-400 focus:outline-none focus:ring-2 focus:ring-brand-500/20 focus:border-brand-500 transition-all text-sm font-semibold";

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-950/60 backdrop-blur-sm animate-in fade-in duration-150">
      <div className="bg-white dark:bg-slate-900 rounded-2xl shadow-2xl w-full max-w-lg overflow-hidden border border-slate-200/80 dark:border-slate-800">
        <div className="flex items-center justify-between p-4 px-6 border-b border-slate-100 dark:border-slate-800">
          <div className="flex items-center gap-2">
            <div className="p-1.5 rounded-lg bg-brand-50 dark:bg-brand-950/60 text-brand-600 dark:text-brand-400">
              <SlidersHorizontal size={16} />
            </div>
            <h2 className="text-base font-bold text-slate-900 dark:text-slate-100 tracking-tight">
              Scenario & Global Settings
            </h2>
          </div>
          <button
            onClick={onClose}
            className="p-1 rounded-lg text-slate-400 hover:text-slate-700 dark:hover:text-slate-200 hover:bg-slate-100 dark:hover:bg-slate-800 transition-colors cursor-pointer"
          >
            <X size={18} />
          </button>
        </div>

        <div className="p-6 space-y-5">
          {/* Active Scenario Name */}
          <div>
            <label className="block text-xs font-semibold text-slate-600 dark:text-slate-300 mb-1.5 uppercase tracking-wider">
              Active Scenario Name
            </label>
            <input
              type="text"
              value={scenarioName}
              onChange={(e) => setScenarioName(e.target.value)}
              className={inputClass}
            />
          </div>

          {/* Currency Selection Dropdown */}
          <div>
            <label className="block text-xs font-semibold text-slate-600 dark:text-slate-300 mb-1.5 uppercase tracking-wider flex items-center gap-1.5">
              <DollarSign size={13} className="text-brand-500" />
              <span>Base Currency (Default: MAD)</span>
            </label>
            <select
              value={selectedCurrencyOption}
              onChange={(e) => {
                setSelectedCurrencyOption(e.target.value);
                if (e.target.value !== 'CUSTOM') {
                  setCustomCurrency('');
                }
              }}
              className={`${inputClass} cursor-pointer`}
            >
              {CURRENCY_PRESETS.map((curr) => (
                <option key={curr.code} value={curr.code}>
                  {curr.label}
                </option>
              ))}
              <option value="CUSTOM">Custom / Other Currency...</option>
            </select>

            {/* Custom Currency Input if selected */}
            {selectedCurrencyOption === 'CUSTOM' && (
              <div className="mt-2.5 animate-in fade-in slide-in-from-top-1 duration-150">
                <label className="block text-[11px] font-semibold text-slate-500 dark:text-slate-400 mb-1">
                  Enter Custom Currency Code or Symbol:
                </label>
                <input
                  type="text"
                  value={customCurrency}
                  onChange={(e) => setCustomCurrency(e.target.value)}
                  placeholder="e.g. CAD, AUD, SGD, DZD, TND..."
                  maxLength={6}
                  className={inputClass}
                  autoFocus
                />
              </div>
            )}
            <p className="text-[11px] text-slate-400 dark:text-slate-500 mt-1.5">
              Applies across all landed cost formulas, charts, executive exports, and simulator tables.
            </p>
          </div>

          {/* Default Holding Rate */}
          <div>
            <label className="block text-xs font-semibold text-slate-600 dark:text-slate-300 mb-1.5 uppercase tracking-wider">
              Default Annual Holding Rate (%)
            </label>
            <input
              type="number"
              min="0"
              max="100"
              step="0.5"
              value={defaultHolding}
              onChange={(e) => setDefaultHolding(parseFloat(e.target.value) || 0)}
              className={inputClass}
            />
          </div>
        </div>

        <div className="p-4 px-6 bg-slate-50/80 dark:bg-slate-950/50 border-t border-slate-100 dark:border-slate-800 flex justify-end gap-2.5">
          <button
            onClick={onClose}
            className="px-4 py-2 text-xs font-semibold text-slate-600 dark:text-slate-300 hover:bg-slate-200/60 dark:hover:bg-slate-800 rounded-xl transition-colors cursor-pointer"
          >
            Cancel
          </button>
          <button
            onClick={handleSave}
            className="flex items-center gap-1.5 px-4 py-2 bg-brand-600 hover:bg-brand-700 active:bg-brand-800 text-white text-xs font-bold rounded-xl transition-all shadow-sm shadow-brand-500/20 cursor-pointer"
          >
            <Save size={14} /> Save Configuration
          </button>
        </div>
      </div>
    </div>
  );
};
