import { SelectableAdsTrafficTrendChart } from "@/components/charts/selectable-ads-traffic-trend-chart";
import { SelectableAdsCvrTrendChart } from "@/components/charts/selectable-ads-cvr-trend-chart";
import { TrendChart } from "@/components/charts/trend-chart";
import { AppShell } from "@/components/dashboard/app-shell";
import { GlobalFilters } from "@/components/dashboard/global-filters";
import { MetricCard } from "@/components/dashboard/metric-card";
import { SectionTitle } from "@/components/dashboard/section-title";
import { ErrorState } from "@/components/states/error-state";
import { getFilterOptions } from "@/lib/queries/common";
import { getAdsRankings, getAdsSummary, getAdsTrend, getLatestAdsMetricDate, getOperatorMetricDateBounds, type AdsRankingRow } from "@/lib/queries/ads";
import { displayError } from "@/lib/services/errors";
import { normalizeComparisonFilters, parseFilters } from "@/lib/utils/date";
import { formatMoney, formatMoneyDecimal, formatNumber, formatPercent } from "@/lib/utils/number";

function formatCompare(value: number | undefined) {
  if (value === undefined) return "-";
  const prefix = value > 0 ? "+" : "";

  return `${prefix}${formatPercent(value)}`;
}

function compareClassName(value: number | undefined, inverse = false) {
  if (value === undefined || value === 0) return "text-muted";

  const positiveIsGood = !inverse;
  return value > 0 === positiveIsGood ? "text-emerald-700" : "text-coral";
}

function changeClassName(value: number | undefined) {
  if (value === undefined || value === 0) return "text-muted";

  return value > 0 ? "text-red-600" : "text-emerald-700";
}

function buildAdsAdvice(row: AdsRankingRow, medianAdSalesAmount: number) {
  const salesChange = row.adSalesAmountCompareRate ?? 0;
  const acosChange = row.acosCompareDelta ?? 0;
  const tacosChange = row.tacosCompareDelta ?? 0;
  const hasSalesDrop = salesChange < -0.05;
  const hasAcosWorse = acosChange > 0.01;
  const hasTacosWorse = tacosChange > 0.01;
  const hasEfficiencyImproved = acosChange < 0 && tacosChange < 0;
  const hasLowSalesHighAcos = row.adSalesAmount < medianAdSalesAmount && row.acos > 0.25;
  const hasHighSalesHighTacos = row.adSalesAmount >= medianAdSalesAmount && row.tacos > 0.2;
  const canScale = salesChange > 0.05 && acosChange <= 0 && tacosChange <= 0;

  if (hasSalesDrop && (hasAcosWorse || hasTacosWorse)) {
    return {
      type: "销售下降且效率变差",
      metrics: `广告销售额 ${formatCompare(row.adSalesAmountCompareRate)}；ACOS ${formatCompare(row.acosCompareDelta)}；TACOS ${formatCompare(row.tacosCompareDelta)}`,
      conclusion: "广告销售下降，同时成本效率恶化，优先级最高。",
      action: "收缩低效活动，检查搜索词、否词、CPC、广告CVR和Listing转化。",
    };
  }

  if (hasSalesDrop && hasEfficiencyImproved) {
    return {
      type: "销售下降但效率改善",
      metrics: `广告销售额 ${formatCompare(row.adSalesAmountCompareRate)}；ACOS ${formatCompare(row.acosCompareDelta)}；TACOS ${formatCompare(row.tacosCompareDelta)}`,
      conclusion: "广告效率变好但规模不足，需要确认广告是否被动收缩。",
      action: "检查预算是否受限、曝光是否下降、核心词排名是否掉，以及高效活动是否有放量空间。",
    };
  }

  if (salesChange > 0.05 && (hasAcosWorse || hasTacosWorse)) {
    return {
      type: "放量但效率变差",
      metrics: `广告销售额 ${formatCompare(row.adSalesAmountCompareRate)}；ACOS ${formatCompare(row.acosCompareDelta)}；TACOS ${formatCompare(row.tacosCompareDelta)}`,
      conclusion: "广告销售增长，但成本效率变差，不建议盲目加预算。",
      action: "先查高花费低转化活动、CPC、CTR、广告CVR和搜索词浪费。",
    };
  }

  if (hasLowSalesHighAcos) {
    return {
      type: "广告销售额低但ACOS高",
      metrics: `广告销售额 ${formatMoney(row.adSalesAmount)}；ACOS ${formatPercent(row.acos)}`,
      conclusion: "广告规模偏低且获客成本偏高，继续放量风险较大。",
      action: "优先排查低效广告活动，降低高花费低转化词出价，必要时暂停低效投放。",
    };
  }

  if (hasHighSalesHighTacos) {
    return {
      type: "广告销售额高但TACOS高",
      metrics: `广告销售额 ${formatMoney(row.adSalesAmount)}；TACOS ${formatPercent(row.tacos)}`,
      conclusion: "广告销售规模靠前，但整体广告依赖偏高。",
      action: "评估广告是否挤压自然单，提升自然流量和自然转化，避免总销售过度依赖广告。",
    };
  }

  if (hasSalesDrop) {
    return {
      type: "广告销售下降",
      metrics: `广告销售额 ${formatCompare(row.adSalesAmountCompareRate)}`,
      conclusion: "广告规模下降，需要确认是预算、曝光还是转化问题。",
      action: "检查预算是否受限、广告展示是否下降、核心词排名和广告订单变化。",
    };
  }

  if (hasAcosWorse || hasTacosWorse) {
    return {
      type: hasAcosWorse ? "ACOS恶化" : "TACOS恶化",
      metrics: `ACOS ${formatCompare(row.acosCompareDelta)}；TACOS ${formatCompare(row.tacosCompareDelta)}`,
      conclusion: "广告成本效率变差，需要控制费用率上升。",
      action: "检查高花费低转化词、竞价、否词、广告CVR，以及广告是否挤压自然单。",
    };
  }

  if (canScale) {
    return {
      type: "可放量建议",
      metrics: `广告销售额 ${formatCompare(row.adSalesAmountCompareRate)}；ACOS ${formatCompare(row.acosCompareDelta)}；TACOS ${formatCompare(row.tacosCompareDelta)}`,
      conclusion: "广告销售增长且效率没有变差，可以谨慎放量。",
      action: "优先给高转化活动和有效搜索词小幅加预算，观察ACOS/TACOS是否稳定。",
    };
  }

  return undefined;
}

function AdsRankingTable({ rows }: { rows: AdsRankingRow[] }) {
  return (
    <section className="mt-5 border border-line bg-white shadow-panel">
      <div className="border-b border-line px-4 py-3 text-sm font-semibold text-ink">广告排行</div>
      <div className="overflow-x-auto scrollbar-thin">
        <table className="w-full table-auto text-left text-sm">
          <thead className="bg-slate-50 text-xs text-muted">
            <tr>
              <th className="whitespace-nowrap px-4 py-3">运营负责人</th>
              <th className="whitespace-nowrap px-4 py-3">组别</th>
              <th className="whitespace-nowrap px-4 py-3 text-right">广告销售额</th>
              <th className="whitespace-nowrap px-4 py-3 text-right">广告销售额环比</th>
              <th className="whitespace-nowrap px-4 py-3 text-right">ACOS</th>
              <th className="whitespace-nowrap px-4 py-3 text-right">ACOS 环比</th>
              <th className="whitespace-nowrap px-4 py-3 text-right">TACOS</th>
              <th className="whitespace-nowrap px-4 py-3 text-right">TACOS 环比</th>
            </tr>
          </thead>
          <tbody className="divide-y divide-line">
            {rows.length ? (
              rows.map((row) => (
                <tr key={`${row.groupName}-${row.name}`} className="hover:bg-slate-50">
                  <td className="whitespace-nowrap px-4 py-3 font-medium text-ink">{row.name}</td>
                  <td className="whitespace-nowrap px-4 py-3 text-muted">{row.groupName}</td>
                  <td className="whitespace-nowrap px-4 py-3 text-right">{formatMoney(row.adSalesAmount)}</td>
                  <td className={`whitespace-nowrap px-4 py-3 text-right font-medium ${compareClassName(row.adSalesAmountCompareRate)}`}>
                    {formatCompare(row.adSalesAmountCompareRate)}
                  </td>
                  <td className="whitespace-nowrap px-4 py-3 text-right">{formatPercent(row.acos)}</td>
                  <td className={`whitespace-nowrap px-4 py-3 text-right font-medium ${compareClassName(row.acosCompareDelta, true)}`}>
                    {formatCompare(row.acosCompareDelta)}
                  </td>
                  <td className="whitespace-nowrap px-4 py-3 text-right">{formatPercent(row.tacos)}</td>
                  <td className={`whitespace-nowrap px-4 py-3 text-right font-medium ${compareClassName(row.tacosCompareDelta, true)}`}>
                    {formatCompare(row.tacosCompareDelta)}
                  </td>
                </tr>
              ))
            ) : (
              <tr>
                <td className="px-4 py-8 text-center text-muted" colSpan={8}>
                  当前筛选范围暂无广告排行数据
                </td>
              </tr>
            )}
          </tbody>
        </table>
      </div>
    </section>
  );
}

function AdsActionAdviceTable({ rows }: { rows: AdsRankingRow[] }) {
  const sortedSalesAmounts = rows.map((row) => row.adSalesAmount).sort((a, b) => a - b);
  const medianAdSalesAmount = sortedSalesAmounts.length ? sortedSalesAmounts[Math.floor(sortedSalesAmounts.length / 2)] : 0;
  const adviceRows = rows
    .map((row) => ({
      row,
      advice: buildAdsAdvice(row, medianAdSalesAmount),
    }))
    .filter((item): item is { row: AdsRankingRow; advice: NonNullable<ReturnType<typeof buildAdsAdvice>> } => Boolean(item.advice));

  return (
    <section className="mt-5 border border-line bg-white shadow-panel">
      <div className="border-b border-line px-4 py-3">
        <div className="text-sm font-semibold text-ink">广告异常监控与动作建议</div>
        <div className="mt-1 text-xs text-muted">只显示触发异常或可放量建议的运营；环比上升为红色，下降为绿色。</div>
      </div>
      <div className="overflow-x-auto">
        <table className="w-full min-w-[980px] text-left text-sm">
          <thead className="bg-slate-50 text-xs text-muted">
            <tr>
              <th className="px-4 py-3">运营负责人</th>
              <th className="px-4 py-3">组别</th>
              <th className="px-4 py-3">异常类型</th>
              <th className="px-4 py-3">触发指标</th>
              <th className="px-4 py-3">判断结论</th>
              <th className="px-4 py-3">执行动作</th>
            </tr>
          </thead>
          <tbody className="divide-y divide-line">
            {adviceRows.length ? (
              adviceRows.map(({ row, advice }) => (
                <tr key={`${row.groupName}-${row.name}-${advice.type}`} className="hover:bg-slate-50">
                  <td className="whitespace-nowrap px-4 py-3 font-medium text-ink">{row.name}</td>
                  <td className="whitespace-nowrap px-4 py-3 text-muted">{row.groupName}</td>
                  <td className="whitespace-nowrap px-4 py-3 font-medium text-ink">{advice.type}</td>
                  <td className="min-w-[240px] px-4 py-3">
                    <span className={changeClassName(row.adSalesAmountCompareRate)}>广告销售额 {formatCompare(row.adSalesAmountCompareRate)}</span>
                    <span className="mx-1 text-muted">/</span>
                    <span className={changeClassName(row.acosCompareDelta)}>ACOS {formatCompare(row.acosCompareDelta)}</span>
                    <span className="mx-1 text-muted">/</span>
                    <span className={changeClassName(row.tacosCompareDelta)}>TACOS {formatCompare(row.tacosCompareDelta)}</span>
                  </td>
                  <td className="min-w-[260px] px-4 py-3 text-ink">{advice.conclusion}</td>
                  <td className="min-w-[320px] px-4 py-3 text-muted">{advice.action}</td>
                </tr>
              ))
            ) : (
              <tr>
                <td className="px-4 py-8 text-center text-muted" colSpan={6}>
                  当前筛选周期暂无广告异常或可放量建议
                </td>
              </tr>
            )}
          </tbody>
        </table>
      </div>
    </section>
  );
}

export default async function AdsPage({
  searchParams,
}: {
  searchParams?: Promise<Record<string, string | string[] | undefined>>;
}) {
  const filters = normalizeComparisonFilters(parseFilters(await searchParams));

  try {
    const [options, summary, trend, rankings, latestMetricDate, dateBounds] = await Promise.all([
      getFilterOptions(),
      getAdsSummary(filters),
      getAdsTrend(filters),
      getAdsRankings(filters),
      getLatestAdsMetricDate(),
      getOperatorMetricDateBounds(),
    ]);

    return (
      <AppShell>
        <SectionTitle
          title="运营广告表现"
          description={
            <div className="space-y-1">
              <div>查看 Sessions、PV、总CVR、广告CTR、广告投入、ACOS/TACOS 和自然转化。</div>
              <div>数据来源：领星产品表现。</div>
              <div>当前运营产品表现最新日期：{latestMetricDate ?? "暂无数据"}</div>
            </div>
          }
        />
        <GlobalFilters dateBounds={dateBounds} filters={filters} options={options} showComparisonMode />
        <div className="grid gap-3 md:grid-cols-4">
          <MetricCard label="Sessions" value={formatNumber(summary.sessionsTotal)} />
          <MetricCard label="PV" value={formatNumber(summary.pageViewsTotal)} />
          <MetricCard label="总CVR" value={formatPercent(summary.cvr)} hint="sum(order_items) / sum(sessions_total)，计算后显示" />
          <MetricCard label="广告花费" value={formatMoney(summary.spend)} />
          <MetricCard label="广告展示" value={formatNumber(summary.impressions)} />
          <MetricCard label="广告点击" value={formatNumber(summary.clicks)} />
          <MetricCard label="广告CTR" value={formatPercent(summary.ctr)} hint="sum(clicks) / sum(impressions)，计算后显示" />
          <MetricCard
            label="CPC"
            value={formatMoneyDecimal(summary.cpc)}
            hint="sum(spend) / sum(clicks)，计算后显示"
          />
          <MetricCard label="广告销售额" value={formatMoney(summary.adSalesAmount)} />
          <MetricCard label="广告 CVR" value={formatPercent(summary.adCvr)} hint="sum(ad_order_quantity) / sum(clicks)，计算后显示" />
          <MetricCard label="ACOS" value={formatPercent(summary.acos)} hint="sum(spend) / sum(ad_sales_amount)，计算后显示" />
          <MetricCard label="TACOS" value={formatPercent(summary.tacos)} hint="sum(spend) / sum(amount)，计算后显示" />
          <MetricCard label="自然点击" value={formatNumber(summary.natureClick)} />
          <MetricCard label="自然订单" value={formatNumber(summary.natureOrderItems)} />
          <MetricCard
            label="自然 CVR"
            value={formatPercent(summary.natureCvr)}
            hint="sum(nature_order_items) / sum(nature_click)，计算后显示"
          />
          <MetricCard label="校验行数" value={formatNumber(summary.rowCount)} hint="当前筛选命中的 fact_operator_daily_metrics 行数" />
        </div>

        <section className="mt-5 border border-line bg-white p-4 shadow-panel">
          <div className="text-sm font-semibold text-ink">指标口径校验</div>
          <div className="mt-3 grid gap-3 text-sm md:grid-cols-3">
            <div className="border border-line p-3">
              <div className="text-xs text-muted">总CVR</div>
              <div className="mt-1 font-semibold text-ink">{formatPercent(summary.cvr)}</div>
              <div className="mt-1 text-xs text-muted">sum(order_items) / sum(sessions_total)</div>
            </div>
            <div className="border border-line p-3">
              <div className="text-xs text-muted">广告CTR</div>
              <div className="mt-1 font-semibold text-ink">{formatPercent(summary.ctr)}</div>
              <div className="mt-1 text-xs text-muted">sum(clicks) / sum(impressions)</div>
            </div>
            <div className="border border-line p-3">
              <div className="text-xs text-muted">自然 CVR</div>
              <div className="mt-1 font-semibold text-ink">{formatPercent(summary.natureCvr)}</div>
              <div className="mt-1 text-xs text-muted">sum(nature_order_items) / sum(nature_click)</div>
            </div>
          </div>
        </section>

        <div className="mt-5">
          <SelectableAdsTrafficTrendChart data={trend} />
        </div>

        <div className="mt-5 grid gap-5 xl:grid-cols-2">
          <TrendChart
            title="广告花费 vs 广告销售额"
            data={trend}
            series={[
              { key: "spend", name: "广告花费", color: "#b45309", type: "bar" },
              { key: "adSalesAmount", name: "广告销售额", color: "#0f766e", type: "bar" },
            ]}
          />
          <TrendChart
            title="ACOS / TACOS 趋势"
            data={trend}
            series={[
              { key: "acos", name: "ACOS", color: "#dc5f45" },
              { key: "tacos", name: "TACOS", color: "#2563eb" },
            ]}
            valueFormat="percent"
          />
        </div>
        <div className="mt-5">
          <SelectableAdsCvrTrendChart data={trend} />
        </div>
        <AdsRankingTable rows={rankings} />
        <AdsActionAdviceTable rows={rankings} />
      </AppShell>
    );
  } catch (error) {
    return (
      <AppShell>
        <SectionTitle title="运营广告表现" />
        <ErrorState message={displayError(error)} />
      </AppShell>
    );
  }
}
