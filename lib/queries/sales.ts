import { query } from "@/lib/db/client";
import { filterValues } from "@/lib/queries/common";
import { previousComparisonRange, type DashboardFilters } from "@/lib/utils/date";
import { toNumber } from "@/lib/utils/number";

export type SalesSummary = {
  volume: number;
  amount: number;
  orderItems: number;
  adOrderQuantity: number;
  adOrderRate: number;
  b2bVolume: number;
  b2bAmount: number;
  b2bOrderItems: number;
};

export type TrendPoint = {
  date: string;
  amount: number;
  adSalesAmount: number;
  b2bAmount: number;
  volume: number;
  orderItems: number;
  b2bOrderItems: number;
  b2bOrderRate: number;
  adOrderQuantity: number;
  adOrderRate: number;
  spend?: number;
  acos?: number;
  tacos?: number;
  grossProfit?: number;
  grossRate?: number;
};

export type RankingRow = {
  name: string;
  groupName?: string;
  amount: number;
  volume: number;
  orderItems: number;
  b2bOrderItems: number;
  b2bOrderRate: number;
  adOrderQuantity: number;
  adOrderRate: number;
  amountCompareRate?: number;
  volumeCompareRate?: number;
};

export type ProductLineDeclineRow = {
  productLineName: string;
  amount: number;
  previousAmount: number;
  amountDelta: number;
  amountCompareRate?: number;
  volume: number;
  previousVolume: number;
  volumeDelta: number;
  volumeCompareRate?: number;
  sessionsTotal: number;
  previousSessionsTotal: number;
  sessionsTotalCompareRate?: number;
  pageViewsTotal: number;
  previousPageViewsTotal: number;
  pageViewsTotalCompareRate?: number;
  impressions: number;
  previousImpressions: number;
  impressionsCompareRate?: number;
  ctr: number;
  previousCtr: number;
  ctrDelta: number;
  cvr: number;
  previousCvr: number;
  cvrDelta: number;
  adCvr: number;
  previousAdCvr: number;
  adCvrDelta: number;
  natureCvr: number;
  previousNatureCvr: number;
  natureCvrDelta: number;
};

export type OperatorProductLineDeclineRow = {
  principalUid: string;
  operatorName: string;
  groupName?: string;
  amount: number;
  previousAmount: number;
  amountDelta: number;
  amountCompareRate?: number;
  volume: number;
  previousVolume: number;
  volumeDelta: number;
  volumeCompareRate?: number;
  productLines: ProductLineDeclineRow[];
};

function compareRate(current: number, previous: number) {
  return previous ? (current - previous) / previous : undefined;
}

function declineScore(amountDelta: number, volumeDelta: number) {
  return amountDelta < 0 ? -amountDelta : volumeDelta < 0 ? -volumeDelta : 0;
}

export async function getSalesSummary(filters: DashboardFilters): Promise<SalesSummary> {
  const rows = await query<Record<string, string>>(
    `select
      coalesce(sum(volume), 0) as volume,
      coalesce(sum(amount), 0) as amount,
      coalesce(sum(order_items), 0) as order_items,
      coalesce(sum(ad_order_quantity), 0) as ad_order_quantity,
      coalesce(sum(ad_order_quantity)::numeric / nullif(sum(order_items), 0), 0) as ad_order_rate,
      coalesce(sum(b2b_volume), 0) as b2b_volume,
      coalesce(sum(b2b_amount), 0) as b2b_amount,
      coalesce(sum(b2b_order_items), 0) as b2b_order_items
    from fact_operator_daily_metrics
    where stat_date between $1 and $2
      and ($3::text is null or group_name = $3)
      and ($4::bigint is null or principal_uid = $4)`,
    filterValues(filters),
  );
  const row = rows[0] ?? {};
  return {
    volume: toNumber(row.volume),
    amount: toNumber(row.amount),
    orderItems: toNumber(row.order_items),
    adOrderQuantity: toNumber(row.ad_order_quantity),
    adOrderRate: toNumber(row.ad_order_rate),
    b2bVolume: toNumber(row.b2b_volume),
    b2bAmount: toNumber(row.b2b_amount),
    b2bOrderItems: toNumber(row.b2b_order_items),
  };
}

export async function getSalesTrend(filters: DashboardFilters): Promise<TrendPoint[]> {
  const rows = await query<Record<string, string>>(
    `select
      stat_date::text as date,
      coalesce(sum(amount), 0) as amount,
      coalesce(sum(ad_sales_amount), 0) as ad_sales_amount,
      coalesce(sum(b2b_amount), 0) as b2b_amount,
      coalesce(sum(volume), 0) as volume,
      coalesce(sum(order_items), 0) as order_items,
      coalesce(sum(b2b_order_items), 0) as b2b_order_items,
      coalesce(sum(b2b_order_items)::numeric / nullif(sum(order_items), 0), 0) as b2b_order_rate,
      coalesce(sum(ad_order_quantity), 0) as ad_order_quantity,
      coalesce(sum(ad_order_quantity)::numeric / nullif(sum(order_items), 0), 0) as ad_order_rate
    from fact_operator_daily_metrics
    where stat_date between $1 and $2
      and ($3::text is null or group_name = $3)
      and ($4::bigint is null or principal_uid = $4)
    group by stat_date
    order by stat_date`,
    filterValues(filters),
  );

  return rows.map((row) => ({
    date: row.date,
    amount: toNumber(row.amount),
    adSalesAmount: toNumber(row.ad_sales_amount),
    b2bAmount: toNumber(row.b2b_amount),
    volume: toNumber(row.volume),
    orderItems: toNumber(row.order_items),
    b2bOrderItems: toNumber(row.b2b_order_items),
    b2bOrderRate: toNumber(row.b2b_order_rate),
    adOrderQuantity: toNumber(row.ad_order_quantity),
    adOrderRate: toNumber(row.ad_order_rate),
  }));
}

export async function getSalesRankings(filters: DashboardFilters, by: "group" | "operator"): Promise<RankingRow[]> {
  const previous = previousComparisonRange(filters);
  const nameExpr = by === "group" ? "group_name" : "operator_name";
  const groupBy = by === "group" ? "group_name" : "operator_name, group_name";
  const rows = await query<Record<string, string>>(
    `with current_period as (
      select
        ${nameExpr} as name,
        max(group_name) as group_name,
        coalesce(sum(amount), 0) as amount,
        coalesce(sum(volume), 0) as volume,
        coalesce(sum(order_items), 0) as order_items,
        coalesce(sum(b2b_order_items), 0) as b2b_order_items,
        coalesce(sum(b2b_order_items)::numeric / nullif(sum(order_items), 0), 0) as b2b_order_rate,
        coalesce(sum(ad_order_quantity), 0) as ad_order_quantity,
        coalesce(sum(ad_order_quantity)::numeric / nullif(sum(order_items), 0), 0) as ad_order_rate
      from fact_operator_daily_metrics
      where stat_date between $1 and $2
        and ($3::text is null or group_name = $3)
        and ($4::bigint is null or principal_uid = $4)
      group by ${groupBy}
    ),
    previous_period as (
      select
        ${nameExpr} as name,
        max(group_name) as group_name,
        coalesce(sum(amount), 0) as previous_amount,
        coalesce(sum(volume), 0) as previous_volume
      from fact_operator_daily_metrics
      where stat_date between $5 and $6
        and ($3::text is null or group_name = $3)
        and ($4::bigint is null or principal_uid = $4)
      group by ${groupBy}
    )
    select
      current_period.*,
      case
        when previous_period.previous_amount is null or previous_period.previous_amount = 0 then null
        else (current_period.amount - previous_period.previous_amount) / previous_period.previous_amount
      end as amount_compare_rate,
      case
        when previous_period.previous_volume is null or previous_period.previous_volume = 0 then null
        else (current_period.volume - previous_period.previous_volume)::numeric / previous_period.previous_volume
      end as volume_compare_rate
    from current_period
    left join previous_period
      on previous_period.name = current_period.name
      and previous_period.group_name = current_period.group_name
    order by current_period.amount desc
    ${by === "group" ? "limit 10" : ""}`,
    [...filterValues(filters), previous.startDate, previous.endDate],
  );

  return rows.map((row) => ({
    name: row.name,
    groupName: row.group_name,
    amount: toNumber(row.amount),
    volume: toNumber(row.volume),
    orderItems: toNumber(row.order_items),
    b2bOrderItems: toNumber(row.b2b_order_items),
    b2bOrderRate: toNumber(row.b2b_order_rate),
    adOrderQuantity: toNumber(row.ad_order_quantity),
    adOrderRate: toNumber(row.ad_order_rate),
    amountCompareRate: row.amount_compare_rate === null || row.amount_compare_rate === undefined ? undefined : toNumber(row.amount_compare_rate),
    volumeCompareRate: row.volume_compare_rate === null || row.volume_compare_rate === undefined ? undefined : toNumber(row.volume_compare_rate),
  }));
}

export async function getOperatorProductLineDeclines(filters: DashboardFilters): Promise<OperatorProductLineDeclineRow[]> {
  const previous = previousComparisonRange(filters);
  const rows = await query<Record<string, string>>(
    `with current_period as (
      select
        principal_uid,
        max(operator_name) as operator_name,
        max(group_name) as group_name,
        product_line_name,
        coalesce(sum(amount), 0) as amount,
        coalesce(sum(volume), 0) as volume,
        coalesce(sum(sessions_total), 0) as sessions_total,
        coalesce(sum(page_views_total), 0) as page_views_total,
        coalesce(sum(impressions), 0) as impressions,
        coalesce(sum(clicks), 0) as clicks,
        coalesce(sum(order_items)::numeric / nullif(sum(sessions_total), 0), 0) as cvr,
        coalesce(sum(clicks)::numeric / nullif(sum(impressions), 0), 0) as ctr,
        coalesce(sum(ad_order_quantity)::numeric / nullif(sum(clicks), 0), 0) as ad_cvr,
        coalesce(sum(nature_order_items)::numeric / nullif(sum(nature_click), 0), 0) as nature_cvr
      from fact_product_line_daily_metrics
      where stat_date between $1 and $2
        and ($3::text is null or group_name = $3)
        and ($4::bigint is null or principal_uid = $4)
        and product_line_name is not null
      group by principal_uid, product_line_name
    ),
    previous_period as (
      select
        principal_uid,
        max(operator_name) as operator_name,
        max(group_name) as group_name,
        product_line_name,
        coalesce(sum(amount), 0) as previous_amount,
        coalesce(sum(volume), 0) as previous_volume,
        coalesce(sum(sessions_total), 0) as previous_sessions_total,
        coalesce(sum(page_views_total), 0) as previous_page_views_total,
        coalesce(sum(impressions), 0) as previous_impressions,
        coalesce(sum(clicks), 0) as previous_clicks,
        coalesce(sum(order_items)::numeric / nullif(sum(sessions_total), 0), 0) as previous_cvr,
        coalesce(sum(clicks)::numeric / nullif(sum(impressions), 0), 0) as previous_ctr,
        coalesce(sum(ad_order_quantity)::numeric / nullif(sum(clicks), 0), 0) as previous_ad_cvr,
        coalesce(sum(nature_order_items)::numeric / nullif(sum(nature_click), 0), 0) as previous_nature_cvr
      from fact_product_line_daily_metrics
      where stat_date between $5 and $6
        and ($3::text is null or group_name = $3)
        and ($4::bigint is null or principal_uid = $4)
        and product_line_name is not null
      group by principal_uid, product_line_name
    )
    select
      coalesce(current_period.principal_uid, previous_period.principal_uid)::text as principal_uid,
      coalesce(current_period.operator_name, previous_period.operator_name) as operator_name,
      coalesce(current_period.group_name, previous_period.group_name) as group_name,
      coalesce(current_period.product_line_name, previous_period.product_line_name) as product_line_name,
      coalesce(current_period.amount, 0) as amount,
      coalesce(previous_period.previous_amount, 0) as previous_amount,
      coalesce(current_period.volume, 0) as volume,
      coalesce(previous_period.previous_volume, 0) as previous_volume,
      coalesce(current_period.sessions_total, 0) as sessions_total,
      coalesce(previous_period.previous_sessions_total, 0) as previous_sessions_total,
      coalesce(current_period.page_views_total, 0) as page_views_total,
      coalesce(previous_period.previous_page_views_total, 0) as previous_page_views_total,
      coalesce(current_period.impressions, 0) as impressions,
      coalesce(previous_period.previous_impressions, 0) as previous_impressions,
      coalesce(current_period.ctr, 0) as ctr,
      coalesce(previous_period.previous_ctr, 0) as previous_ctr,
      coalesce(current_period.cvr, 0) as cvr,
      coalesce(previous_period.previous_cvr, 0) as previous_cvr,
      coalesce(current_period.ad_cvr, 0) as ad_cvr,
      coalesce(previous_period.previous_ad_cvr, 0) as previous_ad_cvr,
      coalesce(current_period.nature_cvr, 0) as nature_cvr,
      coalesce(previous_period.previous_nature_cvr, 0) as previous_nature_cvr
    from current_period
    full join previous_period
      on previous_period.principal_uid = current_period.principal_uid
      and previous_period.product_line_name = current_period.product_line_name`,
    [...filterValues(filters), previous.startDate, previous.endDate],
  );

  const operators = new Map<string, Omit<OperatorProductLineDeclineRow, "productLines"> & { productLines: ProductLineDeclineRow[] }>();

  rows.forEach((row) => {
    const principalUid = row.principal_uid;
    const amount = toNumber(row.amount);
    const previousAmount = toNumber(row.previous_amount);
    const volume = toNumber(row.volume);
    const previousVolume = toNumber(row.previous_volume);
    const sessionsTotal = toNumber(row.sessions_total);
    const previousSessionsTotal = toNumber(row.previous_sessions_total);
    const pageViewsTotal = toNumber(row.page_views_total);
    const previousPageViewsTotal = toNumber(row.previous_page_views_total);
    const impressions = toNumber(row.impressions);
    const previousImpressions = toNumber(row.previous_impressions);
    const ctr = toNumber(row.ctr);
    const previousCtr = toNumber(row.previous_ctr);
    const cvr = toNumber(row.cvr);
    const previousCvr = toNumber(row.previous_cvr);
    const adCvr = toNumber(row.ad_cvr);
    const previousAdCvr = toNumber(row.previous_ad_cvr);
    const natureCvr = toNumber(row.nature_cvr);
    const previousNatureCvr = toNumber(row.previous_nature_cvr);
    const operator = operators.get(principalUid) ?? {
      principalUid,
      operatorName: row.operator_name,
      groupName: row.group_name,
      amount: 0,
      previousAmount: 0,
      amountDelta: 0,
      amountCompareRate: undefined,
      volume: 0,
      previousVolume: 0,
      volumeDelta: 0,
      volumeCompareRate: undefined,
      productLines: [],
    };

    operator.amount += amount;
    operator.previousAmount += previousAmount;
    operator.volume += volume;
    operator.previousVolume += previousVolume;
    operator.productLines.push({
      productLineName: row.product_line_name,
      amount,
      previousAmount,
      amountDelta: amount - previousAmount,
      amountCompareRate: compareRate(amount, previousAmount),
      volume,
      previousVolume,
      volumeDelta: volume - previousVolume,
      volumeCompareRate: compareRate(volume, previousVolume),
      sessionsTotal,
      previousSessionsTotal,
      sessionsTotalCompareRate: compareRate(sessionsTotal, previousSessionsTotal),
      pageViewsTotal,
      previousPageViewsTotal,
      pageViewsTotalCompareRate: compareRate(pageViewsTotal, previousPageViewsTotal),
      impressions,
      previousImpressions,
      impressionsCompareRate: compareRate(impressions, previousImpressions),
      ctr,
      previousCtr,
      ctrDelta: ctr - previousCtr,
      cvr,
      previousCvr,
      cvrDelta: cvr - previousCvr,
      adCvr,
      previousAdCvr,
      adCvrDelta: adCvr - previousAdCvr,
      natureCvr,
      previousNatureCvr,
      natureCvrDelta: natureCvr - previousNatureCvr,
    });

    operators.set(principalUid, operator);
  });

  return Array.from(operators.values())
    .map((operator) => {
      const amountDelta = operator.amount - operator.previousAmount;
      const volumeDelta = operator.volume - operator.previousVolume;
      const productLines = operator.productLines
        .filter((row) => row.amountDelta < 0 || row.volumeDelta < 0)
        .sort((a, b) => declineScore(b.amountDelta, b.volumeDelta) - declineScore(a.amountDelta, a.volumeDelta))
        .slice(0, 5);

      return {
        ...operator,
        amountDelta,
        amountCompareRate: compareRate(operator.amount, operator.previousAmount),
        volumeDelta,
        volumeCompareRate: compareRate(operator.volume, operator.previousVolume),
        productLines,
      };
    })
    .filter((operator) => (operator.amountDelta < 0 || operator.volumeDelta < 0) && operator.productLines.length)
    .sort((a, b) => declineScore(b.amountDelta, b.volumeDelta) - declineScore(a.amountDelta, a.volumeDelta))
    .slice(0, 8);
}
