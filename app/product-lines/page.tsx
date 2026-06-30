import { AppShell } from "@/components/dashboard/app-shell";
import { ProductLineFilters } from "@/components/dashboard/product-line-filters";
import { SectionTitle } from "@/components/dashboard/section-title";
import { ErrorState } from "@/components/states/error-state";
import {
  getLatestProductLineDailyDate,
  getProductLineComparisonRows,
  getProductLineFilterOptions,
  type ProductLineComparisonMetric,
  type ProductLineComparisonRow,
} from "@/lib/queries/product-lines";
import { displayError } from "@/lib/services/errors";
import { normalizeComparisonFilters, parseFilters, previousComparisonRange, type DashboardFilters } from "@/lib/utils/date";
import { endOfMonth, format, parseISO, startOfMonth } from "date-fns";

type MetricColumn = {
  key: keyof ProductLineComparisonMetric;
  label: string;
  type: "number" | "money" | "percent" | "decimal";
};

const metricColumns: MetricColumn[] = [
  { key: "orderItems", label: "订单量", type: "number" },
  { key: "sessionsTotal", label: "Sessions", type: "number" },
  { key: "pageViewsTotal", label: "PV", type: "number" },
  { key: "cvr", label: "CVR", type: "percent" },
  { key: "cpc", label: "CPC", type: "money" },
  { key: "ctr", label: "广告CTR", type: "percent" },
  { key: "spend", label: "广告花费", type: "money" },
  { key: "adSalesAmount", label: "广告销售额", type: "money" },
  { key: "acos", label: "ACOS", type: "percent" },
  { key: "adOrderQuantity", label: "广告订单量", type: "number" },
  { key: "adOrderRate", label: "广告订单占比", type: "percent" },
  { key: "adCvr", label: "广告CVR", type: "percent" },
  { key: "impressions", label: "广告展示", type: "number" },
  { key: "clicks", label: "广告点击", type: "number" },
  { key: "cpa", label: "CPA", type: "decimal" },
  { key: "natureClick", label: "自然点击", type: "number" },
  { key: "natureOrderItems", label: "自然订单量", type: "number" },
  { key: "natureCvr", label: "自然CVR", type: "percent" },
];

function formatMoneyValue(value: number) {
  return new Intl.NumberFormat("zh-CN", {
    style: "currency",
    currency: "USD",
    maximumFractionDigits: 2,
  }).format(value);
}

function formatNumberValue(value: number) {
  return new Intl.NumberFormat("zh-CN", {
    maximumFractionDigits: 0,
  }).format(value);
}

function formatDecimalValue(value: number) {
  return value.toFixed(2);
}

function formatPercentValue(value: number) {
  return `${(value * 100).toFixed(2)}%`;
}

function formatMetric(value: number, type: MetricColumn["type"]) {
  if (type === "money") return formatMoneyValue(value);
  if (type === "percent") return formatPercentValue(value);
  if (type === "decimal") return formatDecimalValue(value);
  return formatNumberValue(value);
}

function formatCompareMetric(value: number, type: MetricColumn["type"]) {
  if (type === "money" || type === "decimal") return value.toFixed(2);
  return formatPercentValue(value);
}

function compareClassName(value: number) {
  if (value === 0) return "text-muted";
  return value > 0 ? "text-emerald-700" : "text-red-600";
}

async function normalizeProductLineFilters(params?: Record<string, string | string[] | undefined>): Promise<DashboardFilters> {
  const parsed = parseFilters(params);
  const filters = normalizeComparisonFilters(parsed);
  const monthFilters =
    filters.comparisonMode === "month"
      ? {
          ...filters,
          startDate: format(startOfMonth(parseISO(filters.startDate)), "yyyy-MM-dd"),
          endDate: format(endOfMonth(parseISO(filters.startDate)), "yyyy-MM-dd"),
        }
      : filters;

  if (params?.startDate || params?.endDate) {
    return monthFilters;
  }

  const latestDate = await getLatestProductLineDailyDate();
  if (!latestDate) return monthFilters;

  const defaultFilters = {
    ...monthFilters,
    startDate: format(startOfMonth(new Date(`${latestDate}T00:00:00`)), "yyyy-MM-dd"),
    endDate: latestDate,
  };

  const normalizedDefaultFilters = normalizeComparisonFilters(defaultFilters);

  if (normalizedDefaultFilters.comparisonMode === "month") {
    return {
      ...normalizedDefaultFilters,
      startDate: format(startOfMonth(parseISO(normalizedDefaultFilters.startDate)), "yyyy-MM-dd"),
      endDate: format(endOfMonth(parseISO(normalizedDefaultFilters.startDate)), "yyyy-MM-dd"),
    };
  }

  return normalizedDefaultFilters;
}

function formatRangeLabel(startDate: string, endDate: string, comparisonMode: DashboardFilters["comparisonMode"]) {
  if (comparisonMode === "month") {
    return `${endDate.slice(2, 4)}年${Number(endDate.slice(5, 7))}月`;
  }

  if (startDate === endDate) {
    return startDate.slice(5).replace("-", "/");
  }

  return `${startDate.slice(5).replace("-", "/")}-${endDate.slice(5).replace("-", "/")}`;
}

function ProductLineComparisonTable({
  currentLabel,
  previousLabel,
  rows,
}: {
  currentLabel: string;
  previousLabel: string;
  rows: ProductLineComparisonRow[];
}) {
  if (!rows.length) {
    return (
      <section className="bg-white px-4 py-8 text-center text-sm text-muted shadow-panel">
        暂无符合筛选条件的品线数据。
      </section>
    );
  }

  return (
    <div className="space-y-5">
      {rows.map((row) => {
        const tableRows = [
          { label: previousLabel, values: row.previous, kind: "previous" as const },
          { label: currentLabel, values: row.current, kind: "current" as const },
          { label: "环比", values: row.compare, kind: "compare" as const },
        ];

        return (
          <section key={row.productLineName} className="overflow-hidden bg-white shadow-panel">
            <div className="border-b border-line bg-slate-50 px-4 py-3">
              <div className="text-[15px] font-semibold text-ink">{row.productLineName}</div>
            </div>
            <div className="overflow-x-auto scrollbar-thin">
              <table className="w-full min-w-[1560px] table-fixed text-center text-xs">
                <thead>
                  <tr className="bg-[#efd66a] text-black">
                    <th className="sticky left-0 z-20 w-24 bg-[#efd66a] px-3 py-2 text-left font-semibold shadow-[1px_0_0_#e2e8f0]">
                      周期
                    </th>
                    {metricColumns.map((column) => (
                      <th key={column.key} className="w-24 px-3 py-2 font-semibold">
                        {column.label}
                      </th>
                    ))}
                  </tr>
                </thead>
                <tbody className="bg-slate-100">
                  {tableRows.map((tableRow) => (
                    <tr key={`${row.productLineName}-${tableRow.kind}`} className="border-b border-white/70 last:border-b-0">
                      <td
                        className="sticky left-0 z-10 bg-slate-100 px-3 py-2 text-left font-semibold text-slate-700 shadow-[1px_0_0_#e2e8f0]"
                      >
                        {tableRow.label}
                      </td>
                      {metricColumns.map((column) => {
                        const value = tableRow.values[column.key];
                        const isCompare = tableRow.kind === "compare";

                        return (
                          <td key={column.key} className={`px-3 py-2 tabular-nums ${isCompare ? compareClassName(value) : "text-black"}`}>
                            {isCompare ? formatCompareMetric(value, column.type) : formatMetric(value, column.type)}
                          </td>
                        );
                      })}
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </section>
        );
      })}
    </div>
  );
}

export default async function ProductLinesPage({
  searchParams,
}: {
  searchParams?: Promise<Record<string, string | string[] | undefined>>;
}) {
  const params = await searchParams;
  const filters = await normalizeProductLineFilters(params);
  const comparisonRange = previousComparisonRange(filters);
  const currentLabel = formatRangeLabel(filters.startDate, filters.endDate, filters.comparisonMode);
  const previousLabel = formatRangeLabel(comparisonRange.startDate, comparisonRange.endDate, filters.comparisonMode);

  try {
    const [options, rows] = await Promise.all([
      getProductLineFilterOptions(),
      getProductLineComparisonRows(filters, comparisonRange),
    ]);

    return (
      <AppShell>
        <SectionTitle
          title="品线产品表现"
          description="全部数据取自 fact_product_line_daily_metrics，按品线展示上一期、本期和环比变化。"
        />
        <ProductLineFilters filters={filters} options={options} />
        <ProductLineComparisonTable currentLabel={currentLabel} previousLabel={previousLabel} rows={rows} />
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
