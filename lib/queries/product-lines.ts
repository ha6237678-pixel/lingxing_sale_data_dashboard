import { query } from "@/lib/db/client";
import type { DashboardFilters } from "@/lib/utils/date";
import { toNumber } from "@/lib/utils/number";

export type ProductLineFilterOptions = {
  groups: string[];
  operators: Array<{
    principalUid: string;
    operatorName: string;
    groupName: string;
  }>;
  productLines: Array<{
    principalUid: string;
    operatorName: string;
    groupName: string;
    productLineName: string;
  }>;
};

export type ProductLineComparisonMetric = {
  orderItems: number;
  sessionsTotal: number;
  pageViewsTotal: number;
  cvr: number;
  cpc: number;
  ctr: number;
  spend: number;
  adSalesAmount: number;
  acos: number;
  adOrderQuantity: number;
  adOrderRate: number;
  adCvr: number;
  impressions: number;
  clicks: number;
  cpa: number;
  natureClick: number;
  natureOrderItems: number;
  natureCvr: number;
};

export type ProductLineComparisonRow = {
  productLineName: string;
  current: ProductLineComparisonMetric;
  previous: ProductLineComparisonMetric;
  compare: ProductLineComparisonMetric;
};

export type ProductLineSettlementMetric = {
  volume: number;
  salesAmount: number;
  grossProfit: number;
  grossRate: number;
  adSalesQuantity: number;
  adSalesAmount: number;
  adsCost: number;
  refundsRate: number;
  adsCostRate: number;
  discountRate: number;
  acos: number;
  tacos: number;
  firstTripRate: number;
  purchaseRate: number;
  fbaRate: number;
  storageRate: number;
  platformRate: number;
  customerPrice: number;
};

export type ProductLineSettlementRow = {
  productLineName: string;
  current: ProductLineSettlementMetric;
  previous: ProductLineSettlementMetric;
  compare: ProductLineSettlementMetric;
};

function productLineFilterValues(filters: DashboardFilters) {
  return [
    filters.startDate,
    filters.endDate,
    filters.groupName ?? null,
    filters.principalUid ? Number(filters.principalUid) : null,
    filters.productLineName ?? null,
  ];
}

function productLineWhere() {
  return `stat_date between $1::date and $2::date
    and ($3::text is null or group_name = $3)
    and ($4::bigint is null or principal_uid = $4)
    and ($5::text is null or product_line_name = $5)`;
}

function productLineSettlementWhere() {
  return `settlement_date between $1::date and $2::date
    and ($3::text is null or group_name = $3)
    and ($4::bigint is null or principal_uid = $4)
    and ($5::text is null or product_line_name = $5)`;
}

function toComparisonMetric(row: Record<string, string> | undefined): ProductLineComparisonMetric {
  return {
    orderItems: toNumber(row?.order_items),
    sessionsTotal: toNumber(row?.sessions_total),
    pageViewsTotal: toNumber(row?.page_views_total),
    cvr: toNumber(row?.cvr),
    cpc: toNumber(row?.cpc),
    ctr: toNumber(row?.ctr),
    spend: toNumber(row?.spend),
    adSalesAmount: toNumber(row?.ad_sales_amount),
    acos: toNumber(row?.acos),
    adOrderQuantity: toNumber(row?.ad_order_quantity),
    adOrderRate: toNumber(row?.ad_order_rate),
    adCvr: toNumber(row?.ad_cvr),
    impressions: toNumber(row?.impressions),
    clicks: toNumber(row?.clicks),
    cpa: toNumber(row?.cpa),
    natureClick: toNumber(row?.nature_click),
    natureOrderItems: toNumber(row?.nature_order_items),
    natureCvr: toNumber(row?.nature_cvr),
  };
}

function compareMetric(current: ProductLineComparisonMetric, previous: ProductLineComparisonMetric): ProductLineComparisonMetric {
  return {
    orderItems: previous.orderItems ? (current.orderItems - previous.orderItems) / previous.orderItems : 0,
    sessionsTotal: previous.sessionsTotal ? (current.sessionsTotal - previous.sessionsTotal) / previous.sessionsTotal : 0,
    pageViewsTotal: previous.pageViewsTotal ? (current.pageViewsTotal - previous.pageViewsTotal) / previous.pageViewsTotal : 0,
    cvr: current.cvr - previous.cvr,
    cpc: current.cpc - previous.cpc,
    ctr: current.ctr - previous.ctr,
    spend: previous.spend ? (current.spend - previous.spend) / previous.spend : 0,
    adSalesAmount: previous.adSalesAmount ? (current.adSalesAmount - previous.adSalesAmount) / previous.adSalesAmount : 0,
    acos: current.acos - previous.acos,
    adOrderQuantity: previous.adOrderQuantity ? (current.adOrderQuantity - previous.adOrderQuantity) / previous.adOrderQuantity : 0,
    adOrderRate: current.adOrderRate - previous.adOrderRate,
    adCvr: current.adCvr - previous.adCvr,
    impressions: previous.impressions ? (current.impressions - previous.impressions) / previous.impressions : 0,
    clicks: previous.clicks ? (current.clicks - previous.clicks) / previous.clicks : 0,
    cpa: current.cpa - previous.cpa,
    natureClick: previous.natureClick ? (current.natureClick - previous.natureClick) / previous.natureClick : 0,
    natureOrderItems: previous.natureOrderItems ? (current.natureOrderItems - previous.natureOrderItems) / previous.natureOrderItems : 0,
    natureCvr: current.natureCvr - previous.natureCvr,
  };
}

function toSettlementMetric(row: Record<string, string> | undefined): ProductLineSettlementMetric {
  return {
    volume: toNumber(row?.volume),
    salesAmount: toNumber(row?.sales_amount),
    grossProfit: toNumber(row?.gross_profit),
    grossRate: toNumber(row?.gross_rate),
    adSalesQuantity: toNumber(row?.ad_sales_quantity),
    adSalesAmount: toNumber(row?.ad_sales_amount),
    adsCost: toNumber(row?.ads_cost),
    refundsRate: toNumber(row?.refunds_rate),
    adsCostRate: toNumber(row?.ads_cost_rate),
    discountRate: toNumber(row?.discount_rate),
    acos: toNumber(row?.acos),
    tacos: toNumber(row?.tacos),
    firstTripRate: toNumber(row?.first_trip_rate),
    purchaseRate: toNumber(row?.purchase_rate),
    fbaRate: toNumber(row?.fba_rate),
    storageRate: toNumber(row?.storage_rate),
    platformRate: toNumber(row?.platform_rate),
    customerPrice: toNumber(row?.customer_price),
  };
}

function compareSettlementMetric(current: ProductLineSettlementMetric, previous: ProductLineSettlementMetric): ProductLineSettlementMetric {
  return {
    volume: previous.volume ? (current.volume - previous.volume) / previous.volume : 0,
    salesAmount: previous.salesAmount ? (current.salesAmount - previous.salesAmount) / previous.salesAmount : 0,
    grossProfit: previous.grossProfit ? (current.grossProfit - previous.grossProfit) / Math.abs(previous.grossProfit) : 0,
    grossRate: current.grossRate - previous.grossRate,
    adSalesQuantity: previous.adSalesQuantity ? (current.adSalesQuantity - previous.adSalesQuantity) / previous.adSalesQuantity : 0,
    adSalesAmount: previous.adSalesAmount ? (current.adSalesAmount - previous.adSalesAmount) / previous.adSalesAmount : 0,
    adsCost: previous.adsCost ? (current.adsCost - previous.adsCost) / previous.adsCost : 0,
    refundsRate: current.refundsRate - previous.refundsRate,
    adsCostRate: current.adsCostRate - previous.adsCostRate,
    discountRate: current.discountRate - previous.discountRate,
    acos: current.acos - previous.acos,
    tacos: current.tacos - previous.tacos,
    firstTripRate: current.firstTripRate - previous.firstTripRate,
    purchaseRate: current.purchaseRate - previous.purchaseRate,
    fbaRate: current.fbaRate - previous.fbaRate,
    storageRate: current.storageRate - previous.storageRate,
    platformRate: current.platformRate - previous.platformRate,
    customerPrice: previous.customerPrice ? (current.customerPrice - previous.customerPrice) / previous.customerPrice : 0,
  };
}

export async function getLatestProductLineDailyDate() {
  const rows = await query<{ latest_date: string | null }>("select max(stat_date)::text as latest_date from fact_product_line_daily_metrics");

  return rows[0]?.latest_date ?? undefined;
}

export async function getLatestProductLineSettlementDate() {
  const rows = await query<{ latest_date: string | null }>(
    "select max(settlement_date)::text as latest_date from fact_product_line_settlement_profit",
  );

  return rows[0]?.latest_date ?? undefined;
}

export async function getProductLineFilterOptions(): Promise<ProductLineFilterOptions> {
  const productLines = await query<{
    principal_uid: string;
    operator_name: string;
    group_name: string;
    product_line_name: string;
  }>(
    `select distinct principal_uid::text, operator_name, group_name, product_line_name
     from fact_product_line_daily_metrics
     where product_line_name is not null
     order by group_name, operator_name, product_line_name`,
  );

  const groups = Array.from(new Set(productLines.map((row) => row.group_name).filter(Boolean))).sort((a, b) => a.localeCompare(b, "zh-Hans-CN"));
  const operatorMap = new Map<string, { principalUid: string; operatorName: string; groupName: string }>();

  productLines.forEach((row) => {
    operatorMap.set(row.principal_uid, {
      principalUid: row.principal_uid,
      operatorName: row.operator_name,
      groupName: row.group_name,
    });
  });

  return {
    groups,
    operators: Array.from(operatorMap.values()).sort(
      (a, b) => a.groupName.localeCompare(b.groupName, "zh-Hans-CN") || a.operatorName.localeCompare(b.operatorName, "zh-Hans-CN"),
    ),
    productLines: productLines.map((row) => ({
      principalUid: row.principal_uid,
      operatorName: row.operator_name,
      groupName: row.group_name,
      productLineName: row.product_line_name,
    })),
  };
}

export async function getProductLineComparisonRows(
  filters: DashboardFilters,
  previousRange: { startDate: string; endDate: string },
): Promise<ProductLineComparisonRow[]> {
  const selectSql = `select
      product_line_name,
      coalesce(sum(order_items), 0) as order_items,
      coalesce(sum(sessions_total), 0) as sessions_total,
      coalesce(sum(page_views_total), 0) as page_views_total,
      coalesce(sum(order_items)::numeric / nullif(sum(sessions_total), 0), 0) as cvr,
      coalesce(sum(spend) / nullif(sum(clicks), 0), 0) as cpc,
      coalesce(sum(clicks)::numeric / nullif(sum(impressions), 0), 0) as ctr,
      coalesce(sum(spend), 0) as spend,
      coalesce(sum(ad_sales_amount), 0) as ad_sales_amount,
      coalesce(sum(spend) / nullif(sum(ad_sales_amount), 0), 0) as acos,
      coalesce(sum(ad_order_quantity), 0) as ad_order_quantity,
      coalesce(sum(ad_order_quantity)::numeric / nullif(sum(order_items), 0), 0) as ad_order_rate,
      coalesce(sum(ad_order_quantity)::numeric / nullif(sum(clicks), 0), 0) as ad_cvr,
      coalesce(sum(impressions), 0) as impressions,
      coalesce(sum(clicks), 0) as clicks,
      coalesce(sum(spend) / nullif(sum(ad_order_quantity), 0), 0) as cpa,
      coalesce(sum(nature_click), 0) as nature_click,
      coalesce(sum(nature_order_items), 0) as nature_order_items,
      coalesce(sum(nature_order_items)::numeric / nullif(sum(nature_click), 0), 0) as nature_cvr
    from fact_product_line_daily_metrics
    where ${productLineWhere()}
    group by product_line_name`;
  const [currentRows, previousRows] = await Promise.all([
    query<Record<string, string>>(selectSql, productLineFilterValues(filters)),
    query<Record<string, string>>(selectSql, productLineFilterValues({ ...filters, startDate: previousRange.startDate, endDate: previousRange.endDate })),
  ]);
  const previousByLine = new Map(previousRows.map((row) => [row.product_line_name, row]));

  return currentRows
    .map((row) => {
      const current = toComparisonMetric(row);
      const previous = toComparisonMetric(previousByLine.get(row.product_line_name));

      return {
        productLineName: row.product_line_name,
        current,
        previous,
        compare: compareMetric(current, previous),
      };
    })
    .sort((a, b) => b.current.orderItems - a.current.orderItems);
}

export async function getProductLineSettlementRows(
  filters: DashboardFilters,
  previousRange: { startDate: string; endDate: string },
): Promise<ProductLineSettlementRow[]> {
  const selectSql = `select
      product_line_name,
      coalesce(sum(total_sales_quantity), 0) as volume,
      coalesce(sum(total_sales_amount_with_tax), 0) as sales_amount,
      coalesce(sum(gross_profit), 0) as gross_profit,
      coalesce(sum(gross_profit) / nullif(sum(total_sales_amount_with_tax), 0), 0) as gross_rate,
      coalesce(sum(total_ads_sales_quantity), 0) as ad_sales_quantity,
      coalesce(sum(total_ads_sales), 0) as ad_sales_amount,
      coalesce(sum(total_ads_cost), 0) as ads_cost,
      coalesce(sum(total_sales_refunds) / nullif(sum(total_sales_amount_with_tax), 0), 0) as refunds_rate,
      coalesce(sum(total_ads_cost) / nullif(sum(total_sales_amount_with_tax), 0), 0) as ads_cost_rate,
      coalesce(sum(promotional_rebates) / nullif(sum(total_sales_amount_with_tax), 0), 0) as discount_rate,
      coalesce(sum(total_ads_cost) / nullif(sum(total_ads_sales), 0), 0) as acos,
      coalesce(sum(total_ads_cost) / nullif(sum(total_sales_amount_with_tax), 0), 0) as tacos,
      coalesce(sum(cg_transport_costs) / nullif(sum(total_sales_amount_with_tax), 0), 0) as first_trip_rate,
      coalesce(sum(cg_price) / nullif(sum(total_sales_amount_with_tax), 0), 0) as purchase_rate,
      coalesce(sum(fba_delivery_fee) / nullif(sum(total_sales_amount_with_tax), 0), 0) as fba_rate,
      coalesce(sum(total_storage_fee) / nullif(sum(total_sales_amount_with_tax), 0), 0) as storage_rate,
      coalesce(sum(platform_fee) / nullif(sum(total_sales_amount_with_tax), 0), 0) as platform_rate,
      coalesce(sum(total_sales_amount_with_tax) / nullif(sum(total_sales_quantity), 0), 0) as customer_price
    from fact_product_line_settlement_profit
    where ${productLineSettlementWhere()}
    group by product_line_name`;
  const [currentRows, previousRows] = await Promise.all([
    query<Record<string, string>>(selectSql, productLineFilterValues(filters)),
    query<Record<string, string>>(selectSql, productLineFilterValues({ ...filters, startDate: previousRange.startDate, endDate: previousRange.endDate })),
  ]);
  const previousByLine = new Map(previousRows.map((row) => [row.product_line_name, row]));

  return currentRows
    .map((row) => {
      const current = toSettlementMetric(row);
      const previous = toSettlementMetric(previousByLine.get(row.product_line_name));

      return {
        productLineName: row.product_line_name,
        current,
        previous,
        compare: compareSettlementMetric(current, previous),
      };
    })
    .sort((a, b) => b.current.salesAmount - a.current.salesAmount);
}
