"use client";

import { ArrowRight, TrendingUp, AlertTriangle } from "lucide-react";
import { Card, Pill, Num } from "./ui";
import type { KpiBundle } from "@/lib/types";
import { formatMultiplier, formatPct, formatEuroCompact } from "@/lib/format";

export function CausalHero({ bundle }: { bundle: KpiBundle }) {
  const g = bundle.global;
  const organicShare = g.grossRoas > 0 ? (g.grossRoas - g.iroas) / g.grossRoas : 0;
  const significant = g.pValue < 0.05;
  const profitable = g.iroasCI.lo > 1;
  const maxRoas = Math.max(g.grossRoas, g.iroas, 1);

  return (
    <Card className="overflow-hidden">
      <div className="grid gap-px bg-border md:grid-cols-[1.1fr_1fr]">
        {/* iROAS — the causal truth */}
        <div className="bg-surface p-5">
          <div className="flex items-center justify-between">
            <span className="text-xs font-medium uppercase tracking-wide text-muted">
              iROAS — retour causal
            </span>
            <Pill color={profitable ? "positive" : "muted"}>
              {profitable ? "rentable (IC > 1×)" : "à confirmer"}
            </Pill>
          </div>
          <div className="mt-2 flex items-end gap-3">
            <span className="text-5xl font-semibold tracking-tight text-brand-strong">
              <Num>{formatMultiplier(g.iroas)}</Num>
            </span>
            <span className="mb-1.5 text-sm text-muted">
              IC95 <Num>{formatMultiplier(g.iroasCI.lo)}</Num>–
              <Num>{formatMultiplier(g.iroasCI.hi)}</Num>
            </span>
          </div>
          <div className="mt-2 flex flex-wrap items-center gap-2 text-xs">
            <Pill color={significant ? "positive" : "negative"}>
              {significant ? "significatif · p < 0,05" : "non significatif"}
            </Pill>
            <span className="text-muted">
              {formatEuroCompact(g.incrementalSales)} de ventes incrémentales · lift{" "}
              <Num>{formatPct(g.liftRel, 0)}</Num>
            </span>
          </div>
          <div className="mt-3">
            <Bar label="iROAS (causal)" value={g.iroas} max={maxRoas} color="var(--brand)" />
            <div className="mt-2">
              <Bar
                label="ROAS brut (attribué)"
                value={g.grossRoas}
                max={maxRoas}
                color="var(--muted)"
                muted
              />
            </div>
          </div>
        </div>

        {/* gross vs incremental gap */}
        <div className="bg-surface p-5">
          <span className="text-xs font-medium uppercase tracking-wide text-muted">
            Le ROAS brut surestime
          </span>
          <div className="mt-2 flex items-end gap-2">
            <AlertTriangle className="mb-2 h-5 w-5 text-brand" />
            <span className="text-4xl font-semibold tracking-tight text-foreground">
              <Num>{formatPct(organicShare, 0)}</Num>
            </span>
          </div>
          <p className="mt-2 text-sm leading-relaxed text-muted">
            Le ROAS brut affiché (<Num>{formatMultiplier(g.grossRoas)}</Num>) intègre des
            ventes <span className="text-foreground">organiques</span> qui auraient eu lieu sans
            la campagne. Seul l&apos;iROAS, mesuré <span className="text-foreground">exposés
            vs contrôle</span>, isole l&apos;effet réellement causé.
          </p>
          <div className="mt-3 flex items-center gap-2 rounded-lg border border-border bg-surface-2 px-3 py-2 text-xs">
            <TrendingUp className="h-4 w-4 text-brand" />
            <span className="text-muted">
              Élargir la fenêtre d&apos;attribution gonfle le ROAS brut
            </span>
            <ArrowRight className="h-3 w-3 text-muted" />
            <span className="font-medium text-foreground">l&apos;iROAS reste stable</span>
          </div>
        </div>
      </div>
    </Card>
  );
}

function Bar({
  label,
  value,
  max,
  color,
  muted = false,
}: {
  label: string;
  value: number;
  max: number;
  color: string;
  muted?: boolean;
}) {
  return (
    <div>
      <div className="mb-1 flex items-center justify-between text-xs">
        <span className={muted ? "text-muted" : "font-medium"}>{label}</span>
        <span className="tabular-nums font-medium" style={{ color: muted ? undefined : color }}>
          {formatMultiplier(value)}
        </span>
      </div>
      <div className="h-2.5 w-full overflow-hidden rounded-full bg-surface-2">
        <div
          className="h-full rounded-full transition-all"
          style={{ width: `${Math.max(0, Math.min(1, value / max)) * 100}%`, background: color }}
        />
      </div>
    </div>
  );
}
