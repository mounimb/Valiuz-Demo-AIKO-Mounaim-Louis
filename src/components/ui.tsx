import type { ReactNode, HTMLAttributes } from "react";

export function Card({
  children,
  className = "",
  ...rest
}: { children: ReactNode; className?: string } & HTMLAttributes<HTMLDivElement>) {
  return (
    <div
      className={`rounded-xl border border-border bg-surface ${className}`}
      {...rest}
    >
      {children}
    </div>
  );
}

export function SectionHeader({
  act,
  title,
  subtitle,
  right,
}: {
  act?: string;
  title: string;
  subtitle?: string;
  right?: ReactNode;
}) {
  return (
    <div className="mb-4 flex items-start justify-between gap-4">
      <div>
        <div className="flex items-baseline gap-2">
          {act && (
            <span className="font-mono text-xs font-semibold tracking-wider text-brand">
              {act}
            </span>
          )}
          <h2 className="text-lg font-semibold tracking-tight">{title}</h2>
        </div>
        {subtitle && <p className="mt-1 max-w-2xl text-sm text-muted">{subtitle}</p>}
      </div>
      {right && <div className="shrink-0">{right}</div>}
    </div>
  );
}

type PillColor = "muted" | "brand" | "positive" | "negative" | "onsite" | "offsite" | "instore";

const PILL: Record<PillColor, string> = {
  muted: "bg-surface-2 text-muted border-border",
  brand: "border-brand/30 bg-brand/10 text-brand-strong",
  positive: "border-positive/30 bg-positive/10 text-positive",
  negative: "border-negative/30 bg-negative/10 text-negative",
  onsite: "border-onsite/30 bg-onsite/10 text-onsite",
  offsite: "border-offsite/30 bg-offsite/10 text-offsite",
  instore: "border-instore/30 bg-instore/10 text-instore",
};

export function Pill({
  children,
  color = "muted",
  className = "",
}: {
  children: ReactNode;
  color?: PillColor;
  className?: string;
}) {
  return (
    <span
      className={`inline-flex items-center gap-1 rounded-full border px-2 py-0.5 text-xs font-medium ${PILL[color]} ${className}`}
    >
      {children}
    </span>
  );
}

export function Num({
  children,
  className = "",
}: {
  children: ReactNode;
  className?: string;
}) {
  return <span className={`tabular-nums ${className}`}>{children}</span>;
}

export function InfoNote({ children, className = "" }: { children: ReactNode; className?: string }) {
  return <p className={`text-xs leading-relaxed text-muted ${className}`}>{children}</p>;
}

/** Thin labeled horizontal bar (for shares / contributions). */
export function MiniBar({
  value,
  color = "var(--brand)",
  track = true,
}: {
  value: number; // 0..1
  color?: string;
  track?: boolean;
}) {
  return (
    <div
      className={`h-1.5 w-full overflow-hidden rounded-full ${track ? "bg-surface-2" : ""}`}
    >
      <div
        className="h-full rounded-full transition-all"
        style={{ width: `${Math.max(0, Math.min(1, value)) * 100}%`, background: color }}
      />
    </div>
  );
}
