"use client";

import { useState } from "react";
import { Bar, BarChart, CartesianGrid, Legend, ResponsiveContainer, Tooltip, XAxis, YAxis } from "recharts";

type TargetMonthlyRow = {
  name: string;
  monthlySalesCompletion: number;
  monthlyProfitCompletion: number;
};

type TargetMonthlyKey = "monthlySalesCompletion" | "monthlyProfitCompletion";

const monthlySeries: Array<{ key: TargetMonthlyKey; label: string; name: string }> = [
  { key: "monthlySalesCompletion", label: "销售额", name: "月化销售额完成率" },
  { key: "monthlyProfitCompletion", label: "毛利润", name: "月化毛利润完成率" },
];

function formatPercent(value: unknown) {
  const num = Number(value);
  if (!Number.isFinite(num)) return "-";
  return `${(num * 100).toFixed(2)}%`;
}

export function TargetMonthlyBarChart({
  data,
  layout = "horizontal",
  profitColor = "#dc5f45",
  salesColor = "#0f766e",
  title = "月化完成率对比",
}: {
  data: TargetMonthlyRow[];
  layout?: "horizontal" | "vertical";
  profitColor?: string;
  salesColor?: string;
  title?: string;
}) {
  const [visibleKeys, setVisibleKeys] = useState<TargetMonthlyKey[]>(["monthlySalesCompletion", "monthlyProfitCompletion"]);
  const series = monthlySeries.map((item) => ({
    ...item,
    color: item.key === "monthlySalesCompletion" ? salesColor : profitColor,
  }));
  const chartHeight = layout === "horizontal" ? Math.max(420, data.length * 38) : 420;

  function toggleSeries(key: TargetMonthlyKey) {
    setVisibleKeys((current) => (current.includes(key) ? current.filter((item) => item !== key) : [...current, key]));
  }

  return (
    <section className="mt-5 rounded-[12px] border border-line bg-white p-6 shadow-panel">
      <div className="mb-4 flex flex-wrap items-center justify-between gap-3">
        <div className="text-[16px] font-semibold text-[#1F2D3D]">{title}</div>
        <div className="flex items-center gap-2">
          {series.map((item) => {
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
      <div style={{ height: chartHeight }}>
        {data.length ? (
          <ResponsiveContainer height="100%" width="100%">
            {layout === "horizontal" ? (
              <BarChart data={data} layout="vertical" margin={{ bottom: 8, left: 24, right: 28, top: 8 }} barCategoryGap="26%">
                <CartesianGrid stroke="#e2e8f0" strokeDasharray="3 3" horizontal={false} />
                <XAxis tickFormatter={formatPercent} tick={{ fontSize: 12 }} type="number" />
                <YAxis dataKey="name" tick={{ fontSize: 12 }} tickLine={false} type="category" width={96} />
                <Tooltip formatter={(value, name) => [formatPercent(value), name]} />
                <Legend />
                {series.map((item) =>
                  visibleKeys.includes(item.key) ? (
                    <Bar key={item.key} barSize={10} dataKey={item.key} fill={item.color} name={item.name} radius={[0, 3, 3, 0]} />
                  ) : null,
                )}
              </BarChart>
            ) : (
              <BarChart data={data} margin={{ bottom: 8, left: 8, right: 20, top: 8 }} barCategoryGap="28%">
                <CartesianGrid stroke="#e2e8f0" strokeDasharray="3 3" vertical={false} />
                <XAxis dataKey="name" tick={{ fontSize: 12 }} tickLine={false} type="category" />
                <YAxis tickFormatter={formatPercent} tick={{ fontSize: 12 }} type="number" />
                <Tooltip formatter={(value, name) => [formatPercent(value), name]} />
                <Legend />
                {series.map((item) =>
                  visibleKeys.includes(item.key) ? (
                    <Bar key={item.key} barSize={28} dataKey={item.key} fill={item.color} name={item.name} radius={[3, 3, 0, 0]} />
                  ) : null,
                )}
              </BarChart>
            )}
          </ResponsiveContainer>
        ) : (
          <div className="flex h-full items-center justify-center text-sm text-muted">当前筛选范围暂无目标排行数据</div>
        )}
      </div>
    </section>
  );
}
