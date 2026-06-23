import { format, startOfMonth, subDays } from "date-fns";

export type DashboardFilters = {
  startDate: string;
  endDate: string;
  groupName?: string;
  principalUid?: string;
};

export function defaultDateRange() {
  const end = subDays(new Date(), 1);
  const start = startOfMonth(end);

  return {
    startDate: format(start, "yyyy-MM-dd"),
    endDate: format(end, "yyyy-MM-dd"),
  };
}

export function parseFilters(searchParams?: Record<string, string | string[] | undefined>): DashboardFilters {
  const defaults = defaultDateRange();
  const read = (key: string) => {
    const value = searchParams?.[key];
    return Array.isArray(value) ? value[0] : value;
  };

  return {
    startDate: read("startDate") || defaults.startDate,
    endDate: read("endDate") || defaults.endDate,
    groupName: read("groupName") || undefined,
    principalUid: read("principalUid") || undefined,
  };
}

export function currentMonthStart(date = new Date()) {
  return format(startOfMonth(date), "yyyy-MM-dd");
}
