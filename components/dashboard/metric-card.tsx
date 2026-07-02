import { Info } from "lucide-react";

export function MetricCard({ label, value, hint, className = "bg-white" }: { label: string; value: string; hint?: string; className?: string }) {
  return (
    <div className={`border border-line p-4 shadow-panel ${className}`}>
      <div className="flex items-center justify-between gap-2 text-xs text-muted">
        <span>{label}</span>
        {hint ? (
          <span title={hint}>
            <Info className="h-3.5 w-3.5" />
          </span>
        ) : null}
      </div>
      <div className="mt-2 truncate text-2xl font-semibold text-ink">{value}</div>
    </div>
  );
}
