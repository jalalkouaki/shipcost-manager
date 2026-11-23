import React from 'react';
import { BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, Legend, ResponsiveContainer } from 'recharts';
import { useScenario } from '../../context/ScenarioContext';
import { BarChart3 } from 'lucide-react';
import { formatCurrency, formatCompactCurrency } from '../../utils/format';

export const CostComparisonChart: React.FC = () => {
  const { activeScenario, results, settings } = useScenario();

  if (!activeScenario || Object.keys(results).length === 0) return null;

  const data = activeScenario.profiles.map(p => {
    const res = results[p.id];
    return {
      name: p.name,
      'Freight Spend': res?.shippingCost || 0,
      'Holding Cost': res?.holdingCost || 0,
    };
  });

  const currencySymbol = settings?.currency || 'MAD';

  return (
    <div className="bg-white dark:bg-slate-900 p-6 rounded-2xl border border-slate-200/80 dark:border-slate-800 shadow-sm transition-colors mt-6 h-[420px] flex flex-col justify-between">
      <div className="flex items-center justify-between mb-4">
        <div className="flex items-center gap-2">
          <div className="p-1.5 rounded-lg bg-brand-50 dark:bg-brand-950/60 text-brand-600 dark:text-brand-400">
            <BarChart3 size={18} />
          </div>
          <div>
            <h3 className="text-base font-bold text-slate-900 dark:text-slate-100">
              Annual Cost Breakdown Comparison
            </h3>
            <p className="text-xs text-slate-500 dark:text-slate-400">
              Stacked freight spend vs. inventory carrying cost
            </p>
          </div>
        </div>
      </div>

      <div className="h-[310px] w-full">
        <ResponsiveContainer width="100%" height="100%">
          <BarChart
            data={data}
            margin={{ top: 20, right: 30, left: 20, bottom: 5 }}
          >
            <CartesianGrid strokeDasharray="3 3" stroke="#94a3b8" opacity={0.15} vertical={false} />
            <XAxis
              dataKey="name"
              stroke="#64748b"
              tick={{ fill: '#64748b', fontSize: 12, fontWeight: 500 }}
              axisLine={{ stroke: '#cbd5e1', opacity: 0.4 }}
              tickLine={false}
            />
            <YAxis
              stroke="#64748b"
              tick={{ fill: '#64748b', fontSize: 12, fontWeight: 500 }}
              tickFormatter={(value) => formatCompactCurrency(value, currencySymbol)}
              axisLine={false}
              tickLine={false}
            />
            <Tooltip
              formatter={(value: any) => [
                formatCurrency(Number(value), currencySymbol),
                undefined
              ]}
              contentStyle={{
                backgroundColor: '#0f172a',
                border: '1px solid #1e293b',
                borderRadius: '10px',
                color: '#f8fafc',
                boxShadow: '0 10px 25px -5px rgba(0, 0, 0, 0.4)',
                fontSize: '12px'
              }}
              itemStyle={{ color: '#f8fafc' }}
            />
            <Legend
              wrapperStyle={{ paddingTop: '16px', fontSize: '12px', fontWeight: 500 }}
            />
            <Bar dataKey="Freight Spend" stackId="a" fill="#2563eb" radius={[0, 0, 6, 6]} maxBarSize={56} />
            <Bar dataKey="Holding Cost" stackId="a" fill="#059669" radius={[6, 6, 0, 0]} maxBarSize={56} />
          </BarChart>
        </ResponsiveContainer>
      </div>
    </div>
  );
};
