"use client";

import { Area, AreaChart, Bar, BarChart, CartesianGrid, Legend, ResponsiveContainer, Tooltip, XAxis, YAxis } from "recharts";

type ChartSeries = {
  key: string;
  name: string;
  color: string;
  type?: "area" | "bar";
};

type ValueFormat = "number" | "percent";

function formatChartValue(value: unknown, format: ValueFormat) {
  const num = Number(value);
  if (!Number.isFinite(num)) return "-";

  if (format === "percent") {
    return `${(num * 100).toFixed(2)}%`;
  }

  return new Intl.NumberFormat("zh-CN", {
    maximumFractionDigits: 2,
  }).format(num);
}

export function TrendChart({
  title,
  data,
  series,
  valueFormat = "number",
}: {
  title: string;
  data: Array<Record<string, unknown>>;
  series: ChartSeries[];
  valueFormat?: ValueFormat;
}) {
  const hasBar = series.some((item) => item.type === "bar");
  const Chart = hasBar ? BarChart : AreaChart;

  return (
    <section className="border border-line bg-white p-4 shadow-panel">
      <div className="mb-3 text-sm font-semibold text-ink">{title}</div>
      <div className="h-72">
        {data.length ? (
          <ResponsiveContainer height="100%" width="100%">
            <Chart data={data} margin={{ left: 4, right: 12, top: 10, bottom: 0 }}>
              <CartesianGrid stroke="#e2e8f0" strokeDasharray="3 3" vertical={false} />
              <XAxis dataKey="date" fontSize={12} tickLine={false} />
              <YAxis
                fontSize={12}
                tickFormatter={(value) => formatChartValue(value, valueFormat)}
                tickLine={false}
                width={76}
              />
              <Tooltip formatter={(value, name) => [formatChartValue(value, valueFormat), name]} />
              <Legend />
              {series.map((item) =>
                item.type === "bar" ? (
                  <Bar key={item.key} dataKey={item.key} fill={item.color} name={item.name} radius={[3, 3, 0, 0]} />
                ) : (
                  <Area
                    key={item.key}
                    dataKey={item.key}
                    fill={item.color}
                    fillOpacity={0.12}
                    name={item.name}
                    stroke={item.color}
                    strokeWidth={2}
                    type="monotone"
                  />
                ),
              )}
            </Chart>
          </ResponsiveContainer>
        ) : (
          <div className="flex h-full items-center justify-center text-sm text-muted">当前筛选范围暂无趋势数据</div>
        )}
      </div>
    </section>
  );
}
