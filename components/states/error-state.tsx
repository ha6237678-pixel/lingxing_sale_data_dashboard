import { AlertTriangle } from "lucide-react";

export function ErrorState({ message }: { message: string }) {
  return (
    <div className="border border-amber-300 bg-amber-50 p-4 text-sm text-amber-900">
      <div className="flex items-start gap-3">
        <AlertTriangle className="mt-0.5 h-5 w-5 shrink-0" />
        <div>
          <div className="font-semibold">数据暂时无法加载</div>
          <div className="mt-1">{message}</div>
        </div>
      </div>
    </div>
  );
}
