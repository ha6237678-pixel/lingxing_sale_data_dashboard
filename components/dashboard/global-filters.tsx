"use client";

import type { FilterOptions } from "@/lib/queries/common";
import {
  normalizeComparisonFilters,
  previousComparisonRange,
  type ComparisonMode,
  type DashboardFilters,
} from "@/lib/utils/date";
import { Filter } from "lucide-react";
import { useMemo, useState } from "react";

function formatDateLabel(value: string) {
  return value.split("-").join("/");
}

function parseDate(value: string) {
  const [year, month, day] = value.split("-").map(Number);
  return new Date(year, month - 1, day);
}

function formatDate(date: Date) {
  const year = date.getFullYear();
  const month = `${date.getMonth() + 1}`.padStart(2, "0");
  const day = `${date.getDate()}`.padStart(2, "0");

  return `${year}-${month}-${day}`;
}

function getSevenDayRange(value: string) {
  const start = parseDate(value);
  const end = new Date(start);
  end.setDate(start.getDate() + 6);

  return {
    startDate: formatDate(start),
    endDate: formatDate(end),
  };
}

export function GlobalFilters({
  filters,
  options,
  showComparisonMode = false,
  showComparisonRange = false,
}: {
  filters: DashboardFilters;
  options: FilterOptions;
  showComparisonMode?: boolean;
  showComparisonRange?: boolean;
}) {
  const initialFilters = showComparisonMode ? normalizeComparisonFilters(filters) : filters;
  const [comparisonMode, setComparisonMode] = useState<ComparisonMode>(initialFilters.comparisonMode ?? "day");
  const [startDate, setStartDate] = useState(initialFilters.startDate);
  const [endDate, setEndDate] = useState(initialFilters.endDate);
  const [groupName, setGroupName] = useState(filters.groupName ?? "");
  const [principalUid, setPrincipalUid] = useState(filters.principalUid ?? "");

  const operators = groupName
    ? options.operators.filter((operator) => operator.groupName === groupName)
    : options.operators;
  const comparisonRange = useMemo(
    () =>
      showComparisonMode || showComparisonRange
        ? previousComparisonRange({
            ...filters,
            comparisonMode,
            startDate,
            endDate,
          })
        : undefined,
    [comparisonMode, endDate, filters, showComparisonMode, showComparisonRange, startDate],
  );

  function updateComparisonMode(nextMode: ComparisonMode) {
    setComparisonMode(nextMode);

    if (nextMode === "day") {
      setEndDate(startDate);
      return;
    }

    if (nextMode === "week") {
      const range = getSevenDayRange(startDate);
      setStartDate(range.startDate);
      setEndDate(range.endDate);
    }
  }

  function updateDayDate(value: string) {
    setStartDate(value);
    setEndDate(value);
  }

  function updateWeekStartDate(value: string) {
    const range = getSevenDayRange(value);
    setStartDate(range.startDate);
    setEndDate(range.endDate);
  }

  function updateGroupName(value: string) {
    setGroupName(value);
    setPrincipalUid("");
  }

  const showRangeDates = !showComparisonMode || comparisonMode === "month" || comparisonMode === "custom";

  return (
    <form
      className={`mb-5 grid gap-3 border-b border-line bg-white p-4 shadow-panel ${
        showComparisonMode ? "md:grid-cols-[repeat(5,minmax(0,1fr))_auto]" : "md:grid-cols-[repeat(4,minmax(0,1fr))_auto]"
      }`}
    >
      {showComparisonMode ? (
        <label className="space-y-1 text-xs text-muted">
          <span>环比模式</span>
          <select
            className="h-10 w-full border border-line px-3 text-sm text-ink"
            name="comparisonMode"
            value={comparisonMode}
            onChange={(event) => updateComparisonMode(event.target.value as ComparisonMode)}
          >
            <option value="day">日度看板</option>
            <option value="week">周度看板</option>
            <option value="month">月度看板</option>
            <option value="custom">自定义</option>
          </select>
        </label>
      ) : null}

      {showComparisonMode && comparisonMode === "day" ? (
        <>
          <label className="space-y-1 text-xs text-muted">
            <span>日期</span>
            <input
              className="h-10 w-full border border-line px-3 text-sm text-ink"
              name="startDate"
              type="date"
              value={startDate}
              onChange={(event) => updateDayDate(event.target.value)}
            />
          </label>
          <input name="endDate" type="hidden" value={endDate} />
        </>
      ) : null}

      {showComparisonMode && comparisonMode === "week" ? (
        <>
          <label className="space-y-1 text-xs text-muted">
            <span>周开始日期</span>
            <input
              className="h-10 w-full border border-line px-3 text-sm text-ink"
              name="startDate"
              type="date"
              value={startDate}
              onChange={(event) => updateWeekStartDate(event.target.value)}
            />
          </label>
          <label className="space-y-1 text-xs text-muted">
            <span>周结束日期</span>
            <input
              className="h-10 w-full border border-line bg-slate-50 px-3 text-sm text-muted"
              name="endDate"
              type="date"
              value={endDate}
              readOnly
            />
          </label>
        </>
      ) : null}

      {showRangeDates ? (
        <>
          <label className="space-y-1 text-xs text-muted">
            <span>开始日期</span>
            <input
              className="h-10 w-full border border-line px-3 text-sm text-ink"
              name="startDate"
              type="date"
              value={startDate}
              onChange={(event) => setStartDate(event.target.value)}
            />
          </label>
          <label className="space-y-1 text-xs text-muted">
            <span>结束日期</span>
            <input
              className="h-10 w-full border border-line px-3 text-sm text-ink"
              name="endDate"
              type="date"
              value={endDate}
              onChange={(event) => setEndDate(event.target.value)}
            />
          </label>
        </>
      ) : null}

      <label className="space-y-1 text-xs text-muted">
        <span>组别</span>
        <select
          className="h-10 w-full border border-line px-3 text-sm text-ink"
          name="groupName"
          value={groupName}
          onChange={(event) => updateGroupName(event.target.value)}
        >
          <option value="">全部组别</option>
          {options.groups.map((group) => (
            <option key={group} value={group}>
              {group}
            </option>
          ))}
        </select>
      </label>
      <label className="space-y-1 text-xs text-muted">
        <span>运营负责人</span>
        <select
          className="h-10 w-full border border-line px-3 text-sm text-ink"
          name="principalUid"
          value={principalUid}
          onChange={(event) => setPrincipalUid(event.target.value)}
        >
          <option value="">全部运营</option>
          {operators.map((operator) => (
            <option key={operator.principalUid} value={operator.principalUid}>
              {operator.operatorName}
            </option>
          ))}
        </select>
      </label>
      <button
        className="mt-5 inline-flex h-10 items-center justify-center gap-2 bg-ink px-4 text-sm font-medium text-white hover:bg-slate-700"
        type="submit"
      >
        <Filter className="h-4 w-4" />
        筛选
      </button>
      {comparisonRange ? (
        <div className="col-span-full border-t border-line pt-3 text-sm text-blue-700">
          环比日期：{formatDateLabel(comparisonRange.startDate)}
          {comparisonRange.startDate === comparisonRange.endDate ? "" : ` 至 ${formatDateLabel(comparisonRange.endDate)}`}
        </div>
      ) : null}
    </form>
  );
}
