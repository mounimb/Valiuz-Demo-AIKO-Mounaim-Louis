"use client";

import {
  CartesianGrid,
  Cell,
  Scatter,
  ScatterChart,
  Tooltip,
  XAxis,
  YAxis,
  ZAxis,
} from "recharts";
import { Card, SectionHeader, Pill, InfoNote, MiniBar } from "./ui";
import { ChartFrame } from "./ChartFrame";
import { KpiCard } from "./KpiCard";
import { useChartColors } from "./charts/chartTheme";
import { ZONES, ZONE_LABEL, type KpiBundle, type Zone } from "@/lib/types";
import {
  formatPct,
  formatPctValue,
  formatEuroCompact,
  formatCompact,
} from "@/lib/format";

/** Distinct color per catchment-area zone (see spec). */
const ZONE_COLOR: Record<Zone, string> = {
  core: "var(--instore)",
  fringe: "var(--onsite)",
  far: "var(--muted)",
};

export function DriveToStore({ bundle }: { bundle: KpiBundle }) {
  const colors = useChartColors();
  const dts = bundle.driveToStore;

  const tooltipStyle = {
    background: "var(--surface)",
    border: "1px solid var(--border)",
    borderRadius: 8,
    fontSize: 12,
    color: "var(--foreground)",
  } as const;

  // Resolve theme-aware fills for the scatter cells (CSS vars don't apply to SVG fills via Recharts).
  const zoneFill: Record<Zone, string> = {
    core: colors.instore,
    fringe: colors.onsite,
    far: colors.muted,
  };

  // Scatter points: x = distance (km), y = drive-to-store uplift in points (uplift * 100).
  const scatterData = dts.scatter.map((p) => ({
    distanceKm: p.distanceKm,
    upliftPts: p.uplift * 100,
    zone: p.zone,
  }));

  // Bars sorted core -> fringe -> far (ZONES is already in that order).
  const byZone = ZONES.map((zone) =>
    dts.byZone.find((z) => z.zone === zone),
  ).filter((z): z is NonNullable<typeof z> => z != null);

  const maxUpliftPts = Math.max(
    0.01,
    ...byZone.map((z) => z.driveToStoreUplift * 100),
  );

  return (
    <Card className="p-5">
      <SectionHeader
        act="ACTE 3"
        title="Drive-to-store & ROPO — par zone de chalandise"
        subtitle="Effet causal d'une exposition digitale sur l'achat en magasin physique, mesuré au ticket de caisse via la carte de fidélité."
      />

      {/* 1. Head stats */}
      <div className="grid grid-cols-1 gap-3 sm:grid-cols-3">
        <KpiCard
          label="Taux ROPO"
          value={formatPct(dts.ropoRate)}
          accent
          sub={<>recherche online &rarr; achat magasin</>}
          hint="Research Online, Purchase Offline"
        />
        <KpiCard
          label="Ventes incrémentales in-store"
          value={formatEuroCompact(dts.inStoreIncrementalSales)}
          sub={<>attribuées à l&apos;exposition digitale</>}
        />
        <KpiCard
          label="DOOH mesuré"
          value={formatPct(dts.doohMeasuredShare)}
          sub={<>caisse + fidélité</>}
        />
      </div>

      {/* 2. Scatter — uplift vs distance, colored by zone */}
      <div className="mt-6">
        <div className="mb-3 flex flex-wrap items-center justify-between gap-3">
          <span className="text-xs font-medium uppercase tracking-wide text-muted">
            Uplift drive-to-store selon la distance au point de vente
          </span>
          <div className="flex flex-wrap items-center gap-3 text-xs text-muted">
            {ZONES.map((zone) => (
              <span key={zone} className="inline-flex items-center gap-1.5">
                <span
                  className="h-2 w-2 rounded-full"
                  style={{ background: ZONE_COLOR[zone] }}
                />
                {ZONE_LABEL[zone]}
              </span>
            ))}
          </div>
        </div>
        <ChartFrame height={300}>
            <ScatterChart margin={{ top: 8, right: 12, bottom: 24, left: 8 }}>
              <CartesianGrid stroke={colors.grid} strokeDasharray="3 3" />
              <XAxis
                type="number"
                dataKey="distanceKm"
                name="Distance"
                unit=" km"
                tick={{ fill: colors.muted, fontSize: 11 }}
                tickLine={false}
                axisLine={{ stroke: colors.border }}
                tickFormatter={(v: number) => v.toFixed(1)}
                label={{
                  value: "Distance au point de vente (km)",
                  position: "insideBottom",
                  offset: -14,
                  fill: colors.muted,
                  fontSize: 11,
                }}
              />
              <YAxis
                type="number"
                dataKey="upliftPts"
                name="Uplift"
                unit=" pts"
                width={52}
                tick={{ fill: colors.muted, fontSize: 11 }}
                tickLine={false}
                axisLine={false}
                tickFormatter={(v: number) => formatPctValue(v, 0)}
              />
              <ZAxis range={[44, 44]} />
              <Tooltip
                cursor={{ stroke: colors.border, strokeDasharray: "3 3" }}
                contentStyle={tooltipStyle}
                formatter={(value, name) =>
                  name === "Uplift"
                    ? [formatPctValue(Number(value)), "Uplift drive-to-store"]
                    : [`${Number(value).toFixed(1)} km`, "Distance"]
                }
                labelFormatter={() => ""}
              />
              <Scatter name="Drive-to-store" data={scatterData} isAnimationActive={false}>
                {scatterData.map((p, i) => (
                  <Cell key={i} fill={zoneFill[p.zone]} fillOpacity={0.75} />
                ))}
              </Scatter>
            </ScatterChart>
        </ChartFrame>
        <InfoNote className="mt-2">
          L&apos;uplift décroît à mesure que l&apos;on s&apos;éloigne du point de vente :
          la proximité physique conditionne le passage en magasin.
        </InfoNote>
      </div>

      {/* 3. Per-zone bars */}
      <div className="mt-6 rounded-xl border border-border bg-surface-2 p-4">
        <div className="mb-3 flex items-center justify-between gap-3">
          <span className="text-xs font-medium uppercase tracking-wide text-muted">
            Uplift drive-to-store par zone de chalandise
          </span>
          <Pill color="instore">caisse + fidélité</Pill>
        </div>
        <div className="space-y-3">
          {byZone.map((z) => (
            <div key={z.zone}>
              <div className="mb-1 flex items-baseline justify-between text-xs">
                <span className="font-medium">{ZONE_LABEL[z.zone]}</span>
                <span
                  className="font-semibold tabular-nums"
                  style={{ color: ZONE_COLOR[z.zone] }}
                >
                  {formatPctValue(z.driveToStoreUplift * 100)}
                </span>
              </div>
              <MiniBar
                value={(z.driveToStoreUplift * 100) / maxUpliftPts}
                color={ZONE_COLOR[z.zone]}
              />
              <div className="mt-1 flex items-center justify-between text-xs text-muted">
                <span>
                  distance moy. <span className="tabular-nums">{z.avgDistanceKm.toFixed(1)} km</span>
                </span>
                <span>
                  n <span className="tabular-nums">{formatCompact(z.n)}</span>
                </span>
              </div>
            </div>
          ))}
        </div>
      </div>

      {/* 4. Methodology note */}
      <InfoNote className="mt-5">
        Effet <span className="text-foreground">causal</span> d&apos;une exposition digitale
        (on/off-site) sur l&apos;achat en <span className="text-foreground">magasin physique</span>,
        mesuré par croisement exposition &harr; ticket de caisse via la carte de fidélité.
        Géospatial simplifié (zones de chalandise).
      </InfoNote>
    </Card>
  );
}
