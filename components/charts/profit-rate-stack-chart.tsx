"use client";

import { Cell, Legend, Pie, PieChart, ResponsiveContainer, Tooltip } from "recharts";

export type ProfitRateData = {
  grossRate: number;
  refundsRate: number;
  platformFeeRate: number;
  cgTransportCostRate: number;
  cgPriceRate: number;
  storageFeeRate: number;
  fbaDeliveryFeeRate: number;
  promotionalRebateRate: number;
  adsCostRate: number;
};

export type ProfitRateKey = keyof ProfitRateData;

export const profitRateSeries: Array<{ key: ProfitRateKey; name: string; color: string }> = [
  { key: "grossRate", name: "毛利率", color: "#74C47A" },
  { key: "refundsRate", name: "退款率", color: "#E28181" },
  { key: "platformFeeRate", name: "平台费比", color: "#6FA3D6" },
  { key: "cgTransportCostRate", name: "头程费比", color: "#C69A74" },
  { key: "cgPriceRate", name: "采购费比", color: "#8E86D1" },
  { key: "storageFeeRate", name: "仓储费比", color: "#6EB5A7" },
  { key: "fbaDeliveryFeeRate", name: "FBA费比", color: "#E0C66E" },
  { key: "promotionalRebateRate", name: "促销费比", color: "#E39C6B" },
  { key: "adsCostRate", name: "广告费比", color: "#7F91AA" },
];

export function formatRatePercent(value: unknown) {
  const num = Number(value);
  if (!Number.isFinite(num)) return "-";

  return `${(num * 100).toFixed(2)}%`;
}

export function ProfitRateStackChart({
  data,
  title = "利润结构占比",
}: {
  data: ProfitRateData;
  title?: string;
}) {
  const chartData = profitRateSeries
    .map((item) => ({
      name: item.name,
      value: Math.abs(data[item.key]),
      color: item.color,
    }))
    .filter((item) => item.value > 0);

  return (
    <section className="border border-line bg-white p-4 shadow-panel">
      <div className="mb-3 text-sm font-semibold text-ink">{title}</div>
      <div className="h-80">
        {chartData.length ? (
          <ResponsiveContainer height="100%" width="100%">
            <PieChart>
              <Pie
                cx="50%"
                cy="48%"
                data={chartData}
                dataKey="value"
                innerRadius="52%"
                nameKey="name"
                outerRadius="78%"
                paddingAngle={1}
              >
                {chartData.map((entry) => (
                  <Cell key={entry.name} fill={entry.color} />
                ))}
              </Pie>
              <Tooltip formatter={(value, name) => [formatRatePercent(value), name]} />
              <Legend />
            </PieChart>
          </ResponsiveContainer>
        ) : (
          <div className="flex h-full items-center justify-center text-sm text-muted">暂无利润结构数据</div>
        )}
      </div>
    </section>
  );
}
