import React, { useMemo } from 'react';
import { LineChart, Line, XAxis, YAxis, CartesianGrid, Tooltip, Legend, ResponsiveContainer, ReferenceDot } from 'recharts';
import { useScenario } from '../../context/ScenarioContext';

const colors = ['#6366f1', '#10b981', '#f59e0b', '#ec4899', '#8b5cf6'];

export const CostCurveChart: React.FC = () => {
  const { activeScenario, results } = useScenario();

  if (!activeScenario || Object.keys(results).length === 0) return null;

  const data = useMemo(() => {
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

  return (
    <div className="bg-white dark:bg-slate-800 p-6 rounded-xl border border-slate-200 dark:border-slate-700 shadow-sm transition-colors mt-6 h-[450px]">
      <h3 className="text-lg font-semibold mb-6 text-slate-900 dark:text-white">Total Cost Curves (Total Cost vs Order Quantity)</h3>
      <div className="h-[350px] w-full">
        <ResponsiveContainer width="100%" height="100%">
          <LineChart
            data={data}
            margin={{ top: 20, right: 30, left: 20, bottom: 20 }}
          >
            <CartesianGrid strokeDasharray="3 3" stroke="#64748b" opacity={0.2} vertical={false} />
            <XAxis 
              dataKey="q" 
              stroke="#94a3b8" 
              tick={{ fill: '#94a3b8' }} 
              axisLine={{ stroke: '#64748b', opacity: 0.2 }} 
              tickLine={false} 
              type="number"
              domain={['dataMin', 'dataMax']}
              tickFormatter={(val) => val.toLocaleString()}
              label={{ value: 'Order Quantity (Q)', position: 'insideBottom', offset: -10, fill: '#94a3b8' }}
            />
            <YAxis 
              stroke="#94a3b8" 
              tick={{ fill: '#94a3b8' }} 
              tickFormatter={(value) => `$${value.toLocaleString()}`} 
              axisLine={false} 
              tickLine={false} 
              domain={['auto', 'auto']}
            />
            <Tooltip 
              labelFormatter={(label) => `Order Quantity: ${Number(label).toLocaleString()}`}
              formatter={(value: any, name: any) => [`$${Number(value).toLocaleString(undefined, { minimumFractionDigits: 2, maximumFractionDigits: 2 })}`, name]}
              contentStyle={{ backgroundColor: '#1e293b', border: '1px solid #334155', borderRadius: '8px', color: '#f8fafc' }}
              itemStyle={{ color: '#f8fafc' }}
            />
            <Legend wrapperStyle={{ paddingTop: '20px' }} />
            
            {activeScenario.profiles.map((p, idx) => (
              <Line 
                key={p.id}
                type="monotone" 
                dataKey={`${p.name}`} 
                stroke={colors[idx % colors.length]} 
                strokeWidth={3}
                dot={false}
                activeDot={{ r: 6, strokeWidth: 0 }}
                connectNulls={false}
              />
            ))}
            
            {activeScenario.profiles.map((p, idx) => {
              const res = results[p.id];
              if (!res) return null;
              return (
                <ReferenceDot 
                  key={`ref-${p.id}`}
                  x={res.optimalQ} 
                  y={res.minTotalCost} 
                  r={6} 
                  fill={colors[idx % colors.length]} 
                  stroke="#fff" 
                  strokeWidth={2} 
                />
              );
            })}
          </LineChart>
        </ResponsiveContainer>
      </div>
    </div>
  );
};
