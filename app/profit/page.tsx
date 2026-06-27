import { ProfitRateStackChart } from "@/components/charts/profit-rate-stack-chart";
import { ProfitRateDeltaBarChart } from "@/components/charts/profit-rate-delta-bar-chart";
import { TrendChart } from "@/components/charts/trend-chart";
import { AppShell } from "@/components/dashboard/app-shell";
import { GlobalFilters } from "@/components/dashboard/global-filters";
import { MetricCard } from "@/components/dashboard/metric-card";
import { RankingTable } from "@/components/dashboard/ranking-table";
import { SectionTitle } from "@/components/dashboard/section-title";
import { ErrorState } from "@/components/states/error-state";
import { getFilterOptions } from "@/lib/queries/common";
import { getLatestSettlementProfitDate, getProfitRankings, getProfitSummary, getProfitTrend } from "@/lib/queries/profit";
import { displayError } from "@/lib/services/errors";
import { parseFilters, previousComparisonRange } from "@/lib/utils/date";
import { formatMoney, formatNumber, formatPercent } from "@/lib/utils/number";
import { format, startOfMonth } from "date-fns";

function rateData(summary: Awaited<ReturnType<typeof getProfitSummary>>) {
  return {
    grossRate: summary.grossRate,
    refundsRate: summary.refundsRate,
    platformFeeRate: summary.platformFeeRate,
    cgTransportCostRate: summary.cgTransportCostRate,
    cgPriceRate: summary.cgPriceRate,
    storageFeeRate: summary.storageFeeRate,
    fbaDeliveryFeeRate: summary.fbaDeliveryFeeRate,
    promotionalRebateRate: summary.promotionalRebateRate,
    adsCostRate: summary.adsCostRate,
  };
}

function formatRange(startDate: string, endDate: string) {
  const start = startDate.split("-").join("/");
  const end = endDate.split("-").join("/");

  return start === end ? start : `${start} 至 ${end}`;
}

export default async function ProfitPage({
  searchParams,
}: {
  searchParams?: Promise<Record<string, string | string[] | undefined>>;
}) {
  const params = await searchParams;
  let filters = parseFilters(params);

  try {
    const latestSettlementDate = await getLatestSettlementProfitDate();
    const hasStartDate = Boolean(params?.startDate);
    const hasEndDate = Boolean(params?.endDate);

    if (latestSettlementDate && !hasEndDate) {
      filters.endDate = latestSettlementDate;
      if (!hasStartDate) {
        filters.startDate = format(startOfMonth(new Date(`${latestSettlementDate}T00:00:00`)), "yyyy-MM-dd");
      }
    }

    filters.comparisonMode = "custom";
    const comparisonRange = previousComparisonRange(filters);
    const comparisonFilters = {
      ...filters,
      startDate: comparisonRange.startDate,
      endDate: comparisonRange.endDate,
    };

    const [options, summary, comparisonSummary, trend, rankings] = await Promise.all([
      getFilterOptions(),
      getProfitSummary(filters),
      getProfitSummary(comparisonFilters),
      getProfitTrend(filters),
      getProfitRankings(filters),
    ]);

    return (
      <AppShell>
        <SectionTitle
          title="利润数据总览"
          description="数据全部取自 fact_settlement_profit，默认结束日期跟随结算利润最新日期。"
        />
        <GlobalFilters filters={filters} options={options} showComparisonRange />
        <div className="grid gap-3 md:grid-cols-4">
          <MetricCard label="结算销售额" value={formatMoney(summary.settlementSales)} />
          <MetricCard label="结算销量" value={formatNumber(summary.totalSalesQuantity)} />
          <MetricCard label="毛利润" value={formatMoney(summary.grossProfit)} />
          <MetricCard label="毛利率" value={formatPercent(summary.grossRate)} hint="sum(gross_profit) / sum(total_sales_amount_with_tax)" />
          <MetricCard label="广告销售额" value={formatMoney(summary.totalAdsSales)} />
          <MetricCard label="广告销量" value={formatNumber(summary.totalAdsSalesQuantity)} />
          <MetricCard label="销售退款额" value={formatMoney(summary.totalSalesRefunds)} />
          <MetricCard label="退款率" value={formatPercent(summary.refundsRate)} hint="sum(total_sales_refunds) / sum(total_sales_amount_with_tax)" />

          <MetricCard label="平台费" value={formatMoney(summary.platformFee)} />
          <MetricCard label="平台费比" value={formatPercent(summary.platformFeeRate)} hint="sum(platform_fee) / sum(total_sales_amount_with_tax)" />
          <MetricCard label="头程成本" value={formatMoney(summary.cgTransportCosts)} />
          <MetricCard label="头程费比" value={formatPercent(summary.cgTransportCostRate)} hint="sum(cg_transport_costs) / sum(total_sales_amount_with_tax)" />
          <MetricCard label="采购成本" value={formatMoney(summary.cgPrice)} />
          <MetricCard label="采购费比" value={formatPercent(summary.cgPriceRate)} hint="sum(cg_price) / sum(total_sales_amount_with_tax)" />
          <MetricCard label="仓储费" value={formatMoney(summary.totalStorageFee)} />
          <MetricCard label="仓储费比" value={formatPercent(summary.storageFeeRate)} hint="sum(total_storage_fee) / sum(total_sales_amount_with_tax)" />
          <MetricCard label="FBA 发货费" value={formatMoney(summary.fbaDeliveryFee)} />
          <MetricCard label="FBA费比" value={formatPercent(summary.fbaDeliveryFeeRate)} hint="sum(fba_delivery_fee) / sum(total_sales_amount_with_tax)" />
          <MetricCard label="促销返点" value={formatMoney(summary.promotionalRebates)} />
          <MetricCard label="促销费比" value={formatPercent(summary.promotionalRebateRate)} hint="sum(promotional_rebates) / sum(total_sales_amount_with_tax)" />
          <MetricCard label="广告费" value={formatMoney(summary.totalAdsCost)} />
          <MetricCard label="广告费比" value={formatPercent(summary.adsCostRate)} hint="sum(total_ads_cost) / sum(total_sales_amount_with_tax)" />
          <MetricCard label="推广费" value={formatMoney(summary.promotionFee)} />
          <MetricCard label="合计成本占比" value={formatPercent(summary.totalCostRate)} hint="sum(total_cost) / sum(total_sales_amount_with_tax)" />
        </div>
        <div className="mt-5 grid gap-5 xl:grid-cols-2">
          <ProfitRateStackChart title={`筛选周期利润结构：${formatRange(filters.startDate, filters.endDate)}`} data={rateData(summary)} />
          <ProfitRateStackChart
            title={`环比周期利润结构：${formatRange(comparisonRange.startDate, comparisonRange.endDate)}`}
            data={rateData(comparisonSummary)}
          />
        </div>
        <ProfitRateDeltaBarChart current={rateData(summary)} previous={rateData(comparisonSummary)} />
        <div className="mt-5">
          <TrendChart
            title="利润趋势"
            data={trend}
            series={[
              { key: "amount", name: "结算销售额", color: "#0f766e" },
              { key: "grossProfit", name: "毛利润", color: "#dc5f45" },
            ]}
          />
        </div>
        <div className="mt-5">
          <RankingTable title="运营利润排行" rows={rankings} variant="profit" />
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
