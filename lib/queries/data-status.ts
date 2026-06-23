import { query } from "@/lib/db/client";

export type DataStatus = {
  dailyMaxDate?: string;
  profitMaxDate?: string;
  targetMaxMonth?: string;
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
  tableCounts: Array<{ tableName: string; rows: number }>;
};

export async function getDataStatus(): Promise<DataStatus> {
  const [dates] = await query<Record<string, string>>(
    `select
      (select max(stat_date)::text from fact_operator_daily_metrics) as daily_max_date,
      (select max(settlement_date)::text from fact_settlement_profit) as profit_max_date,
      (select max(target_month)::text from fact_operator_monthly_target) as target_max_month`,
  );
  const latestRuns = await query<Record<string, string>>(
    `select
      id::int,
      task_name,
      status,
      coalesce(total_operator_count, 0)::int as total_operator_count,
      coalesce(success_count, 0)::int as success_count,
      coalesce(fail_count, 0)::int as fail_count,
      error_message,
      started_at::text,
      finished_at::text
    from crawl_run
    order by coalesce(finished_at, started_at) desc nulls last, id desc
    limit 1`,
  );

  const counts = await Promise.all(
    ["dim_operator", "fact_operator_daily_metrics", "fact_settlement_profit", "fact_operator_monthly_target", "crawl_run"].map(
      async (tableName) => {
        const rows = await query<{ count: number }>(`select count(*)::int as count from ${tableName}`);
        return { tableName, rows: rows[0]?.count ?? 0 };
      },
    ),
  );

  const latest = latestRuns[0];
  return {
    dailyMaxDate: dates?.daily_max_date,
    profitMaxDate: dates?.profit_max_date,
    targetMaxMonth: dates?.target_max_month,
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
    tableCounts: counts,
  };
}
