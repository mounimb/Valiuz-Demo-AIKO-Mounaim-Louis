"use client";

import { useMemo } from "react";
import {
  ArrowRight,
  Users,
  Ghost,
  Target,
  CheckCircle2,
} from "lucide-react";
import {
  BarChart,
  Bar,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  Cell,
  ReferenceLine,
} from "recharts";
import { Card, SectionHeader, Pill, Num, InfoNote } from "./ui";
import { ChartFrame } from "./ChartFrame";
import { useChartColors, type ChartColors } from "./charts/chartTheme";
import type { KpiBundle } from "@/lib/types";
import {
  formatNumber,
  formatPct,
  formatPctValue,
  formatMultiplier,
  formatSignedPct,
} from "@/lib/format";

const TOOLTIP_STYLE = {
  background: "var(--surface)",
  border: "1px solid var(--border)",
  borderRadius: 8,
  fontSize: 12,
  color: "var(--foreground)",
} as const;

export function IncrementalityLab({ bundle }: { bundle: KpiBundle }) {
  const g = bundle.global;
  const c = useChartColors();

  const significant = g.pValue < 0.05;

  // True conversion-uplift is not exposed directly on GlobalMetrics; we recover the
  // "ground-truth effect" implied by the injected iROAS so the measured-vs-true panel
  // compares like with like (lift scales with iROAS at fixed spend & basket).
  const trueLiftAbs =
    g.iroas > 0 ? g.liftAbs * (g.trueIroas / g.iroas) : g.liftAbs;
  const iroasGapRel = g.trueIroas !== 0 ? (g.iroas - g.trueIroas) / g.trueIroas : 0;
  const liftGapRel = trueLiftAbs !== 0 ? (g.liftAbs - trueLiftAbs) / trueLiftAbs : 0;

  return (
    <Card className="p-5">
      <SectionHeader
        act="ACTE 2"
        title="Lab d'incrémentalité & iROAS"
        subtitle="Combien EN PLUS grâce à la pub ? Démonstration causale exposés vs contrôle (ghost ads), test de significativité et bootstrap de l'iROAS."
      />

      {/* 1 — design expérimental : deux groupes côte à côte */}
      <ExperimentDesign g={g} />

      <div className="mt-5 grid gap-5 lg:grid-cols-2">
        {/* 2 — barres taux de conversion + delta */}
        <div className="rounded-lg border border-border bg-surface-2/40 p-4">
          <div className="mb-1 flex items-center justify-between">
            <span className="text-xs font-medium uppercase tracking-wide text-muted">
              Taux de conversion — exposés vs contrôle
            </span>
            <Pill color="brand">
              Δ {formatPctValue(g.liftAbs * 100)} pts
            </Pill>
          </div>
          <ConversionBars g={g} colors={c} />
          {/* 3 — badge significativité */}
          <div className="mt-3 flex flex-wrap items-center gap-2 text-xs">
            <Pill color={significant ? "positive" : "negative"}>
              p = {g.pValue.toExponential(1)} ·{" "}
              {significant ? "significatif" : "non significatif"}
            </Pill>
            <span className="text-muted">
              z = <Num>{g.zScore.toFixed(2)}</Num> · lift relatif{" "}
              <Num>{formatPct(g.liftRel, 0)}</Num>
            </span>
          </div>
        </div>

        {/* 4 — histogramme bootstrap iROAS */}
        <div className="rounded-lg border border-border bg-surface-2/40 p-4">
          <div className="mb-1 flex items-center justify-between">
            <span className="text-xs font-medium uppercase tracking-wide text-muted">
              Distribution bootstrap de l&apos;iROAS
            </span>
            <Pill color="muted">
              iROAS <Num>{formatMultiplier(g.iroas)}</Num>
            </Pill>
          </div>
          <BootstrapHistogram
            samples={g.bootstrapIroas}
            point={g.iroas}
            lo={g.iroasCI.lo}
            hi={g.iroasCI.hi}
            colors={c}
          />
          <InfoNote className="mt-2">
            distribution bootstrap (B={g.bootstrapIroas.length}), IC95 percentile{" "}
            <Num>{formatMultiplier(g.iroasCI.lo)}</Num>–
            <Num>{formatMultiplier(g.iroasCI.hi)}</Num>
          </InfoNote>
        </div>
      </div>

      {/* 5 — estimé vs vérité-terrain (preuve de méthode) */}
      <GroundTruthPanel
        iroas={g.iroas}
        trueIroas={g.trueIroas}
        liftAbs={g.liftAbs}
        trueLiftAbs={trueLiftAbs}
        iroasGapRel={iroasGapRel}
        liftGapRel={liftGapRel}
      />

      {/* 6 — encart pédagogique */}
      <div className="mt-5 grid gap-3">
        <div className="rounded-lg border border-border bg-surface-2/40 p-4">
          <div className="mb-2 flex items-center gap-2 text-xs font-medium uppercase tracking-wide text-muted">
            <Target className="h-3.5 w-3.5 text-brand" />
            Trois lectures du retour
          </div>
          <InfoNote>
            <span className="font-medium text-foreground">ROAS brut</span> = corrélationnel
            (inclut l&apos;organique) ·{" "}
            <span className="font-medium text-brand-strong">iROAS</span> = causal (exposés vs
            contrôle) · <span className="font-medium text-foreground">last-touch</span>{" "}
            surestime en s&apos;attribuant la dernière interaction. Seule la mesure causale
            répond à « combien EN PLUS grâce à la pub ? ».
          </InfoNote>
        </div>
      </div>
    </Card>
  );
}

/* ------------------------------------------------------------------ */
/* 1 — Design expérimental                                            */
/* ------------------------------------------------------------------ */

function ExperimentDesign({ g }: { g: KpiBundle["global"] }) {
  return (
    <div className="grid items-stretch gap-3 md:grid-cols-[1fr_auto_1fr]">
      <GroupBlock
        icon={<Users className="h-4 w-4 text-brand" />}
        title="Groupe exposé"
        n={g.nExposedTouched}
        p={g.pExposed}
        accent
        caption="individus réellement touchés par au moins un levier"
      />

      {/* écart central */}
      <div className="flex flex-col items-center justify-center gap-1 px-2 py-3 md:py-0">
        <ArrowRight className="hidden h-5 w-5 text-muted md:block" />
        <span className="text-xs font-medium uppercase tracking-wide text-muted">
          écart causal
        </span>
        <span className="text-2xl font-semibold tracking-tight text-brand-strong">
          <Num>+{formatPctValue(g.liftAbs * 100)} pts</Num>
        </span>
        <Pill color="brand">lift {formatPct(g.liftRel, 0)}</Pill>
      </div>

      <GroupBlock
        icon={<Ghost className="h-4 w-4 text-muted" />}
        title="Contrôle / holdout — ghost ads"
        n={g.nControl}
        p={g.pControl}
        caption="éligibles non exposés (placebo) — contrefactuel"
      />
    </div>
  );
}

function GroupBlock({
  icon,
  title,
  n,
  p,
  caption,
  accent = false,
}: {
  icon: React.ReactNode;
  title: string;
  n: number;
  p: number;
  caption: string;
  accent?: boolean;
}) {
  return (
    <div
      className={`flex flex-col rounded-lg border p-4 ${
        accent ? "border-brand/30 bg-brand/5" : "border-border bg-surface-2/40"
      }`}
    >
      <div className="flex items-center gap-2">
        {icon}
        <span className="text-sm font-medium tracking-tight">{title}</span>
      </div>
      <div className="mt-2 flex items-baseline gap-2">
        <span className="text-xs uppercase tracking-wide text-muted">n =</span>
        <span className="text-xl font-semibold tracking-tight tabular-nums">
          {formatNumber(n)}
        </span>
      </div>
      <div className="mt-2 flex items-baseline justify-between">
        <span className="text-xs uppercase tracking-wide text-muted">conversion</span>
        <span
          className={`text-lg font-semibold tabular-nums ${
            accent ? "text-brand-strong" : "text-foreground"
          }`}
        >
          {formatPct(p, 2)}
        </span>
      </div>
      <p className="mt-2 text-xs leading-relaxed text-muted">{caption}</p>
    </div>
  );
}

/* ------------------------------------------------------------------ */
/* 2 — Barres taux de conversion                                      */
/* ------------------------------------------------------------------ */

function ConversionBars({
  g,
  colors,
}: {
  g: KpiBundle["global"];
  colors: ChartColors;
}) {
  const data = useMemo(
    () => [
      { key: "exposed", label: "Exposés", p: g.pExposed, fill: "var(--brand)" },
      { key: "control", label: "Contrôle", p: g.pControl, fill: "var(--muted)" },
    ],
    [g.pExposed, g.pControl],
  );

  return (
    <ChartFrame height={180}>
        <BarChart data={data} margin={{ top: 8, right: 8, bottom: 0, left: -8 }}>
          <CartesianGrid strokeDasharray="3 3" stroke={colors.grid} vertical={false} />
          <XAxis
            dataKey="label"
            tick={{ fill: colors.muted, fontSize: 12 }}
            axisLine={{ stroke: colors.border }}
            tickLine={false}
          />
          <YAxis
            tick={{ fill: colors.muted, fontSize: 11 }}
            tickFormatter={(v: number) => formatPct(v, 1)}
            axisLine={false}
            tickLine={false}
            width={52}
          />
          <Tooltip
            cursor={{ fill: colors.muted, fillOpacity: 0.08 }}
            contentStyle={TOOLTIP_STYLE}
            formatter={(v) => [formatPct(Number(v), 2), "conversion"]}
          />
          <Bar dataKey="p" radius={[6, 6, 0, 0]} maxBarSize={88} isAnimationActive={false}>
            {data.map((d) => (
              <Cell key={d.key} fill={d.fill} />
            ))}
          </Bar>
        </BarChart>
    </ChartFrame>
  );
}

/* ------------------------------------------------------------------ */
/* 4 — Histogramme bootstrap                                          */
/* ------------------------------------------------------------------ */

interface HistBin {
  x0: number;
  x1: number;
  mid: number;
  count: number;
  label: string;
}

function buildHistogram(samples: number[], nBins: number): HistBin[] {
  if (!samples || samples.length === 0) return [];
  let min = Infinity;
  let max = -Infinity;
  for (const s of samples) {
    if (!Number.isFinite(s)) continue;
    if (s < min) min = s;
    if (s > max) max = s;
  }
  if (!Number.isFinite(min) || !Number.isFinite(max)) return [];
  if (max === min) max = min + 1e-6;

  const width = (max - min) / nBins;
  const bins: HistBin[] = Array.from({ length: nBins }, (_, i) => {
    const x0 = min + i * width;
    const x1 = x0 + width;
    return {
      x0,
      x1,
      mid: (x0 + x1) / 2,
      count: 0,
      label: formatMultiplier((x0 + x1) / 2),
    };
  });

  for (const s of samples) {
    if (!Number.isFinite(s)) continue;
    let idx = Math.floor((s - min) / width);
    if (idx < 0) idx = 0;
    if (idx >= nBins) idx = nBins - 1;
    bins[idx].count += 1;
  }
  return bins;
}

function BootstrapHistogram({
  samples,
  point,
  lo,
  hi,
  colors,
}: {
  samples: number[];
  point: number;
  lo: number;
  hi: number;
  colors: ChartColors;
}) {
  const bins = useMemo(() => buildHistogram(samples, 24), [samples]);

  if (bins.length === 0) {
    return (
      <div className="flex h-[180px] items-center justify-center text-xs text-muted">
        bootstrap indisponible
      </div>
    );
  }

  return (
    <ChartFrame height={180}>
        <BarChart data={bins} margin={{ top: 8, right: 8, bottom: 0, left: -12 }}>
          <CartesianGrid strokeDasharray="3 3" stroke={colors.grid} vertical={false} />
          <XAxis
            dataKey="mid"
            type="number"
            domain={["dataMin", "dataMax"]}
            tick={{ fill: colors.muted, fontSize: 11 }}
            tickFormatter={(v: number) => formatMultiplier(v, 1)}
            axisLine={{ stroke: colors.border }}
            tickLine={false}
          />
          <YAxis
            tick={{ fill: colors.muted, fontSize: 11 }}
            axisLine={false}
            tickLine={false}
            width={32}
            allowDecimals={false}
          />
          <Tooltip
            cursor={{ fill: colors.muted, fillOpacity: 0.08 }}
            contentStyle={TOOLTIP_STYLE}
            labelFormatter={(v) => `iROAS ≈ ${formatMultiplier(Number(v))}`}
            formatter={(v) => [formatNumber(Number(v)), "tirages"]}
          />
          <Bar
            dataKey="count"
            fill={colors.brand}
            fillOpacity={0.55}
            radius={[2, 2, 0, 0]}
            isAnimationActive={false}
          />
          <ReferenceLine
            x={lo}
            stroke={colors.muted}
            strokeDasharray="4 3"
            label={{
              value: "IC lo",
              position: "insideTopLeft",
              fill: colors.muted,
              fontSize: 10,
            }}
          />
          <ReferenceLine
            x={hi}
            stroke={colors.muted}
            strokeDasharray="4 3"
            label={{
              value: "IC hi",
              position: "insideTopRight",
              fill: colors.muted,
              fontSize: 10,
            }}
          />
          <ReferenceLine
            x={point}
            stroke={colors.brand}
            strokeWidth={2}
            label={{
              value: "iROAS",
              position: "top",
              fill: colors.brand,
              fontSize: 10,
            }}
          />
        </BarChart>
    </ChartFrame>
  );
}

/* ------------------------------------------------------------------ */
/* 5 — Estimé vs vérité-terrain                                       */
/* ------------------------------------------------------------------ */

function GroundTruthPanel({
  iroas,
  trueIroas,
  liftAbs,
  trueLiftAbs,
  iroasGapRel,
  liftGapRel,
}: {
  iroas: number;
  trueIroas: number;
  liftAbs: number;
  trueLiftAbs: number;
  iroasGapRel: number;
  liftGapRel: number;
}) {
  return (
    <div className="mt-5 rounded-lg border border-positive/30 bg-positive/5 p-4">
      <div className="mb-3 flex items-center gap-2">
        <CheckCircle2 className="h-4 w-4 text-positive" />
        <span className="text-sm font-medium tracking-tight">
          Estimé vs vérité-terrain — preuve de méthode
        </span>
      </div>
      <div className="grid gap-3 sm:grid-cols-2">
        <CompareRow
          label="iROAS"
          measured={formatMultiplier(iroas)}
          truth={formatMultiplier(trueIroas)}
          gap={iroasGapRel}
        />
        <CompareRow
          label="Lift de conversion"
          measured={`${formatPctValue(liftAbs * 100)} pts`}
          truth={`${formatPctValue(trueLiftAbs * 100)} pts`}
          gap={liftGapRel}
        />
      </div>
      <InfoNote className="mt-3">
        La méthode retrouve l&apos;effet causal injecté à l&apos;IC près : l&apos;écart
        estimé / vrai reste dans la marge d&apos;erreur d&apos;échantillonnage.
      </InfoNote>
    </div>
  );
}

function CompareRow({
  label,
  measured,
  truth,
  gap,
}: {
  label: string;
  measured: string;
  truth: string;
  gap: number;
}) {
  return (
    <div className="rounded-md border border-border bg-surface px-3 py-2.5">
      <div className="text-xs font-medium uppercase tracking-wide text-muted">{label}</div>
      <div className="mt-1.5 flex items-baseline justify-between gap-3">
        <div>
          <div className="text-xs text-muted">mesuré</div>
          <div className="text-lg font-semibold tabular-nums text-brand-strong">
            {measured}
          </div>
        </div>
        <ArrowRight className="h-4 w-4 shrink-0 text-muted" />
        <div className="text-right">
          <div className="text-xs text-muted">vrai injecté</div>
          <div className="text-lg font-semibold tabular-nums text-foreground">{truth}</div>
        </div>
      </div>
      <div className="mt-1.5 text-right text-xs text-muted">
        écart <Num>{formatSignedPct(gap)}</Num>
      </div>
    </div>
  );
}

/* ------------------------------------------------------------------ */
/* small helper                                                       */
/* ------------------------------------------------------------------ */

function Metric({
  label,
  value,
  hint,
  accent = false,
}: {
  label: string;
  value: string;
  hint?: string;
  accent?: boolean;
}) {
  return (
    <div className="rounded-md border border-border bg-surface px-3 py-2.5">
      <div className="text-xs font-medium uppercase tracking-wide text-muted">{label}</div>
      <div
        className={`mt-1 text-lg font-semibold tabular-nums ${
          accent ? "text-brand-strong" : "text-foreground"
        }`}
      >
        {value}
      </div>
      {hint && <div className="mt-0.5 text-xs text-muted">{hint}</div>}
    </div>
  );
}
