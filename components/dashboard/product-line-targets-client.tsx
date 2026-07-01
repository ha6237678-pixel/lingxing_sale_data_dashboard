"use client";

import { TargetMonthlyBarChart } from "@/components/charts/target-monthly-bar-chart";
import { ProductLineTargetFilters } from "@/components/dashboard/product-line-target-filters";
import type { ProductLineFilterOptions } from "@/lib/queries/product-lines";
import type { ProductLineTargetRow } from "@/lib/queries/product-line-targets";
import type { DashboardFilters } from "@/lib/utils/date";
import { formatMoney, formatPercent } from "@/lib/utils/number";
import { useState } from "react";

type ProductLineTargetPayload = {
  filters: DashboardFilters;
  latestDate?: string;
  rankings: ProductLineTargetRow[];
};

function buildQuery(filters: DashboardFilters) {
  const params = new URLSearchParams();
  params.set("startDate", filters.startDate);
  params.set("endDate", filters.endDate);
  params.set("groupName", filters.groupName ?? "");
  params.set("principalUid", filters.principalUid ?? "");
  params.set("productLineName", filters.productLineName ?? "");

  return params;
}

function ProductLineTargetTable({ rows }: { rows: ProductLineTargetRow[] }) {
  return (
    <section className="mt-5 rounded-[12px] border border-line bg-white p-6 shadow-panel">
      <div className="mb-4 text-[16px] font-semibold text-[#1F2D3D]">品线目标达成排行（按销售目标从高到低排序）</div>
      <div className="overflow-x-auto">
        <table className="min-w-full text-left text-sm">
          <thead className="bg-slate-50 text-xs text-muted">
            <tr>
              <th className="px-4 py-3">品线</th>
              <th className="px-4 py-3">运营负责人</th>
              <th className="px-4 py-3">组别</th>
              <th className="px-4 py-3 text-right">销售目标</th>
              <th className="px-4 py-3 text-right">实际销售额</th>
              <th className="px-4 py-3 text-right">月化销售完成率</th>
              <th className="px-4 py-3 text-right">利润目标</th>
              <th className="px-4 py-3 text-right">实际毛利</th>
              <th className="px-4 py-3 text-right">月化利润完成率</th>
            </tr>
          </thead>
          <tbody className="divide-y divide-line">
            {rows.map((row) => (
              <tr key={`${row.groupName}-${row.operatorName}-${row.name}`} className="hover:bg-slate-50">
                <td className="px-4 py-3 font-medium">{row.name}</td>
                <td className="px-4 py-3 text-muted">{row.operatorName || "-"}</td>
                <td className="px-4 py-3 text-muted">{row.groupName}</td>
                <td className="px-4 py-3 text-right">{formatMoney(row.salesTarget)}</td>
                <td className="px-4 py-3 text-right">{formatMoney(row.actualSales)}</td>
                <td className="px-4 py-3 text-right font-semibold text-blue-700">{formatPercent(row.monthlySalesCompletion)}</td>
                <td className="px-4 py-3 text-right">{formatMoney(row.profitTarget)}</td>
                <td className="px-4 py-3 text-right">{formatMoney(row.actualProfit)}</td>
                <td className="px-4 py-3 text-right font-semibold text-blue-700">{formatPercent(row.monthlyProfitCompletion)}</td>
              </tr>
            ))}
            {!rows.length ? (
              <tr>
                <td className="px-4 py-8 text-center text-muted" colSpan={9}>
                  当前筛选条件下没有品线目标数据
                </td>
              </tr>
            ) : null}
          </tbody>
        </table>
      </div>
    </section>
  );
}

export function ProductLineTargetsClient({
  initialFilters,
  initialLatestDate,
  initialRankings,
  options,
}: {
  initialFilters: DashboardFilters;
  initialLatestDate?: string;
  initialRankings: ProductLineTargetRow[];
  options: ProductLineFilterOptions;
}) {
  const [filters, setFilters] = useState(initialFilters);
  const [latestDate, setLatestDate] = useState(initialLatestDate);
  const [rankings, setRankings] = useState(initialRankings);
  const [error, setError] = useState<string>();
  const [isLoading, setIsLoading] = useState(false);

  async function applyFilters(nextFilters: DashboardFilters) {
    const query = buildQuery(nextFilters);
    setError(undefined);
    setIsLoading(true);

    try {
      const response = await fetch(`/api/product-line-targets?${query.toString()}`, {
        headers: { Accept: "application/json" },
      });

      if (!response.ok) {
        const body = await response.json().catch(() => undefined);
        setError(body?.message ?? "筛选失败，请稍后重试");
        return;
      }

      const payload = (await response.json()) as ProductLineTargetPayload;
      setFilters(payload.filters);
      setLatestDate(payload.latestDate);
      setRankings(payload.rankings);
      window.history.pushState(null, "", `/product-line-targets?${query.toString()}`);
    } finally {
      setIsLoading(false);
    }
  }

  return (
    <>
      <ProductLineTargetFilters filters={filters} isLoading={isLoading} onApply={applyFilters} options={options} />
      <div className="-mt-2 mb-5 flex flex-wrap items-center gap-3">
        <div className="text-sm font-semibold text-blue-700">当前品线结算利润最新日期：{latestDate ?? "暂无数据"}</div>
        {isLoading ? <div className="text-xs text-muted">数据更新中...</div> : null}
        {error ? <div className="text-xs font-medium text-red-600">{error}</div> : null}
      </div>
      <ProductLineTargetTable rows={rankings} />
      <TargetMonthlyBarChart data={rankings} title="品线月化完成率" />
    </>
  );
}
