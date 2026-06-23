import { AppShell } from "@/components/dashboard/app-shell";
import { GlobalFilters } from "@/components/dashboard/global-filters";
import { MetricCard } from "@/components/dashboard/metric-card";
import { RankingTable } from "@/components/dashboard/ranking-table";
import { SectionTitle } from "@/components/dashboard/section-title";
import { ErrorState } from "@/components/states/error-state";
import { TrendChart } from "@/components/charts/trend-chart";
import { getFilterOptions } from "@/lib/queries/common";
import { getSalesRankings, getSalesSummary, getSalesTrend } from "@/lib/queries/sales";
import { displayError } from "@/lib/services/errors";
import { parseFilters } from "@/lib/utils/date";
import { formatMoney, formatNumber, formatPercent } from "@/lib/utils/number";

export default async function SalesPage({ searchParams }: { searchParams?: Promise<Record<string, string | string[] | undefined>> }) {
  const params = await searchParams;
  const filters = parseFilters(params);

  try {
    const [options, summary, trend, groupRankings, operatorRankings] = await Promise.all([
      getFilterOptions(),
      getSalesSummary(filters),
      getSalesTrend(filters),
      getSalesRankings(filters, "group"),
      getSalesRankings(filters, "operator"),
    ]);

    return (
      <AppShell>
        <SectionTitle title="销售数据总览" description="按日期、组别、运营负责人查看销售额、销量、订单和 B2B 表现。" />
        <GlobalFilters filters={filters} options={options} />
        <div className="grid gap-3 md:grid-cols-4">
          <MetricCard label="销售额" value={formatMoney(summary.amount)} hint="sum(amount)" />
          <MetricCard label="销量" value={formatNumber(summary.volume)} hint="sum(volume)" />
          <MetricCard label="订单量" value={formatNumber(summary.orderItems)} hint="sum(order_items)" />
          <MetricCard label="广告订单占比" value={formatPercent(summary.adOrderRate)} hint="sum(ad_order_quantity) / sum(order_items)" />
          <MetricCard label="广告订单量" value={formatNumber(summary.adOrderQuantity)} />
          <MetricCard label="B2B 销售额" value={formatMoney(summary.b2bAmount)} />
          <MetricCard label="B2B 销量" value={formatNumber(summary.b2bVolume)} />
          <MetricCard label="B2B 订单量" value={formatNumber(summary.b2bOrderItems)} />
        </div>
        <div className="mt-5">
          <TrendChart
            title="销售趋势"
            data={trend}
            series={[
              { key: "amount", name: "销售额", color: "#0f766e" },
              { key: "volume", name: "销量", color: "#2563eb" },
              { key: "orderItems", name: "订单", color: "#dc5f45" },
            ]}
          />
        </div>
        <div className="mt-5 grid gap-5 xl:grid-cols-2">
          <RankingTable title="组别销售排行" rows={groupRankings} />
          <RankingTable title="运营销售排行" rows={operatorRankings} />
        </div>
      </AppShell>
    );
  } catch (error) {
    return (
      <AppShell>
        <SectionTitle title="销售数据总览" />
        <ErrorState message={displayError(error)} />
      </AppShell>
    );
  }
}
