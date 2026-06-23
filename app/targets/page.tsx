import { AppShell } from "@/components/dashboard/app-shell";
import { GlobalFilters } from "@/components/dashboard/global-filters";
import { MetricCard } from "@/components/dashboard/metric-card";
import { SectionTitle } from "@/components/dashboard/section-title";
import { ErrorState } from "@/components/states/error-state";
import { getFilterOptions } from "@/lib/queries/common";
import { getTargetRankings, getTargetSummary } from "@/lib/queries/targets";
import { displayError } from "@/lib/services/errors";
import { parseFilters } from "@/lib/utils/date";
import { formatMoney, formatPercent } from "@/lib/utils/number";

export default async function TargetsPage({ searchParams }: { searchParams?: Promise<Record<string, string | string[] | undefined>> }) {
  const filters = parseFilters(await searchParams);

  try {
    const [options, summary, rankings] = await Promise.all([getFilterOptions(), getTargetSummary(filters), getTargetRankings(filters)]);

    return (
      <AppShell>
        <SectionTitle
          title="目标达成"
          description="目标金额按结束日期所在月份取月目标；实际销售额和实际毛利均来自结算利润表，并严格按当前筛选日期范围统计。"
        />
        <GlobalFilters filters={filters} options={options} />
        <div className="grid gap-3 md:grid-cols-4">
          <MetricCard label="销售目标" value={summary.salesTarget ? formatMoney(summary.salesTarget) : "未配置目标"} />
          <MetricCard
            label="实际销售额"
            value={formatMoney(summary.actualSales)}
            hint={`${filters.startDate} 至 ${filters.endDate} 的 sum(total_sales_amount_with_tax)`}
          />
          <MetricCard label="销售完成率" value={formatPercent(summary.salesCompletion)} />
          <MetricCard label="已配置目标人数" value={`${summary.configuredOperators}`} />
          <MetricCard label="利润目标" value={summary.profitTarget ? formatMoney(summary.profitTarget) : "未配置目标"} />
          <MetricCard label="实际毛利润" value={formatMoney(summary.actualProfit)} hint={`${filters.startDate} 至 ${filters.endDate} 的 sum(gross_profit)`} />
          <MetricCard label="利润完成率" value={formatPercent(summary.profitCompletion)} />
        </div>
        <section className="mt-5 border border-line bg-white shadow-panel">
          <div className="border-b border-line px-4 py-3 text-sm font-semibold text-ink">运营目标达成排行</div>
          <div className="overflow-x-auto">
            <table className="min-w-full text-left text-sm">
              <thead className="bg-slate-50 text-xs text-muted">
                <tr>
                  <th className="px-4 py-3">运营</th>
                  <th className="px-4 py-3">组别</th>
                  <th className="px-4 py-3 text-right">销售目标</th>
                  <th className="px-4 py-3 text-right">实际销售额</th>
                  <th className="px-4 py-3 text-right">销售完成率</th>
                  <th className="px-4 py-3 text-right">月化销售额完成率</th>
                  <th className="px-4 py-3 text-right">利润目标</th>
                  <th className="px-4 py-3 text-right">实际毛利润</th>
                  <th className="px-4 py-3 text-right">利润完成率</th>
                  <th className="px-4 py-3 text-right">月化毛利润完成率</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-line">
                {rankings.map((row) => (
                  <tr key={`${row.groupName}-${row.name}`} className="hover:bg-slate-50">
                    <td className="px-4 py-3 font-medium">{row.name}</td>
                    <td className="px-4 py-3 text-muted">{row.groupName}</td>
                    <td className="px-4 py-3 text-right">{formatMoney(row.salesTarget)}</td>
                    <td className="px-4 py-3 text-right">{formatMoney(row.actualSales)}</td>
                    <td className="px-4 py-3 text-right">{formatPercent(row.salesCompletion)}</td>
                    <td className="px-4 py-3 text-right">{formatPercent(row.monthlySalesCompletion)}</td>
                    <td className="px-4 py-3 text-right">{formatMoney(row.profitTarget)}</td>
                    <td className="px-4 py-3 text-right">{formatMoney(row.actualProfit)}</td>
                    <td className="px-4 py-3 text-right">{formatPercent(row.profitCompletion)}</td>
                    <td className="px-4 py-3 text-right">{formatPercent(row.monthlyProfitCompletion)}</td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </section>
      </AppShell>
    );
  } catch (error) {
    return (
      <AppShell>
        <SectionTitle title="目标达成" />
        <ErrorState message={displayError(error)} />
      </AppShell>
    );
  }
}
