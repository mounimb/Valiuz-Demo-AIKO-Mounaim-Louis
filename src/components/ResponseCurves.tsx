"use client";

import {
  CartesianGrid,
  Line,
  LineChart,
  ReferenceLine,
  Tooltip,
  XAxis,
  YAxis,
} from "recharts";
import { Card, SectionHeader, Pill, InfoNote } from "./ui";
import { ChartFrame } from "./ChartFrame";
import { useChartColors, leverColor } from "./charts/chartTheme";
import type { KpiBundle, LeverKey } from "@/lib/types";
import { LEVERS, LEVER_LABEL } from "@/lib/types";
import {
  formatCompact,
  formatEuroCompact,
  formatNumber,
  formatPct,
} from "@/lib/format";

export function ResponseCurves({ bundle }: { bundle: KpiBundle }) {
  const colors = useChartColors();
  const mmm = bundle.mmm;

  const tooltipStyle = {
    background: "var(--surface)",
    border: "1px solid var(--border)",
    borderRadius: 8,
    fontSize: 12,
    color: "var(--foreground)",
  } as const;

  // --- 1. Response curves: merge the 3 series into one dataset, aligned by index.
  // The lever with the most points drives the x (spend) axis.
  const longestLever = LEVERS.reduce<LeverKey>((acc, l) => {
    return mmm.responseCurves[l].length > mmm.responseCurves[acc].length ? l : acc;
  }, "onsite");
  const baseCurve = mmm.responseCurves[longestLever];

  const curveData = baseCurve.map((pt, i) => {
    const row: { spend: number } & Partial<Record<LeverKey, number>> = {
      spend: pt.spend,
    };
    for (const l of LEVERS) {
      const c = mmm.responseCurves[l][i];
      if (c) row[l] = c.response;
    }
    return row;
  });

  // --- 2. Observed vs fitted series.
  const fitData = mmm.dates.map((date, i) => ({
    date,
    observed: mmm.observed[i],
    fitted: mmm.fitted[i],
  }));
  const fitTickInterval = Math.max(0, Math.floor(fitData.length / 7) - 1);

  // --- 3. Estimated vs ground-truth parameters.
  const baselineErr = relErr(mmm.baseline, mmm.trueBaseline);

  return (
    <Card className="p-5">
      <SectionHeader
        act="ACTE 3"
        title="Courbes de réponse & qualité du fit"
        subtitle="Réponse par levier à saturation (rendements marginaux décroissants), β calibrés sur l'incrémentalité mesurée exposés-vs-contrôle."
        right={
          <Pill color={mmm.r2 >= 0.7 ? "positive" : "muted"}>
            R² {formatPct(mmm.r2, 0)}
          </Pill>
        }
      />

      {/* 1. Media response curves */}
      <div className="mb-3 flex flex-wrap items-center gap-x-5 gap-y-1.5 text-xs text-muted">
        {LEVERS.map((l) => (
          <span key={l} className="inline-flex items-center gap-1.5">
            <span
              className="h-2 w-2 rounded-sm"
              style={{ background: leverColor(colors, l) }}
            />
            {LEVER_LABEL[l]}
          </span>
        ))}
        <span className="inline-flex items-center gap-1.5">
          <span
            className="h-2 w-3 rounded-sm border border-dashed"
            style={{ borderColor: colors.muted }}
          />
          point d&apos;opération actuel
        </span>
      </div>
      <ChartFrame height={280}>
          <LineChart data={curveData} margin={{ top: 8, right: 12, bottom: 18, left: 6 }}>
            <CartesianGrid stroke={colors.grid} strokeDasharray="3 3" />
            <XAxis
              dataKey="spend"
              type="number"
              domain={["dataMin", "dataMax"]}
              tickFormatter={(v: number) => formatCompact(v)}
              tick={{ fill: colors.muted, fontSize: 11 }}
              tickLine={false}
              axisLine={{ stroke: colors.border }}
              label={{
                value: "Dépense du levier (€)",
                position: "insideBottom",
                offset: -12,
                fill: colors.muted,
                fontSize: 11,
              }}
            />
            <YAxis
              width={64}
              tickFormatter={(v: number) => formatCompact(v)}
              tick={{ fill: colors.muted, fontSize: 11 }}
              tickLine={false}
              axisLine={false}
              label={{
                value: "Ventes incrémentales",
                angle: -90,
                position: "insideLeft",
                style: { textAnchor: "middle" },
                fill: colors.muted,
                fontSize: 11,
              }}
            />
            <Tooltip
              contentStyle={tooltipStyle}
              labelFormatter={(v) => `Dépense ${formatEuroCompact(Number(v))}`}
              formatter={(value, name) => [
                `${formatCompact(Number(value))} ventes incr.`,
                LEVER_LABEL[name as LeverKey] ?? String(name),
              ]}
            />
            {LEVERS.map((l) => (
              <ReferenceLine
                key={`op-${l}`}
                x={mmm.operatingSpend[l]}
                stroke={leverColor(colors, l)}
                strokeDasharray="4 3"
                strokeOpacity={0.55}
              />
            ))}
            {LEVERS.map((l) => (
              <Line
                key={l}
                type="monotone"
                dataKey={l}
                name={l}
                stroke={leverColor(colors, l)}
                strokeWidth={2}
                dot={false}
                activeDot={{ r: 3 }}
                isAnimationActive={false}
              />
            ))}
          </LineChart>
      </ChartFrame>
      <InfoNote className="mt-2">
        Courbes concaves : rendements marginaux décroissants (saturation Hill). La verticale
        pointillée marque la dépense d&apos;opération actuelle de chaque levier.
      </InfoNote>

      <div className="mt-4 rounded-xl border border-border bg-surface-2 p-4">
        <div className="mb-3 flex flex-wrap items-center gap-x-5 gap-y-1.5 text-xs text-muted">
          <span className="font-medium uppercase tracking-wide">Observé vs ajusté</span>
          <span className="inline-flex items-center gap-1.5">
            <span className="h-2 w-2 rounded-sm" style={{ background: colors.muted }} />
            observé
          </span>
          <span className="inline-flex items-center gap-1.5">
            <span className="h-2 w-2 rounded-sm" style={{ background: colors.brand }} />
            ajusté (modèle)
          </span>
        </div>
        <ChartFrame height={200}>
            <LineChart data={fitData} margin={{ top: 8, right: 12, bottom: 18, left: 6 }}>
              <CartesianGrid stroke={colors.grid} strokeDasharray="3 3" />
              <XAxis
                dataKey="date"
                interval={fitTickInterval}
                tick={{ fill: colors.muted, fontSize: 11 }}
                tickLine={false}
                axisLine={{ stroke: colors.border }}
                label={{
                  value: "Semaine",
                  position: "insideBottom",
                  offset: -12,
                  fill: colors.muted,
                  fontSize: 11,
                }}
              />
              <YAxis
                width={64}
                tickFormatter={(v: number) => formatCompact(v)}
                tick={{ fill: colors.muted, fontSize: 11 }}
                tickLine={false}
                axisLine={false}
                label={{
                  value: "Ventes hebdo",
                  angle: -90,
                  position: "insideLeft",
                  style: { textAnchor: "middle" },
                  fill: colors.muted,
                  fontSize: 11,
                }}
              />
              <Tooltip
                contentStyle={tooltipStyle}
                formatter={(value, name) => [
                  formatCompact(Number(value)),
                  name === "observed" ? "observé" : "ajusté",
                ]}
              />
              <Line
                type="monotone"
                dataKey="observed"
                stroke={colors.muted}
                strokeWidth={1.5}
                dot={false}
                isAnimationActive={false}
              />
              <Line
                type="monotone"
                dataKey="fitted"
                stroke={colors.brand}
                strokeWidth={1.5}
                dot={false}
                isAnimationActive={false}
              />
            </LineChart>
        </ChartFrame>
      </div>

      {/* 3. Estimated vs ground-truth parameters */}
      <div className="mt-6 overflow-x-auto rounded-xl border border-border">
        <table className="w-full text-sm">
          <thead>
            <tr className="border-b border-border bg-surface-2 text-left text-xs uppercase tracking-wide text-muted">
              <th className="px-3 py-2 font-medium">Levier</th>
              <th className="px-3 py-2 text-right font-medium">K saturation</th>
              <th className="px-3 py-2 text-right font-medium">β</th>
            </tr>
          </thead>
          <tbody>
            {LEVERS.map((l) => {
              const est = mmm.params[l];
              const tru = mmm.trueParams[l];
              return (
                <tr key={l} className="border-b border-border last:border-0">
                  <td className="px-3 py-2 font-medium">
                    <span className="inline-flex items-center gap-1.5">
                      <span
                        className="h-2 w-2 rounded-sm"
                        style={{ background: leverColor(colors, l) }}
                      />
                      {LEVER_LABEL[l]}
                    </span>
                  </td>
                  <ParamCell est={est.K} tru={tru.K} fmt={(v) => formatNumber(v, 2)} />
                  <ParamCell est={est.beta} tru={tru.beta} fmt={(v) => formatCompact(v)} />
                </tr>
              );
            })}
            <tr className="bg-surface-2">
              <td className="px-3 py-2 font-medium">Baseline organique</td>
              <td
                colSpan={2}
                className="px-3 py-2 text-right tabular-nums"
                title="estimée vs vérité-terrain"
              >
                <span style={{ color: errColor(colors, baselineErr) }}>
                  {formatEuroCompact(mmm.baseline)}
                </span>
                <span className="text-muted">
                  {" "}
                  vs {formatEuroCompact(mmm.trueBaseline)}{" "}
                  <span style={{ color: errColor(colors, baselineErr) }}>
                    ({formatPct(baselineErr, 0)} écart)
                  </span>
                </span>
              </td>
            </tr>
          </tbody>
        </table>
      </div>
      <InfoNote className="mt-2">
        Chaque cellule affiche la valeur <span className="text-foreground">estimée</span> (en gras)
        au-dessus de la <span className="text-foreground">vérité-terrain</span> injectée ; la couleur
        reflète la proximité (vert = proche, rouge = éloigné).
      </InfoNote>

      {/* 4. Honest caveat */}
      <InfoNote className="mt-5">
        La saturation est bornée à des plages plausibles
        (<span className="text-foreground">priors informés</span>) ; les magnitudes par levier sont
        calibrées sur l&apos;incrémentalité mesurée exposés-vs-contrôle — comme on calibre un modèle sur
        des lift tests. Le modèle agrégé reste <span className="text-foreground">corrélationnel</span> ;
        l&apos;incrémentalité test/contrôle est la <span className="text-foreground">référence
        causale</span>.
      </InfoNote>
    </Card>
  );
}

/** Two-line cell: estimated value (bold, colored by proximity) over ground truth. */
function ParamCell({
  est,
  tru,
  fmt,
}: {
  est: number;
  tru: number;
  fmt: (v: number) => string;
}) {
  const colors = useChartColors();
  const err = relErr(est, tru);
  return (
    <td className="px-3 py-2 text-right align-top tabular-nums">
      <div className="font-medium" style={{ color: errColor(colors, err) }}>
        {fmt(est)}
      </div>
      <div className="text-xs text-muted">vs {fmt(tru)}</div>
    </td>
  );
}

/** Relative error |est − true| / |true| (capped, NaN-safe). */
function relErr(est: number, tru: number): number {
  if (!Number.isFinite(est) || !Number.isFinite(tru) || tru === 0) return 0;
  return Math.abs(est - tru) / Math.abs(tru);
}

/** Green when close, muted when middling, red when far. */
function errColor(
  colors: { positive: string; muted: string; negative: string },
  err: number,
): string {
  if (err <= 0.1) return colors.positive;
  if (err >= 0.3) return colors.negative;
  return colors.muted;
}
