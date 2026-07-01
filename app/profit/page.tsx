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
import {
  getLatestSettlementProfitDate,
  getProfitAttributionRows,
  getProfitRankings,
  getProfitSummary,
  getProfitTrend,
  getSettlementProfitDateBounds,
  type ProfitAttributionFactor,
  type ProfitAttributionRow,
} from "@/lib/queries/profit";
import { displayError } from "@/lib/services/errors";
import { normalizeComparisonFilters, parseFilters, previousComparisonRange } from "@/lib/utils/date";
import { formatPercent } from "@/lib/utils/number";

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

function signedPercent(value: number | undefined) {
  if (value === undefined) return "-";
  const prefix = value > 0 ? "+" : "";

  return `${prefix}${formatPercent(value)}`;
}

function changeClassName(value: number | undefined) {
  if (value === undefined || value === 0) return "text-muted";

  return value > 0 ? "text-red-600" : "text-emerald-700";
}

function formatFactors(factors: ProfitAttributionFactor[]) {
  if (!factors.length) {
    return "暂无明显费用率上升项";
  }

  return factors.map((factor) => `${factor.name} ${signedPercent(factor.delta)}`).join("、");
}

function ProfitAttributionTable({ rows }: { rows: ProfitAttributionRow[] }) {
  return (
    <section className="mt-5 border border-line bg-white shadow-panel">
      <div className="border-b border-line px-4 py-3">
        <div className="text-sm font-semibold text-ink">利润变化归因分析</div>
        <div className="mt-1 text-xs text-muted">以毛利润和毛利率变化为主体，分析销售额变化及费用率上升项对利润的影响；上升为红色，下跌为绿色。</div>
      </div>
      <div className="overflow-x-auto">
        <table className="w-full min-w-[1120px] text-left text-sm">
          <thead className="bg-slate-50 text-xs text-muted">
            <tr>
              <th className="px-4 py-3">运营负责人</th>
              <th className="px-4 py-3">组别</th>
              <th className="px-4 py-3 text-right">毛利润环比</th>
              <th className="px-4 py-3 text-right">毛利率变化</th>
              <th className="px-4 py-3 text-right">销售额环比</th>
              <th className="px-4 py-3">主要拉低因素</th>
              <th className="px-4 py-3">归因结论</th>
              <th className="px-4 py-3">排查建议</th>
            </tr>
          </thead>
          <tbody className="divide-y divide-line">
            {rows.length ? (
              rows.map((row) => (
                <tr key={`${row.groupName}-${row.name}`} className="hover:bg-slate-50">
                  <td className="whitespace-nowrap px-4 py-3 font-medium text-ink">{row.name}</td>
                  <td className="whitespace-nowrap px-4 py-3 text-muted">{row.groupName}</td>
                  <td className={`whitespace-nowrap px-4 py-3 text-right font-medium ${changeClassName(row.grossProfitCompareRate)}`}>{signedPercent(row.grossProfitCompareRate)}</td>
                  <td className={`whitespace-nowrap px-4 py-3 text-right font-medium ${changeClassName(row.grossRateDelta)}`}>{signedPercent(row.grossRateDelta)}</td>
                  <td className={`whitespace-nowrap px-4 py-3 text-right font-medium ${changeClassName(row.amountCompareRate)}`}>{signedPercent(row.amountCompareRate)}</td>
                  <td className="min-w-[190px] px-4 py-3 text-ink">{formatFactors(row.factors)}</td>
                  <td className="min-w-[260px] px-4 py-3 text-ink">{row.conclusion}</td>
                  <td className="min-w-[300px] px-4 py-3 text-muted">{row.advice}</td>
                </tr>
              ))
            ) : (
              <tr>
                <td className="px-4 py-8 text-center text-muted" colSpan={8}>
                  当前筛选周期暂无明显利润变化异常
                </td>
              </tr>
            )}
          </tbody>
        </table>
      </div>
    </section>
  );
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

    const [options, summary, comparisonSummary, trend, rankings, dateBounds, attributionRows] = await Promise.all([
      getFilterOptions(),
      getProfitSummary(filters),
      getProfitSummary(comparisonFilters),
      getProfitTrend(filters),
      getProfitRankings(filters),
      getSettlementProfitDateBounds(),
      getProfitAttributionRows(filters),
    ]);

    return (
      <AppShell>
        <SectionTitle
          title="运营利润分析"
          description={
            <div className="space-y-1">
              <div>数据全部取自 fact_settlement_profit，默认结束日期跟随结算利润最新日期。</div>
              <div className="font-semibold text-blue-700">当前运营结算利润最新日期：{latestSettlementDate ?? "暂无数据"}</div>
            </div>
          }
        />
        <GlobalFilters dateBounds={dateBounds} filters={filters} options={options} showComparisonMode />
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
        <ProfitAttributionTable rows={attributionRows} />
        <div className="mt-5">
          <RankingTable title="运营利润排行（按毛利从高到低排序）" rows={rankings} variant="profit" />
        </div>
      </AppShell>
    );
  } catch (error) {
    return (
      <AppShell>
        <SectionTitle title="运营利润分析" />
        <ErrorState message={displayError(error)} />
      </AppShell>
    );
  }
}
