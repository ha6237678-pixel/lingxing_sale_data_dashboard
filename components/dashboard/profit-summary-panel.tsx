"use client";

import { ChevronDown } from "lucide-react";
import { useState } from "react";
import type { ProfitSummary } from "@/lib/queries/profit";
import { formatMoney, formatNumber, formatPercent } from "@/lib/utils/number";

function compareRate(current: number, previous: number) {
  if (!previous) return undefined;
  return (current - previous) / Math.abs(previous);
}

function CompareLine({ value }: { value?: number }) {
  if (value === undefined || !Number.isFinite(value)) {
    return <div className="mt-2 text-sm text-muted">环比 -</div>;
  }

  const positive = value >= 0;
  return (
    <div className={`mt-2 text-sm font-semibold ${positive ? "text-emerald-600" : "text-red-600"}`}>
      {positive ? "↑" : "↓"}
      {formatPercent(Math.abs(value))}
    </div>
  );
}

function CoreMetric({ compare, label, value }: { compare?: number; label: string; value: string }) {
  return (
    <div className="border border-line bg-white p-5 shadow-panel">
      <div className="text-xs text-muted">{label}</div>
      <div className="mt-3 truncate text-[24px] font-semibold leading-tight text-ink">{value}</div>
      <CompareLine value={compare} />
    </div>
  );
}

function FeeMetric({ amount, label, rate }: { amount: string; label: string; rate?: string }) {
  return (
    <div className="border border-line bg-slate-50/70 p-4">
      <div className="text-xs text-muted">{label}</div>
      <div className="mt-2 truncate text-lg font-semibold text-ink">{amount}</div>
      {rate ? <div className="mt-1 text-xs text-muted">费比 {rate}</div> : null}
    </div>
  );
}

export function ProfitSummaryPanel({ previous, summary }: { previous: ProfitSummary; summary: ProfitSummary }) {
  const [open, setOpen] = useState(false);

  return (
    <section className="mt-5 border border-line bg-white p-5 shadow-panel">
      <div className="grid gap-3 md:grid-cols-4">
        <CoreMetric
          compare={compareRate(summary.settlementSales, previous.settlementSales)}
          label="销售额"
          value={formatMoney(summary.settlementSales)}
        />
        <CoreMetric
          compare={compareRate(summary.totalSalesQuantity, previous.totalSalesQuantity)}
          label="销量"
          value={formatNumber(summary.totalSalesQuantity)}
        />
        <CoreMetric compare={compareRate(summary.grossProfit, previous.grossProfit)} label="毛利润" value={formatMoney(summary.grossProfit)} />
        <CoreMetric compare={summary.grossRate - previous.grossRate} label="毛利率" value={formatPercent(summary.grossRate)} />
      </div>

      <div className="mt-4 flex justify-end">
        <button
          className="inline-flex h-9 items-center gap-2 border border-line bg-white px-3 text-sm font-semibold text-ink transition hover:border-slate-400"
          onClick={() => setOpen((value) => !value)}
          type="button"
        >
          查看完整费用
          <ChevronDown className={`h-4 w-4 transition-transform ${open ? "rotate-180" : ""}`} />
        </button>
      </div>

      <div
        className={`grid overflow-hidden transition-[grid-template-rows,opacity] duration-300 ${
          open ? "grid-rows-[1fr] opacity-100" : "grid-rows-[0fr] opacity-0"
        }`}
      >
        <div className="min-h-0">
          <div className="mt-4 grid gap-3 md:grid-cols-4">
            <FeeMetric amount={formatMoney(summary.totalSalesRefunds)} label="销售退款额" rate={formatPercent(summary.refundsRate)} />
            <FeeMetric amount={formatMoney(summary.platformFee)} label="平台费" rate={formatPercent(summary.platformFeeRate)} />
            <FeeMetric amount={formatMoney(summary.cgTransportCosts)} label="头程费" rate={formatPercent(summary.cgTransportCostRate)} />
            <FeeMetric amount={formatMoney(summary.cgPrice)} label="采购成本" rate={formatPercent(summary.cgPriceRate)} />
            <FeeMetric amount={formatMoney(summary.totalStorageFee)} label="仓储费" rate={formatPercent(summary.storageFeeRate)} />
            <FeeMetric amount={formatMoney(summary.fbaDeliveryFee)} label="FBA 发货费" rate={formatPercent(summary.fbaDeliveryFeeRate)} />
            <FeeMetric amount={formatMoney(summary.promotionalRebates)} label="促销返点" rate={formatPercent(summary.promotionalRebateRate)} />
            <FeeMetric amount={formatMoney(summary.totalAdsCost)} label="广告费" rate={formatPercent(summary.adsCostRate)} />
            <FeeMetric amount={formatMoney(summary.promotionFee)} label="推广费" />
            <FeeMetric amount={formatMoney(summary.totalCost)} label="合计成本" rate={formatPercent(summary.totalCostRate)} />
          </div>
        </div>
      </div>
    </section>
  );
}
