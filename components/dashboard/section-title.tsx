import type { ReactNode } from "react";

export function SectionTitle({ title, description }: { title: string; description?: ReactNode }) {
  return (
    <div className="mb-4">
      <h1 className="text-xl font-semibold text-ink">{title}</h1>
      {description ? <div className="mt-1 text-sm text-muted">{description}</div> : null}
    </div>
  );
}
