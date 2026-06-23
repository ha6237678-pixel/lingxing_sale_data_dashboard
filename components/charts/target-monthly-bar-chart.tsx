"use client";

import { Bar, BarChart, CartesianGrid, Legend, ResponsiveContainer, Tooltip, XAxis, YAxis } from "recharts";

type TargetMonthlyRow = {
  name: string;
  monthlySalesCompletion: number;
  monthlyProfitCompletion: number;
};

function formatPercent(value: unknown) {
  const num = Number(value);
  if (!Number.isFinite(num)) return "-";
  return `${(num * 100).toFixed(2)}%`;
}

export function TargetMonthlyBarChart({ data }: { data: TargetMonthlyRow[] }) {
  return (
    <section className="mt-5 border border-line bg-white p-4 shadow-panel">
      <div className="mb-3 text-sm font-semibold text-ink">月化完成率对比</div>
      <div className="h-[520px]">
        {data.length ? (
          <ResponsiveContainer height="100%" width="100%">
            <BarChart data={data} layout="vertical" margin={{ left: 24, right: 24, top: 8, bottom: 8 }}>
              <CartesianGrid stroke="#e2e8f0" strokeDasharray="3 3" horizontal={false} />
              <XAxis tickFormatter={formatPercent} type="number" />
              <YAxis dataKey="name" tick={{ fontSize: 12 }} type="category" width={86} />
              <Tooltip formatter={(value, name) => [formatPercent(value), name]} />
              <Legend />
              <Bar dataKey="monthlySalesCompletion" fill="#0f766e" name="月化销售额完成率" radius={[0, 3, 3, 0]} />
              <Bar dataKey="monthlyProfitCompletion" fill="#dc5f45" name="月化毛利润完成率" radius={[0, 3, 3, 0]} />
            </BarChart>
          </ResponsiveContainer>
        ) : (
          <div className="flex h-full items-center justify-center text-sm text-muted">当前筛选范围暂无目标排行数据</div>
        )}
      </div>
    </section>
  );
}
