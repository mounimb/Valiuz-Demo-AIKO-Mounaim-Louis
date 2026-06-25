"use client";

import {
  Bar,
  BarChart,
  Cell,
  CartesianGrid,
  ReferenceLine,
  Tooltip,
  XAxis,
  YAxis,
} from "recharts";
import { Card, SectionHeader, Pill, InfoNote, Num } from "./ui";
import { ChartFrame } from "./ChartFrame";
import { useChartColors } from "./charts/chartTheme";
import type { KpiBundle, SegmentMetrics } from "@/lib/types";
import { SEGMENT_LABEL } from "@/lib/types";
import { formatSignedPct, formatPct, formatCompact } from "@/lib/format";

type UpliftClass = SegmentMetrics["upliftClass"];

/** Maps an uplift class to a stable CSS variable (theme-aware). */
const CLASS_VAR: Record<UpliftClass, string> = {
  persuadable: "var(--positive)",
  "sure-thing": "var(--onsite)",
  "lost-cause": "var(--muted)",
  "sleeping-dog": "var(--negative)",
};

/** Maps an uplift class to a key on the resolved ChartColors object. */
const CLASS_COLOR_KEY: Record<
  UpliftClass,
  "positive" | "onsite" | "muted" | "negative"
> = {
  persuadable: "positive",
  "sure-thing": "onsite",
  "lost-cause": "muted",
  "sleeping-dog": "negative",
};

const CLASS_LEGEND: { cls: UpliftClass; label: string; def: string }[] = [
  {
    cls: "persuadable",
    label: "Persuadables",
    def: "convertissent grâce à la pub → à cibler en priorité",
  },
  {
    cls: "sure-thing",
    label: "Sure-things",
    def: "convertissent de toute façon → budget gaspillé",
  },
  {
    cls: "lost-cause",
    label: "Lost-causes",
    def: "ne convertissent jamais, pub ou non",
  },
  {
    cls: "sleeping-dog",
    label: "Sleeping-dogs",
    def: "effet négatif → la pub les fait fuir",
  },
];

const CLASS_SHORT: Record<UpliftClass, string> = {
  persuadable: "persuadable",
  "sure-thing": "sure-thing",
  "lost-cause": "lost-cause",
  "sleeping-dog": "sleeping-dog",
};

interface Row {
  segment: string;
  label: string;
  cls: UpliftClass;
  cate: number; // uplift en points (%)
  trueCate: number; // vérité-terrain en points (%)
  share: number;
  n: number;
  pExposed: number;
  pControl: number;
}

export function UpliftBySegment({ bundle }: { bundle: KpiBundle }) {
  const colors = useChartColors();
  const segments = bundle.segments;

  // Already sorted by cate desc upstream — convert to points (×100).
  const data: Row[] = segments.map((s) => ({
    segment: s.segment,
    label: SEGMENT_LABEL[s.segment],
    cls: s.upliftClass,
    cate: s.cate * 100,
    trueCate: s.trueCate * 100,
    share: s.share,
    n: s.n,
    pExposed: s.pExposed,
    pControl: s.pControl,
  }));

  const persuadables = segments
    .filter((s) => s.upliftClass === "persuadable")
    .map((s) => SEGMENT_LABEL[s.segment]);

  const hasNegative = data.some((d) => d.cate < 0 || d.trueCate < 0);
  const chartHeight = Math.max(220, data.length * 56);

  const tooltipStyle = {
    background: "var(--surface)",
    border: "1px solid var(--border)",
    borderRadius: 8,
    fontSize: 12,
    color: "var(--foreground)",
  } as const;

  return (
    <Card className="p-5">
      <SectionHeader
        title="Uplift par segment — hétérogénéité des effets (T-learner)"
        subtitle="L'effet causal moyen conditionnel (CATE) varie fortement selon le segment client : un même euro investi ne produit pas le même incrément. On cible les persuadables et on coupe le gaspillage sur les sure-things."
      />

      {/* 1. Vertical bar chart — estimated CATE vs ground truth, colored by class */}
      <ChartFrame height={chartHeight}>
          <BarChart
            layout="vertical"
            data={data}
            barGap={2}
            barCategoryGap="22%"
            margin={{ top: 4, right: 16, bottom: 4, left: 8 }}
          >
            <CartesianGrid stroke={colors.grid} strokeDasharray="3 3" horizontal={false} />
            <XAxis
              type="number"
              tickFormatter={(v: number) => `${formatSignedPct(v / 100, 0)}`}
              tick={{ fill: colors.muted, fontSize: 11 }}
              tickLine={false}
              axisLine={{ stroke: colors.border }}
            />
            <YAxis
              type="category"
              dataKey="label"
              width={84}
              tick={{ fill: colors.foreground, fontSize: 12 }}
              tickLine={false}
              axisLine={{ stroke: colors.border }}
            />
            {hasNegative && <ReferenceLine x={0} stroke={colors.border} />}
            <Tooltip
              cursor={{ fill: "color-mix(in srgb, var(--muted) 12%, transparent)" }}
              contentStyle={tooltipStyle}
              formatter={(value, name) => [
                formatSignedPct(Number(value) / 100, 2),
                name === "cate" ? "CATE estimé" : "vérité-terrain",
              ]}
            />
            {/* Estimated CATE — color encodes the uplift class via <Cell> */}
            <Bar dataKey="cate" name="cate" radius={[0, 3, 3, 0]} isAnimationActive={false}>
              {data.map((d) => (
                <Cell key={d.segment} fill={colors[CLASS_COLOR_KEY[d.cls]]} />
              ))}
            </Bar>
            {/* Ground truth — thin overlaid bar for validation */}
            <Bar
              dataKey="trueCate"
              name="trueCate"
              radius={[0, 3, 3, 0]}
              fill={colors.foreground}
              fillOpacity={0.28}
              isAnimationActive={false}
            />
          </BarChart>
      </ChartFrame>

      <div className="mt-1 flex flex-wrap items-center gap-x-4 gap-y-1 text-xs text-muted">
        <span className="inline-flex items-center gap-1.5">
          <span className="h-2 w-3 rounded-sm" style={{ background: "var(--brand)" }} />
          CATE estimé (couleur = classe)
        </span>
        <span className="inline-flex items-center gap-1.5">
          <span
            className="h-2 w-3 rounded-sm"
            style={{ background: colors.foreground, opacity: 0.28 }}
          />
          vérité-terrain (effet injecté)
        </span>
        <span>uplift en points de taux de conversion</span>
      </div>

      {/* 2. Four-class legend with definitions */}
      <div className="mt-5 grid gap-2 sm:grid-cols-2">
        {CLASS_LEGEND.map((c) => {
          const count = segments.filter((s) => s.upliftClass === c.cls).length;
          return (
            <div
              key={c.cls}
              className="flex items-start gap-2.5 rounded-lg border border-border bg-surface-2 px-3 py-2"
            >
              <span
                className="mt-1 h-2.5 w-2.5 shrink-0 rounded-full"
                style={{ background: CLASS_VAR[c.cls] }}
              />
              <div className="min-w-0">
                <div className="flex items-baseline gap-2">
                  <span className="text-sm font-medium text-foreground">{c.label}</span>
                  {count > 0 && (
                    <span className="text-xs tabular-nums text-muted">
                      {count} segment{count > 1 ? "s" : ""}
                    </span>
                  )}
                </div>
                <p className="mt-0.5 text-xs leading-relaxed text-muted">{c.def}</p>
              </div>
            </div>
          );
        })}
      </div>

      {/* Per-segment readout — share + CATE for context */}
      <div className="mt-4 overflow-hidden rounded-xl border border-border">
        <div className="grid grid-cols-[1.4fr_0.8fr_1fr_1.1fr] gap-2 border-b border-border bg-surface-2 px-3 py-2 text-xs font-medium uppercase tracking-wide text-muted">
          <span>Segment</span>
          <span className="text-right">Part</span>
          <span className="text-right">CATE</span>
          <span className="text-right">Classe</span>
        </div>
        {data.map((d) => (
          <div
            key={d.segment}
            className="grid grid-cols-[1.4fr_0.8fr_1fr_1.1fr] items-center gap-2 border-b border-border px-3 py-2 text-sm last:border-b-0"
          >
            <span className="flex items-center gap-2">
              <span
                className="h-2 w-2 shrink-0 rounded-full"
                style={{ background: CLASS_VAR[d.cls] }}
              />
              <span className="truncate text-foreground">{d.label}</span>
            </span>
            <span className="text-right tabular-nums text-muted">
              <Num>{formatPct(d.share, 0)}</Num>
            </span>
            <span
              className="text-right font-medium tabular-nums"
              style={{ color: CLASS_VAR[d.cls] }}
            >
              <Num>{formatSignedPct(d.cate / 100, 1)}</Num>
            </span>
            <span className="text-right text-xs text-muted">{CLASS_SHORT[d.cls]}</span>
          </div>
        ))}
      </div>

      {/* 3. Targeting recommendation */}
      <div className="mt-4">
        {persuadables.length > 0 ? (
          <Pill color="brand">
            Recibler en priorité : {persuadables.join(", ")}
          </Pill>
        ) : (
          <Pill color="muted">
            Aucun segment persuadable détecté — réévaluer le ciblage ou la pression média
          </Pill>
        )}
      </div>

      {/* 4. Methodological note */}
      <InfoNote className="mt-4">
        CATE = p(exposé | segment) − p(contrôle | segment), estimé ici par un{" "}
        <span className="text-foreground">T-learner</span> (un modèle par bras). En production :{" "}
        <span className="text-foreground">causal forest</span> / two-model en Python sur la clean
        room, sur l&apos;ensemble des covariables individuelles.{" "}
        <span className="tabular-nums">
          {formatCompact(segments.reduce((a, s) => a + s.n, 0))}
        </span>{" "}
        individus, {segments.length} segments.
      </InfoNote>
    </Card>
  );
}
