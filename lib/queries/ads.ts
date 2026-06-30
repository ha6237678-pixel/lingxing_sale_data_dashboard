import { query } from "@/lib/db/client";
import { filterValues } from "@/lib/queries/common";
import { previousComparisonRange, type DashboardFilters } from "@/lib/utils/date";
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

export type AdsRankingRow = {
  name: string;
  groupName: string;
  adSalesAmount: number;
  adSalesAmountCompareRate?: number;
  acos: number;
  acosCompareDelta?: number;
  tacos: number;
  tacosCompareDelta?: number;
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
      and ($4::bigint is null or principal_uid = $4)`,
    filterValues(filters),
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
    group by stat_date
    order by stat_date`,
    filterValues(filters),
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

export async function getAdsRankings(filters: DashboardFilters): Promise<AdsRankingRow[]> {
  const previous = previousComparisonRange(filters);
  const rows = await query<Record<string, string>>(
    `with current_period as (
      select
        principal_uid,
        operator_name as name,
        max(group_name) as group_name,
        coalesce(sum(ad_sales_amount), 0) as ad_sales_amount,
        coalesce(sum(spend), 0) as spend,
        coalesce(sum(amount), 0) as amount,
        coalesce(sum(spend) / nullif(sum(ad_sales_amount), 0), 0) as acos,
        coalesce(sum(spend) / nullif(sum(amount), 0), 0) as tacos
      from fact_operator_daily_metrics
      where stat_date between $1 and $2
        and ($3::text is null or group_name = $3)
        and ($4::bigint is null or principal_uid = $4)
      group by principal_uid, operator_name
    ),
    previous_period as (
      select
        principal_uid,
        coalesce(sum(ad_sales_amount), 0) as previous_ad_sales_amount,
        coalesce(sum(spend) / nullif(sum(ad_sales_amount), 0), 0) as previous_acos,
        coalesce(sum(spend) / nullif(sum(amount), 0), 0) as previous_tacos
      from fact_operator_daily_metrics
      where stat_date between $5 and $6
        and ($3::text is null or group_name = $3)
        and ($4::bigint is null or principal_uid = $4)
      group by principal_uid
    )
    select
      current_period.*,
      case
        when previous_period.previous_ad_sales_amount is null or previous_period.previous_ad_sales_amount = 0 then null
        else (current_period.ad_sales_amount - previous_period.previous_ad_sales_amount) / previous_period.previous_ad_sales_amount
      end as ad_sales_amount_compare_rate,
      case
        when previous_period.previous_acos is null then null
        else current_period.acos - previous_period.previous_acos
      end as acos_compare_delta,
      case
        when previous_period.previous_tacos is null then null
        else current_period.tacos - previous_period.previous_tacos
      end as tacos_compare_delta
    from current_period
    left join previous_period on previous_period.principal_uid = current_period.principal_uid
    order by current_period.ad_sales_amount desc
    limit 20`,
    [...filterValues(filters), previous.startDate, previous.endDate],
  );

  return rows.map((row) => ({
    name: row.name,
    groupName: row.group_name,
    adSalesAmount: toNumber(row.ad_sales_amount),
    adSalesAmountCompareRate:
      row.ad_sales_amount_compare_rate === null || row.ad_sales_amount_compare_rate === undefined
        ? undefined
        : toNumber(row.ad_sales_amount_compare_rate),
    acos: toNumber(row.acos),
    acosCompareDelta: row.acos_compare_delta === null || row.acos_compare_delta === undefined ? undefined : toNumber(row.acos_compare_delta),
    tacos: toNumber(row.tacos),
    tacosCompareDelta: row.tacos_compare_delta === null || row.tacos_compare_delta === undefined ? undefined : toNumber(row.tacos_compare_delta),
  }));
}
