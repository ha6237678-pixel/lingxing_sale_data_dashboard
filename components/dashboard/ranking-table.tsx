import { formatMoney, formatNumber, formatPercent } from "@/lib/utils/number";

export type RankingTableRow = {
  name: string;
  groupName?: string;
  amount?: number;
  volume?: number;
  orderItems?: number;
  b2bOrderItems?: number;
  b2bOrderRate?: number;
  adOrderQuantity?: number;
  adOrderRate?: number;
  grossProfit?: number;
  amountCompareRate?: number;
  amountAverageDiff?: number;
  volumeCompareRate?: number;
  grossProfitCompareRate?: number;
};

function formatCompare(value: number | undefined) {
  if (value === undefined) return "-";
  const prefix = value > 0 ? "+" : "";

  return `${prefix}${formatPercent(value)}`;
}

function compareClassName(value: number | undefined) {
  if (value === undefined || value === 0) return "text-muted";
  return value > 0 ? "text-emerald-700" : "text-coral";
}

function moneyDiffClassName(value: number | undefined) {
  if (value === undefined || value === 0) return "text-muted";
  return value > 0 ? "text-emerald-700" : "text-coral";
}

export function RankingTable({
  title,
  rows,
  showAmountAverageDiff = false,
  variant = "sales",
  headerClassName = "",
}: {
  title: string;
  rows: RankingTableRow[];
  showAmountAverageDiff?: boolean;
  variant?: "sales" | "profit";
  headerClassName?: string;
}) {
  const isSales = variant === "sales";
  const emptyColSpan = isSales ? (showAmountAverageDiff ? 12 : 11) : 7;

  return (
    <section className="border border-line bg-white shadow-panel">
      <div className={`border-b border-line px-4 py-3 text-sm font-semibold text-ink ${headerClassName}`}>{title}</div>
      <div className="overflow-x-auto scrollbar-thin">
        <table className="w-full table-auto text-left text-sm">
          <thead className="bg-slate-50 text-xs text-muted">
            <tr>
              <th className="whitespace-nowrap px-4 py-3">名称</th>
              <th className="whitespace-nowrap px-4 py-3">组别</th>
              <th className="whitespace-nowrap px-4 py-3 text-right">销售额</th>
              <th className="whitespace-nowrap px-4 py-3 text-right">销售额环比</th>
              {isSales && showAmountAverageDiff ? <th className="whitespace-nowrap px-4 py-3 text-right">人均销售额差值</th> : null}
              <th className="whitespace-nowrap px-4 py-3 text-right">销量</th>
              {isSales ? <th className="whitespace-nowrap px-4 py-3 text-right">销量环比</th> : null}
              {isSales ? <th className="whitespace-nowrap px-4 py-3 text-right">订单量</th> : null}
              {isSales ? (
                <>
                  <th className="whitespace-nowrap px-4 py-3 text-right">B2B订单量</th>
                  <th className="whitespace-nowrap px-4 py-3 text-right">B2B订单占比</th>
                  <th className="whitespace-nowrap px-4 py-3 text-right">广告订单量</th>
                  <th className="whitespace-nowrap px-4 py-3 text-right">广告订单占比</th>
                </>
              ) : (
                <>
                  <th className="whitespace-nowrap px-4 py-3 text-right">毛利</th>
                  <th className="whitespace-nowrap px-4 py-3 text-right">毛利环比</th>
                </>
              )}
            </tr>
          </thead>
          <tbody className="divide-y divide-line">
            {rows.length ? (
              rows.map((row) => (
                <tr key={`${row.name}-${row.groupName ?? ""}`} className="hover:bg-slate-50">
                  <td className="whitespace-nowrap px-4 py-3 font-medium text-ink">{row.name}</td>
                  <td className="whitespace-nowrap px-4 py-3 text-muted">{row.groupName || "-"}</td>
                  <td className="whitespace-nowrap px-4 py-3 text-right">{row.amount === undefined ? "-" : formatMoney(row.amount)}</td>
                  <td className={`whitespace-nowrap px-4 py-3 text-right font-medium ${compareClassName(row.amountCompareRate)}`}>
                    {formatCompare(row.amountCompareRate)}
                  </td>
                  {isSales && showAmountAverageDiff ? (
                    <td className={`whitespace-nowrap px-4 py-3 text-right font-medium ${moneyDiffClassName(row.amountAverageDiff)}`}>
                      {row.amountAverageDiff === undefined ? "-" : formatMoney(row.amountAverageDiff)}
                    </td>
                  ) : null}
                  <td className="whitespace-nowrap px-4 py-3 text-right">{row.volume === undefined ? "-" : formatNumber(row.volume)}</td>
                  {isSales ? (
                    <td className={`whitespace-nowrap px-4 py-3 text-right font-medium ${compareClassName(row.volumeCompareRate)}`}>
                      {formatCompare(row.volumeCompareRate)}
                    </td>
                  ) : null}
                  {isSales ? (
                    <td className="whitespace-nowrap px-4 py-3 text-right">{row.orderItems === undefined ? "-" : formatNumber(row.orderItems)}</td>
                  ) : null}
                  {isSales ? (
                    <>
                      <td className="whitespace-nowrap px-4 py-3 text-right">
                        {row.b2bOrderItems === undefined ? "-" : formatNumber(row.b2bOrderItems)}
                      </td>
                      <td className="whitespace-nowrap px-4 py-3 text-right">
                        {row.b2bOrderRate === undefined ? "-" : formatPercent(row.b2bOrderRate)}
                      </td>
                      <td className="whitespace-nowrap px-4 py-3 text-right">
                        {row.adOrderQuantity === undefined ? "-" : formatNumber(row.adOrderQuantity)}
                      </td>
                      <td className="whitespace-nowrap px-4 py-3 text-right">
                        {row.adOrderRate === undefined ? "-" : formatPercent(row.adOrderRate)}
                      </td>
                    </>
                  ) : (
                    <>
                      <td className="whitespace-nowrap px-4 py-3 text-right">
                        {row.grossProfit === undefined ? "-" : formatMoney(row.grossProfit)}
                      </td>
                      <td className={`whitespace-nowrap px-4 py-3 text-right font-medium ${compareClassName(row.grossProfitCompareRate)}`}>
                        {formatCompare(row.grossProfitCompareRate)}
                      </td>
                    </>
                  )}
                </tr>
              ))
            ) : (
              <tr>
                <td className="px-4 py-8 text-center text-muted" colSpan={emptyColSpan}>
                  当前筛选范围暂无排行数据
                </td>
              </tr>
            )}
          </tbody>
        </table>
      </div>
    </section>
  );
}
