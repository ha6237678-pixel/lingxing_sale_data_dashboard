import { TargetMonthlyBarChart } from "@/components/charts/target-monthly-bar-chart";
import { AppShell } from "@/components/dashboard/app-shell";
import { ProductLineTargetFilters } from "@/components/dashboard/product-line-target-filters";
import { ErrorState } from "@/components/states/error-state";
import { getProductLineFilterOptions } from "@/lib/queries/product-lines";
import {
  getLatestProductLineTargetDate,
  getProductLineTargetRankings,
  type ProductLineTargetRow,
} from "@/lib/queries/product-line-targets";
import { displayError } from "@/lib/services/errors";
import { parseFilters } from "@/lib/utils/date";
import { formatMoney, formatPercent } from "@/lib/utils/number";
import { format, startOfMonth } from "date-fns";

function ProductLineTargetTable({ rows, title, showOperator = true }: { rows: ProductLineTargetRow[]; title: string; showOperator?: boolean }) {
  return (
    <section className="mt-5 rounded-[12px] border border-line bg-white p-6 shadow-panel">
      <div className="mb-4 text-[16px] font-semibold text-[#1F2D3D]">{title}</div>
      <div className="overflow-x-auto">
        <table className="min-w-full text-left text-sm">
          <thead className="bg-slate-50 text-xs text-muted">
            <tr>
              <th className="px-4 py-3">{showOperator ? "品线" : "组别"}</th>
              {showOperator ? <th className="px-4 py-3">运营负责人</th> : null}
              <th className="px-4 py-3">组别</th>
              <th className="px-4 py-3 text-right">销售目标</th>
              <th className="px-4 py-3 text-right">实际销售额</th>
              <th className="px-4 py-3 text-right">月化销售完成率</th>
              <th className="px-4 py-3 text-right">利润目标</th>
              <th className="px-4 py-3 text-right">实际毛利</th>
              <th className="px-4 py-3 text-right">月化利润完成率</th>
            </tr>
          </thead>
          <tbody className="divide-y divide-line">
            {rows.map((row) => (
              <tr key={`${row.groupName}-${row.operatorName}-${row.name}`} className="hover:bg-slate-50">
                <td className="px-4 py-3 font-medium">{row.name}</td>
                {showOperator ? <td className="px-4 py-3 text-muted">{row.operatorName || "-"}</td> : null}
                <td className="px-4 py-3 text-muted">{row.groupName}</td>
                <td className="px-4 py-3 text-right">{formatMoney(row.salesTarget)}</td>
                <td className="px-4 py-3 text-right">{formatMoney(row.actualSales)}</td>
                <td className="px-4 py-3 text-right font-semibold text-blue-700">{formatPercent(row.monthlySalesCompletion)}</td>
                <td className="px-4 py-3 text-right">{formatMoney(row.profitTarget)}</td>
                <td className="px-4 py-3 text-right">{formatMoney(row.actualProfit)}</td>
                <td className="px-4 py-3 text-right font-semibold text-blue-700">{formatPercent(row.monthlyProfitCompletion)}</td>
              </tr>
            ))}
            {!rows.length ? (
              <tr>
                <td className="px-4 py-8 text-center text-muted" colSpan={showOperator ? 9 : 8}>
                  当前筛选条件下没有品线目标数据
                </td>
              </tr>
            ) : null}
          </tbody>
        </table>
      </div>
    </section>
  );
}

export default async function ProductLineTargetsPage({ searchParams }: { searchParams?: Promise<Record<string, string | string[] | undefined>> }) {
  const params = await searchParams;
  const filters = parseFilters(params);

  try {
    const latestDate = await getLatestProductLineTargetDate();
    const hasEndDate = Boolean(params?.endDate);
    const hasStartDate = Boolean(params?.startDate);
    if (latestDate && !hasEndDate) {
      filters.endDate = latestDate;
      if (!hasStartDate) {
        filters.startDate = format(startOfMonth(new Date(`${latestDate}T00:00:00`)), "yyyy-MM-dd");
      }
    }

    const [options, rankings] = await Promise.all([
      getProductLineFilterOptions(),
      getProductLineTargetRankings(filters),
    ]);

    return (
      <AppShell>
        <div className="mb-4">
          <h1 className="text-xl font-semibold text-ink">品线目标达成</h1>
          <div className="mt-1 text-sm leading-6 text-muted">
            <p>根据 fact_product_line_monthly_target 的品线目标，展示当前周期实际值、完成率和月化完成率。</p>
            <p>实际销售额取自 [领星-产品表现]，实际毛利取自 [领星-结算利润]。</p>
          </div>
        </div>
        <ProductLineTargetFilters filters={filters} options={options} />
        <div className="-mt-2 mb-5 text-sm font-semibold text-blue-700">当前品线结算利润最新日期：{latestDate ?? "暂无数据"}</div>
        <ProductLineTargetTable rows={rankings} title="品线目标达成排行（按销售目标从高到低排序）" />
        <TargetMonthlyBarChart data={rankings} title="品线月化完成率（全部品线）" />
      </AppShell>
    );
  } catch (error) {
    return (
      <AppShell>
        <div className="mb-4">
          <h1 className="text-xl font-semibold text-ink">品线目标达成</h1>
        </div>
        <ErrorState message={displayError(error)} />
      </AppShell>
    );
  }
}
