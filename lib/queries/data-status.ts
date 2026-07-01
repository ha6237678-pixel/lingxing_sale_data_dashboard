import { query } from "@/lib/db/client";

const tableStatusConfigs = [
  { tableName: "crawl_run", displayName: "数据采集日志", dateColumn: "finished_at", dateLabel: "完成时间" },
  { tableName: "dim_operator", displayName: "运营id映射表", dateColumn: "updated_at", dateLabel: "更新时间" },
  { tableName: "dim_product_line", displayName: "运营-品线映射表", dateColumn: "updated_at", dateLabel: "更新时间" },
  { tableName: "fact_operator_monthly_target", displayName: "运营月度目标", dateColumn: "target_month", dateLabel: "最新月份" },
  { tableName: "fact_product_line_monthly_target", displayName: "品线月度目标", dateColumn: "target_month", dateLabel: "最新月份" },
  { tableName: "fact_operator_daily_metrics", displayName: "运营产品表现", dateColumn: "stat_date", dateLabel: "最新日期" },
  { tableName: "fact_settlement_profit", displayName: "运营结算利润", dateColumn: "settlement_date", dateLabel: "最新日期" },
  { tableName: "fact_product_line_daily_metrics", displayName: "品线产品表现", dateColumn: "stat_date", dateLabel: "最新日期" },
  { tableName: "fact_product_line_settlement_profit", displayName: "品线结算利润", dateColumn: "settlement_date", dateLabel: "最新日期" },
] as const;

const crawlTaskByTable: Record<string, string> = {
  fact_operator_daily_metrics: "lingxing_product_performance",
  fact_product_line_daily_metrics: "lingxing_product_line_performance",
  fact_settlement_profit: "lingxing_settlement_profit",
  fact_product_line_settlement_profit: "lingxing_product_line_settlement_profit",
};

export type TableStatusRow = {
  tableName: string;
  displayName: string;
  dateLabel: string;
  latestDate?: string;
  rows: number;
  successCount?: number;
  failCount?: number;
};

export type DataStatus = {
  latestRun?: {
    id: number;
    taskName: string;
    status: string;
    totalOperatorCount: number;
    successCount: number;
    failCount: number;
    errorMessage?: string;
    startedAt?: string;
    finishedAt?: string;
  };
  tableStatuses: TableStatusRow[];
};

function formatDateSql(tableName: string, dateColumn: string) {
  if (dateColumn.endsWith("_at")) {
    return `to_char(max(${dateColumn}), 'YYYY-MM-DD HH24:MI')`;
  }

  return `max(${dateColumn})::text`;
}

export async function getDataStatus(): Promise<DataStatus> {
  const latestRuns = await query<Record<string, string>>(
    `select
      id::int,
      task_name,
      status,
      coalesce(total_operator_count, 0)::int as total_operator_count,
      coalesce(success_count, 0)::int as success_count,
      coalesce(fail_count, 0)::int as fail_count,
      error_message,
      to_char(started_at, 'YYYY-MM-DD HH24:MI') as started_at,
      to_char(finished_at, 'YYYY-MM-DD HH24:MI') as finished_at
    from crawl_run
    order by coalesce(finished_at, started_at) desc nulls last, id desc
    limit 1`,
  );

  const tableStatuses = await Promise.all(
    tableStatusConfigs.map(async (config) => {
      const rows = await query<{ row_count: number; latest_date: string | null }>(
        `select count(*)::int as row_count, ${formatDateSql(config.tableName, config.dateColumn)} as latest_date from ${config.tableName}`,
      );
      const crawlTaskName = crawlTaskByTable[config.tableName];
      const latestTaskRuns = crawlTaskName
        ? await query<Record<string, string>>(
            `select coalesce(success_count, 0)::int as success_count, coalesce(fail_count, 0)::int as fail_count
             from crawl_run
             where task_name = $1
             order by coalesce(finished_at, started_at) desc nulls last, id desc
             limit 1`,
            [crawlTaskName],
          )
        : [];

      return {
        tableName: config.tableName,
        displayName: config.displayName,
        dateLabel: config.dateLabel,
        latestDate: rows[0]?.latest_date ?? undefined,
        rows: rows[0]?.row_count ?? 0,
        successCount: latestTaskRuns[0] ? Number(latestTaskRuns[0].success_count) : undefined,
        failCount: latestTaskRuns[0] ? Number(latestTaskRuns[0].fail_count) : undefined,
      };
    }),
  );

  const latest = latestRuns[0];
  return {
    latestRun: latest
      ? {
          id: Number(latest.id),
          taskName: latest.task_name,
          status: latest.status,
          totalOperatorCount: Number(latest.total_operator_count),
          successCount: Number(latest.success_count),
          failCount: Number(latest.fail_count),
          errorMessage: latest.error_message || undefined,
          startedAt: latest.started_at || undefined,
          finishedAt: latest.finished_at || undefined,
        }
      : undefined,
    tableStatuses,
  };
}
