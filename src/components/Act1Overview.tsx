"use client";

import {
  Area,
  AreaChart,
  CartesianGrid,
  Tooltip,
  XAxis,
  YAxis,
} from "recharts";
import { Card, SectionHeader, InfoNote, MiniBar } from "./ui";
import { ChartFrame } from "./ChartFrame";
import { KpiCard } from "./KpiCard";
import { IndicatorLogicMap } from "./IndicatorLogicMap";
import { useChartColors } from "./charts/chartTheme";
import type { KpiBundle } from "@/lib/types";
import {
  formatEuro,
  formatEuroCompact,
  formatCompact,
  formatPct,
  formatMultiplier,
} from "@/lib/format";

export function Act1Overview({ bundle }: { bundle: KpiBundle }) {
  const colors = useChartColors();
  const g = bundle.global;

  const tooltipStyle = {
    background: "var(--surface)",
    border: "1px solid var(--border)",
    borderRadius: 8,
    fontSize: 12,
    color: "var(--foreground)",
  } as const;

  // Daily series: organic baseline vs. advertising increment (stacked areas).
  const areaData = bundle.daily.map((d) => ({
    date: d.date,
    baseline: d.baselineSales,
    increment: Math.max(0, d.totalSales - d.baselineSales),
  }));
  const tickInterval = Math.max(0, Math.floor(areaData.length / 7) - 1);

  // Attribution-window mini bars.
  const maxWindowRoas = Math.max(
    1,
    ...bundle.attribution.map((a) => a.grossRoas),
  );

  return (
    <Card className="p-5">
      <SectionHeader
        act="ACTE 1"
        title="Combien j'ai vendu ?"
        subtitle="Attribution closed-loop déterministe — mesure descriptive et corrélationnelle de la campagne (caisse + fidélité)."
      />

      {/* 1. KPI grid */}
      <div className="grid grid-cols-2 gap-3 md:grid-cols-3">
        <KpiCard label="Dépense média" value={formatEuro(g.totalSpend)} />
        <KpiCard
          label="Reach dédupliqué"
          value={formatCompact(bundle.reach.dedupReach)}
          sub={<>fréquence {formatMultiplier(bundle.reach.dedupFrequency, 1)}</>}
        />
        <KpiCard
          label="Impressions"
          value={formatCompact(bundle.reach.totalImpressions)}
        />
        <KpiCard
          label="Ventes attribuées"
          value={formatEuroCompact(g.grossAttributedSales)}
        />
        <KpiCard
          label="ROAS brut"
          value={formatMultiplier(g.grossRoas)}
          hint="corrélationnel, sensible à la fenêtre"
          sub={<>corrélationnel, sensible à la fenêtre</>}
        />
        <KpiCard
          label="New-to-brand"
          value={formatPct(bundle.newToBrandRate)}
        />
      </div>

      {/* 2. Organic baseline vs. advertising increment */}
      <div className="mt-6">
        <div className="mb-3 flex flex-wrap items-center gap-3 text-xs text-muted">
          <span className="inline-flex items-center gap-1.5">
            <span
              className="h-2 w-2 rounded-sm"
              style={{ background: colors.muted }}
            />
            ventes organiques (baseline)
          </span>
          <span className="inline-flex items-center gap-1.5">
            <span
              className="h-2 w-2 rounded-sm"
              style={{ background: "var(--brand)" }}
            />
            incrément publicitaire
          </span>
        </div>
        <ChartFrame height={260}>
            <AreaChart
              data={areaData}
              margin={{ top: 8, right: 8, bottom: 0, left: 0 }}
            >
              <defs>
                <linearGradient id="act1-baseline" x1="0" y1="0" x2="0" y2="1">
                  <stop offset="0%" stopColor={colors.muted} stopOpacity={0.35} />
                  <stop offset="100%" stopColor={colors.muted} stopOpacity={0.08} />
                </linearGradient>
                <linearGradient id="act1-increment" x1="0" y1="0" x2="0" y2="1">
                  <stop offset="0%" stopColor={colors.brand} stopOpacity={0.55} />
                  <stop offset="100%" stopColor={colors.brand} stopOpacity={0.12} />
                </linearGradient>
              </defs>
              <CartesianGrid stroke={colors.grid} strokeDasharray="3 3" />
              <XAxis
                dataKey="date"
                interval={tickInterval}
                tick={{ fill: colors.muted, fontSize: 11 }}
                tickLine={false}
                axisLine={{ stroke: colors.border }}
              />
              <YAxis
                width={48}
                tickFormatter={(v: number) => formatCompact(v)}
                tick={{ fill: colors.muted, fontSize: 11 }}
                tickLine={false}
                axisLine={false}
              />
              <Tooltip
                contentStyle={tooltipStyle}
                formatter={(value, name) => [
                  formatEuro(Number(value)),
                  name === "baseline"
                    ? "ventes organiques (baseline)"
                    : "incrément publicitaire",
                ]}
              />
              <Area
                type="monotone"
                dataKey="baseline"
                stackId="sales"
                stroke={colors.muted}
                strokeWidth={1.5}
                fill="url(#act1-baseline)"
              />
              <Area
                type="monotone"
                dataKey="increment"
                stackId="sales"
                stroke={colors.brand}
                strokeWidth={1.5}
                fill="url(#act1-increment)"
              />
            </AreaChart>
        </ChartFrame>
      </div>

      {/* 3. CESP certified indicators — arborescence (logique des 8 indicateurs) */}
      <div className="mt-6">
        <IndicatorLogicMap bundle={bundle} />
      </div>

      {/* 4. Attribution window mini viz */}
      <div className="mt-6 rounded-xl border border-border bg-surface-2 p-4">
        <span className="text-xs font-medium uppercase tracking-wide text-muted">
          Fenêtre d&apos;attribution
        </span>
        <div className="mt-3 grid gap-3 sm:grid-cols-3">
          {bundle.attribution.map((a) => {
            const current = a.window === bundle.params.attributionDays;
            return (
              <div key={a.window}>
                <div className="mb-1 flex items-baseline justify-between text-xs">
                  <span className={current ? "font-semibold text-brand-strong" : "text-muted"}>
                    {a.window} j{current ? " · courante" : ""}
                  </span>
                  <span
                    className="tabular-nums font-medium"
                    style={{ color: current ? "var(--brand)" : undefined }}
                  >
                    {formatMultiplier(a.grossRoas)}
                  </span>
                </div>
                <MiniBar
                  value={a.grossRoas / maxWindowRoas}
                  color={current ? "var(--brand)" : "var(--muted)"}
                />
                <div className="mt-1 text-xs text-muted">
                  iROAS <span className="tabular-nums">{formatMultiplier(a.iroas)}</span>
                </div>
              </div>
            );
          })}
        </div>
        <InfoNote className="mt-3">
          Le ROAS brut gonfle avec la fenêtre d&apos;attribution, tandis que l&apos;iROAS
          reste stable.
        </InfoNote>
      </div>

      {/* 5. Correlational caveat */}
      <InfoNote className="mt-5">
        Ces chiffres sont <span className="text-foreground">descriptifs et corrélationnels</span> :
        ils décrivent ce qui a été vendu après exposition, sans isoler l&apos;effet réellement
        causé par la campagne. L&apos;incrémentalité causale (exposés vs contrôle) est mesurée à
        l&apos;Acte 2.
      </InfoNote>
    </Card>
  );
}
