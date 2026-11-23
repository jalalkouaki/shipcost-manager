import React, { useState, useRef, useEffect } from 'react';
import { useScenario } from '../context/ScenarioContext';
import {
  FileSpreadsheet,
  FileText,
  Download,
  BookOpen,
  Code,
  FileCode,
  ChevronDown,
  Check
} from 'lucide-react';
import {
  exportToExcel,
  exportToBraille,
  exportToMarkdown,
  exportToJSON,
  exportToCSV,
  exportToPDF,
  type ExportContext
} from '../utils/exportReport';

export const ExportButtons: React.FC = () => {
  const { activeScenario, results, isAnalysisFresh, settings, demandMultiplier } = useScenario();
  const [isOpen, setIsOpen] = useState(false);
  const [lastExported, setLastExported] = useState<string | null>(null);
  const dropdownRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    const handleClickOutside = (e: MouseEvent) => {
      if (dropdownRef.current && !dropdownRef.current.contains(e.target as Node)) {
        setIsOpen(false);
      }
    };
    document.addEventListener('mousedown', handleClickOutside);
    return () => document.removeEventListener('mousedown', handleClickOutside);
  }, []);

  if (!activeScenario || !isAnalysisFresh || Object.keys(results).length === 0) return null;

  const context: ExportContext = {
    activeScenario,
    results,
    settings,
    demandMultiplier,
  };

  const handleAction = (label: string, action: () => void) => {
    action();
    setLastExported(label);
    setIsOpen(false);
    setTimeout(() => setLastExported(null), 3000);
  };

  return (
    <div className="flex flex-wrap items-center gap-2 print:hidden" ref={dropdownRef}>
      {/* Primary Excel Button */}
      <button
        onClick={() => handleAction('Excel', () => exportToExcel(context))}
        className="flex items-center gap-2 px-3.5 py-2 bg-emerald-600 hover:bg-emerald-700 active:bg-emerald-800 text-white rounded-lg text-sm font-semibold transition-all shadow-sm shadow-emerald-600/20 cursor-pointer"
        title="Export multi-sheet financial model to Excel (.xlsx)"
      >
        <FileSpreadsheet size={16} className="shrink-0" />
        <span>Export Excel</span>
        <span className="text-[10px] font-bold tracking-wider px-1.5 py-0.5 bg-emerald-700/80 rounded uppercase">
          .XLSX
        </span>
      </button>

      {/* Braille Accessibility Button */}
      <button
        onClick={() => handleAction('Braille', () => exportToBraille(context))}
        className="flex items-center gap-2 px-3.5 py-2 bg-violet-600 hover:bg-violet-700 active:bg-violet-800 text-white rounded-lg text-sm font-semibold transition-all shadow-sm shadow-violet-600/20 cursor-pointer"
        title="Export tactile Grade-1 UEB Braille and embossable .brf file"
      >
        <BookOpen size={16} className="shrink-0" />
        <span>Braille Report</span>
        <span className="text-[10px] font-bold tracking-wider px-1.5 py-0.5 bg-violet-700/80 rounded uppercase">
          .BRF
        </span>
      </button>

      {/* PDF Button */}
      <button
        onClick={() => handleAction('PDF', () => exportToPDF())}
        className="flex items-center gap-2 px-3 py-2 bg-slate-100 hover:bg-slate-200 dark:bg-slate-800 dark:hover:bg-slate-700 text-slate-700 dark:text-slate-200 border border-slate-200 dark:border-slate-700 rounded-lg text-sm font-medium transition-colors cursor-pointer"
        title="Print-ready PDF executive summary"
      >
        <FileText size={16} className="shrink-0 text-slate-500 dark:text-slate-400" />
        <span>PDF</span>
      </button>

      {/* More Formats Dropdown Menu */}
      <div className="relative">
        <button
          onClick={() => setIsOpen(!isOpen)}
          className="flex items-center gap-1.5 px-3 py-2 bg-slate-100 hover:bg-slate-200 dark:bg-slate-800 dark:hover:bg-slate-700 text-slate-700 dark:text-slate-200 border border-slate-200 dark:border-slate-700 rounded-lg text-sm font-medium transition-colors cursor-pointer"
          title="More export options"
        >
          <span>More Formats</span>
          <ChevronDown size={14} className={`transition-transform duration-200 ${isOpen ? 'rotate-180' : ''}`} />
        </button>

        {isOpen && (
          <div className="absolute right-0 mt-2 w-64 bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-xl shadow-xl z-50 py-1.5 animate-in fade-in slide-in-from-top-2 duration-150">
            <div className="px-3 py-2 border-b border-slate-100 dark:border-slate-800">
              <span className="text-[11px] font-semibold text-slate-400 dark:text-slate-500 uppercase tracking-wider">
                Additional Formats
              </span>
            </div>

            {/* Markdown Executive Brief (Choice format) */}
            <button
              onClick={() => handleAction('Markdown', () => exportToMarkdown(context))}
              className="w-full flex items-start gap-3 px-3.5 py-2.5 text-left text-sm hover:bg-slate-50 dark:hover:bg-slate-800/70 transition-colors cursor-pointer group"
            >
              <FileCode size={18} className="text-brand-500 mt-0.5 shrink-0" />
              <div>
                <div className="font-semibold text-slate-800 dark:text-slate-200 flex items-center gap-1.5">
                  Executive Brief
                  <span className="text-[10px] bg-brand-100 dark:bg-brand-900/40 text-brand-700 dark:text-brand-300 font-bold px-1.5 py-0.2 rounded">
                    .MD
                  </span>
                </div>
                <div className="text-xs text-slate-500 dark:text-slate-400">
                  Notion & GitHub-ready Markdown summary
                </div>
              </div>
            </button>

            {/* CSV Format */}
            <button
              onClick={() => handleAction('CSV', () => exportToCSV(context))}
              className="w-full flex items-start gap-3 px-3.5 py-2.5 text-left text-sm hover:bg-slate-50 dark:hover:bg-slate-800/70 transition-colors cursor-pointer"
            >
              <Download size={18} className="text-blue-500 mt-0.5 shrink-0" />
              <div>
                <div className="font-semibold text-slate-800 dark:text-slate-200 flex items-center gap-1.5">
                  Standard CSV
                  <span className="text-[10px] bg-blue-100 dark:bg-blue-900/40 text-blue-700 dark:text-blue-300 font-bold px-1.5 py-0.2 rounded">
                    .CSV
                  </span>
                </div>
                <div className="text-xs text-slate-500 dark:text-slate-400">
                  Comma-separated profile metrics
                </div>
              </div>
            </button>

            {/* JSON Dataset */}
            <button
              onClick={() => handleAction('JSON', () => exportToJSON(context))}
              className="w-full flex items-start gap-3 px-3.5 py-2.5 text-left text-sm hover:bg-slate-50 dark:hover:bg-slate-800/70 transition-colors cursor-pointer"
            >
              <Code size={18} className="text-amber-500 mt-0.5 shrink-0" />
              <div>
                <div className="font-semibold text-slate-800 dark:text-slate-200 flex items-center gap-1.5">
                  Raw JSON Dataset
                  <span className="text-[10px] bg-amber-100 dark:bg-amber-900/40 text-amber-700 dark:text-amber-300 font-bold px-1.5 py-0.2 rounded">
                    .JSON
                  </span>
                </div>
                <div className="text-xs text-slate-500 dark:text-slate-400">
                  Machine-readable schema for API pipelines
                </div>
              </div>
            </button>
          </div>
        )}
      </div>

      {/* Confirmation Pill when user downloads */}
      {lastExported && (
        <div className="flex items-center gap-1 text-xs font-semibold text-emerald-600 dark:text-emerald-400 bg-emerald-50 dark:bg-emerald-950/40 px-2.5 py-1.5 rounded-md border border-emerald-200 dark:border-emerald-800/60 animate-in fade-in duration-200">
          <Check size={14} />
          {lastExported} downloaded
        </div>
      )}
    </div>
  );
};
