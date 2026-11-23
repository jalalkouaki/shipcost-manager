import React, { useMemo } from 'react';
import { LineChart, Line, XAxis, YAxis, CartesianGrid, Tooltip, Legend, ResponsiveContainer, ReferenceDot } from 'recharts';
import { useScenario } from '../../context/ScenarioContext';
import { LineChart as LineChartIcon } from 'lucide-react';
import { formatCurrency, formatCompactCurrency } from '../../utils/format';

const EXECUTIVE_PALETTE = ['#2563eb', '#059669', '#d97706', '#7c3aed', '#0891b2', '#db2777'];

export const CostCurveChart: React.FC = () => {
  const { activeScenario, results, settings } = useScenario();

  const data = useMemo(() => {
    if (!activeScenario || !results) return [];
    const allQs = new Set<number>();
    activeScenario.profiles.forEach(p => {
      const curve = results[p.id]?.costCurve || [];
      curve.forEach(pt => allQs.add(pt.q));
    });

    const sortedQs = Array.from(allQs).sort((a, b) => a - b);

    return sortedQs.map(q => {
      const dataPoint: any = { q };
      activeScenario.profiles.forEach(p => {
        const curve = results[p.id]?.costCurve || [];
        const exact = curve.find(pt => pt.q === q);
        if (exact) {
          dataPoint[`${p.name}`] = exact.totalCost;
        }
      });
      return dataPoint;
    });
  }, [activeScenario, results]);

  if (!activeScenario || Object.keys(results).length === 0) return null;

  const currencySymbol = settings?.currency || 'MAD';

  return (
    <div className="bg-white dark:bg-slate-900 p-6 rounded-2xl border border-slate-200/80 dark:border-slate-800 shadow-sm transition-colors mt-6 h-[420px] flex flex-col justify-between">
      <div className="flex items-center justify-between mb-4">
        <div className="flex items-center gap-2">
          <div className="p-1.5 rounded-lg bg-emerald-50 dark:bg-emerald-950/60 text-emerald-600 dark:text-emerald-400">
            <LineChartIcon size={18} />
          </div>
          <div>
            <h3 className="text-base font-bold text-slate-900 dark:text-slate-100">
              Total Cost Curves (EOQ Convexity)
            </h3>
            <p className="text-xs text-slate-500 dark:text-slate-400">
              Total annual expenditure vs. order quantity Q (minimum marks EOQ)
            </p>
          </div>
        </div>
      </div>

      <div className="h-[310px] w-full">
        <ResponsiveContainer width="100%" height="100%">
          <LineChart
            data={data}
            margin={{ top: 20, right: 30, left: 20, bottom: 20 }}
          >
            <CartesianGrid strokeDasharray="3 3" stroke="#94a3b8" opacity={0.15} vertical={false} />
            <XAxis
              dataKey="q"
              stroke="#64748b"
              tick={{ fill: '#64748b', fontSize: 12, fontWeight: 500 }}
              axisLine={{ stroke: '#cbd5e1', opacity: 0.4 }}
              tickLine={false}
              type="number"
              domain={['dataMin', 'dataMax']}
              tickFormatter={(val) => val >= 1000 ? `${(val / 1000).toFixed(0)}k` : val.toLocaleString()}
              label={{ value: 'Order Quantity (Q)', position: 'insideBottom', offset: -10, fill: '#64748b', fontSize: 11 }}
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
              labelFormatter={(label) => `Order Size: ${Number(label).toLocaleString()} units`}
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
            <Legend wrapperStyle={{ paddingTop: '10px', fontSize: '12px', fontWeight: 500 }} />

            {activeScenario.profiles.map((p, idx) => {
              const res = results[p.id];
              const color = EXECUTIVE_PALETTE[idx % EXECUTIVE_PALETTE.length];

              return (
                <React.Fragment key={p.id}>
                  <Line
                    type="monotone"
                    dataKey={p.name}
                    stroke={color}
                    strokeWidth={2.5}
                    dot={false}
                    activeDot={{ r: 5, strokeWidth: 2, stroke: '#ffffff' }}
                  />
                  {res && (
                    <ReferenceDot
                      x={res.optimalQ}
                      y={res.minTotalCost}
                      r={6}
                      fill={color}
                      stroke="#ffffff"
                      strokeWidth={2}
                    />
                  )}
                </React.Fragment>
              );
            })}
          </LineChart>
        </ResponsiveContainer>
      </div>
    </div>
  );
};
