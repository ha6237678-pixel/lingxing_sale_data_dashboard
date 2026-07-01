import { AppShell } from "@/components/dashboard/app-shell";
import { MetricCard } from "@/components/dashboard/metric-card";
import { SectionTitle } from "@/components/dashboard/section-title";
import { ErrorState } from "@/components/states/error-state";
import { getDataStatus } from "@/lib/queries/data-status";
import { displayError } from "@/lib/services/errors";
import { formatNumber } from "@/lib/utils/number";

export default async function DataStatusPage() {
  try {
    const status = await getDataStatus();

    return (
      <AppShell>
        <SectionTitle title="数据库状态" description="确认数据库所有表的最新日期、表行数和最近一次采集结果。" />

        <div className="grid gap-3 md:grid-cols-4">
          <MetricCard label="最近采集状态" value={status.latestRun?.status ?? "-"} />
          <MetricCard label="最近采集任务" value={status.latestRun?.taskName ?? "-"} />
          <MetricCard label="采集开始时间" value={status.latestRun?.startedAt ?? "-"} />
          <MetricCard label="采集完成时间" value={status.latestRun?.finishedAt ?? "-"} />
        </div>

        {status.latestRun?.errorMessage ? (
          <div className="mt-5 border border-amber-300 bg-amber-50 p-4 text-sm text-amber-900">{status.latestRun.errorMessage}</div>
        ) : null}

        <section className="mt-5 border border-line bg-white shadow-panel">
          <div className="border-b border-line px-4 py-3 text-sm font-semibold text-ink">数据库表状态</div>
          <div className="overflow-x-auto scrollbar-thin">
            <table className="w-full min-w-[900px] table-auto text-left text-sm">
              <thead className="bg-slate-50 text-xs text-muted">
                <tr>
                  <th className="whitespace-nowrap px-4 py-3">表名</th>
                  <th className="whitespace-nowrap px-4 py-3">中文名称</th>
                  <th className="whitespace-nowrap px-4 py-3">日期口径</th>
                  <th className="whitespace-nowrap px-4 py-3">最新日期状态</th>
                  <th className="whitespace-nowrap px-4 py-3 text-right">表行数</th>
                  <th className="whitespace-nowrap px-4 py-3 text-right">采集成功数量</th>
                  <th className="whitespace-nowrap px-4 py-3 text-right">采集失败数量</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-line">
                {status.tableStatuses.map((row) => (
                  <tr key={row.tableName} className="hover:bg-slate-50">
                    <td className="whitespace-nowrap px-4 py-3 font-medium text-ink">{row.tableName}</td>
                    <td className="whitespace-nowrap px-4 py-3">{row.displayName}</td>
                    <td className="whitespace-nowrap px-4 py-3 text-muted">{row.dateLabel}</td>
                    <td className="whitespace-nowrap px-4 py-3">{row.latestDate ?? "-"}</td>
                    <td className="whitespace-nowrap px-4 py-3 text-right">{formatNumber(row.rows)}</td>
                    <td className="whitespace-nowrap px-4 py-3 text-right">
                      {row.successCount === undefined ? "-" : formatNumber(row.successCount)}
                    </td>
                    <td className="whitespace-nowrap px-4 py-3 text-right">
                      {row.failCount === undefined ? "-" : formatNumber(row.failCount)}
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
          <div className="border-t border-line bg-slate-50 px-4 py-3 text-xs leading-5 text-muted">
            说明：采集失败表示某个运营或品线的 ID 对应不到数据，不是指某一天采集不到数据；这种情况可能出现在该运营处于交接中。
          </div>
        </section>
      </AppShell>
    );
  } catch (error) {
    return (
      <AppShell>
        <SectionTitle title="数据库状态" />
        <ErrorState message={displayError(error)} />
      </AppShell>
    );
  }
}
