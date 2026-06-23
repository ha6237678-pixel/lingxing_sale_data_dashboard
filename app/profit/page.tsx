import { AppShell } from "@/components/dashboard/app-shell";
import { GlobalFilters } from "@/components/dashboard/global-filters";
import { MetricCard } from "@/components/dashboard/metric-card";
import { RankingTable } from "@/components/dashboard/ranking-table";
import { SectionTitle } from "@/components/dashboard/section-title";
import { ErrorState } from "@/components/states/error-state";
import { TrendChart } from "@/components/charts/trend-chart";
import { getFilterOptions } from "@/lib/queries/common";
import { getProfitRankings, getProfitSummary, getProfitTrend } from "@/lib/queries/profit";
import { displayError } from "@/lib/services/errors";
import { parseFilters } from "@/lib/utils/date";
import { formatMoney, formatNumber, formatPercent } from "@/lib/utils/number";

export default async function ProfitPage({ searchParams }: { searchParams?: Promise<Record<string, string | string[] | undefined>> }) {
  const filters = parseFilters(await searchParams);

  try {
    const [options, summary, trend, rankings] = await Promise.all([
      getFilterOptions(),
      getProfitSummary(filters),
      getProfitTrend(filters),
      getProfitRankings(filters),
    ]);

    return (
      <AppShell>
        <SectionTitle title="利润数据总览" description="结算销售额、毛利、费用占比和成本结构集中查看。" />
        <GlobalFilters filters={filters} options={options} />
        <div className="grid gap-3 md:grid-cols-4">
          <MetricCard label="结算销售额" value={formatMoney(summary.settlementSales)} />
          <MetricCard label="结算销量" value={formatNumber(summary.totalSalesQuantity)} />
          <MetricCard label="毛利润" value={formatMoney(summary.grossProfit)} />
          <MetricCard label="毛利率" value={formatPercent(summary.grossRate)} hint="sum(gross_profit) / sum(total_sales_amount_with_tax)" />
          <MetricCard label="广告销售额" value={formatMoney(summary.totalAdsSales)} />
          <MetricCard label="广告销量" value={formatNumber(summary.totalAdsSalesQuantity)} />
          <MetricCard label="退款率" value={formatPercent(summary.refundsRate)} />
          <MetricCard label="广告费占比" value={formatPercent(summary.adsCostRate)} />
          <MetricCard label="平台费" value={formatMoney(summary.platformFee)} />
          <MetricCard label="FBA 发货费" value={formatMoney(summary.fbaDeliveryFee)} />
          <MetricCard label="广告费" value={formatMoney(summary.totalAdsCost)} />
          <MetricCard label="推广费" value={formatMoney(summary.promotionFee)} />
          <MetricCard label="仓储费" value={formatMoney(summary.totalStorageFee)} />
          <MetricCard label="采购成本" value={formatMoney(summary.cgPrice)} />
          <MetricCard label="头程成本" value={formatMoney(summary.cgTransportCosts)} />
          <MetricCard label="合计成本占比" value={formatPercent(summary.totalCostRate)} />
        </div>
        <div className="mt-5 grid gap-5 xl:grid-cols-2">
          <TrendChart
            title="利润趋势"
            data={trend}
            series={[
              { key: "amount", name: "结算销售额", color: "#0f766e" },
              { key: "grossProfit", name: "毛利润", color: "#dc5f45" },
            ]}
          />
          <RankingTable title="运营利润排行" rows={rankings.map((row) => ({ ...row, orderItems: undefined }))} variant="profit" />
        </div>
      </AppShell>
    );
  } catch (error) {
    return (
      <AppShell>
        <SectionTitle title="利润数据总览" />
        <ErrorState message={displayError(error)} />
      </AppShell>
    );
  }
}
