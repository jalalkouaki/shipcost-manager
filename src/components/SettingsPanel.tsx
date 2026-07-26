import React, { useState, useEffect } from 'react';
import { useScenario } from '../context/ScenarioContext';
import { X, Save } from 'lucide-react';

export const SettingsPanel: React.FC<{ isOpen: boolean; onClose: () => void }> = ({ isOpen, onClose }) => {
  const { activeScenario, settings, updateSettings, renameActiveScenario } = useScenario();
  
  const [scenarioName, setScenarioName] = useState('');
  const [currency, setCurrency] = useState('');
  const [defaultHolding, setDefaultHolding] = useState(20);

  useEffect(() => {
    if (isOpen && activeScenario) {
      setScenarioName(activeScenario.name);
      setCurrency(settings.currency);
      setDefaultHolding(settings.defaultHoldingRate);
    }
  }, [isOpen, activeScenario, settings]);

  if (!isOpen || !activeScenario) return null;

  const handleSave = () => {
    if (scenarioName.trim()) {
      renameActiveScenario(scenarioName.trim());
    }
    updateSettings({ currency: currency.trim() || '$', defaultHoldingRate: defaultHolding });
    onClose();
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-900/50 backdrop-blur-sm">
      <div className="bg-white dark:bg-slate-800 rounded-xl shadow-2xl w-full max-w-md overflow-hidden border border-slate-200 dark:border-slate-700">
        <div className="flex items-center justify-between p-4 border-b border-slate-200 dark:border-slate-700">
          <h2 className="text-lg font-bold text-slate-900 dark:text-white">Settings</h2>
          <button onClick={onClose} className="text-slate-500 hover:text-slate-700 dark:text-slate-400 dark:hover:text-slate-200 cursor-pointer">
            <X size={20} />
          </button>
        </div>
        
        <div className="p-6 space-y-6">
          <div>
            <label className="block text-sm font-medium text-slate-700 dark:text-slate-300 mb-1">Active Scenario Name</label>
            <input
              type="text"
              value={scenarioName}
              onChange={(e) => setScenarioName(e.target.value)}
              className="w-full px-3 py-2 border border-slate-300 dark:border-slate-600 rounded-md bg-transparent text-slate-900 dark:text-white focus:outline-none focus:ring-2 focus:ring-brand-500"
            />
          </div>
          
          <div>
            <label className="block text-sm font-medium text-slate-700 dark:text-slate-300 mb-1">Currency Symbol</label>
            <input
              type="text"
              value={currency}
              onChange={(e) => setCurrency(e.target.value)}
              className="w-full px-3 py-2 border border-slate-300 dark:border-slate-600 rounded-md bg-transparent text-slate-900 dark:text-white focus:outline-none focus:ring-2 focus:ring-brand-500"
              maxLength={5}
            />
          </div>
          
          <div>
            <label className="block text-sm font-medium text-slate-700 dark:text-slate-300 mb-1">Default Holding Rate (%)</label>
            <input
              type="number"
              min="0"
              max="100"
              step="0.1"
              value={defaultHolding}
              onChange={(e) => setDefaultHolding(parseFloat(e.target.value) || 0)}
              className="w-full px-3 py-2 border border-slate-300 dark:border-slate-600 rounded-md bg-transparent text-slate-900 dark:text-white focus:outline-none focus:ring-2 focus:ring-brand-500"
            />
            <p className="text-xs text-slate-500 mt-1">Applies to newly created scenarios.</p>
          </div>
        </div>
        
        <div className="p-4 bg-slate-50 dark:bg-slate-900 border-t border-slate-200 dark:border-slate-700 flex justify-end gap-3">
          <button 
            onClick={onClose}
            className="px-4 py-2 rounded-md font-medium text-slate-600 dark:text-slate-300 hover:bg-slate-200 dark:hover:bg-slate-800 transition-colors cursor-pointer"
          >
            Cancel
          </button>
          <button 
            onClick={handleSave}
            className="px-4 py-2 rounded-md font-medium text-white bg-brand-500 hover:bg-brand-600 transition-colors flex items-center gap-2 cursor-pointer shadow-md shadow-brand-500/20"
          >
            <Save size={16} /> Save Changes
          </button>
        </div>
      </div>
    </div>
  );
};
