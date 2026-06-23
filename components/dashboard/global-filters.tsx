import type { FilterOptions } from "@/lib/queries/common";
import type { DashboardFilters } from "@/lib/utils/date";
import { Filter } from "lucide-react";

export function GlobalFilters({ filters, options }: { filters: DashboardFilters; options: FilterOptions }) {
  const operators = filters.groupName
    ? options.operators.filter((operator) => operator.groupName === filters.groupName)
    : options.operators;

  return (
    <form className="mb-5 grid gap-3 border-b border-line bg-white p-4 shadow-panel md:grid-cols-[repeat(4,minmax(0,1fr))_auto]">
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
        <select className="h-10 w-full border border-line px-3 text-sm text-ink" name="groupName" defaultValue={filters.groupName ?? ""}>
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
        <select className="h-10 w-full border border-line px-3 text-sm text-ink" name="principalUid" defaultValue={filters.principalUid ?? ""}>
          <option value="">全部运营</option>
          {operators.map((operator) => (
            <option key={operator.principalUid} value={operator.principalUid}>
              {operator.operatorName}
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
