import { query } from "@/lib/db/client";
import { filterValues } from "@/lib/queries/common";
import type { DashboardFilters } from "@/lib/utils/date";
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
  volume: number;
  orderItems: number;
  spend?: number;
  adSalesAmount?: number;
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
    volume: toNumber(row.volume),
    orderItems: toNumber(row.order_items),
    b2bOrderItems: toNumber(row.b2b_order_items),
    b2bOrderRate: toNumber(row.b2b_order_rate),
    adOrderQuantity: toNumber(row.ad_order_quantity),
    adOrderRate: toNumber(row.ad_order_rate),
  }));
}

export async function getSalesRankings(filters: DashboardFilters, by: "group" | "operator"): Promise<RankingRow[]> {
  const nameExpr = by === "group" ? "group_name" : "operator_name";
  const groupBy = by === "group" ? "group_name" : "operator_name, group_name";
  const rows = await query<Record<string, string>>(
    `select
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
    order by amount desc
    limit 10`,
    filterValues(filters),
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
  }));
}
