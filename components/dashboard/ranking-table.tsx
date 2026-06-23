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
};

export function RankingTable({ title, rows, variant = "sales" }: { title: string; rows: RankingTableRow[]; variant?: "sales" | "profit" }) {
  const isSales = variant === "sales";

  return (
    <section className="border border-line bg-white shadow-panel">
      <div className="border-b border-line px-4 py-3 text-sm font-semibold text-ink">{title}</div>
      <div className="overflow-x-auto scrollbar-thin">
        <table className="min-w-[980px] text-left text-sm">
          <thead className="bg-slate-50 text-xs text-muted">
            <tr>
              <th className="px-4 py-3">名称</th>
              <th className="px-4 py-3">组别</th>
              <th className="px-4 py-3 text-right">销售额</th>
              <th className="px-4 py-3 text-right">销量</th>
              <th className="px-4 py-3 text-right">订单</th>
              {isSales ? (
                <>
                  <th className="px-4 py-3 text-right">B2B订单</th>
                  <th className="px-4 py-3 text-right">B2B订单占比</th>
                  <th className="px-4 py-3 text-right">广告订单</th>
                  <th className="px-4 py-3 text-right">广告订单占比</th>
                </>
              ) : (
                <th className="px-4 py-3 text-right">毛利</th>
              )}
            </tr>
          </thead>
          <tbody className="divide-y divide-line">
            {rows.length ? (
              rows.map((row) => (
                <tr key={`${row.name}-${row.groupName ?? ""}`} className="hover:bg-slate-50">
                  <td className="px-4 py-3 font-medium text-ink">{row.name}</td>
                  <td className="px-4 py-3 text-muted">{row.groupName || "-"}</td>
                  <td className="px-4 py-3 text-right">{row.amount === undefined ? "-" : formatMoney(row.amount)}</td>
                  <td className="px-4 py-3 text-right">{row.volume === undefined ? "-" : formatNumber(row.volume)}</td>
                  <td className="px-4 py-3 text-right">{row.orderItems === undefined ? "-" : formatNumber(row.orderItems)}</td>
                  {isSales ? (
                    <>
                      <td className="px-4 py-3 text-right">{row.b2bOrderItems === undefined ? "-" : formatNumber(row.b2bOrderItems)}</td>
                      <td className="px-4 py-3 text-right">{row.b2bOrderRate === undefined ? "-" : formatPercent(row.b2bOrderRate)}</td>
                      <td className="px-4 py-3 text-right">{row.adOrderQuantity === undefined ? "-" : formatNumber(row.adOrderQuantity)}</td>
                      <td className="px-4 py-3 text-right">{row.adOrderRate === undefined ? "-" : formatPercent(row.adOrderRate)}</td>
                    </>
                  ) : (
                    <td className="px-4 py-3 text-right">{row.grossProfit === undefined ? "-" : formatMoney(row.grossProfit)}</td>
                  )}
                </tr>
              ))
            ) : (
              <tr>
                <td className="px-4 py-8 text-center text-muted" colSpan={isSales ? 9 : 6}>
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
