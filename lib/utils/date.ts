import { addDays, differenceInCalendarDays, endOfMonth, format, parseISO, startOfMonth, subDays, subMonths } from "date-fns";

export type ComparisonMode = "day" | "week" | "month" | "custom";

export type DashboardFilters = {
  startDate: string;
  endDate: string;
  groupName?: string;
  principalUid?: string;
  comparisonMode?: ComparisonMode;
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
    comparisonMode: parseComparisonMode(read("comparisonMode")),
  };
}

export function currentMonthStart(date = new Date()) {
  return format(startOfMonth(date), "yyyy-MM-dd");
}

export function parseComparisonMode(value: string | undefined): ComparisonMode {
  return value === "week" || value === "month" || value === "custom" ? value : "day";
}

export function normalizeComparisonFilters(filters: DashboardFilters): DashboardFilters {
  if (filters.comparisonMode === "month" || filters.comparisonMode === "custom") {
    return filters;
  }

  if (filters.comparisonMode === "week") {
    return {
      ...filters,
      endDate: format(addDays(parseISO(filters.startDate), 6), "yyyy-MM-dd"),
    };
  }

  return {
    ...filters,
    endDate: filters.startDate,
  };
}

export function previousComparisonRange(filters: DashboardFilters) {
  const normalized = normalizeComparisonFilters(filters);
  const start = parseISO(normalized.startDate);
  const end = parseISO(normalized.endDate);

  if (normalized.comparisonMode === "month") {
    const previousMonth = subMonths(end, 1);

    return {
      startDate: format(startOfMonth(previousMonth), "yyyy-MM-dd"),
      endDate: format(endOfMonth(previousMonth), "yyyy-MM-dd"),
    };
  }

  if (normalized.comparisonMode === "custom") {
    const days = Math.max(differenceInCalendarDays(end, start) + 1, 1);
    const previousEnd = subDays(start, 1);
    const previousStart = subDays(start, days);

    return {
      startDate: format(previousStart, "yyyy-MM-dd"),
      endDate: format(previousEnd, "yyyy-MM-dd"),
    };
  }

  return {
    startDate: format(subDays(start, 7), "yyyy-MM-dd"),
    endDate: format(subDays(end, 7), "yyyy-MM-dd"),
  };
}
