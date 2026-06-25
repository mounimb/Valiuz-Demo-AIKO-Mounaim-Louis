"use client";

import { useEffect, useState, type ReactElement } from "react";
import { ResponsiveContainer } from "recharts";

/**
 * Fixed-height frame for a Recharts chart. The ResponsiveContainer can only
 * measure its parent once a real DOM box exists, so on the server (and the
 * first client render) it reports width/height of -1 and logs a warning.
 * We render the chart only after mount — the reserved-height div keeps layout
 * stable (no CLS) and SSR ↔ client output matches (no hydration warning).
 */
export function ChartFrame({
  height,
  children,
}: {
  height: number;
  children: ReactElement;
}) {
  const [mounted, setMounted] = useState(false);
  useEffect(() => setMounted(true), []);

  return (
    <div style={{ height }}>
      {mounted ? (
        <ResponsiveContainer width="100%" height="100%">
          {children}
        </ResponsiveContainer>
      ) : null}
    </div>
  );
}
