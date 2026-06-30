"use client";

import type { ProductLineFilterOptions } from "@/lib/queries/product-lines";
import type { DashboardFilters } from "@/lib/utils/date";
import { Filter } from "lucide-react";
import { useMemo, useState } from "react";

export function ProductLineFilters({ filters, options }: { filters: DashboardFilters; options: ProductLineFilterOptions }) {
  const [groupName, setGroupName] = useState(filters.groupName ?? "");
  const [principalUid, setPrincipalUid] = useState(filters.principalUid ?? "");
  const [productLineName, setProductLineName] = useState(filters.productLineName ?? "");
  const [cid, setCid] = useState(filters.cid ?? "");

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

  function updateGroupName(value: string) {
    setGroupName(value);
    setPrincipalUid("");
    setProductLineName("");
    setCid("");
  }

  function updatePrincipalUid(value: string) {
    setPrincipalUid(value);
    setProductLineName("");
    setCid("");
  }

  function updateProductLineName(value: string) {
    setProductLineName(value);
    setCid("");
  }

  return (
    <form className="mb-5 grid gap-3 border-b border-line bg-white p-4 shadow-panel md:grid-cols-[repeat(6,minmax(0,1fr))_auto]">
      <label className="space-y-1 text-xs text-muted">
        <span>开始日期</span>
        <input className="h-10 w-full border border-line px-3 text-sm text-ink" name="startDate" type="date" defaultValue={filters.startDate} />
      </label>
      <label className="space-y-1 text-xs text-muted">
        <span>结束日期</span>
        <input className="h-10 w-full border border-line px-3 text-sm text-ink" name="endDate" type="date" defaultValue={filters.endDate} />
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
        <span>品线名称</span>
        <select
          className="h-10 w-full border border-line px-3 text-sm text-ink"
          name="productLineName"
          value={productLineName}
          onChange={(event) => updateProductLineName(event.target.value)}
        >
          <option value="">全部品线</option>
          {lineNames.map((lineName) => (
            <option key={lineName} value={lineName}>
              {lineName}
            </option>
          ))}
        </select>
      </label>
      <label className="space-y-1 text-xs text-muted">
        <span>品线 ID</span>
        <select
          className="h-10 w-full border border-line px-3 text-sm text-ink disabled:bg-slate-50 disabled:text-muted"
          disabled={!principalUid}
          name="cid"
          value={cid}
          onChange={(event) => setCid(event.target.value)}
        >
          <option value="">{principalUid ? "全部 ID" : "先选择运营"}</option>
          {productLines
            .filter((line) => !productLineName || line.productLineName === productLineName)
            .map((line) => (
              <option key={`${line.principalUid}-${line.cid}`} value={line.cid}>
                {line.productLineName} / {line.cid}
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
