import React from 'react';
import { useScenario } from '../context/ScenarioContext';
import { FileText, Download } from 'lucide-react';

export const ExportButtons: React.FC = () => {
  const { activeScenario, results, isAnalysisFresh } = useScenario();

  if (!activeScenario || !isAnalysisFresh || Object.keys(results).length === 0) return null;

  const handleExportCSV = () => {
    const headers = [
      'Profile Name',
      'Optimal Order Quantity',
      'Total Annual Cost',
      'Annual Freight Cost',
      'Annual Holding Cost',
      'Average Inventory Value',
      'Cash Tied Up',
      'Days of Inventory',
      'Landed Unit Cost'
    ];

    const rows = activeScenario.profiles.map(p => {
      const res = results[p.id];
      if (!res) return [];
      return [
        `"${p.name}"`,
        res.optimalQ,
        res.minTotalCost.toFixed(2),
        res.shippingCost.toFixed(2),
        res.holdingCost.toFixed(2),
        res.avgInventoryValue.toFixed(2),
        res.cashTiedUp.toFixed(2),
        res.daysOfInventory.toFixed(2),
        res.effectiveLandedCost.toFixed(2)
      ];
    });

    const csvContent = [
      headers.join(','),
      ...rows.map(r => r.join(','))
    ].join('\n');

    const blob = new Blob([csvContent], { type: 'text/csv;charset=utf-8;' });
    const url = URL.createObjectURL(blob);
    const link = document.createElement('a');
    
    // Sanitize filename
    const safeName = activeScenario.name.replace(/[^a-z0-9]/gi, '_').toLowerCase();
    link.setAttribute('href', url);
    link.setAttribute('download', `shipcost_summary_${safeName}.csv`);
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
  };

  const handleExportPDF = () => {
    window.print();
  };

  return (
    <div className="flex gap-3 print:hidden">
      <button 
        onClick={handleExportPDF}
        className="flex items-center gap-2 px-4 py-2 bg-slate-100 dark:bg-slate-800 hover:bg-slate-200 dark:hover:bg-slate-700 text-slate-700 dark:text-slate-300 rounded-lg text-sm font-medium transition-colors cursor-pointer"
      >
        <FileText size={16} /> Export as PDF
      </button>
      <button 
        onClick={handleExportCSV}
        className="flex items-center gap-2 px-4 py-2 bg-slate-100 dark:bg-slate-800 hover:bg-slate-200 dark:hover:bg-slate-700 text-slate-700 dark:text-slate-300 rounded-lg text-sm font-medium transition-colors cursor-pointer"
      >
        <Download size={16} /> Export as CSV
      </button>
    </div>
  );
};
