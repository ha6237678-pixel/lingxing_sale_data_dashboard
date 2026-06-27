import { query } from "@/lib/db/client";
import { filterValues } from "@/lib/queries/common";
import { previousComparisonRange, type DashboardFilters } from "@/lib/utils/date";
import { toNumber } from "@/lib/utils/number";

export type ProfitSummary = {
  settlementSales: number;
  totalSalesQuantity: number;
  totalAdsSales: number;
  totalAdsSalesQuantity: number;
  grossProfit: number;
  grossRate: number;
  refundsRate: number;
  totalSalesRefunds: number;
  platformFee: number;
  fbaDeliveryFee: number;
  totalAdsCost: number;
  promotionalRebates: number;
  promotionFee: number;
  totalStorageFee: number;
  cgPrice: number;
  cgTransportCosts: number;
  totalCost: number;
  adsCostRate: number;
  platformFeeRate: number;
  fbaDeliveryFeeRate: number;
  cgTransportCostRate: number;
  cgPriceRate: number;
  storageFeeRate: number;
  promotionalRebateRate: number;
  totalCostRate: number;
};

export async function getLatestSettlementProfitDate() {
  const rows = await query<{ latest_date: string | null }>(
    "select max(settlement_date)::text as latest_date from fact_settlement_profit",
  );

  return rows[0]?.latest_date ?? undefined;
}

export async function getProfitSummary(filters: DashboardFilters): Promise<ProfitSummary> {
  const rows = await query<Record<string, string>>(
    `select
      coalesce(sum(total_sales_amount_with_tax), 0) as settlement_sales,
      coalesce(sum(total_sales_quantity), 0) as total_sales_quantity,
      coalesce(sum(total_ads_sales), 0) as total_ads_sales,
      coalesce(sum(total_ads_sales_quantity), 0) as total_ads_sales_quantity,
      coalesce(sum(gross_profit), 0) as gross_profit,
      coalesce(sum(gross_profit) / nullif(sum(total_sales_amount_with_tax), 0), 0) as gross_rate,
      coalesce(sum(total_sales_refunds) / nullif(sum(total_sales_amount_with_tax), 0), 0) as refunds_rate,
      coalesce(sum(total_sales_refunds), 0) as total_sales_refunds,
      coalesce(sum(platform_fee), 0) as platform_fee,
      coalesce(sum(fba_delivery_fee), 0) as fba_delivery_fee,
      coalesce(sum(total_ads_cost), 0) as total_ads_cost,
      coalesce(sum(promotional_rebates), 0) as promotional_rebates,
      coalesce(sum(promotion_fee), 0) as promotion_fee,
      coalesce(sum(total_storage_fee), 0) as total_storage_fee,
      coalesce(sum(cg_price), 0) as cg_price,
      coalesce(sum(cg_transport_costs), 0) as cg_transport_costs,
      coalesce(sum(total_cost), 0) as total_cost,
      coalesce(sum(total_ads_cost) / nullif(sum(total_sales_amount_with_tax), 0), 0) as ads_cost_rate,
      coalesce(sum(platform_fee) / nullif(sum(total_sales_amount_with_tax), 0), 0) as platform_fee_rate,
      coalesce(sum(fba_delivery_fee) / nullif(sum(total_sales_amount_with_tax), 0), 0) as fba_delivery_fee_rate,
      coalesce(sum(cg_transport_costs) / nullif(sum(total_sales_amount_with_tax), 0), 0) as cg_transport_cost_rate,
      coalesce(sum(cg_price) / nullif(sum(total_sales_amount_with_tax), 0), 0) as cg_price_rate,
      coalesce(sum(total_storage_fee) / nullif(sum(total_sales_amount_with_tax), 0), 0) as storage_fee_rate,
      coalesce(sum(promotional_rebates) / nullif(sum(total_sales_amount_with_tax), 0), 0) as promotional_rebate_rate,
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
    totalSalesRefunds: toNumber(row.total_sales_refunds),
    platformFee: toNumber(row.platform_fee),
    fbaDeliveryFee: toNumber(row.fba_delivery_fee),
    totalAdsCost: toNumber(row.total_ads_cost),
    promotionalRebates: toNumber(row.promotional_rebates),
    promotionFee: toNumber(row.promotion_fee),
    totalStorageFee: toNumber(row.total_storage_fee),
    cgPrice: toNumber(row.cg_price),
    cgTransportCosts: toNumber(row.cg_transport_costs),
    totalCost: toNumber(row.total_cost),
    adsCostRate: toNumber(row.ads_cost_rate),
    platformFeeRate: toNumber(row.platform_fee_rate),
    fbaDeliveryFeeRate: toNumber(row.fba_delivery_fee_rate),
    cgTransportCostRate: toNumber(row.cg_transport_cost_rate),
    cgPriceRate: toNumber(row.cg_price_rate),
    storageFeeRate: toNumber(row.storage_fee_rate),
    promotionalRebateRate: toNumber(row.promotional_rebate_rate),
    totalCostRate: toNumber(row.total_cost_rate),
  };
}

export async function getProfitTrend(filters: DashboardFilters) {
  const rows = await query<Record<string, string>>(
    `select
      settlement_date::text as date,
      coalesce(sum(total_sales_amount_with_tax), 0) as amount,
      coalesce(sum(gross_profit), 0) as gross_profit,
      coalesce(sum(gross_profit) / nullif(sum(total_sales_amount_with_tax), 0), 0) as gross_rate,
      coalesce(sum(total_sales_refunds) / nullif(sum(total_sales_amount_with_tax), 0), 0) as refunds_rate,
      coalesce(sum(platform_fee) / nullif(sum(total_sales_amount_with_tax), 0), 0) as platform_fee_rate,
      coalesce(sum(cg_transport_costs) / nullif(sum(total_sales_amount_with_tax), 0), 0) as cg_transport_cost_rate,
      coalesce(sum(cg_price) / nullif(sum(total_sales_amount_with_tax), 0), 0) as cg_price_rate,
      coalesce(sum(total_storage_fee) / nullif(sum(total_sales_amount_with_tax), 0), 0) as storage_fee_rate,
      coalesce(sum(fba_delivery_fee) / nullif(sum(total_sales_amount_with_tax), 0), 0) as fba_delivery_fee_rate,
      coalesce(sum(promotional_rebates) / nullif(sum(total_sales_amount_with_tax), 0), 0) as promotional_rebate_rate,
      coalesce(sum(total_ads_cost) / nullif(sum(total_sales_amount_with_tax), 0), 0) as ads_cost_rate
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
    refundsRate: toNumber(row.refunds_rate),
    platformFeeRate: toNumber(row.platform_fee_rate),
    cgTransportCostRate: toNumber(row.cg_transport_cost_rate),
    cgPriceRate: toNumber(row.cg_price_rate),
    storageFeeRate: toNumber(row.storage_fee_rate),
    fbaDeliveryFeeRate: toNumber(row.fba_delivery_fee_rate),
    promotionalRebateRate: toNumber(row.promotional_rebate_rate),
    adsCostRate: toNumber(row.ads_cost_rate),
  }));
}

export async function getProfitRankings(filters: DashboardFilters) {
  const previous = previousComparisonRange(filters);
  const rows = await query<Record<string, string>>(
    `with current_period as (
      select
        principal_uid,
        operator_name as name,
        group_name,
        coalesce(sum(total_sales_amount_with_tax), 0) as amount,
        coalesce(sum(total_sales_quantity), 0) as volume,
        coalesce(sum(gross_profit), 0) as gross_profit
      from fact_settlement_profit
      where settlement_date between $1 and $2
        and ($3::text is null or group_name = $3)
        and ($4::bigint is null or principal_uid = $4)
      group by principal_uid, operator_name, group_name
    ),
    previous_period as (
      select
        principal_uid,
        coalesce(sum(total_sales_amount_with_tax), 0) as previous_amount,
        coalesce(sum(gross_profit), 0) as previous_gross_profit
      from fact_settlement_profit
      where settlement_date between $5 and $6
        and ($3::text is null or group_name = $3)
        and ($4::bigint is null or principal_uid = $4)
      group by principal_uid
    )
    select
      current_period.*,
      case
        when previous_period.previous_amount is null or previous_period.previous_amount = 0 then null
        else (current_period.amount - previous_period.previous_amount) / previous_period.previous_amount
      end as amount_compare_rate,
      case
        when previous_period.previous_gross_profit is null or previous_period.previous_gross_profit = 0 then null
        else (current_period.gross_profit - previous_period.previous_gross_profit) / abs(previous_period.previous_gross_profit)
      end as gross_profit_compare_rate
    from current_period
    left join previous_period on previous_period.principal_uid = current_period.principal_uid
    order by current_period.gross_profit desc
    limit 10`,
    [...filterValues(filters), previous.startDate, previous.endDate],
  );

  return rows.map((row) => ({
    name: row.name,
    groupName: row.group_name,
    amount: toNumber(row.amount),
    volume: toNumber(row.volume),
    grossProfit: toNumber(row.gross_profit),
    amountCompareRate: row.amount_compare_rate === null || row.amount_compare_rate === undefined ? undefined : toNumber(row.amount_compare_rate),
    grossProfitCompareRate:
      row.gross_profit_compare_rate === null || row.gross_profit_compare_rate === undefined
        ? undefined
        : toNumber(row.gross_profit_compare_rate),
  }));
}
