import { SelectableAdsTrafficTrendChart } from "@/components/charts/selectable-ads-traffic-trend-chart";
import { SelectableAdsCvrTrendChart } from "@/components/charts/selectable-ads-cvr-trend-chart";
import { TrendChart } from "@/components/charts/trend-chart";
import { AppShell } from "@/components/dashboard/app-shell";
import { GlobalFilters } from "@/components/dashboard/global-filters";
import { MetricCard } from "@/components/dashboard/metric-card";
import { SectionTitle } from "@/components/dashboard/section-title";
import { ErrorState } from "@/components/states/error-state";
import { getFilterOptions } from "@/lib/queries/common";
import { getAdsSummary, getAdsTrend } from "@/lib/queries/ads";
import { displayError } from "@/lib/services/errors";
import { parseFilters } from "@/lib/utils/date";
import { formatMoney, formatMoneyDecimal, formatNumber, formatPercent } from "@/lib/utils/number";

export default async function AdsPage({
  searchParams,
}: {
  searchParams?: Promise<Record<string, string | string[] | undefined>>;
}) {
  const filters = parseFilters(await searchParams);

  try {
    const [options, summary, trend] = await Promise.all([
      getFilterOptions(),
      getAdsSummary(filters),
      getAdsTrend(filters),
    ]);

    return (
      <AppShell>
        <SectionTitle
          title="流量与广告总览"
          description="查看 Sessions、PV、总CVR、广告CTR、广告投入、ACOS/TACOS 和自然转化。"
        />
        <GlobalFilters filters={filters} options={options} />
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
          <SelectableAdsCvrTrendChart data={trend} />
        </div>
      </AppShell>
    );
  } catch (error) {
    return (
      <AppShell>
        <SectionTitle title="流量与广告总览" />
        <ErrorState message={displayError(error)} />
      </AppShell>
    );
  }
}
