import { query } from "@/lib/db/client";
import { filterValues } from "@/lib/queries/common";
import type { DashboardFilters } from "@/lib/utils/date";
import { toNumber } from "@/lib/utils/number";

export type ProfitSummary = {
  settlementSales: number;
  totalSalesQuantity: number;
  totalAdsSales: number;
  totalAdsSalesQuantity: number;
  grossProfit: number;
  grossRate: number;
  refundsRate: number;
  platformFee: number;
  fbaDeliveryFee: number;
  totalAdsCost: number;
  promotionFee: number;
  totalStorageFee: number;
  cgPrice: number;
  cgTransportCosts: number;
  totalCost: number;
  adsCostRate: number;
  platformFeeRate: number;
  fbaDeliveryFeeRate: number;
  totalCostRate: number;
};

export async function getProfitSummary(filters: DashboardFilters): Promise<ProfitSummary> {
  const rows = await query<Record<string, string>>(
    `select
      coalesce(sum(total_sales_amount_with_tax), 0) as settlement_sales,
      coalesce(sum(total_sales_quantity), 0) as total_sales_quantity,
      coalesce(sum(total_ads_sales), 0) as total_ads_sales,
      coalesce(sum(total_ads_sales_quantity), 0) as total_ads_sales_quantity,
      coalesce(sum(gross_profit), 0) as gross_profit,
      coalesce(sum(gross_profit) / nullif(sum(total_sales_amount_with_tax), 0), 0) as gross_rate,
      coalesce(sum(refunds_quantity) / nullif(sum(total_sales_quantity), 0), 0) as refunds_rate,
      coalesce(sum(platform_fee), 0) as platform_fee,
      coalesce(sum(fba_delivery_fee), 0) as fba_delivery_fee,
      coalesce(sum(total_ads_cost), 0) as total_ads_cost,
      coalesce(sum(promotion_fee), 0) as promotion_fee,
      coalesce(sum(total_storage_fee), 0) as total_storage_fee,
      coalesce(sum(cg_price), 0) as cg_price,
      coalesce(sum(cg_transport_costs), 0) as cg_transport_costs,
      coalesce(sum(total_cost), 0) as total_cost,
      coalesce(sum(total_ads_cost) / nullif(sum(total_sales_amount_with_tax), 0), 0) as ads_cost_rate,
      coalesce(sum(platform_fee) / nullif(sum(total_sales_amount_with_tax), 0), 0) as platform_fee_rate,
      coalesce(sum(fba_delivery_fee) / nullif(sum(total_sales_amount_with_tax), 0), 0) as fba_delivery_fee_rate,
      coalesce(sum(total_cost) / nullif(sum(total_sales_amount_with_tax), 0), 0) as total_cost_rate
    from fact_settlement_profit
    where settlement_date between $1 and $2
      and ($3::text is null or group_name = $3)
      and ($4::bigint is null or principal_uid = $4)`,
    filterValues(filters),
  );
  const row = rows[0] ?? {};
  return {
    settlementSales: toNumber(row.settlement_sales),
    totalSalesQuantity: toNumber(row.total_sales_quantity),
    totalAdsSales: toNumber(row.total_ads_sales),
    totalAdsSalesQuantity: toNumber(row.total_ads_sales_quantity),
    grossProfit: toNumber(row.gross_profit),
    grossRate: toNumber(row.gross_rate),
    refundsRate: toNumber(row.refunds_rate),
    platformFee: toNumber(row.platform_fee),
    fbaDeliveryFee: toNumber(row.fba_delivery_fee),
    totalAdsCost: toNumber(row.total_ads_cost),
    promotionFee: toNumber(row.promotion_fee),
    totalStorageFee: toNumber(row.total_storage_fee),
    cgPrice: toNumber(row.cg_price),
    cgTransportCosts: toNumber(row.cg_transport_costs),
    totalCost: toNumber(row.total_cost),
    adsCostRate: toNumber(row.ads_cost_rate),
    platformFeeRate: toNumber(row.platform_fee_rate),
    fbaDeliveryFeeRate: toNumber(row.fba_delivery_fee_rate),
    totalCostRate: toNumber(row.total_cost_rate),
  };
}

export async function getProfitTrend(filters: DashboardFilters) {
  const rows = await query<Record<string, string>>(
    `select
      settlement_date::text as date,
      coalesce(sum(total_sales_amount_with_tax), 0) as amount,
      coalesce(sum(gross_profit), 0) as gross_profit,
      coalesce(sum(gross_profit) / nullif(sum(total_sales_amount_with_tax), 0), 0) as gross_rate
    from fact_settlement_profit
    where settlement_date between $1 and $2
      and ($3::text is null or group_name = $3)
      and ($4::bigint is null or principal_uid = $4)
    group by settlement_date
    order by settlement_date`,
    filterValues(filters),
  );

  return rows.map((row) => ({
    date: row.date,
    amount: toNumber(row.amount),
    grossProfit: toNumber(row.gross_profit),
    grossRate: toNumber(row.gross_rate),
  }));
}

export async function getProfitRankings(filters: DashboardFilters) {
  const rows = await query<Record<string, string>>(
    `select
      operator_name as name,
      max(group_name) as group_name,
      coalesce(sum(total_sales_amount_with_tax), 0) as amount,
      coalesce(sum(total_sales_quantity), 0) as volume,
      coalesce(sum(gross_profit), 0) as gross_profit
    from fact_settlement_profit
    where settlement_date between $1 and $2
      and ($3::text is null or group_name = $3)
      and ($4::bigint is null or principal_uid = $4)
    group by operator_name
    order by gross_profit desc
    limit 10`,
    filterValues(filters),
  );

  return rows.map((row) => ({
    name: row.name,
    groupName: row.group_name,
    amount: toNumber(row.amount),
    volume: toNumber(row.volume),
    grossProfit: toNumber(row.gross_profit),
  }));
}
