"use client";

import { useMemo, useState } from "react";
import { Area, AreaChart, CartesianGrid, ResponsiveContainer, Tooltip, XAxis, YAxis } from "recharts";

type SalesTrendPoint = {
  date: string;
  amount: number;
  volume: number;
  orderItems: number;
};

type MetricKey = "amount" | "volume" | "orderItems";

const metrics: Array<{ key: MetricKey; label: string; color: string }> = [
  { key: "amount", label: "销售额", color: "#0f766e" },
  { key: "volume", label: "销量", color: "#2563eb" },
  { key: "orderItems", label: "订单量", color: "#dc5f45" },
];

function formatValue(value: unknown) {
  const num = Number(value);
  if (!Number.isFinite(num)) return "-";

  return new Intl.NumberFormat("zh-CN", {
    maximumFractionDigits: 0,
  }).format(num);
}

export function SelectableSalesTrendChart({ data }: { data: SalesTrendPoint[] }) {
  const [selected, setSelected] = useState<MetricKey[]>(["amount"]);

  const visibleMetrics = useMemo(
    () => metrics.filter((metric) => selected.includes(metric.key)),
    [selected],
  );

  function toggleMetric(key: MetricKey) {
    setSelected((current) => {
      if (current.includes(key)) {
        return current.length === 1 ? current : current.filter((item) => item !== key);
      }

      return [...current, key];
    });
  }

  return (
    <section className="border border-line bg-white p-4 shadow-panel">
      <div className="mb-3 flex flex-wrap items-center justify-between gap-3">
        <div className="text-sm font-semibold text-ink">销售趋势</div>
        <div className="flex flex-wrap gap-2">
          {metrics.map((metric) => {
            const active = selected.includes(metric.key);

            return (
              <button
                key={metric.key}
                type="button"
                aria-pressed={active}
                onClick={() => toggleMetric(metric.key)}
                style={
                  active
                    ? {
                        backgroundColor: "#facc15",
                        borderColor: "#eab308",
                        color: "#0f172a",
                      }
                    : undefined
                }
                className={`rounded-md border px-3 py-1.5 text-sm font-semibold transition ${
                  active
                    ? "shadow-sm"
                    : "border-line bg-white text-ink hover:border-[#eab308] hover:bg-[#fef9c3]"
                }`}
              >
                {metric.label}
              </button>
            );
          })}
        </div>
      </div>
      <div className="h-72">
        {data.length ? (
          <ResponsiveContainer height="100%" width="100%">
            <AreaChart data={data} margin={{ left: 4, right: 12, top: 10, bottom: 0 }}>
              <CartesianGrid stroke="#e2e8f0" strokeDasharray="3 3" vertical={false} />
              <XAxis dataKey="date" fontSize={12} tickLine={false} />
              <YAxis fontSize={12} tickFormatter={formatValue} tickLine={false} width={86} />
              <Tooltip formatter={(value, name) => [formatValue(value), name]} />
              {visibleMetrics.map((metric) => (
                <Area
                  key={metric.key}
                  dataKey={metric.key}
                  fill={metric.color}
                  fillOpacity={0.12}
                  name={metric.label}
                  stroke={metric.color}
                  strokeWidth={2}
                  type="monotone"
                />
              ))}
            </AreaChart>
          </ResponsiveContainer>
        ) : (
          <div className="flex h-full items-center justify-center text-sm text-muted">暂无趋势数据</div>
        )}
      </div>
    </section>
  );
}
