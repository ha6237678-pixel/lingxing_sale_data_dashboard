import type { OperatorProductLineDeclineRow } from "@/lib/queries/sales";
import { formatMoney, formatNumber, formatPercent } from "@/lib/utils/number";
import { Fragment, type ReactElement } from "react";

type DeclineLine = OperatorProductLineDeclineRow["productLines"][number];
type ReasonItem = ReactElement | string;
type CauseLine = {
  items: ReasonItem[];
  label: string;
};

const RATE_THRESHOLD = -0.03;
const POINT_THRESHOLD = -0.005;

function deltaClassName(value: number) {
  if (value === 0) return "text-ink";

  return value > 0 ? "text-emerald-700" : "text-coral";
}

function deltaArrow(value: number) {
  if (value === 0) return "";

  return value > 0 ? "↑" : "↓";
}

function DeltaValue({ formatter, value }: { formatter: (value: number) => string; value: number }) {
  return <span className={`font-medium ${deltaClassName(value)}`}>{`${deltaArrow(value)}${formatter(Math.abs(value))}`}</span>;
}

function isCauseLine(value: CauseLine | undefined): value is CauseLine {
  return value !== undefined;
}

function isReasonItem<T extends ReasonItem>(value: T | undefined): value is T {
  return value !== undefined;
}

function metricReason(label: string, value: number | undefined) {
  if (value === undefined) return undefined;

  return (
    <span>
      {label} <DeltaValue value={value} formatter={formatPercent} />
    </span>
  );
}

function pointReason(label: string, value: number) {
  return (
    <span>
      {label} <DeltaValue value={value} formatter={formatPercent} />
    </span>
  );
}

function lineCauses(line: DeclineLine): CauseLine[] {
  const trafficReasons = [
    line.sessionsTotalCompareRate !== undefined && line.sessionsTotalCompareRate < RATE_THRESHOLD
      ? metricReason("Session", line.sessionsTotalCompareRate)
      : undefined,
    line.pageViewsTotalCompareRate !== undefined && line.pageViewsTotalCompareRate < RATE_THRESHOLD
      ? metricReason("PV", line.pageViewsTotalCompareRate)
      : undefined,
    line.impressionsCompareRate !== undefined && line.impressionsCompareRate < RATE_THRESHOLD
      ? metricReason("展示", line.impressionsCompareRate)
      : undefined,
  ].filter(isReasonItem);

  const precisionReasons: ReasonItem[] = line.ctrDelta < POINT_THRESHOLD ? [pointReason("广告 CTR", line.ctrDelta)] : [];

  const conversionReasons = [
    line.cvrDelta < POINT_THRESHOLD ? pointReason("CVR", line.cvrDelta) : undefined,
    line.adCvrDelta < POINT_THRESHOLD ? pointReason("广告 CVR", line.adCvrDelta) : undefined,
    line.natureCvrDelta < POINT_THRESHOLD ? pointReason("自然 CVR", line.natureCvrDelta) : undefined,
  ].filter(isReasonItem);
  const causes = [
    trafficReasons.length ? { items: trafficReasons, label: "流量下滑" } : undefined,
    precisionReasons.length ? { items: precisionReasons, label: "流量精准度下降" } : undefined,
    conversionReasons.length ? { items: conversionReasons, label: "转化率下降" } : undefined,
  ].filter(isCauseLine);

  return causes.length ? causes : [{ items: ["暂未命中流量下滑、流量精准度或转化率下降"], label: "" }];
}

function MetricWithCompare({
  compareValue,
  value,
  valueFormatter,
}: {
  compareValue: number | undefined;
  value: number;
  valueFormatter: (value: number) => string;
}) {
  return (
    <div className="leading-5">
      <div className="font-medium text-ink">{valueFormatter(value)}</div>
      <div className="text-xs">{compareValue === undefined ? "-" : <DeltaValue value={compareValue} formatter={formatPercent} />}</div>
    </div>
  );
}

function CauseSummary({ causes }: { causes: CauseLine[] }) {
  return (
    <div className="space-y-1 leading-5 text-ink">
      {causes.map((cause) => (
        <div key={cause.label || "none"}>
          {cause.label ? <span className="font-medium">{cause.label}：</span> : null}
          <span>
            {cause.items.map((item, index) => (
              <span key={index}>
                {index > 0 ? "，" : null}
                {item}
              </span>
            ))}
          </span>
        </div>
      ))}
    </div>
  );
}

export function OperatorProductLineDeclinePanel({ rows }: { rows: OperatorProductLineDeclineRow[] }) {
  const productLineCount = rows.reduce((sum, row) => sum + row.productLines.length, 0);

  return (
    <section className="border border-line bg-white shadow-panel">
      <div className="border-b border-line bg-[#6fa3d6] px-4 py-3">
        <div className="flex flex-col gap-2 md:flex-row md:items-center md:justify-between">
          <div>
            <div className="text-sm font-semibold text-ink">异常监控</div>
            <div className="mt-1 text-xs text-ink">定位销售额或销量异常的运营及主要品线，并展示流量、精准度、转化率中的异常项。</div>
          </div>
          <div className="flex gap-2 text-xs text-ink">
            <span className="border border-blue-300 bg-white/50 px-2 py-1">异常运营 {rows.length}</span>
            <span className="border border-blue-300 bg-white/50 px-2 py-1">异常品线 {productLineCount}</span>
          </div>
        </div>
      </div>
      {rows.length ? (
        <div className="overflow-x-auto px-3 py-3 scrollbar-thin">
          <table className="w-full table-fixed text-left text-sm">
            <colgroup>
              <col className="w-[10%]" />
              <col className="w-[20%]" />
              <col className="w-[15%]" />
              <col className="w-[12%]" />
              <col className="w-[43%]" />
            </colgroup>
            <thead className="bg-slate-50 text-xs text-ink">
              <tr>
                <th className="whitespace-nowrap px-3 py-2">运营</th>
                <th className="whitespace-nowrap px-3 py-2 text-center">异常品线</th>
                <th className="whitespace-nowrap px-3 py-2 text-center">销售额</th>
                <th className="whitespace-nowrap px-3 py-2 text-center">销量</th>
                <th className="px-3 py-2">异常原因</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-line">
              {rows.map((operator) => (
                <Fragment key={operator.principalUid}>
                  {operator.productLines.map((line, index) => (
                    <tr key={`${operator.principalUid}-${line.productLineName}`} className="hover:bg-slate-50">
                      {index === 0 ? (
                        <td className="whitespace-nowrap px-3 py-2.5 align-middle" rowSpan={operator.productLines.length}>
                          <div className="font-medium text-ink">{operator.operatorName}</div>
                          <div className="mt-0.5 text-xs text-ink">{operator.groupName || "-"}</div>
                        </td>
                      ) : null}
                      <td className="whitespace-nowrap px-3 py-2.5 text-center align-middle font-medium text-ink">{line.productLineName}</td>
                      <td className="whitespace-nowrap px-3 py-2.5 text-center align-middle">
                        <MetricWithCompare compareValue={line.amountCompareRate} value={line.amount} valueFormatter={formatMoney} />
                      </td>
                      <td className="whitespace-nowrap px-3 py-2.5 text-center align-middle">
                        <MetricWithCompare compareValue={line.volumeCompareRate} value={line.volume} valueFormatter={formatNumber} />
                      </td>
                      <td className="px-3 py-2.5 align-middle">
                        <CauseSummary causes={lineCauses(line)} />
                      </td>
                    </tr>
                  ))}
                </Fragment>
              ))}
            </tbody>
          </table>
        </div>
      ) : (
        <div className="px-4 py-8 text-center text-sm text-muted">当前筛选范围内暂无销售额或销量下降的运营。</div>
      )}
    </section>
  );
}
