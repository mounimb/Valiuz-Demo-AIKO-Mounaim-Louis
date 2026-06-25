import type { ReactNode } from "react";
import { Card, Num } from "./ui";
import type { CI } from "@/lib/types";

export function KpiCard({
  label,
  value,
  sub,
  ci,
  accent = false,
  hint,
  ciFormatter,
}: {
  label: string;
  value: ReactNode;
  sub?: ReactNode;
  ci?: CI;
  accent?: boolean;
  hint?: string;
  ciFormatter?: (v: number) => string;
}) {
  return (
    <Card className="p-4" title={hint}>
      <div className="text-xs font-medium uppercase tracking-wide text-muted">{label}</div>
      <div
        className={`mt-1.5 text-2xl font-semibold tracking-tight ${
          accent ? "text-brand-strong" : "text-foreground"
        }`}
      >
        <Num>{value}</Num>
      </div>
      {ci && ciFormatter && (
        <div className="mt-1 text-xs text-muted">
          IC95 <Num>{ciFormatter(ci.lo)}</Num> – <Num>{ciFormatter(ci.hi)}</Num>
        </div>
      )}
      {sub && <div className="mt-1 text-xs text-muted">{sub}</div>}
    </Card>
  );
}
