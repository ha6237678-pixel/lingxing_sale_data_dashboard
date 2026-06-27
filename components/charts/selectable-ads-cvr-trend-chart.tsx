"use client";

import { useMemo, useState } from "react";
import { Area, AreaChart, CartesianGrid, ResponsiveContainer, Tooltip, XAxis, YAxis } from "recharts";

type AdsCvrTrendPoint = {
  date: string;
  cvr: number;
  adCvr: number;
  natureCvr: number;
  ctr: number;
};

type MetricKey = "cvr" | "adCvr" | "natureCvr" | "ctr";

const metrics: Array<{ key: MetricKey; label: string; color: string }> = [
  { key: "cvr", label: "总CVR", color: "#0f766e" },
  { key: "adCvr", label: "广告CVR", color: "#7c3aed" },
  { key: "natureCvr", label: "自然CVR", color: "#dc5f45" },
  { key: "ctr", label: "广告CTR", color: "#2563eb" },
];

function formatPercentValue(value: unknown) {
  const num = Number(value);
  if (!Number.isFinite(num)) return "-";

  return `${(num * 100).toFixed(2)}%`;
}

export function SelectableAdsCvrTrendChart({ data }: { data: AdsCvrTrendPoint[] }) {
  const [selected, setSelected] = useState<MetricKey[]>(["cvr", "adCvr", "natureCvr"]);

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
        <div className="text-sm font-semibold text-ink">总CVR / 广告CVR / 自然CVR / 广告CTR 趋势</div>
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
                        backgroundColor: metric.color,
                        borderColor: metric.color,
                        color: "#ffffff",
                      }
                    : undefined
                }
                className={`rounded-md border px-3 py-1.5 text-sm font-semibold transition ${
                  active ? "shadow-sm" : "border-line bg-white text-ink hover:bg-slate-50"
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
              <YAxis fontSize={12} tickFormatter={formatPercentValue} tickLine={false} width={76} />
              <Tooltip formatter={(value, name) => [formatPercentValue(value), name]} />
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
