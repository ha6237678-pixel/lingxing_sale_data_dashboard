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
    cid: string;
  }>;
};

export type ProductLineSummary = {
  amount: number;
  volume: number;
  orderItems: number;
  sessionsTotal: number;
  pageViewsTotal: number;
  cvr: number;
  impressions: number;
  clicks: number;
  ctr: number;
  cpc: number;
  spend: number;
  adSalesAmount: number;
  adCvr: number;
  acos: number;
  tacos: number;
  natureClick: number;
  natureOrderItems: number;
  natureCvr: number;
};

export type ProductLineTrendPoint = {
  date: string;
  amount: number;
  volume: number;
  sessionsTotal: number;
  pageViewsTotal: number;
  spend: number;
  adSalesAmount: number;
  acos: number;
  tacos: number;
  cvr: number;
};

export type ProductLineRankingRow = {
  productLineName: string;
  cid: string;
  operatorName: string;
  groupName: string;
  amount: number;
  volume: number;
  orderItems: number;
  sessionsTotal: number;
  cvr: number;
  spend: number;
  adSalesAmount: number;
  acos: number;
  tacos: number;
};

function productLineFilterValues(filters: DashboardFilters) {
  return [
    filters.startDate,
    filters.endDate,
    filters.groupName ?? null,
    filters.principalUid ? Number(filters.principalUid) : null,
    filters.productLineName ?? null,
    filters.cid ?? null,
  ];
}

function productLineWhere() {
  return `stat_date between $1::date and $2::date
    and ($3::text is null or group_name = $3)
    and ($4::bigint is null or principal_uid = $4)
    and ($5::text is null or product_line_name = $5)
    and ($6::text is null or cid::text = $6)`;
}

export async function getLatestProductLineDailyDate() {
  const rows = await query<{ latest_date: string | null }>("select max(stat_date)::text as latest_date from fact_product_line_daily_metrics");

  return rows[0]?.latest_date ?? undefined;
}

export async function getProductLineFilterOptions(): Promise<ProductLineFilterOptions> {
  const productLines = await query<{
    principal_uid: string;
    operator_name: string;
    group_name: string;
    product_line_name: string;
    cid: string;
  }>(
    `select distinct principal_uid::text, operator_name, group_name, product_line_name, cid::text
     from fact_product_line_daily_metrics
     where product_line_name is not null
     order by group_name, operator_name, product_line_name, cid`,
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
      cid: row.cid,
    })),
  };
}

export async function getProductLineSummary(filters: DashboardFilters): Promise<ProductLineSummary> {
  const rows = await query<Record<string, string>>(
    `select
      coalesce(sum(amount), 0) as amount,
      coalesce(sum(volume), 0) as volume,
      coalesce(sum(order_items), 0) as order_items,
      coalesce(sum(sessions_total), 0) as sessions_total,
      coalesce(sum(page_views_total), 0) as page_views_total,
      coalesce(sum(order_items)::numeric / nullif(sum(sessions_total), 0), 0) as cvr,
      coalesce(sum(impressions), 0) as impressions,
      coalesce(sum(clicks), 0) as clicks,
      coalesce(sum(clicks)::numeric / nullif(sum(impressions), 0), 0) as ctr,
      coalesce(sum(spend) / nullif(sum(clicks), 0), 0) as cpc,
      coalesce(sum(spend), 0) as spend,
      coalesce(sum(ad_sales_amount), 0) as ad_sales_amount,
      coalesce(sum(ad_order_quantity)::numeric / nullif(sum(clicks), 0), 0) as ad_cvr,
      coalesce(sum(spend) / nullif(sum(ad_sales_amount), 0), 0) as acos,
      coalesce(sum(spend) / nullif(sum(amount), 0), 0) as tacos,
      coalesce(sum(nature_click), 0) as nature_click,
      coalesce(sum(nature_order_items), 0) as nature_order_items,
      coalesce(sum(nature_order_items)::numeric / nullif(sum(nature_click), 0), 0) as nature_cvr
     from fact_product_line_daily_metrics
     where ${productLineWhere()}`,
    productLineFilterValues(filters),
  );
  const row = rows[0] ?? {};

  return {
    amount: toNumber(row.amount),
    volume: toNumber(row.volume),
    orderItems: toNumber(row.order_items),
    sessionsTotal: toNumber(row.sessions_total),
    pageViewsTotal: toNumber(row.page_views_total),
    cvr: toNumber(row.cvr),
    impressions: toNumber(row.impressions),
    clicks: toNumber(row.clicks),
    ctr: toNumber(row.ctr),
    cpc: toNumber(row.cpc),
    spend: toNumber(row.spend),
    adSalesAmount: toNumber(row.ad_sales_amount),
    adCvr: toNumber(row.ad_cvr),
    acos: toNumber(row.acos),
    tacos: toNumber(row.tacos),
    natureClick: toNumber(row.nature_click),
    natureOrderItems: toNumber(row.nature_order_items),
    natureCvr: toNumber(row.nature_cvr),
  };
}

export async function getProductLineTrend(filters: DashboardFilters): Promise<ProductLineTrendPoint[]> {
  const rows = await query<Record<string, string>>(
    `select
      stat_date::text as date,
      coalesce(sum(amount), 0) as amount,
      coalesce(sum(volume), 0) as volume,
      coalesce(sum(sessions_total), 0) as sessions_total,
      coalesce(sum(page_views_total), 0) as page_views_total,
      coalesce(sum(spend), 0) as spend,
      coalesce(sum(ad_sales_amount), 0) as ad_sales_amount,
      coalesce(sum(spend) / nullif(sum(ad_sales_amount), 0), 0) as acos,
      coalesce(sum(spend) / nullif(sum(amount), 0), 0) as tacos,
      coalesce(sum(order_items)::numeric / nullif(sum(sessions_total), 0), 0) as cvr
     from fact_product_line_daily_metrics
     where ${productLineWhere()}
     group by stat_date
     order by stat_date`,
    productLineFilterValues(filters),
  );

  return rows.map((row) => ({
    date: row.date,
    amount: toNumber(row.amount),
    volume: toNumber(row.volume),
    sessionsTotal: toNumber(row.sessions_total),
    pageViewsTotal: toNumber(row.page_views_total),
    spend: toNumber(row.spend),
    adSalesAmount: toNumber(row.ad_sales_amount),
    acos: toNumber(row.acos),
    tacos: toNumber(row.tacos),
    cvr: toNumber(row.cvr),
  }));
}

export async function getProductLineRankings(filters: DashboardFilters): Promise<ProductLineRankingRow[]> {
  const rows = await query<Record<string, string>>(
    `select
      group_name,
      operator_name,
      product_line_name,
      cid::text,
      coalesce(sum(amount), 0) as amount,
      coalesce(sum(volume), 0) as volume,
      coalesce(sum(order_items), 0) as order_items,
      coalesce(sum(sessions_total), 0) as sessions_total,
      coalesce(sum(order_items)::numeric / nullif(sum(sessions_total), 0), 0) as cvr,
      coalesce(sum(spend), 0) as spend,
      coalesce(sum(ad_sales_amount), 0) as ad_sales_amount,
      coalesce(sum(spend) / nullif(sum(ad_sales_amount), 0), 0) as acos,
      coalesce(sum(spend) / nullif(sum(amount), 0), 0) as tacos
     from fact_product_line_daily_metrics
     where ${productLineWhere()}
     group by group_name, operator_name, principal_uid, product_line_name, cid
     order by amount desc
     limit 20`,
    productLineFilterValues(filters),
  );

  return rows.map((row) => ({
    productLineName: row.product_line_name,
    cid: row.cid,
    operatorName: row.operator_name,
    groupName: row.group_name,
    amount: toNumber(row.amount),
    volume: toNumber(row.volume),
    orderItems: toNumber(row.order_items),
    sessionsTotal: toNumber(row.sessions_total),
    cvr: toNumber(row.cvr),
    spend: toNumber(row.spend),
    adSalesAmount: toNumber(row.ad_sales_amount),
    acos: toNumber(row.acos),
    tacos: toNumber(row.tacos),
  }));
}
