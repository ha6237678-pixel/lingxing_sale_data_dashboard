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

export type ProfitAttributionFactor = {
  name: string;
  delta: number;
};

export type ProfitAttributionRow = {
  name: string;
  groupName: string;
  grossProfitCompareRate?: number;
  grossRateDelta: number;
  amountCompareRate?: number;
  factors: ProfitAttributionFactor[];
  conclusion: string;
  advice: string;
};

export async function getLatestSettlementProfitDate() {
  const rows = await query<{ latest_date: string | null }>(
    "select max(settlement_date)::text as latest_date from fact_settlement_profit",
  );

  return rows[0]?.latest_date ?? undefined;
}

export async function getSettlementProfitDateBounds() {
  const rows = await query<{ min_date: string | null; max_date: string | null }>(
    "select min(settlement_date)::text as min_date, max(settlement_date)::text as max_date from fact_settlement_profit",
  );
  const row = rows[0];

  return {
    minDate: row?.min_date ?? undefined,
    maxDate: row?.max_date ?? undefined,
  };
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
    order by current_period.gross_profit desc`,
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

function compareRate(current: number, previous: number) {
  return previous ? (current - previous) / Math.abs(previous) : undefined;
}

function buildProfitAttribution(row: Record<string, string>): ProfitAttributionRow | undefined {
  const grossProfit = toNumber(row.gross_profit);
  const previousGrossProfit = toNumber(row.previous_gross_profit);
  const amount = toNumber(row.amount);
  const previousAmount = toNumber(row.previous_amount);
  const grossRate = toNumber(row.gross_rate);
  const previousGrossRate = toNumber(row.previous_gross_rate);
  const grossProfitCompareRate = compareRate(grossProfit, previousGrossProfit);
  const amountCompareRate = compareRate(amount, previousAmount);
  const grossRateDelta = grossRate - previousGrossRate;
  const isNotableProfit = grossProfitCompareRate !== undefined && Math.abs(grossProfitCompareRate) >= 0.05;
  const isNotableRate = Math.abs(grossRateDelta) >= 0.01;

  if (!isNotableProfit && !isNotableRate) {
    return undefined;
  }

  if ((grossProfitCompareRate ?? 0) > 0 && grossRateDelta > 0) {
    return undefined;
  }

  const factors = [
    { name: "广告费比", delta: toNumber(row.ads_cost_rate) - toNumber(row.previous_ads_cost_rate) },
    { name: "退款率", delta: toNumber(row.refunds_rate) - toNumber(row.previous_refunds_rate) },
    { name: "平台费比", delta: toNumber(row.platform_fee_rate) - toNumber(row.previous_platform_fee_rate) },
    { name: "头程费比", delta: toNumber(row.cg_transport_cost_rate) - toNumber(row.previous_cg_transport_cost_rate) },
    { name: "采购费比", delta: toNumber(row.cg_price_rate) - toNumber(row.previous_cg_price_rate) },
    { name: "仓储费比", delta: toNumber(row.storage_fee_rate) - toNumber(row.previous_storage_fee_rate) },
    { name: "FBA费比", delta: toNumber(row.fba_delivery_fee_rate) - toNumber(row.previous_fba_delivery_fee_rate) },
    { name: "促销费比", delta: toNumber(row.promotional_rebate_rate) - toNumber(row.previous_promotional_rebate_rate) },
  ]
    .filter((factor) => factor.delta > 0)
    .sort((a, b) => b.delta - a.delta)
    .slice(0, 3);

  let conclusion = "利润变化较明显";
  let advice = "结合销售额、毛利率和费用结构进一步确认变化来源。";

  if ((grossProfitCompareRate ?? 0) < -0.05 && grossRateDelta < -0.01) {
    conclusion = "毛利润下降，且毛利率同步下降，销售规模和利润结构可能同时拖累。";
    advice = "优先排查销售额下滑、广告费比、退款率、采购费比和头程费比。";
  } else if ((grossProfitCompareRate ?? 0) < -0.05 && grossRateDelta > 0.01) {
    conclusion = "毛利润下降但毛利率改善，主要问题更可能来自销售规模不足。";
    advice = "重点恢复销售额、订单量和核心品类流量，同时保持当前利润率结构。";
  } else if ((grossProfitCompareRate ?? 0) > 0.05 && grossRateDelta < -0.01) {
    conclusion = "毛利润上升但毛利率下降，销售增长掩盖了利润结构恶化。";
    advice = "保留有效增长来源，同时压降上升最快的费用率，避免利润质量继续走弱。";
  } else if ((grossProfitCompareRate ?? 0) > 0.05 && grossRateDelta > 0.01) {
    conclusion = "毛利润和毛利率同步上升，销售规模和利润结构均有改善。";
    advice = "复盘本周期有效动作，关注是否可复制到相似运营或品线。";
  } else if (grossRateDelta < -0.01) {
    conclusion = "毛利率下降明显，利润结构存在拖累。";
    advice = "优先排查上升最快的费用率，以及低毛利产品占比变化。";
  } else if (grossRateDelta > 0.01) {
    conclusion = "毛利率上升明显，利润结构改善。";
    advice = "复盘费用率下降或高毛利产品增长的原因，确认是否可持续。";
  }

  return {
    name: row.name,
    groupName: row.group_name,
    grossProfitCompareRate,
    grossRateDelta,
    amountCompareRate,
    factors,
    conclusion,
    advice,
  };
}

export async function getProfitAttributionRows(filters: DashboardFilters): Promise<ProfitAttributionRow[]> {
  const previous = previousComparisonRange(filters);
  const rows = await query<Record<string, string>>(
    `with current_period as (
      select
        principal_uid,
        operator_name as name,
        group_name,
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
      group by principal_uid, operator_name, group_name
    ),
    previous_period as (
      select
        principal_uid,
        coalesce(sum(total_sales_amount_with_tax), 0) as previous_amount,
        coalesce(sum(gross_profit), 0) as previous_gross_profit,
        coalesce(sum(gross_profit) / nullif(sum(total_sales_amount_with_tax), 0), 0) as previous_gross_rate,
        coalesce(sum(total_sales_refunds) / nullif(sum(total_sales_amount_with_tax), 0), 0) as previous_refunds_rate,
        coalesce(sum(platform_fee) / nullif(sum(total_sales_amount_with_tax), 0), 0) as previous_platform_fee_rate,
        coalesce(sum(cg_transport_costs) / nullif(sum(total_sales_amount_with_tax), 0), 0) as previous_cg_transport_cost_rate,
        coalesce(sum(cg_price) / nullif(sum(total_sales_amount_with_tax), 0), 0) as previous_cg_price_rate,
        coalesce(sum(total_storage_fee) / nullif(sum(total_sales_amount_with_tax), 0), 0) as previous_storage_fee_rate,
        coalesce(sum(fba_delivery_fee) / nullif(sum(total_sales_amount_with_tax), 0), 0) as previous_fba_delivery_fee_rate,
        coalesce(sum(promotional_rebates) / nullif(sum(total_sales_amount_with_tax), 0), 0) as previous_promotional_rebate_rate,
        coalesce(sum(total_ads_cost) / nullif(sum(total_sales_amount_with_tax), 0), 0) as previous_ads_cost_rate
      from fact_settlement_profit
      where settlement_date between $5 and $6
        and ($3::text is null or group_name = $3)
        and ($4::bigint is null or principal_uid = $4)
      group by principal_uid
    )
    select current_period.*, previous_period.*
    from current_period
    left join previous_period on previous_period.principal_uid = current_period.principal_uid
    order by abs(current_period.gross_profit - coalesce(previous_period.previous_gross_profit, 0)) desc`,
    [...filterValues(filters), previous.startDate, previous.endDate],
  );

  return rows.map(buildProfitAttribution).filter((row): row is ProfitAttributionRow => Boolean(row));
}
