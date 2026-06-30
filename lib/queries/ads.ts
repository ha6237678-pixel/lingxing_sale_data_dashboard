import { query } from "@/lib/db/client";
import { filterValues, productLineCondition, productLineValue } from "@/lib/queries/common";
import type { DashboardFilters } from "@/lib/utils/date";
import { toNumber } from "@/lib/utils/number";

export type AdsSummary = {
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
  rowCount: number;
};

export async function getAdsSummary(filters: DashboardFilters): Promise<AdsSummary> {
  const rows = await query<Record<string, string>>(
    `select
      count(*)::int as row_count,
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
    from fact_operator_daily_metrics
    where stat_date between $1 and $2
      and ($3::text is null or group_name = $3)
      and ($4::bigint is null or principal_uid = $4)
      ${productLineCondition(filters, 5)}`,
    [...filterValues(filters), ...productLineValue(filters)],
  );
  const row = rows[0] ?? {};
  return {
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
    rowCount: toNumber(row.row_count),
  };
}

export async function getAdsTrend(filters: DashboardFilters) {
  const rows = await query<Record<string, string>>(
    `select
      stat_date::text as date,
      coalesce(sum(sessions_total), 0) as sessions_total,
      coalesce(sum(page_views_total), 0) as page_views_total,
      coalesce(sum(impressions), 0) as impressions,
      coalesce(sum(clicks), 0) as clicks,
      coalesce(sum(nature_click), 0) as nature_click,
      coalesce(sum(spend), 0) as spend,
      coalesce(sum(ad_sales_amount), 0) as ad_sales_amount,
      coalesce(sum(spend) / nullif(sum(ad_sales_amount), 0), 0) as acos,
      coalesce(sum(spend) / nullif(sum(amount), 0), 0) as tacos,
      coalesce(sum(order_items)::numeric / nullif(sum(sessions_total), 0), 0) as cvr,
      coalesce(sum(clicks)::numeric / nullif(sum(impressions), 0), 0) as ctr,
      coalesce(sum(ad_order_quantity)::numeric / nullif(sum(clicks), 0), 0) as ad_cvr,
      coalesce(sum(nature_order_items)::numeric / nullif(sum(nature_click), 0), 0) as nature_cvr
    from fact_operator_daily_metrics
    where stat_date between $1 and $2
      and ($3::text is null or group_name = $3)
      and ($4::bigint is null or principal_uid = $4)
      ${productLineCondition(filters, 5)}
    group by stat_date
    order by stat_date`,
    [...filterValues(filters), ...productLineValue(filters)],
  );

  return rows.map((row) => ({
    date: row.date,
    sessionsTotal: toNumber(row.sessions_total),
    pageViewsTotal: toNumber(row.page_views_total),
    impressions: toNumber(row.impressions),
    clicks: toNumber(row.clicks),
    natureClick: toNumber(row.nature_click),
    spend: toNumber(row.spend),
    adSalesAmount: toNumber(row.ad_sales_amount),
    acos: toNumber(row.acos),
    tacos: toNumber(row.tacos),
    cvr: toNumber(row.cvr),
    ctr: toNumber(row.ctr),
    adCvr: toNumber(row.ad_cvr),
    natureCvr: toNumber(row.nature_cvr),
  }));
}
