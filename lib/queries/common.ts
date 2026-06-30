import { query } from "@/lib/db/client";
import type { DashboardFilters } from "@/lib/utils/date";

export type FilterOptions = {
  groups: string[];
  productLines: string[];
  operators: Array<{
    principalUid: string;
    operatorName: string;
    groupName: string;
  }>;
};

export function filterValues(filters: DashboardFilters) {
  return [filters.startDate, filters.endDate, filters.groupName ?? null, filters.principalUid ? Number(filters.principalUid) : null];
}

export function productLineCondition(filters: DashboardFilters, parameterIndex: number, tableAlias?: string) {
  if (!filters.productLine) return "";

  const column = tableAlias ? `${tableAlias}.product_line` : "product_line";
  return `and ${column} = $${parameterIndex}`;
}

export function productLineValue(filters: DashboardFilters) {
  return filters.productLine ? [filters.productLine] : [];
}

async function getProductLinesFrom(tableName: "fact_operator_daily_metrics" | "fact_settlement_profit") {
  try {
    const rows = await query<{ product_line: string }>(
      `select distinct product_line
       from ${tableName}
       where product_line is not null and product_line <> ''
       order by product_line`,
    );

    return rows.map((row) => row.product_line);
  } catch {
    return [];
  }
}

export async function getFilterOptions(): Promise<FilterOptions> {
  const [groups, operators, dailyProductLines, profitProductLines] = await Promise.all([
    query<{ group_name: string }>(
      `select group_name
       from (
         select distinct group_name
         from dim_operator
         where group_name is not null
       ) groups
       order by case group_name
         when '四组' then 1
         when '五组' then 2
         when '六组' then 3
         when '七组' then 4
         else 99
       end, group_name`,
    ),
    query<{ principal_uid: string; operator_name: string; group_name: string }>(
      `select principal_uid::text, operator_name, group_name
       from dim_operator
       where principal_uid is not null and coalesce(is_active, true) = true
       order by case group_name
         when '四组' then 1
         when '五组' then 2
         when '六组' then 3
         when '七组' then 4
         else 99
       end, group_name, operator_name`,
    ),
    getProductLinesFrom("fact_operator_daily_metrics"),
    getProductLinesFrom("fact_settlement_profit"),
  ]);
  const productLines = Array.from(new Set([...dailyProductLines, ...profitProductLines])).sort((a, b) => a.localeCompare(b, "zh-Hans-CN"));

  return {
    groups: groups.map((row) => row.group_name),
    productLines,
    operators: operators.map((row) => ({
      principalUid: row.principal_uid,
      operatorName: row.operator_name,
      groupName: row.group_name,
    })),
  };
}
