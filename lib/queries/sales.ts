import { query } from "@/lib/db/client";
import { filterValues } from "@/lib/queries/common";
import { previousComparisonRange, type DashboardFilters } from "@/lib/utils/date";
import { toNumber } from "@/lib/utils/number";

export type SalesSummary = {
  volume: number;
  amount: number;
  orderItems: number;
  adOrderQuantity: number;
  adOrderRate: number;
  b2bVolume: number;
  b2bAmount: number;
  b2bOrderItems: number;
};

export type TrendPoint = {
  date: string;
  amount: number;
  adSalesAmount: number;
  b2bAmount: number;
  volume: number;
  orderItems: number;
  b2bOrderItems: number;
  b2bOrderRate: number;
  adOrderQuantity: number;
  adOrderRate: number;
  spend?: number;
  acos?: number;
  tacos?: number;
  grossProfit?: number;
  grossRate?: number;
};

export type RankingRow = {
  name: string;
  groupName?: string;
  amount: number;
  volume: number;
  orderItems: number;
  b2bOrderItems: number;
  b2bOrderRate: number;
  adOrderQuantity: number;
  adOrderRate: number;
  amountCompareRate?: number;
  volumeCompareRate?: number;
};

export async function getSalesSummary(filters: DashboardFilters): Promise<SalesSummary> {
  const rows = await query<Record<string, string>>(
    `select
      coalesce(sum(volume), 0) as volume,
      coalesce(sum(amount), 0) as amount,
      coalesce(sum(order_items), 0) as order_items,
      coalesce(sum(ad_order_quantity), 0) as ad_order_quantity,
      coalesce(sum(ad_order_quantity)::numeric / nullif(sum(order_items), 0), 0) as ad_order_rate,
      coalesce(sum(b2b_volume), 0) as b2b_volume,
      coalesce(sum(b2b_amount), 0) as b2b_amount,
      coalesce(sum(b2b_order_items), 0) as b2b_order_items
    from fact_operator_daily_metrics
    where stat_date between $1 and $2
      and ($3::text is null or group_name = $3)
      and ($4::bigint is null or principal_uid = $4)`,
    filterValues(filters),
  );
  const row = rows[0] ?? {};
  return {
    volume: toNumber(row.volume),
    amount: toNumber(row.amount),
    orderItems: toNumber(row.order_items),
    adOrderQuantity: toNumber(row.ad_order_quantity),
    adOrderRate: toNumber(row.ad_order_rate),
    b2bVolume: toNumber(row.b2b_volume),
    b2bAmount: toNumber(row.b2b_amount),
    b2bOrderItems: toNumber(row.b2b_order_items),
  };
}

export async function getSalesTrend(filters: DashboardFilters): Promise<TrendPoint[]> {
  const rows = await query<Record<string, string>>(
    `select
      stat_date::text as date,
      coalesce(sum(amount), 0) as amount,
      coalesce(sum(ad_sales_amount), 0) as ad_sales_amount,
      coalesce(sum(b2b_amount), 0) as b2b_amount,
      coalesce(sum(volume), 0) as volume,
      coalesce(sum(order_items), 0) as order_items,
      coalesce(sum(b2b_order_items), 0) as b2b_order_items,
      coalesce(sum(b2b_order_items)::numeric / nullif(sum(order_items), 0), 0) as b2b_order_rate,
      coalesce(sum(ad_order_quantity), 0) as ad_order_quantity,
      coalesce(sum(ad_order_quantity)::numeric / nullif(sum(order_items), 0), 0) as ad_order_rate
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
    amount: toNumber(row.amount),
    adSalesAmount: toNumber(row.ad_sales_amount),
    b2bAmount: toNumber(row.b2b_amount),
    volume: toNumber(row.volume),
    orderItems: toNumber(row.order_items),
    b2bOrderItems: toNumber(row.b2b_order_items),
    b2bOrderRate: toNumber(row.b2b_order_rate),
    adOrderQuantity: toNumber(row.ad_order_quantity),
    adOrderRate: toNumber(row.ad_order_rate),
  }));
}

export async function getSalesRankings(filters: DashboardFilters, by: "group" | "operator"): Promise<RankingRow[]> {
  const previous = previousComparisonRange(filters);
  const nameExpr = by === "group" ? "group_name" : "operator_name";
  const groupBy = by === "group" ? "group_name" : "operator_name, group_name";
  const rows = await query<Record<string, string>>(
    `with current_period as (
      select
        ${nameExpr} as name,
        max(group_name) as group_name,
        coalesce(sum(amount), 0) as amount,
        coalesce(sum(volume), 0) as volume,
        coalesce(sum(order_items), 0) as order_items,
        coalesce(sum(b2b_order_items), 0) as b2b_order_items,
        coalesce(sum(b2b_order_items)::numeric / nullif(sum(order_items), 0), 0) as b2b_order_rate,
        coalesce(sum(ad_order_quantity), 0) as ad_order_quantity,
        coalesce(sum(ad_order_quantity)::numeric / nullif(sum(order_items), 0), 0) as ad_order_rate
      from fact_operator_daily_metrics
      where stat_date between $1 and $2
        and ($3::text is null or group_name = $3)
        and ($4::bigint is null or principal_uid = $4)
      group by ${groupBy}
    ),
    previous_period as (
      select
        ${nameExpr} as name,
        max(group_name) as group_name,
        coalesce(sum(amount), 0) as previous_amount,
        coalesce(sum(volume), 0) as previous_volume
      from fact_operator_daily_metrics
      where stat_date between $5 and $6
        and ($3::text is null or group_name = $3)
        and ($4::bigint is null or principal_uid = $4)
      group by ${groupBy}
    )
    select
      current_period.*,
      case
        when previous_period.previous_amount is null or previous_period.previous_amount = 0 then null
        else (current_period.amount - previous_period.previous_amount) / previous_period.previous_amount
      end as amount_compare_rate,
      case
        when previous_period.previous_volume is null or previous_period.previous_volume = 0 then null
        else (current_period.volume - previous_period.previous_volume)::numeric / previous_period.previous_volume
      end as volume_compare_rate
    from current_period
    left join previous_period
      on previous_period.name = current_period.name
      and previous_period.group_name = current_period.group_name
    order by current_period.amount desc
    ${by === "group" ? "limit 10" : ""}`,
    [...filterValues(filters), previous.startDate, previous.endDate],
  );

  return rows.map((row) => ({
    name: row.name,
    groupName: row.group_name,
    amount: toNumber(row.amount),
    volume: toNumber(row.volume),
    orderItems: toNumber(row.order_items),
    b2bOrderItems: toNumber(row.b2b_order_items),
    b2bOrderRate: toNumber(row.b2b_order_rate),
    adOrderQuantity: toNumber(row.ad_order_quantity),
    adOrderRate: toNumber(row.ad_order_rate),
    amountCompareRate: row.amount_compare_rate === null || row.amount_compare_rate === undefined ? undefined : toNumber(row.amount_compare_rate),
    volumeCompareRate: row.volume_compare_rate === null || row.volume_compare_rate === undefined ? undefined : toNumber(row.volume_compare_rate),
  }));
}
