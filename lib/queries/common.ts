import { query } from "@/lib/db/client";
import type { DashboardFilters } from "@/lib/utils/date";

export type FilterOptions = {
  groups: string[];
  operators: Array<{
    principalUid: string;
    operatorName: string;
    groupName: string;
  }>;
};

export function filterValues(filters: DashboardFilters) {
  return [filters.startDate, filters.endDate, filters.groupName ?? null, filters.principalUid ? Number(filters.principalUid) : null];
}

export async function getFilterOptions(): Promise<FilterOptions> {
  const groups = await query<{ group_name: string }>(
    "select distinct group_name from dim_operator where group_name is not null order by group_name",
  );
  const operators = await query<{ principal_uid: string; operator_name: string; group_name: string }>(
    `select principal_uid::text, operator_name, group_name
     from dim_operator
     where principal_uid is not null and coalesce(is_active, true) = true
     order by group_name, operator_name`,
  );

  return {
    groups: groups.map((row) => row.group_name),
    operators: operators.map((row) => ({
      principalUid: row.principal_uid,
      operatorName: row.operator_name,
      groupName: row.group_name,
    })),
  };
}
