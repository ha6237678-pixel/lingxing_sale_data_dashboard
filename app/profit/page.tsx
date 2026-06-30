import { ProfitRateStackChart } from "@/components/charts/profit-rate-stack-chart";
import { ProfitRateDeltaBarChart } from "@/components/charts/profit-rate-delta-bar-chart";
import { TrendChart } from "@/components/charts/trend-chart";
import { AppShell } from "@/components/dashboard/app-shell";
import { GlobalFilters } from "@/components/dashboard/global-filters";
import { ProfitSummaryPanel } from "@/components/dashboard/profit-summary-panel";
import { RankingTable } from "@/components/dashboard/ranking-table";
import { SectionTitle } from "@/components/dashboard/section-title";
import { ErrorState } from "@/components/states/error-state";
import { getFilterOptions } from "@/lib/queries/common";
import { getLatestSettlementProfitDate, getProfitRankings, getProfitSummary, getProfitTrend } from "@/lib/queries/profit";
import { displayError } from "@/lib/services/errors";
import { normalizeComparisonFilters, parseFilters, previousComparisonRange } from "@/lib/utils/date";

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
        filters.startDate = latestSettlementDate;
      }
    }

    filters = normalizeComparisonFilters(filters);
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
        <GlobalFilters filters={filters} options={options} showComparisonMode />
        <ProfitSummaryPanel previous={comparisonSummary} summary={summary} />
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
        <div className="mt-5 grid gap-5 xl:grid-cols-2">
          <ProfitRateStackChart
            centerValue={summary.grossRate}
            data={rateData(summary)}
            subtitle={formatRange(filters.startDate, filters.endDate)}
            title="利润结构"
          />
          <ProfitRateStackChart
            centerValue={comparisonSummary.grossRate}
            data={rateData(comparisonSummary)}
            subtitle={formatRange(comparisonRange.startDate, comparisonRange.endDate)}
            title="利润结构（上期）"
          />
        </div>
        <ProfitRateDeltaBarChart current={rateData(summary)} previous={rateData(comparisonSummary)} />
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
