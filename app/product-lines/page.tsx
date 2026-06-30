import { TrendChart } from "@/components/charts/trend-chart";
import { AppShell } from "@/components/dashboard/app-shell";
import { MetricCard } from "@/components/dashboard/metric-card";
import { ProductLineFilters } from "@/components/dashboard/product-line-filters";
import { SectionTitle } from "@/components/dashboard/section-title";
import { ErrorState } from "@/components/states/error-state";
import {
  getLatestProductLineDailyDate,
  getProductLineFilterOptions,
  getProductLineRankings,
  getProductLineSummary,
  getProductLineTrend,
  type ProductLineRankingRow,
} from "@/lib/queries/product-lines";
import { displayError } from "@/lib/services/errors";
import { parseFilters, type DashboardFilters } from "@/lib/utils/date";
import { formatMoney, formatMoneyDecimal, formatNumber, formatPercent } from "@/lib/utils/number";
import { format, startOfMonth } from "date-fns";

async function normalizeProductLineFilters(params?: Record<string, string | string[] | undefined>): Promise<DashboardFilters> {
  const filters = parseFilters(params);
  const normalizedCidFilter = filters.cid && !filters.principalUid ? { ...filters, cid: undefined } : filters;

  if (params?.startDate || params?.endDate) {
    return normalizedCidFilter;
  }

  const latestDate = await getLatestProductLineDailyDate();
  if (!latestDate) return normalizedCidFilter;

  return {
    ...normalizedCidFilter,
    startDate: format(startOfMonth(new Date(`${latestDate}T00:00:00`)), "yyyy-MM-dd"),
    endDate: latestDate,
  };
}

function ProductLineRankingTable({ rows }: { rows: ProductLineRankingRow[] }) {
  return (
    <section className="border border-line bg-white shadow-panel">
      <div className="border-b border-line px-4 py-3 text-sm font-semibold text-ink">品线产品表现排行</div>
      <div className="overflow-x-auto scrollbar-thin">
        <table className="w-full table-auto text-left text-sm">
          <thead className="bg-slate-50 text-xs text-muted">
            <tr>
              <th className="whitespace-nowrap px-4 py-3">品线</th>
              <th className="whitespace-nowrap px-4 py-3">运营</th>
              <th className="whitespace-nowrap px-4 py-3">组别</th>
              <th className="whitespace-nowrap px-4 py-3 text-right">销售额</th>
              <th className="whitespace-nowrap px-4 py-3 text-right">销量</th>
              <th className="whitespace-nowrap px-4 py-3 text-right">订单商品数</th>
              <th className="whitespace-nowrap px-4 py-3 text-right">Sessions</th>
              <th className="whitespace-nowrap px-4 py-3 text-right">CVR</th>
              <th className="whitespace-nowrap px-4 py-3 text-right">广告花费</th>
              <th className="whitespace-nowrap px-4 py-3 text-right">广告销售额</th>
              <th className="whitespace-nowrap px-4 py-3 text-right">ACOS</th>
              <th className="whitespace-nowrap px-4 py-3 text-right">TACOS</th>
            </tr>
          </thead>
          <tbody className="divide-y divide-line">
            {rows.length ? (
              rows.map((row) => (
                <tr key={`${row.operatorName}-${row.cid}`} className="hover:bg-slate-50">
                  <td className="whitespace-nowrap px-4 py-3 font-medium text-ink">
                    {row.productLineName}
                    <div className="mt-1 text-xs font-normal text-muted">CID {row.cid}</div>
                  </td>
                  <td className="whitespace-nowrap px-4 py-3">{row.operatorName}</td>
                  <td className="whitespace-nowrap px-4 py-3 text-muted">{row.groupName}</td>
                  <td className="whitespace-nowrap px-4 py-3 text-right">{formatMoney(row.amount)}</td>
                  <td className="whitespace-nowrap px-4 py-3 text-right">{formatNumber(row.volume)}</td>
                  <td className="whitespace-nowrap px-4 py-3 text-right">{formatNumber(row.orderItems)}</td>
                  <td className="whitespace-nowrap px-4 py-3 text-right">{formatNumber(row.sessionsTotal)}</td>
                  <td className="whitespace-nowrap px-4 py-3 text-right">{formatPercent(row.cvr)}</td>
                  <td className="whitespace-nowrap px-4 py-3 text-right">{formatMoney(row.spend)}</td>
                  <td className="whitespace-nowrap px-4 py-3 text-right">{formatMoney(row.adSalesAmount)}</td>
                  <td className="whitespace-nowrap px-4 py-3 text-right">{formatPercent(row.acos)}</td>
                  <td className="whitespace-nowrap px-4 py-3 text-right">{formatPercent(row.tacos)}</td>
                </tr>
              ))
            ) : (
              <tr>
                <td className="px-4 py-8 text-center text-muted" colSpan={12}>
                  当前筛选范围暂无品线产品表现数据
                </td>
              </tr>
            )}
          </tbody>
        </table>
      </div>
    </section>
  );
}

export default async function ProductLinesPage({
  searchParams,
}: {
  searchParams?: Promise<Record<string, string | string[] | undefined>>;
}) {
  const params = await searchParams;
  const filters = await normalizeProductLineFilters(params);

  try {
    const [options, summary, trend, rankings] = await Promise.all([
      getProductLineFilterOptions(),
      getProductLineSummary(filters),
      getProductLineTrend(filters),
      getProductLineRankings(filters),
    ]);

    return (
      <AppShell>
        <SectionTitle
          title="品线产品表现"
          description="全部数据取自 fact_product_line_daily_metrics，按 principal_uid + cid 查看真实品线产品表现口径。"
        />
        <ProductLineFilters filters={filters} options={options} />

        <div className="grid gap-3 md:grid-cols-4">
          <MetricCard label="品线销售额" value={formatMoney(summary.amount)} hint="sum(amount)" />
          <MetricCard label="品线销量" value={formatNumber(summary.volume)} hint="sum(volume)" />
          <MetricCard label="订单商品数" value={formatNumber(summary.orderItems)} hint="sum(order_items)" />
          <MetricCard label="CVR" value={formatPercent(summary.cvr)} hint="sum(order_items) / sum(sessions_total)" />
          <MetricCard label="Sessions" value={formatNumber(summary.sessionsTotal)} />
          <MetricCard label="Page Views" value={formatNumber(summary.pageViewsTotal)} />
          <MetricCard label="广告展示" value={formatNumber(summary.impressions)} />
          <MetricCard label="广告点击" value={formatNumber(summary.clicks)} />
          <MetricCard label="广告 CTR" value={formatPercent(summary.ctr)} hint="sum(clicks) / sum(impressions)" />
          <MetricCard label="CPC" value={formatMoneyDecimal(summary.cpc)} hint="sum(spend) / sum(clicks)" />
          <MetricCard label="广告花费" value={formatMoney(summary.spend)} />
          <MetricCard label="广告销售额" value={formatMoney(summary.adSalesAmount)} />
          <MetricCard label="广告 CVR" value={formatPercent(summary.adCvr)} hint="sum(ad_order_quantity) / sum(clicks)" />
          <MetricCard label="ACOS" value={formatPercent(summary.acos)} hint="sum(spend) / sum(ad_sales_amount)" />
          <MetricCard label="TACOS" value={formatPercent(summary.tacos)} hint="sum(spend) / sum(amount)" />
          <MetricCard label="自然 CVR" value={formatPercent(summary.natureCvr)} hint="sum(nature_order_items) / sum(nature_click)" />
        </div>

        <div className="mt-5 grid gap-5 xl:grid-cols-2">
          <TrendChart
            title="销售额 / 销量趋势"
            data={trend}
            series={[
              { key: "amount", name: "销售额", color: "#0f766e", type: "bar" },
              { key: "volume", name: "销量", color: "#2563eb", type: "bar" },
            ]}
          />
          <TrendChart
            title="流量趋势"
            data={trend}
            series={[
              { key: "sessionsTotal", name: "Sessions", color: "#0f766e" },
              { key: "pageViewsTotal", name: "Page Views", color: "#2563eb" },
            ]}
          />
          <TrendChart
            title="广告花费 / 广告销售额趋势"
            data={trend}
            series={[
              { key: "spend", name: "广告花费", color: "#b45309", type: "bar" },
              { key: "adSalesAmount", name: "广告销售额", color: "#2563eb", type: "bar" },
            ]}
          />
          <TrendChart
            title="ACOS / TACOS / CVR 趋势"
            data={trend}
            series={[
              { key: "acos", name: "ACOS", color: "#dc5f45" },
              { key: "tacos", name: "TACOS", color: "#2563eb" },
              { key: "cvr", name: "CVR", color: "#0f766e" },
            ]}
            valueFormat="percent"
          />
        </div>

        <div className="mt-5">
          <ProductLineRankingTable rows={rankings} />
        </div>
      </AppShell>
    );
  } catch (error) {
    return (
      <AppShell>
        <SectionTitle title="品线产品表现" />
        <ErrorState message={displayError(error)} />
      </AppShell>
    );
  }
}
