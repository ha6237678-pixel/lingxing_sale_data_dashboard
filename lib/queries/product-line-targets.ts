import { query } from "@/lib/db/client";
import type { DashboardFilters } from "@/lib/utils/date";
import { currentMonthStart } from "@/lib/utils/date";
import { toNumber } from "@/lib/utils/number";
import { differenceInCalendarDays, getDaysInMonth } from "date-fns";

export type ProductLineTargetSummary = {
  salesTarget: number;
  actualSales: number;
  salesCompletion: number;
  monthlySalesCompletion: number;
  profitTarget: number;
  actualProfit: number;
  profitCompletion: number;
  monthlyProfitCompletion: number;
  configuredProductLines: number;
};

export type ProductLineTargetRow = {
  name: string;
  groupName: string;
  operatorName: string;
  salesTarget: number;
  actualSales: number;
  salesCompletion: number;
  monthlySalesCompletion: number;
  profitTarget: number;
  actualProfit: number;
  profitCompletion: number;
  monthlyProfitCompletion: number;
};

function targetValues(filters: DashboardFilters) {
  return [
    filters.groupName ?? null,
    filters.principalUid ? Number(filters.principalUid) : null,
    filters.productLineName ?? null,
  ];
}

function targetGroupFilter(column = "group_name") {
  return `($2::text is null or ${column} = $2 or replace(${column}, '运营', '') = $2)`;
}

function productLineNameFilter(column = "product_line_name", param = "$4") {
  return `(${param}::text is null or lower(replace(${column}, ' ', '')) = lower(replace(${param}, ' ', '')))`;
}

function withMonthlyCompletion<T extends ProductLineTargetRow>(row: T, selectedDays: number, monthDays: number): T {
  const monthlySales = (row.actualSales / selectedDays) * monthDays;
  const monthlyProfit = (row.actualProfit / selectedDays) * monthDays;

  return {
    ...row,
    monthlySalesCompletion: row.salesTarget ? monthlySales / row.salesTarget : 0,
    monthlyProfitCompletion: row.profitTarget ? monthlyProfit / row.profitTarget : 0,
  };
}

export async function getLatestProductLineTargetDate() {
  const rows = await query<{ latest_date: string | null }>(
    "select max(settlement_date)::text as latest_date from fact_product_line_settlement_profit",
  );

  return rows[0]?.latest_date ?? undefined;
}

export async function getProductLineTargetSummary(filters: DashboardFilters): Promise<ProductLineTargetSummary> {
  const month = currentMonthStart(new Date(`${filters.endDate}T00:00:00`));
  const start = new Date(`${filters.startDate}T00:00:00`);
  const end = new Date(`${filters.endDate}T00:00:00`);
  const selectedDays = Math.max(differenceInCalendarDays(end, start) + 1, 1);
  const monthDays = getDaysInMonth(end);
  const values = targetValues(filters);
  const targetRows = await query<Record<string, string>>(
    `select
      coalesce(sum(sales_target_amount), 0) as sales_target,
      coalesce(sum(profit_target_amount), 0) as profit_target,
      count(*)::int as configured_product_lines
    from fact_product_line_monthly_target
    where target_month = $1::date
      and ${targetGroupFilter()}
      and ($3::bigint is null or principal_uid = $3)
      and ${productLineNameFilter()}`,
    [month, ...values],
  );
  const salesRows = await query<Record<string, string>>(
    `select coalesce(sum(amount), 0) as actual_sales
    from fact_product_line_daily_metrics
    where stat_date between $1::date and $2::date
      and ($3::text is null or group_name = $3)
      and ($4::bigint is null or principal_uid = $4)
      and ${productLineNameFilter("product_line_name", "$5")}`,
    [filters.startDate, filters.endDate, ...values],
  );
  const profitRows = await query<Record<string, string>>(
    `select coalesce(sum(gross_profit), 0) as actual_profit
    from fact_product_line_settlement_profit
    where settlement_date between $1::date and $2::date
      and ($3::text is null or group_name = $3)
      and ($4::bigint is null or principal_uid = $4)
      and ${productLineNameFilter("product_line_name", "$5")}`,
    [filters.startDate, filters.endDate, ...values],
  );

  const targets = targetRows[0] ?? {};
  const salesTarget = toNumber(targets.sales_target);
  const profitTarget = toNumber(targets.profit_target);
  const actualSales = toNumber(salesRows[0]?.actual_sales);
  const actualProfit = toNumber(profitRows[0]?.actual_profit);
  const monthlySales = (actualSales / selectedDays) * monthDays;
  const monthlyProfit = (actualProfit / selectedDays) * monthDays;

  return {
    salesTarget,
    actualSales,
    salesCompletion: salesTarget ? actualSales / salesTarget : 0,
    monthlySalesCompletion: salesTarget ? monthlySales / salesTarget : 0,
    profitTarget,
    actualProfit,
    profitCompletion: profitTarget ? actualProfit / profitTarget : 0,
    monthlyProfitCompletion: profitTarget ? monthlyProfit / profitTarget : 0,
    configuredProductLines: toNumber(targets.configured_product_lines),
  };
}

export async function getProductLineTargetGroupRankings(filters: DashboardFilters): Promise<ProductLineTargetRow[]> {
  const month = currentMonthStart(new Date(`${filters.endDate}T00:00:00`));
  const start = new Date(`${filters.startDate}T00:00:00`);
  const end = new Date(`${filters.endDate}T00:00:00`);
  const selectedDays = Math.max(differenceInCalendarDays(end, start) + 1, 1);
  const monthDays = getDaysInMonth(end);
  const values = targetValues(filters);
  const rows = await query<Record<string, string>>(
    `with targets as (
      select
        replace(group_name, '运营', '') as group_name,
        coalesce(sum(sales_target_amount), 0) as sales_target,
        coalesce(sum(profit_target_amount), 0) as profit_target
      from fact_product_line_monthly_target
      where target_month = $1::date
        and ${targetGroupFilter()}
        and ($3::bigint is null or principal_uid = $3)
        and ${productLineNameFilter()}
      group by replace(group_name, '运营', '')
    ), sales as (
      select group_name, coalesce(sum(amount), 0) as actual_sales
      from fact_product_line_daily_metrics
      where stat_date between $5::date and $6::date
        and ($2::text is null or group_name = $2)
        and ($3::bigint is null or principal_uid = $3)
        and ${productLineNameFilter()}
      group by group_name
    ), profit as (
      select group_name, coalesce(sum(gross_profit), 0) as actual_profit
      from fact_product_line_settlement_profit
      where settlement_date between $5::date and $6::date
        and ($2::text is null or group_name = $2)
        and ($3::bigint is null or principal_uid = $3)
        and ${productLineNameFilter()}
      group by group_name
    )
    select
      t.group_name as name,
      t.group_name,
      '' as operator_name,
      coalesce(t.sales_target, 0) as sales_target,
      coalesce(s.actual_sales, 0) as actual_sales,
      coalesce(coalesce(s.actual_sales, 0) / nullif(t.sales_target, 0), 0) as sales_completion,
      coalesce(t.profit_target, 0) as profit_target,
      coalesce(p.actual_profit, 0) as actual_profit,
      coalesce(coalesce(p.actual_profit, 0) / nullif(t.profit_target, 0), 0) as profit_completion
    from targets t
    left join sales s on s.group_name = t.group_name
    left join profit p on p.group_name = t.group_name
    order by coalesce(t.sales_target, 0) desc, t.group_name`,
    [month, ...values, filters.startDate, filters.endDate],
  );

  return rows
    .map((row) => ({
      name: row.name,
      groupName: row.group_name,
      operatorName: row.operator_name,
      salesTarget: toNumber(row.sales_target),
      actualSales: toNumber(row.actual_sales),
      salesCompletion: toNumber(row.sales_completion),
      monthlySalesCompletion: 0,
      profitTarget: toNumber(row.profit_target),
      actualProfit: toNumber(row.actual_profit),
      profitCompletion: toNumber(row.profit_completion),
      monthlyProfitCompletion: 0,
    }))
    .map((row) => withMonthlyCompletion(row, selectedDays, monthDays));
}

export async function getProductLineTargetRankings(filters: DashboardFilters): Promise<ProductLineTargetRow[]> {
  const month = currentMonthStart(new Date(`${filters.endDate}T00:00:00`));
  const start = new Date(`${filters.startDate}T00:00:00`);
  const end = new Date(`${filters.endDate}T00:00:00`);
  const selectedDays = Math.max(differenceInCalendarDays(end, start) + 1, 1);
  const monthDays = getDaysInMonth(end);
  const values = targetValues(filters);
  const rows = await query<Record<string, string>>(
    `with targets as (
      select
        group_name,
        operator_name,
        principal_uid,
        product_line_name,
        cid,
        coalesce(sum(sales_target_amount), 0) as sales_target,
        coalesce(sum(profit_target_amount), 0) as profit_target
      from fact_product_line_monthly_target
      where target_month = $1::date
        and ${targetGroupFilter()}
        and ($3::bigint is null or principal_uid = $3)
        and ${productLineNameFilter()}
      group by group_name, operator_name, principal_uid, product_line_name, cid
    ), sales as (
      select
        cid,
        coalesce(sum(amount), 0) as actual_sales
      from fact_product_line_daily_metrics
      where stat_date between $5::date and $6::date
        and ($2::text is null or group_name = $2)
        and ($3::bigint is null or principal_uid = $3)
        and ${productLineNameFilter()}
      group by cid
    ), profit as (
      select
        cid,
        coalesce(sum(gross_profit), 0) as actual_profit
      from fact_product_line_settlement_profit
      where settlement_date between $5::date and $6::date
        and ($2::text is null or group_name = $2)
        and ($3::bigint is null or principal_uid = $3)
        and ${productLineNameFilter()}
      group by cid
    )
    select
      t.product_line_name as name,
      replace(t.group_name, '运营', '') as group_name,
      t.operator_name,
      coalesce(t.sales_target, 0) as sales_target,
      coalesce(s.actual_sales, 0) as actual_sales,
      coalesce(coalesce(s.actual_sales, 0) / nullif(t.sales_target, 0), 0) as sales_completion,
      coalesce(t.profit_target, 0) as profit_target,
      coalesce(p.actual_profit, 0) as actual_profit,
      coalesce(coalesce(p.actual_profit, 0) / nullif(t.profit_target, 0), 0) as profit_completion
    from targets t
    left join sales s on s.cid = t.cid
    left join profit p on p.cid = t.cid
    order by coalesce(t.sales_target, 0) desc, t.group_name, t.operator_name, t.product_line_name`,
    [month, ...values, filters.startDate, filters.endDate],
  );

  return rows
    .map((row) => ({
      name: row.name,
      groupName: row.group_name,
      operatorName: row.operator_name,
      salesTarget: toNumber(row.sales_target),
      actualSales: toNumber(row.actual_sales),
      salesCompletion: toNumber(row.sales_completion),
      monthlySalesCompletion: 0,
      profitTarget: toNumber(row.profit_target),
      actualProfit: toNumber(row.actual_profit),
      profitCompletion: toNumber(row.profit_completion),
      monthlyProfitCompletion: 0,
    }))
    .map((row) => withMonthlyCompletion(row, selectedDays, monthDays));
}
