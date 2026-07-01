"use client";

import type { ProductLineFilterOptions } from "@/lib/queries/product-lines";
import type { DashboardFilters } from "@/lib/utils/date";
import { Filter } from "lucide-react";
import { useMemo, useState } from "react";

function formatMonthValue(value: string) {
  return value.slice(0, 7);
}

function getMonthRange(value: string) {
  const [year, month] = value.split("-").map(Number);
  const start = new Date(year, month - 1, 1);
  const end = new Date(year, month, 0);
  const formatDate = (date: Date) => {
    const dateMonth = `${date.getMonth() + 1}`.padStart(2, "0");
    const day = `${date.getDate()}`.padStart(2, "0");

    return `${date.getFullYear()}-${dateMonth}-${day}`;
  };

  return {
    startDate: formatDate(start),
    endDate: formatDate(end),
  };
}

export function ProductLineTargetFilters({ filters, options }: { filters: DashboardFilters; options: ProductLineFilterOptions }) {
  const [month, setMonth] = useState(formatMonthValue(filters.startDate));
  const [range, setRange] = useState({ startDate: filters.startDate, endDate: filters.endDate });
  const [groupName, setGroupName] = useState(filters.groupName ?? "");
  const [principalUid, setPrincipalUid] = useState(filters.principalUid ?? "");
  const [productLineName, setProductLineName] = useState(filters.productLineName ?? "");

  const operators = useMemo(
    () => (groupName ? options.operators.filter((operator) => operator.groupName === groupName) : options.operators),
    [groupName, options.operators],
  );
  const productLines = useMemo(
    () =>
      options.productLines.filter((line) => {
        if (groupName && line.groupName !== groupName) return false;
        if (principalUid && line.principalUid !== principalUid) return false;
        return true;
      }),
    [groupName, options.productLines, principalUid],
  );
  const lineNames = Array.from(new Set(productLines.map((line) => line.productLineName))).sort((a, b) => a.localeCompare(b, "zh-Hans-CN"));

  function updateMonth(value: string) {
    setMonth(value);
    setRange(getMonthRange(value));
  }

  function updateGroupName(value: string) {
    setGroupName(value);
    setPrincipalUid("");
    setProductLineName("");
  }

  function updatePrincipalUid(value: string) {
    setPrincipalUid(value);
    setProductLineName("");
  }

  return (
    <form className="mb-5 grid gap-3 border-b border-line bg-white p-4 shadow-panel md:grid-cols-[repeat(4,minmax(0,1fr))_auto]">
      <label className="space-y-1 text-xs text-muted">
        <span>目标月份</span>
        <input className="h-10 w-full border border-line px-3 text-sm text-ink" type="month" value={month} onChange={(event) => updateMonth(event.target.value)} />
        <input name="startDate" type="hidden" value={range.startDate} />
        <input name="endDate" type="hidden" value={range.endDate} />
      </label>
      <label className="space-y-1 text-xs text-muted">
        <span>组别</span>
        <select className="h-10 w-full border border-line px-3 text-sm text-ink" name="groupName" value={groupName} onChange={(event) => updateGroupName(event.target.value)}>
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
          onChange={(event) => updatePrincipalUid(event.target.value)}
        >
          <option value="">全部运营</option>
          {operators.map((operator) => (
            <option key={operator.principalUid} value={operator.principalUid}>
              {operator.operatorName}
            </option>
          ))}
        </select>
      </label>
      <label className="space-y-1 text-xs text-muted">
        <span>品线</span>
        <select
          className="h-10 w-full border border-line px-3 text-sm text-ink"
          name="productLineName"
          value={productLineName}
          onChange={(event) => setProductLineName(event.target.value)}
        >
          <option value="">全部品线</option>
          {lineNames.map((lineName) => (
            <option key={lineName} value={lineName}>
              {lineName}
            </option>
          ))}
        </select>
      </label>
      <button className="mt-5 inline-flex h-10 items-center justify-center gap-2 bg-ink px-4 text-sm font-medium text-white hover:bg-slate-700" type="submit">
        <Filter className="h-4 w-4" />
        筛选
      </button>
    </form>
  );
}
