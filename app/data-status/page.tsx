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
        <SectionTitle title="数据状态与采集日志" description="确认最新数据日期、表行数和最近一次采集结果。" />
        <div className="grid gap-3 md:grid-cols-4">
          <MetricCard label="销售/广告最新日期" value={status.dailyMaxDate ?? "-"} />
          <MetricCard label="利润最新日期" value={status.profitMaxDate ?? "-"} />
          <MetricCard label="目标最新月份" value={status.targetMaxMonth ?? "-"} />
          <MetricCard label="最近采集状态" value={status.latestRun?.status ?? "-"} />
          <MetricCard label="采集成功运营数" value={formatNumber(status.latestRun?.successCount ?? 0)} />
          <MetricCard label="采集失败运营数" value={formatNumber(status.latestRun?.failCount ?? 0)} />
          <MetricCard label="采集开始时间" value={status.latestRun?.startedAt ?? "-"} />
          <MetricCard label="采集完成时间" value={status.latestRun?.finishedAt ?? "-"} />
        </div>
        {status.latestRun?.errorMessage ? (
          <div className="mt-5 border border-amber-300 bg-amber-50 p-4 text-sm text-amber-900">{status.latestRun.errorMessage}</div>
        ) : null}
        <section className="mt-5 border border-line bg-white shadow-panel">
          <div className="border-b border-line px-4 py-3 text-sm font-semibold text-ink">核心表行数</div>
          <div className="grid gap-0 md:grid-cols-5">
            {status.tableCounts.map((row) => (
              <div key={row.tableName} className="border-b border-r border-line p-4">
                <div className="text-xs text-muted">{row.tableName}</div>
                <div className="mt-2 text-xl font-semibold">{formatNumber(row.rows)}</div>
              </div>
            ))}
          </div>
        </section>
      </AppShell>
    );
  } catch (error) {
    return (
      <AppShell>
        <SectionTitle title="数据状态与采集日志" />
        <ErrorState message={displayError(error)} />
      </AppShell>
    );
  }
}
