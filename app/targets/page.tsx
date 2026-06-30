import { AppShell } from "@/components/dashboard/app-shell";
import { TargetMonthlyBarChart } from "@/components/charts/target-monthly-bar-chart";
import { GlobalFilters } from "@/components/dashboard/global-filters";
import { MetricCard } from "@/components/dashboard/metric-card";
import { ErrorState } from "@/components/states/error-state";
import { getFilterOptions } from "@/lib/queries/common";
import { getLatestSettlementDate, getTargetGroupRankings, getTargetRankings, getTargetSummary } from "@/lib/queries/targets";
import { displayError } from "@/lib/services/errors";
import { parseFilters } from "@/lib/utils/date";
import { formatMoney, formatPercent } from "@/lib/utils/number";
import { format, startOfMonth } from "date-fns";

type TargetRankingRow = Awaited<ReturnType<typeof getTargetRankings>>[number];

function TargetRankingTable({ rows, title }: { rows: TargetRankingRow[]; title: string }) {
  return (
    <section className="mt-5 rounded-[12px] border border-line bg-white p-6 shadow-panel">
      <div className="mb-4 text-[16px] font-semibold text-[#1F2D3D]">{title}</div>
      <div className="overflow-x-auto">
        <table className="min-w-full text-left text-sm">
          <thead className="bg-slate-50 text-xs text-muted">
            <tr>
              <th className="px-4 py-3">名称</th>
              <th className="px-4 py-3">组别</th>
              <th className="px-4 py-3 text-right">销售目标</th>
              <th className="px-4 py-3 text-right">实际销售额</th>
              <th className="px-4 py-3 text-right">累计销售完成率</th>
              <th className="px-4 py-3 text-right">月化销售额完成率</th>
              <th className="px-4 py-3 text-right">利润目标</th>
              <th className="px-4 py-3 text-right">实际毛利润</th>
              <th className="px-4 py-3 text-right">累计利润完成率</th>
              <th className="px-4 py-3 text-right">月化毛利润完成率</th>
            </tr>
          </thead>
          <tbody className="divide-y divide-line">
            {rows.map((row) => (
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
  );
}

export default async function TargetsPage({ searchParams }: { searchParams?: Promise<Record<string, string | string[] | undefined>> }) {
  const params = await searchParams;
  const filters = parseFilters(params);

  try {
    const latestSettlementDate = await getLatestSettlementDate();
    const hasEndDate = Boolean(params?.endDate);
    const hasStartDate = Boolean(params?.startDate);
    if (latestSettlementDate && !hasEndDate) {
      filters.endDate = latestSettlementDate;
      if (!hasStartDate) {
        filters.startDate = format(startOfMonth(new Date(`${latestSettlementDate}T00:00:00`)), "yyyy-MM-dd");
      }
    }

    const [options, summary, groupRankings, rankings] = await Promise.all([
      getFilterOptions(),
      getTargetSummary(filters),
      getTargetGroupRankings(filters),
      getTargetRankings(filters),
    ]);

    return (
      <AppShell>
        <div className="mb-4">
          <h1 className="text-xl font-semibold text-ink">目标达成</h1>
          <div className="mt-1 text-sm leading-6 text-blue-700">
            <p>1. 数据源：取自【领星ERP-结算利润】模块。</p>
            <p>2. 时间筛选规则：系统每日自动获取 T-7 天（即当天往前推算第 7 天）的结算数据。</p>
          </div>
        </div>
        <GlobalFilters filters={filters} options={options} />
        <section className="mt-5 rounded-[12px] border border-line bg-white p-6 shadow-panel">
          <div className="mb-4 text-[16px] font-semibold text-[#1F2D3D]">目标完成概览</div>
          <div className="grid gap-3 md:grid-cols-4">
          <MetricCard label="销售目标" value={summary.salesTarget ? formatMoney(summary.salesTarget) : "未配置目标"} />
          <MetricCard
            label="实际销售额"
            value={formatMoney(summary.actualSales)}
            hint={`${filters.startDate} 至 ${filters.endDate} 的 sum(total_sales_amount_with_tax)`}
          />
          <MetricCard label="累计销售完成率" value={formatPercent(summary.salesCompletion)} />
          <MetricCard label="月化销售额完成率" value={formatPercent(summary.monthlySalesCompletion)} />
          <MetricCard label="利润目标" value={summary.profitTarget ? formatMoney(summary.profitTarget) : "未配置目标"} />
          <MetricCard label="实际毛利润" value={formatMoney(summary.actualProfit)} hint={`${filters.startDate} 至 ${filters.endDate} 的 sum(gross_profit)`} />
          <MetricCard label="累计利润完成率" value={formatPercent(summary.profitCompletion)} />
          <MetricCard label="月化毛利润完成率" value={formatPercent(summary.monthlyProfitCompletion)} />
          </div>
        </section>
        <TargetRankingTable title="组别运营目标达成排行" rows={groupRankings} />
        <TargetMonthlyBarChart data={groupRankings} layout="vertical" profitColor="#E1A874" salesColor="#68AADF" title="组别月化完成率对比" />
        <section className="mt-5 rounded-[12px] border border-line bg-white p-6 shadow-panel">
          <div className="mb-4 text-[16px] font-semibold text-[#1F2D3D]">运营目标达成排行</div>
          <div className="overflow-x-auto">
            <table className="min-w-full text-left text-sm">
              <thead className="bg-slate-50 text-xs text-muted">
                <tr>
                  <th className="px-4 py-3">运营</th>
                  <th className="px-4 py-3">组别</th>
                  <th className="px-4 py-3 text-right">销售目标</th>
                  <th className="px-4 py-3 text-right">实际销售额</th>
                  <th className="px-4 py-3 text-right">累计销售完成率</th>
                  <th className="px-4 py-3 text-right">月化销售额完成率</th>
                  <th className="px-4 py-3 text-right">利润目标</th>
                  <th className="px-4 py-3 text-right">实际毛利润</th>
                  <th className="px-4 py-3 text-right">累计利润完成率</th>
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
        <TargetMonthlyBarChart data={rankings} />
      </AppShell>
    );
  } catch (error) {
    return (
      <AppShell>
        <div className="mb-4">
          <h1 className="text-xl font-semibold text-ink">目标达成</h1>
        </div>
        <ErrorState message={displayError(error)} />
      </AppShell>
    );
  }
}
