"use client";

import { useState } from "react";
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

const monthlySeries = [
  { key: "monthlySalesCompletion", label: "销售额", name: "月化销售额完成率", color: "#0f766e" },
  { key: "monthlyProfitCompletion", label: "毛利润", name: "月化毛利润完成率", color: "#dc5f45" },
] as const;

export function TargetMonthlyBarChart({ data }: { data: TargetMonthlyRow[] }) {
  const [visibleKeys, setVisibleKeys] = useState<Array<(typeof monthlySeries)[number]["key"]>>([
    "monthlySalesCompletion",
    "monthlyProfitCompletion",
  ]);

  function toggleSeries(key: (typeof monthlySeries)[number]["key"]) {
    setVisibleKeys((current) => (current.includes(key) ? current.filter((item) => item !== key) : [...current, key]));
  }

  return (
    <section className="mt-5 border border-line bg-white p-4 shadow-panel">
      <div className="mb-3 flex flex-wrap items-center justify-between gap-3">
        <div className="text-sm font-semibold text-ink">月化完成率对比</div>
        <div className="flex items-center gap-2">
          {monthlySeries.map((item) => {
            const active = visibleKeys.includes(item.key);

            return (
              <button
                key={item.key}
                className="h-9 rounded-md border px-3 text-sm font-semibold transition"
                onClick={() => toggleSeries(item.key)}
                style={{
                  backgroundColor: active ? item.color : "#ffffff",
                  borderColor: active ? item.color : "#cbd5e1",
                  color: active ? "#ffffff" : "#0f172a",
                }}
                type="button"
              >
                {item.label}
              </button>
            );
          })}
        </div>
      </div>
      <div className="h-[520px]">
        {data.length ? (
          <ResponsiveContainer height="100%" width="100%">
            <BarChart data={data} layout="vertical" margin={{ left: 24, right: 24, top: 8, bottom: 8 }}>
              <CartesianGrid stroke="#e2e8f0" strokeDasharray="3 3" horizontal={false} />
              <XAxis tickFormatter={formatPercent} type="number" />
              <YAxis dataKey="name" tick={{ fontSize: 12 }} type="category" width={86} />
              <Tooltip formatter={(value, name) => [formatPercent(value), name]} />
              <Legend />
              {monthlySeries.map((item) =>
                visibleKeys.includes(item.key) ? (
                  <Bar key={item.key} dataKey={item.key} fill={item.color} name={item.name} radius={[0, 3, 3, 0]} />
                ) : null,
              )}
            </BarChart>
          </ResponsiveContainer>
        ) : (
          <div className="flex h-full items-center justify-center text-sm text-muted">当前筛选范围暂无目标排行数据</div>
        )}
      </div>
    </section>
  );
}
