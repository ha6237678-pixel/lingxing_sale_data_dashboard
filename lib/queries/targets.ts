import { query } from "@/lib/db/client";
import type { DashboardFilters } from "@/lib/utils/date";
import { currentMonthStart } from "@/lib/utils/date";
import { toNumber } from "@/lib/utils/number";
import { differenceInCalendarDays, getDaysInMonth } from "date-fns";

export type TargetSummary = {
  salesTarget: number;
  actualSales: number;
  salesCompletion: number;
  monthlySalesCompletion: number;
  profitTarget: number;
  actualProfit: number;
  profitCompletion: number;
  monthlyProfitCompletion: number;
  configuredOperators: number;
};

export async function getLatestSettlementDate() {
  const rows = await query<{ latest_date: string | null }>(
    "select max(settlement_date)::text as latest_date from fact_settlement_profit",
  );

  return rows[0]?.latest_date ?? undefined;
}

export async function getTargetSummary(filters: DashboardFilters): Promise<TargetSummary> {
  const month = currentMonthStart(new Date(`${filters.endDate}T00:00:00`));
  const start = new Date(`${filters.startDate}T00:00:00`);
  const end = new Date(`${filters.endDate}T00:00:00`);
  const selectedDays = Math.max(differenceInCalendarDays(end, start) + 1, 1);
  const monthDays = getDaysInMonth(end);
  const values = [month, filters.groupName ?? null, filters.principalUid ? Number(filters.principalUid) : null];
  const targetRows = await query<Record<string, string>>(
    `select
      coalesce(sum(sales_target_amount), 0) as sales_target,
      coalesce(sum(profit_target_amount), 0) as profit_target,
      count(*)::int as configured_operators
    from fact_operator_monthly_target
    where target_month = $1::date
      and ($2::text is null or group_name = $2)
      and ($3::bigint is null or principal_uid = $3)`,
    values,
  );
  const actualSalesRows = await query<Record<string, string>>(
    `select coalesce(sum(total_sales_amount_with_tax), 0) as actual_sales
    from fact_settlement_profit
    where settlement_date between $1::date and $4::date
      and ($2::text is null or group_name = $2)
      and ($3::bigint is null or principal_uid = $3)`,
    [filters.startDate, values[1], values[2], filters.endDate],
  );
  const actualProfitRows = await query<Record<string, string>>(
    `select coalesce(sum(gross_profit), 0) as actual_profit
    from fact_settlement_profit
    where settlement_date between $1::date and $4::date
      and ($2::text is null or group_name = $2)
      and ($3::bigint is null or principal_uid = $3)`,
    [filters.startDate, values[1], values[2], filters.endDate],
  );

  const targets = targetRows[0] ?? {};
  const salesTarget = toNumber(targets.sales_target);
  const profitTarget = toNumber(targets.profit_target);
  const actualSales = toNumber(actualSalesRows[0]?.actual_sales);
  const actualProfit = toNumber(actualProfitRows[0]?.actual_profit);
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
    configuredOperators: toNumber(targets.configured_operators),
  };
}

export async function getTargetRankings(filters: DashboardFilters) {
  const month = currentMonthStart(new Date(`${filters.endDate}T00:00:00`));
  const start = new Date(`${filters.startDate}T00:00:00`);
  const end = new Date(`${filters.endDate}T00:00:00`);
  const selectedDays = Math.max(differenceInCalendarDays(end, start) + 1, 1);
  const monthDays = getDaysInMonth(end);
  const rows = await query<Record<string, string>>(
    `with sales as (
      select principal_uid, coalesce(sum(total_sales_amount_with_tax), 0) as actual_sales
      from fact_settlement_profit
      where settlement_date between $4::date and $5::date
      group by principal_uid
    ), profit as (
      select principal_uid, coalesce(sum(gross_profit), 0) as actual_profit
      from fact_settlement_profit
      where settlement_date between $4::date and $5::date
      group by principal_uid
    )
    select
      t.operator_name as name,
      t.group_name,
      coalesce(t.sales_target_amount, 0) as sales_target,
      coalesce(s.actual_sales, 0) as actual_sales,
      coalesce(coalesce(s.actual_sales, 0) / nullif(t.sales_target_amount, 0), 0) as sales_completion,
      coalesce(t.profit_target_amount, 0) as profit_target,
      coalesce(p.actual_profit, 0) as actual_profit,
      coalesce(coalesce(p.actual_profit, 0) / nullif(t.profit_target_amount, 0), 0) as profit_completion
    from fact_operator_monthly_target t
    left join sales s on s.principal_uid = t.principal_uid
    left join profit p on p.principal_uid = t.principal_uid
    where t.target_month = $1::date
      and ($2::text is null or t.group_name = $2)
      and ($3::bigint is null or t.principal_uid = $3)
    order by sales_completion desc
    limit 20`,
    [month, filters.groupName ?? null, filters.principalUid ? Number(filters.principalUid) : null, filters.startDate, filters.endDate],
  );

  return rows.map((row) => ({
    name: row.name,
    groupName: row.group_name,
    salesTarget: toNumber(row.sales_target),
    actualSales: toNumber(row.actual_sales),
    salesCompletion: toNumber(row.sales_completion),
    profitTarget: toNumber(row.profit_target),
    actualProfit: toNumber(row.actual_profit),
    profitCompletion: toNumber(row.profit_completion),
  })).map((row) => {
    const monthlySales = (row.actualSales / selectedDays) * monthDays;
    const monthlyProfit = (row.actualProfit / selectedDays) * monthDays;

    return {
      ...row,
      monthlySalesCompletion: row.salesTarget ? monthlySales / row.salesTarget : 0,
      monthlyProfitCompletion: row.profitTarget ? monthlyProfit / row.profitTarget : 0,
    };
  });
}

export async function getTargetGroupRankings(filters: DashboardFilters) {
  const month = currentMonthStart(new Date(`${filters.endDate}T00:00:00`));
  const start = new Date(`${filters.startDate}T00:00:00`);
  const end = new Date(`${filters.endDate}T00:00:00`);
  const selectedDays = Math.max(differenceInCalendarDays(end, start) + 1, 1);
  const monthDays = getDaysInMonth(end);
  const rows = await query<Record<string, string>>(
    `with targets as (
      select
        group_name,
        coalesce(sum(sales_target_amount), 0) as sales_target,
        coalesce(sum(profit_target_amount), 0) as profit_target
      from fact_operator_monthly_target
      where target_month = $1::date
        and ($2::text is null or group_name = $2)
        and ($3::bigint is null or principal_uid = $3)
      group by group_name
    ), actuals as (
      select
        group_name,
        coalesce(sum(total_sales_amount_with_tax), 0) as actual_sales,
        coalesce(sum(gross_profit), 0) as actual_profit
      from fact_settlement_profit
      where settlement_date between $4::date and $5::date
        and ($2::text is null or group_name = $2)
        and ($3::bigint is null or principal_uid = $3)
      group by group_name
    )
    select
      t.group_name as name,
      t.group_name,
      coalesce(t.sales_target, 0) as sales_target,
      coalesce(a.actual_sales, 0) as actual_sales,
      coalesce(coalesce(a.actual_sales, 0) / nullif(t.sales_target, 0), 0) as sales_completion,
      coalesce(t.profit_target, 0) as profit_target,
      coalesce(a.actual_profit, 0) as actual_profit,
      coalesce(coalesce(a.actual_profit, 0) / nullif(t.profit_target, 0), 0) as profit_completion
    from targets t
    left join actuals a on a.group_name = t.group_name
    order by
      case t.group_name
        when '四组' then 1
        when '五组' then 2
        when '六组' then 3
        when '七组' then 4
        else 99
      end,
      t.group_name`,
    [month, filters.groupName ?? null, filters.principalUid ? Number(filters.principalUid) : null, filters.startDate, filters.endDate],
  );

  return rows.map((row) => ({
    name: row.name,
    groupName: row.group_name,
    salesTarget: toNumber(row.sales_target),
    actualSales: toNumber(row.actual_sales),
    salesCompletion: toNumber(row.sales_completion),
    profitTarget: toNumber(row.profit_target),
    actualProfit: toNumber(row.actual_profit),
    profitCompletion: toNumber(row.profit_completion),
  })).map((row) => {
    const monthlySales = (row.actualSales / selectedDays) * monthDays;
    const monthlyProfit = (row.actualProfit / selectedDays) * monthDays;

    return {
      ...row,
      monthlySalesCompletion: row.salesTarget ? monthlySales / row.salesTarget : 0,
      monthlyProfitCompletion: row.profitTarget ? monthlyProfit / row.profitTarget : 0,
    };
  });
}
