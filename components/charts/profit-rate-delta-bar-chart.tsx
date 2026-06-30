"use client";

import { Bar, BarChart, CartesianGrid, Cell, ReferenceLine, ResponsiveContainer, Tooltip, XAxis, YAxis } from "recharts";
import { formatRatePercent, profitRateSeries, type ProfitRateData } from "@/components/charts/profit-rate-stack-chart";

export function ProfitRateDeltaBarChart({
  current,
  previous,
}: {
  current: ProfitRateData;
  previous: ProfitRateData;
}) {
  const chartData = profitRateSeries.map((item) => {
    const value = current[item.key] - previous[item.key];

    return {
      name: item.name,
      value,
      color: value >= 0 ? "#16a34a" : "#dc2626",
    };
  });

  return (
    <section className="mt-5 border border-line bg-white p-4 shadow-panel">
      <div className="mb-3 text-sm font-semibold text-ink">利润结构环比差值</div>
      <div className="h-96">
        <ResponsiveContainer height="100%" width="100%">
          <BarChart data={chartData} layout="vertical" margin={{ bottom: 0, left: 16, right: 24, top: 10 }}>
            <CartesianGrid stroke="#e2e8f0" strokeDasharray="3 3" horizontal={false} />
            <XAxis fontSize={12} tickFormatter={formatRatePercent} tickLine={false} type="number" />
            <YAxis dataKey="name" fontSize={12} tickLine={false} type="category" width={86} />
            <Tooltip formatter={(value, name) => [formatRatePercent(value), name]} />
            <ReferenceLine stroke="#94a3b8" x={0} />
            <Bar dataKey="value" name="环比差值" radius={[3, 3, 3, 3]}>
              {chartData.map((entry) => (
                <Cell key={entry.name} fill={entry.color} />
              ))}
            </Bar>
          </BarChart>
        </ResponsiveContainer>
      </div>
    </section>
  );
}
