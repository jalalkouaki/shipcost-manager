import React from 'react';
import { BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, Legend, ResponsiveContainer } from 'recharts';
import { useScenario } from '../../context/ScenarioContext';

export const CostComparisonChart: React.FC = () => {
  const { activeScenario, results } = useScenario();

  if (!activeScenario || Object.keys(results).length === 0) return null;

  const data = activeScenario.profiles.map(p => {
    const res = results[p.id];
    return {
      name: p.name,
      'Freight Spend': res?.shippingCost || 0,
      'Holding Cost': res?.holdingCost || 0,
    };
  });

  return (
    <div className="bg-white dark:bg-slate-800 p-6 rounded-xl border border-slate-200 dark:border-slate-700 shadow-sm transition-colors mt-6 h-[400px]">
      <h3 className="text-lg font-semibold mb-6 text-slate-900 dark:text-white">Cost Breakdown Comparison</h3>
      <div className="h-[300px] w-full">
        <ResponsiveContainer width="100%" height="100%">
          <BarChart
            data={data}
            margin={{ top: 20, right: 30, left: 20, bottom: 5 }}
          >
            <CartesianGrid strokeDasharray="3 3" stroke="#64748b" opacity={0.2} vertical={false} />
            <XAxis dataKey="name" stroke="#94a3b8" tick={{ fill: '#94a3b8' }} axisLine={{ stroke: '#64748b', opacity: 0.2 }} tickLine={false} />
            <YAxis stroke="#94a3b8" tick={{ fill: '#94a3b8' }} tickFormatter={(value) => `$${value.toLocaleString()}`} axisLine={false} tickLine={false} />
            <Tooltip 
              formatter={(value: any) => [`$${Number(value).toLocaleString(undefined, { minimumFractionDigits: 2, maximumFractionDigits: 2 })}`, undefined]}
              contentStyle={{ backgroundColor: '#1e293b', border: '1px solid #334155', borderRadius: '8px', color: '#f8fafc' }}
              itemStyle={{ color: '#f8fafc' }}
            />
            <Legend wrapperStyle={{ paddingTop: '20px' }} />
            <Bar dataKey="Freight Spend" stackId="a" fill="#3b82f6" radius={[0, 0, 4, 4]} maxBarSize={60} />
            <Bar dataKey="Holding Cost" stackId="a" fill="#f97316" radius={[4, 4, 0, 0]} maxBarSize={60} />
          </BarChart>
        </ResponsiveContainer>
      </div>
    </div>
  );
};
