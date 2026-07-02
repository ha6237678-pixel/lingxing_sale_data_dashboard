import { SelectableSalesAmountTrendChart, SelectableSalesTrendChart } from "@/components/charts/selectable-sales-trend-chart";
import { AppShell } from "@/components/dashboard/app-shell";
import { GlobalFilters } from "@/components/dashboard/global-filters";
import { MetricCard } from "@/components/dashboard/metric-card";
import { OperatorProductLineDeclinePanel } from "@/components/dashboard/operator-product-line-decline-panel";
import { RankingTable } from "@/components/dashboard/ranking-table";
import { SectionTitle } from "@/components/dashboard/section-title";
import { ErrorState } from "@/components/states/error-state";
import { getFilterOptions } from "@/lib/queries/common";
import { getLatestAdsMetricDate, getOperatorMetricDateBounds } from "@/lib/queries/ads";
import { getOperatorProductLineDeclines, getSalesRankings, getSalesSummary, getSalesTrend } from "@/lib/queries/sales";
import { displayError } from "@/lib/services/errors";
import { normalizeComparisonFilters, parseFilters } from "@/lib/utils/date";
import { formatMoney, formatNumber, formatPercent } from "@/lib/utils/number";

export default async function SalesPage({
  searchParams,
}: {
  searchParams?: Promise<Record<string, string | string[] | undefined>>;
}) {
  const params = await searchParams;

  try {
    const [latestMetricDate, dateBounds] = await Promise.all([getLatestAdsMetricDate(), getOperatorMetricDateBounds()]);
    const parsedFilters = parseFilters(params);
    const hasDateParams = Boolean(params?.startDate || params?.endDate);
    const latestDefaultDate = dateBounds.maxDate ?? latestMetricDate;
    const filters = normalizeComparisonFilters(
      !hasDateParams && latestDefaultDate
        ? {
            ...parsedFilters,
            startDate: latestDefaultDate,
            endDate: latestDefaultDate,
          }
        : parsedFilters,
    );

    const [options, summary, trend, groupRankings, operatorRankings, operatorProductLineDeclines] = await Promise.all([
      getFilterOptions(),
      getSalesSummary(filters),
      getSalesTrend(filters),
      getSalesRankings(filters, "group"),
      getSalesRankings(filters, "operator"),
      getOperatorProductLineDeclines(filters),
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
          title="运营销售总览"
          description={
            <div className="space-y-1">
              <div>查看销售额、销量、订单量、广告订单、B2B 和运营排行。</div>
              <div>数据来源：领星产品表现。</div>
              <div>当前运营产品表现最新日期：{latestMetricDate ?? "暂无数据"}</div>
            </div>
          }
        />
        <GlobalFilters dateBounds={dateBounds} filters={filters} options={options} showComparisonMode />
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
            <MetricCard label="人均销售额" value={formatMoney(operatorAverageAmount)} className="bg-[#e0c66e]" />
            <MetricCard label="人均销量" value={formatNumber(operatorAverageVolume)} className="bg-[#e0c66e]" />
            <MetricCard label="人均订单量" value={formatNumber(operatorAverageOrderItems)} className="bg-[#e0c66e]" />
          </div>
          <RankingTable title="运营销售排行" rows={operatorRankingsWithAverageDiff} showAmountAverageDiff headerClassName="bg-[#6fa3d6]" />
          <OperatorProductLineDeclinePanel rows={operatorProductLineDeclines} />
        </div>
      </AppShell>
    );
  } catch (error) {
    return (
      <AppShell>
        <SectionTitle title="运营销售总览" />
        <ErrorState message={displayError(error)} />
      </AppShell>
    );
  }
}
