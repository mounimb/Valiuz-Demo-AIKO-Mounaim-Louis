"use client";

import type { ReactNode } from "react";
import { Card, SectionHeader, Pill, Num, MiniBar, InfoNote } from "./ui";
import {
  LEVER_LABEL,
  LEVERS,
  type KpiBundle,
  type LeverKey,
  type PerLeverMetrics,
  type OverlapRegion,
} from "@/lib/types";
import {
  formatEuro,
  formatEuroCompact,
  formatCompact,
  formatPct,
  formatMultiplier,
} from "@/lib/format";

const LEVER_VAR: Record<LeverKey, string> = {
  onsite: "var(--onsite)",
  offsite: "var(--offsite)",
  instore: "var(--instore)",
};

const LEVER_TEXT: Record<LeverKey, string> = {
  onsite: "text-onsite",
  offsite: "text-offsite",
  instore: "text-instore",
};

const LEVER_PILL: Record<LeverKey, "onsite" | "offsite" | "instore"> = {
  onsite: "onsite",
  offsite: "offsite",
  instore: "instore",
};

export function MultiLeverDashboard({ bundle }: { bundle: KpiBundle }) {
  const totalSpend = bundle.global.totalSpend;
  const byLever = (k: LeverKey): PerLeverMetrics | undefined =>
    bundle.perLever.find((p) => p.lever === k);

  const reach = bundle.reach;

  return (
    <Card className="p-5">
      <SectionHeader
        title="Détail par levier & déduplication cross-levier"
        subtitle="Performance isolée de chaque levier (on-site, off-site, in-store/DOOH), puis reach unifié sans double-comptage et effet de halo entre leviers."
      />

      {/* 1. Three lever columns */}
      <div className="grid gap-4 md:grid-cols-3">
        {LEVERS.map((k) => {
          const m = byLever(k);
          if (!m) {
            return (
              <div
                key={k}
                className="rounded-xl border border-border bg-surface-2 p-4 text-sm text-muted"
              >
                {LEVER_LABEL[k]} — données indisponibles
              </div>
            );
          }
          const budgetShare = totalSpend > 0 ? m.spend / totalSpend : 0;
          const noClick = m.ctr === 0;
          return (
            <div
              key={k}
              className="flex flex-col rounded-xl border-l-2 border border-border bg-surface p-4"
              style={{ borderLeftColor: LEVER_VAR[k] }}
            >
              {/* header */}
              <div className="flex items-center justify-between gap-2">
                <span className={`text-sm font-semibold ${LEVER_TEXT[k]}`}>
                  {LEVER_LABEL[k]}
                </span>
                <Pill color={LEVER_PILL[k]}>{formatPct(budgetShare, 0)} du budget</Pill>
              </div>

              {/* iROAS — big, lever color */}
              <div className="mt-3">
                <div className="text-xs font-medium uppercase tracking-wide text-muted">
                  iROAS
                </div>
                <div className="mt-0.5 flex items-end gap-2">
                  <span
                    className="text-3xl font-semibold tracking-tight tabular-nums"
                    style={{ color: LEVER_VAR[k] }}
                  >
                    <Num>{formatMultiplier(m.iroas)}</Num>
                  </span>
                  <span className="mb-1 text-xs text-muted">
                    IC95 <Num>{formatMultiplier(m.iroasCI.lo)}</Num>–
                    <Num>{formatMultiplier(m.iroasCI.hi)}</Num>
                  </span>
                </div>
              </div>

              {/* metric rows */}
              <dl className="mt-3 space-y-1.5 text-xs">
                <Row label="Investissement" value={formatEuro(m.spend)} />
                <Row label="Impressions" value={formatCompact(m.impressions)} />
                <Row label="Reach" value={formatCompact(m.reach)} />
                <Row label="CPM" value={formatEuro(m.cpm, 2)} />
                <Row
                  label="CTR"
                  value={noClick ? "—" : formatPct(m.ctr)}
                />
              </dl>

              {noClick && (
                <InfoNote className="mt-1">DOOH : pas de clic.</InfoNote>
              )}

              {/* contribution to incremental sales */}
              <div className="mt-3">
                <div className="mb-1 flex items-baseline justify-between text-xs">
                  <span className="text-muted">Contribution aux ventes incr.</span>
                  <span
                    className="font-medium tabular-nums"
                    style={{ color: LEVER_VAR[k] }}
                  >
                    {formatPct(m.contributionShare)}
                  </span>
                </div>
                <MiniBar value={m.contributionShare} color={LEVER_VAR[k]} />
              </div>

              {k === "instore" && (
                <div className="mt-3">
                  <Pill color="instore">100 % mesuré (caisse + fidélité)</Pill>
                </div>
              )}
            </div>
          );
        })}
      </div>

      {/* 2. Cross-lever dedup reach & frequency */}
      <div className="mt-6 rounded-xl border border-border bg-surface-2/40 p-4">
        <div className="flex flex-wrap items-baseline justify-between gap-3">
          <h3 className="text-sm font-semibold tracking-tight">
            Déduplication reach &amp; fréquence cross-levier
          </h3>
          <div className="flex flex-wrap items-center gap-x-5 gap-y-1 text-xs text-muted">
            <span>
              <Num className="text-base font-semibold text-foreground">
                {formatCompact(reach.dedupReach)}
              </Num>{" "}
              clients uniques touchés
            </span>
            <span>
              fréquence moy. dédupliquée{" "}
              <Num className="font-semibold text-foreground">
                {formatMultiplier(reach.dedupFrequency, 1)}
              </Num>
            </span>
          </div>
        </div>

        <InfoNote className="mt-1">
          Un individu multi-exposé (touché par plusieurs leviers) est compté{" "}
          <span className="font-medium text-foreground">une seule fois</span>.
        </InfoNote>

        <OverlapMatrix overlap={reach.overlap} />
      </div>

      {/* 3. RGPD off-site cap + 4. Halo, side by side */}
      <div className="mt-4 grid gap-4 md:grid-cols-2">
        <OffsiteCap
          offsiteReach={reach.offsiteReach}
          offsiteCapReach={reach.offsiteCapReach}
        />
        <HaloBlock
          monoSales={reach.haloMonoIncrSales}
          crossSales={reach.haloCrossIncrSales}
          synergyPct={reach.haloSynergyPct}
        />
      </div>
    </Card>
  );
}

function Row({ label, value }: { label: string; value: ReactNode }) {
  return (
    <div className="flex items-baseline justify-between">
      <dt className="text-muted">{label}</dt>
      <dd className="font-medium tabular-nums">{value}</dd>
    </div>
  );
}

/* ---------- Overlap matrix (mono-lever vs combinations) ---------- */

function overlapLabel(levers: LeverKey[]): string {
  return levers.map((l) => LEVER_LABEL[l]).join(" + ");
}

function OverlapMatrix({ overlap }: { overlap: OverlapRegion[] }) {
  const rows = [...overlap]
    .filter((r) => r.levers.length > 0)
    .sort((a, b) => b.count - a.count);
  const max = rows.reduce((acc, r) => Math.max(acc, r.count), 0);

  if (rows.length === 0) {
    return <InfoNote className="mt-3">Aucune région de chevauchement.</InfoNote>;
  }

  return (
    <div className="mt-3 space-y-2">
      {rows.map((r) => {
        const mono = r.levers.length === 1;
        const color = mono ? LEVER_VAR[r.levers[0]] : "var(--brand)";
        return (
          <div key={r.key} className="grid grid-cols-[10.5rem_1fr_auto] items-center gap-3">
            <span className="flex items-center gap-1.5 truncate text-xs">
              {!mono && <Pill color="brand">multi</Pill>}
              <span className={mono ? "text-muted" : "font-medium"}>
                {overlapLabel(r.levers)}
              </span>
            </span>
            <MiniBar value={max > 0 ? r.count / max : 0} color={color} />
            <span className="w-14 text-right text-xs font-medium tabular-nums">
              {formatCompact(r.count)}
            </span>
          </div>
        );
      })}
    </div>
  );
}

/* ---------- Off-site RGPD cap ---------- */

function OffsiteCap({
  offsiteReach,
  offsiteCapReach,
}: {
  offsiteReach: number;
  offsiteCapReach: number;
}) {
  const max = Math.max(offsiteReach, offsiteCapReach, 1);
  const headroom = offsiteCapReach - offsiteReach;
  return (
    <div className="rounded-xl border border-border bg-surface p-4">
      <div className="flex items-center justify-between gap-2">
        <h3 className="text-sm font-semibold tracking-tight">Plafond off-site (RGPD)</h3>
        <Pill color="offsite">opt-in</Pill>
      </div>
      <p className="mt-1 text-xs text-muted">
        Le reach off-site activable est plafonné par le 2nd consentement.
      </p>

      <div className="mt-3 space-y-2.5">
        <BarRow
          label="Reach off-site actuel"
          value={formatCompact(offsiteReach)}
          ratio={offsiteReach / max}
          color="var(--offsite)"
        />
        <BarRow
          label="Plafond activable (opt-in)"
          value={formatCompact(offsiteCapReach)}
          ratio={offsiteCapReach / max}
          color="var(--muted)"
          muted
        />
      </div>

      <div className="mt-3 flex flex-wrap items-center gap-2">
        <Pill color="offsite">activable plafonné par le 2nd consentement (opt-in)</Pill>
        {headroom > 0 && (
          <span className="text-xs text-muted">
            marge restante <Num>{formatCompact(headroom)}</Num>
          </span>
        )}
      </div>
    </div>
  );
}

/* ---------- Halo / cross-lever ---------- */

function HaloBlock({
  monoSales,
  crossSales,
  synergyPct,
}: {
  monoSales: number;
  crossSales: number;
  synergyPct: number;
}) {
  const max = Math.max(monoSales, crossSales, 1);
  return (
    <div className="rounded-xl border border-border bg-surface p-4">
      <div className="flex items-center justify-between gap-2">
        <h3 className="text-sm font-semibold tracking-tight">Effet de halo / cross-levier</h3>
        <Pill color="brand">{formatPct(synergyPct)} de synergie</Pill>
      </div>
      <p className="mt-1 text-xs text-muted">
        <Num className="font-medium text-foreground">{formatPct(synergyPct)}</Num> des ventes
        incrémentales proviennent de clients exposés à{" "}
        <span className="font-medium text-foreground">≥ 2 leviers</span>.
      </p>

      <div className="mt-3 space-y-2.5">
        <BarRow
          label="Ventes incr. — multi-exposés (halo)"
          value={formatEuroCompact(crossSales)}
          ratio={crossSales / max}
          color="var(--brand)"
        />
        <BarRow
          label="Ventes incr. — mono-levier"
          value={formatEuroCompact(monoSales)}
          ratio={monoSales / max}
          color="var(--muted)"
          muted
        />
      </div>
    </div>
  );
}

/* ---------- Shared labeled bar (CausalHero style) ---------- */

function BarRow({
  label,
  value,
  ratio,
  color,
  muted = false,
}: {
  label: string;
  value: ReactNode;
  ratio: number;
  color: string;
  muted?: boolean;
}) {
  return (
    <div>
      <div className="mb-1 flex items-center justify-between gap-2 text-xs">
        <span className={muted ? "text-muted" : "font-medium"}>{label}</span>
        <span
          className="font-medium tabular-nums"
          style={{ color: muted ? undefined : color }}
        >
          {value}
        </span>
      </div>
      <div className="h-2.5 w-full overflow-hidden rounded-full bg-surface-2">
        <div
          className="h-full rounded-full transition-all"
          style={{
            width: `${Math.max(0, Math.min(1, ratio)) * 100}%`,
            background: color,
          }}
        />
      </div>
    </div>
  );
}
