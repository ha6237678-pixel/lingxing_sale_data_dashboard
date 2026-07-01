import { AppShell } from "@/components/dashboard/app-shell";
import { ProductLineFilters } from "@/components/dashboard/product-line-filters";
import { SectionTitle } from "@/components/dashboard/section-title";
import { ErrorState } from "@/components/states/error-state";
import {
  getLatestProductLineDailyDate,
  getLatestProductLineSettlementDate,
  getProductLineComparisonRows,
  getProductLineFilterOptions,
  getProductLineSettlementRows,
  type ProductLineComparisonMetric,
  type ProductLineComparisonRow,
  type ProductLineSettlementMetric,
  type ProductLineSettlementRow,
} from "@/lib/queries/product-lines";
import { displayError } from "@/lib/services/errors";
import { normalizeComparisonFilters, parseFilters, previousComparisonRange, type DashboardFilters } from "@/lib/utils/date";
import { endOfMonth, format, parseISO, startOfMonth } from "date-fns";
import type { ReactNode } from "react";

type ProductMetricColumn = {
  key: keyof ProductLineComparisonMetric;
  label: string;
  type: "number" | "money" | "percent" | "decimal";
};

type SettlementMetricColumn = {
  key: keyof ProductLineSettlementMetric;
  label: string;
  type: "number" | "money" | "percent" | "decimal";
  compareType: "rate" | "delta";
};

const productMetricColumns: ProductMetricColumn[] = [
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

const settlementMetricColumns: SettlementMetricColumn[] = [
  { key: "volume", label: "销量", type: "number", compareType: "rate" },
  { key: "salesAmount", label: "销售额", type: "decimal", compareType: "rate" },
  { key: "grossProfit", label: "毛利润", type: "decimal", compareType: "rate" },
  { key: "grossRate", label: "毛利率", type: "percent", compareType: "delta" },
  { key: "adSalesQuantity", label: "广告销量", type: "number", compareType: "rate" },
  { key: "adSalesAmount", label: "广告销售额", type: "decimal", compareType: "rate" },
  { key: "adsCost", label: "广告费", type: "decimal", compareType: "rate" },
  { key: "refundsRate", label: "退款率", type: "percent", compareType: "delta" },
  { key: "adsCostRate", label: "广告费占比", type: "percent", compareType: "delta" },
  { key: "discountRate", label: "折扣占比", type: "percent", compareType: "delta" },
  { key: "acos", label: "ACOS", type: "percent", compareType: "delta" },
  { key: "tacos", label: "TACOS", type: "percent", compareType: "delta" },
  { key: "firstTripRate", label: "头程费比", type: "percent", compareType: "delta" },
  { key: "purchaseRate", label: "采购费比", type: "percent", compareType: "delta" },
  { key: "fbaRate", label: "FBA费比", type: "percent", compareType: "delta" },
  { key: "storageRate", label: "仓储费比", type: "percent", compareType: "delta" },
  { key: "platformRate", label: "平台费比", type: "percent", compareType: "delta" },
  { key: "customerPrice", label: "客单价", type: "money", compareType: "rate" },
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

function formatMetric(value: number, type: ProductMetricColumn["type"]) {
  if (type === "money") return formatMoneyValue(value);
  if (type === "percent") return formatPercentValue(value);
  if (type === "decimal") return formatDecimalValue(value);
  return formatNumberValue(value);
}

function formatProductCompareMetric(value: number, type: ProductMetricColumn["type"]) {
  if (type === "money" || type === "decimal") return value.toFixed(2);
  return formatPercentValue(value);
}

function formatSettlementCompareMetric(value: number) {
  return formatPercentValue(value);
}

function compareClassName(value: number) {
  if (value === 0) return "text-muted";
  return value > 0 ? "text-red-600" : "text-emerald-700";
}

function formatSignedPercentValue(value: number) {
  const prefix = value > 0 ? "+" : "";
  return `${prefix}${formatPercentValue(value)}`;
}

function formatReason(label: string, value: number) {
  return (
    <span key={label} className={`whitespace-nowrap font-medium ${compareClassName(value)}`}>
      {label} {formatSignedPercentValue(value)}
    </span>
  );
}

function ProductLineDiagnostics({
  productRow,
  settlementRow,
}: {
  productRow: ProductLineComparisonRow;
  settlementRow?: ProductLineSettlementRow;
}) {
  const diagnostics: Array<{ label: string; reasons: ReactNode[]; suggestion: string }> = [];
  const settlementCompare = settlementRow?.compare;
  const productCompare = productRow.compare;

  if (settlementCompare) {
    const reasons = [
      settlementCompare.salesAmount < -0.05 ? formatReason("销售额", settlementCompare.salesAmount) : undefined,
      settlementCompare.volume < -0.05 ? formatReason("销量", settlementCompare.volume) : undefined,
    ].filter(Boolean) as ReactNode[];

    if (reasons.length) {
      diagnostics.push({
        label: "销售额或销量下降",
        reasons,
        suggestion: "检查库存，折扣是否报错，流量大小、转化是否下降、广告订单和自然订单是否同步下降。",
      });
    }

    const profitReasons = [
      settlementCompare.grossProfit < -0.05 ? formatReason("毛利润", settlementCompare.grossProfit) : undefined,
      settlementCompare.grossRate < -0.01 ? formatReason("毛利率", settlementCompare.grossRate) : undefined,
    ].filter(Boolean) as ReactNode[];

    if (profitReasons.length) {
      diagnostics.push({
        label: "毛利润或毛利率下降",
        reasons: profitReasons,
        suggestion: "优先拆解销售额、毛利率、广告费占比、折扣占比、退款率。",
      });
    }

    const adEfficiencyReasons = [
      settlementCompare.acos > 0.01 ? formatReason("ACOS", settlementCompare.acos) : undefined,
      settlementCompare.tacos > 0.01 ? formatReason("TACOS", settlementCompare.tacos) : undefined,
    ].filter(Boolean) as ReactNode[];

    if (adEfficiencyReasons.length) {
      diagnostics.push({
        label: "广告效率恶化",
        reasons: adEfficiencyReasons,
        suggestion: "检索搜索词、CPC、广告CTR、广告CVR。",
      });
    }
  }

  const trafficReasons = [
    productCompare.sessionsTotal < -0.05 ? formatReason("Sessions", productCompare.sessionsTotal) : undefined,
    productCompare.pageViewsTotal < -0.05 ? formatReason("PV", productCompare.pageViewsTotal) : undefined,
    productCompare.impressions < -0.05 ? formatReason("广告展示", productCompare.impressions) : undefined,
  ].filter(Boolean) as ReactNode[];

  if (trafficReasons.length) {
    diagnostics.push({
      label: "流量下降",
      reasons: trafficReasons,
      suggestion: "检查广告展示、自然点击、关键词排名、促销状态。",
    });
  }

  if (productCompare.cvr < -0.01) {
    diagnostics.push({
      label: "转化下降",
      reasons: [formatReason("CVR", productCompare.cvr)],
      suggestion: "检查促销状态、评价、Listing 页面、竞品活动。",
    });
  }

  if (!diagnostics.length) {
    return null;
  }

  return (
    <div className="border-t border-line bg-slate-50 px-4 py-3">
      <div className="mb-2 text-sm font-semibold text-ink">异常诊断与运营建议</div>
      <div className="space-y-2">
        {diagnostics.map((item) => (
          <div key={item.label} className="grid items-center gap-3 border border-line bg-white px-3 py-2 text-sm md:grid-cols-[160px_1fr_2fr]">
            <div className="self-center font-semibold text-ink">{item.label}</div>
            <div className="flex flex-wrap items-center gap-x-3 gap-y-1 self-center text-xs">{item.reasons}</div>
            <div className="self-center text-xs leading-5 text-muted">{item.suggestion}</div>
          </div>
        ))}
      </div>
    </div>
  );
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

  return normalizeComparisonFilters(defaultFilters);
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

function ProductPerformanceTable({
  currentLabel,
  previousLabel,
  row,
}: {
  currentLabel: string;
  previousLabel: string;
  row: ProductLineComparisonRow;
}) {
  const tableRows = [
    { label: previousLabel, values: row.previous, kind: "previous" as const },
    { label: currentLabel, values: row.current, kind: "current" as const },
    { label: "环比", values: row.compare, kind: "compare" as const },
  ];

  return (
    <div>
      <table className="w-full min-w-[1560px] table-fixed text-center text-xs">
        <thead>
          <tr className="bg-[#efd66a] text-black">
            <th className="sticky left-0 z-[2] w-24 bg-[#efd66a] px-3 py-2 text-left font-semibold shadow-[1px_0_0_#e2e8f0]">
              周期
            </th>
            {productMetricColumns.map((column) => (
              <th key={column.key} className="w-24 px-3 py-2 font-semibold">
                {column.label}
              </th>
            ))}
          </tr>
        </thead>
        <tbody className="bg-slate-100">
          {tableRows.map((tableRow) => (
            <tr key={`${row.productLineName}-product-${tableRow.kind}`} className="border-b border-white/70 last:border-b-0">
              <td className="sticky left-0 z-[1] bg-slate-100 px-3 py-2 text-left font-semibold text-slate-700 shadow-[1px_0_0_#e2e8f0]">
                {tableRow.label}
              </td>
              {productMetricColumns.map((column) => {
                const value = tableRow.values[column.key];
                const isCompare = tableRow.kind === "compare";

                return (
                  <td key={column.key} className={`px-3 py-2 tabular-nums ${isCompare ? compareClassName(value) : "text-black"}`}>
                    {isCompare ? formatProductCompareMetric(value, column.type) : formatMetric(value, column.type)}
                  </td>
                );
              })}
            </tr>
          ))}
        </tbody>
      </table>
    </div>
  );
}

function SettlementPerformanceTable({
  currentLabel,
  previousLabel,
  row,
}: {
  currentLabel: string;
  previousLabel: string;
  row?: ProductLineSettlementRow;
}) {
  if (!row) {
    return <div className="bg-slate-50 px-4 py-6 text-center text-sm text-muted">当前筛选范围暂无结算利润数据。</div>;
  }

  const tableRows = [
    { label: previousLabel, values: row.previous, kind: "previous" as const },
    { label: currentLabel, values: row.current, kind: "current" as const },
    { label: "环比", values: row.compare, kind: "compare" as const },
  ];

  return (
    <div className="border-b border-white/80">
      <table className="w-full min-w-[1680px] table-fixed text-center text-xs">
        <thead>
          <tr className="bg-[#cfe4f6] text-black">
            <th className="sticky left-0 z-[2] w-24 bg-[#cfe4f6] px-3 py-2 text-left font-semibold shadow-[1px_0_0_#e2e8f0]">
              周期
            </th>
            {settlementMetricColumns.map((column) => (
              <th key={column.key} className="w-24 px-3 py-2 font-semibold">
                {column.label}
              </th>
            ))}
          </tr>
        </thead>
        <tbody className="bg-slate-100">
          {tableRows.map((tableRow) => (
            <tr key={`${row.productLineName}-settlement-${tableRow.kind}`} className="border-b border-white/70 last:border-b-0">
              <td className="sticky left-0 z-[1] bg-slate-100 px-3 py-2 text-left font-semibold text-slate-700 shadow-[1px_0_0_#e2e8f0]">
                {tableRow.label}
              </td>
              {settlementMetricColumns.map((column) => {
                const value = tableRow.values[column.key];
                const isCompare = tableRow.kind === "compare";

                return (
                  <td key={column.key} className={`px-3 py-2 tabular-nums ${isCompare ? compareClassName(value) : "text-black"}`}>
                    {isCompare ? formatSettlementCompareMetric(value) : formatMetric(value, column.type)}
                  </td>
                );
              })}
            </tr>
          ))}
        </tbody>
      </table>
    </div>
  );
}

function ProductLineComparisonTable({
  currentLabel,
  previousLabel,
  productRows,
  settlementRows,
}: {
  currentLabel: string;
  previousLabel: string;
  productRows: ProductLineComparisonRow[];
  settlementRows: ProductLineSettlementRow[];
}) {
  if (!productRows.length) {
    return <section className="bg-white px-4 py-8 text-center text-sm text-muted shadow-panel">暂无符合筛选条件的品线数据。</section>;
  }

  const settlementByLine = new Map(settlementRows.map((row) => [row.productLineName, row]));

  return (
    <div className="space-y-5">
      {productRows.map((row) => {
        const settlementRow = settlementByLine.get(row.productLineName);

        return (
          <section key={row.productLineName} className="overflow-hidden border border-line bg-white shadow-panel">
            <div className="flex items-center gap-3 border-b border-line bg-white px-4 py-3">
              <span className="h-5 w-1 bg-blue-600" aria-hidden="true" />
              <div className="text-base font-semibold text-ink">{row.productLineName}</div>
            </div>
            <div className="overflow-x-auto pb-2 scrollbar-thin">
              <div className="min-w-[1680px]">
                <SettlementPerformanceTable currentLabel={currentLabel} previousLabel={previousLabel} row={settlementRow} />
                <ProductPerformanceTable currentLabel={currentLabel} previousLabel={previousLabel} row={row} />
              </div>
            </div>
            <ProductLineDiagnostics productRow={row} settlementRow={settlementRow} />
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
    const [options, productRows, settlementRows, latestProductDate, latestSettlementDate] = await Promise.all([
      getProductLineFilterOptions(),
      getProductLineComparisonRows(filters, comparisonRange),
      getProductLineSettlementRows(filters, comparisonRange),
      getLatestProductLineDailyDate(),
      getLatestProductLineSettlementDate(),
    ]);

    return (
      <AppShell>
        <SectionTitle
          title="品线数据分析"
          description={
            <div className="space-y-1">
              <div>
                按品线展示{" "}
                <span className="font-semibold text-blue-600">[领星-结算利润]</span>
                {" "}和{" "}
                <span className="font-semibold text-blue-600">[领星-产品表现]</span>
                {" "}的数据
              </div>
              <div>品线产品表现最新日期：{latestProductDate ?? "-"}</div>
              <div>品线结算利润最新日期：{latestSettlementDate ?? "-"}</div>
            </div>
          }
        />
        <ProductLineFilters filters={filters} options={options} />
        <ProductLineComparisonTable
          currentLabel={currentLabel}
          previousLabel={previousLabel}
          productRows={productRows}
          settlementRows={settlementRows}
        />
      </AppShell>
    );
  } catch (error) {
    return (
      <AppShell>
        <SectionTitle title="品线数据分析" />
        <ErrorState message={displayError(error)} />
      </AppShell>
    );
  }
}
