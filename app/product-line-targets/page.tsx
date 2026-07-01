import { AppShell } from "@/components/dashboard/app-shell";
import { ProductLineTargetsClient } from "@/components/dashboard/product-line-targets-client";
import { ErrorState } from "@/components/states/error-state";
import { getProductLineFilterOptions } from "@/lib/queries/product-lines";
import { getLatestProductLineTargetDate, getProductLineTargetRankings } from "@/lib/queries/product-line-targets";
import { displayError } from "@/lib/services/errors";
import { parseFilters } from "@/lib/utils/date";
import { format, startOfMonth } from "date-fns";

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

    const [options, rankings] = await Promise.all([getProductLineFilterOptions(), getProductLineTargetRankings(filters)]);

    return (
      <AppShell>
        <div className="mb-4">
          <h1 className="text-xl font-semibold text-ink">品线完成率</h1>
          <div className="mt-1 text-sm leading-6 text-muted">
            <p>根据 fact_product_line_monthly_target 的品线目标，展示当前周期实际值和月化完成率。</p>
            <p>实际销售额取自 [领星-产品表现]，实际毛利取自 [领星-结算利润]。</p>
          </div>
        </div>
        <ProductLineTargetsClient initialFilters={filters} initialLatestDate={latestDate} initialRankings={rankings} options={options} />
      </AppShell>
    );
  } catch (error) {
    return (
      <AppShell>
        <div className="mb-4">
          <h1 className="text-xl font-semibold text-ink">品线完成率</h1>
        </div>
        <ErrorState message={displayError(error)} />
      </AppShell>
    );
  }
}
