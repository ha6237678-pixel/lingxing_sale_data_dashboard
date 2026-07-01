import { SelectableSalesAmountTrendChart, SelectableSalesTrendChart } from "@/components/charts/selectable-sales-trend-chart";
import { AppShell } from "@/components/dashboard/app-shell";
import { GlobalFilters } from "@/components/dashboard/global-filters";
import { MetricCard } from "@/components/dashboard/metric-card";
import { RankingTable } from "@/components/dashboard/ranking-table";
import { SectionTitle } from "@/components/dashboard/section-title";
import { ErrorState } from "@/components/states/error-state";
import { getFilterOptions } from "@/lib/queries/common";
import { getSalesRankings, getSalesSummary, getSalesTrend } from "@/lib/queries/sales";
import { displayError } from "@/lib/services/errors";
import { normalizeComparisonFilters, parseFilters } from "@/lib/utils/date";
import { formatMoney, formatNumber, formatPercent } from "@/lib/utils/number";

export default async function SalesPage({
  searchParams,
}: {
  searchParams?: Promise<Record<string, string | string[] | undefined>>;
}) {
  const params = await searchParams;
  const filters = normalizeComparisonFilters(parseFilters(params));

  try {
    const [options, summary, trend, groupRankings, operatorRankings] = await Promise.all([
      getFilterOptions(),
      getSalesSummary(filters),
      getSalesTrend(filters),
      getSalesRankings(filters, "group"),
      getSalesRankings(filters, "operator"),
    ]);
    const operatorCount = operatorRankings.length;
    const operatorAverageAmount = operatorCount ? operatorRankings.reduce((sum, row) => sum + row.amount, 0) / operatorCount : 0;
    const operatorAverageVolume = operatorCount ? operatorRankings.reduce((sum, row) => sum + row.volume, 0) / operatorCount : 0;
    const operatorAverageOrderItems = operatorCount ? operatorRankings.reduce((sum, row) => sum + row.orderItems, 0) / operatorCount : 0;
    const operatorRankingsWithAverageDiff = operatorRankings.map((row) => ({
      ...row,
      amountAverageDiff: row.amount - operatorAverageAmount,
    }));

    return (
      <AppShell>
        <SectionTitle
          title="销售总览"
          description="查看销售额、销量、订单量、广告订单、B2B 和运营排行。"
        />
        <GlobalFilters filters={filters} options={options} showComparisonMode />
        <div className="grid gap-3 md:grid-cols-4">
          <MetricCard label="销售额" value={formatMoney(summary.amount)} hint="sum(amount)" />
          <MetricCard label="销量" value={formatNumber(summary.volume)} hint="sum(volume)" />
          <MetricCard label="订单量" value={formatNumber(summary.orderItems)} hint="sum(order_items)" />
          <MetricCard
            label="广告订单占比"
            value={formatPercent(summary.adOrderRate)}
            hint="sum(ad_order_quantity) / sum(order_items)"
          />
          <MetricCard label="广告订单量" value={formatNumber(summary.adOrderQuantity)} />
          <MetricCard label="B2B销售额" value={formatMoney(summary.b2bAmount)} />
          <MetricCard label="B2B销量" value={formatNumber(summary.b2bVolume)} />
          <MetricCard label="B2B订单量" value={formatNumber(summary.b2bOrderItems)} />
        </div>
        <div className="mt-5 space-y-5">
          <SelectableSalesAmountTrendChart data={trend} />
          <SelectableSalesTrendChart data={trend} />
        </div>
        <div className="mt-5 space-y-5">
          <RankingTable title="组别销售排行" rows={groupRankings} />
          <div className="grid gap-3 md:grid-cols-3">
            <MetricCard label="人均销售额" value={formatMoney(operatorAverageAmount)} />
            <MetricCard label="人均销量" value={formatNumber(operatorAverageVolume)} />
            <MetricCard label="人均订单量" value={formatNumber(operatorAverageOrderItems)} />
          </div>
          <RankingTable title="运营销售排行" rows={operatorRankingsWithAverageDiff} showAmountAverageDiff />
        </div>
      </AppShell>
    );
  } catch (error) {
    return (
      <AppShell>
        <SectionTitle title="销售总览" />
        <ErrorState message={displayError(error)} />
      </AppShell>
    );
  }
}
