import { Pill, InfoNote } from "./ui";
import type { KpiBundle } from "@/lib/types";
import {
  formatEuro,
  formatEuroCompact,
  formatCompact,
  formatPct,
  formatMultiplier,
} from "@/lib/format";

/**
 * Arborescence des 8 indicateurs certifiés CESP — « la carte des relations ».
 * Un seul arbre : la dépense média en racine, qui se décline en branches.
 *   DÉPENSE ─┬─ ① Reach ──────────────────────────────► ⑧ Nouveaux acheteurs
 *            ├─ Impressions → ② CPM
 *            └─ ③ CTR → Clics → ④ CPC
 *                          ↓
 *                     ⑤ Add-to-cart → Ventes ─┬─ ⑥ ROAS brut
 *                                              └─ ⑦ iROAS (seul juge causal)
 * Valeurs branchées en direct sur le scénario courant.
 */

type Variant = "input" | "cost" | "engagement" | "impact" | "judge";

const ACCENT: Record<Variant, string> = {
  input: "var(--muted)",
  cost: "var(--brand)",
  engagement: "var(--brand)",
  impact: "var(--positive)",
  judge: "var(--brand)",
};

const W = 188;

function NodeBox({
  cx,
  ty,
  w = W,
  h = 74,
  num,
  title,
  value,
  sub,
  variant,
}: {
  cx: number;
  ty: number;
  w?: number;
  h?: number;
  num?: string;
  title: string;
  value: string;
  sub?: string;
  variant: Variant;
}) {
  const accent = ACCENT[variant];
  const judge = variant === "judge";
  const input = variant === "input";
  const x = cx - w / 2;
  return (
    <g>
      <rect
        x={x}
        y={ty}
        width={w}
        height={h}
        rx={9}
        fill={judge ? "color-mix(in srgb, var(--brand) 8%, var(--surface))" : input ? "var(--surface-2)" : "var(--surface)"}
        stroke={judge ? "var(--brand)" : "var(--border)"}
        strokeWidth={judge ? 1.6 : 1}
        strokeDasharray={input ? "4 3" : undefined}
      />
      <text
        x={cx}
        y={ty + 18}
        textAnchor="middle"
        fontSize={11}
        fontWeight={600}
        fill={input ? "var(--muted)" : accent}
      >
        {num ? `${num} ` : ""}
        <tspan fill={input ? "var(--muted)" : "var(--foreground)"}>{title}</tspan>
        {input ? <tspan fill="var(--muted)" fontWeight={400}>{"  · entrée"}</tspan> : null}
      </text>
      <text
        x={cx}
        y={ty + 40}
        textAnchor="middle"
        fontSize={17}
        fontWeight={700}
        fill={judge ? "var(--brand-strong)" : "var(--foreground)"}
        style={{ fontVariantNumeric: "tabular-nums" }}
      >
        {value}
      </text>
      {sub && (
        <text x={cx} y={ty + 58} textAnchor="middle" fontSize={9.5} fill="var(--muted)">
          {sub}
        </text>
      )}
    </g>
  );
}

function Line({ d }: { d: string }) {
  return <path d={d} fill="none" stroke="var(--border)" strokeWidth={1.5} />;
}

export function IndicatorLogicMap({ bundle }: { bundle: KpiBundle }) {
  const { cesp, reach, global: g, newToBrandRate } = bundle;
  const clicks = Number.isFinite(cesp.ctr)
    ? Math.round(cesp.ctr * reach.totalImpressions)
    : NaN;
  const cpcVal = cesp.cpc > 0 && Number.isFinite(cesp.cpc) ? formatEuro(cesp.cpc, 2) : "—";

  return (
    <div className="rounded-xl border border-border bg-surface-2 p-4">
      <div className="mb-3 flex flex-wrap items-center justify-between gap-3">
        <span className="text-xs font-medium uppercase tracking-wide text-muted">
          8 indicateurs certifiés · la carte des relations
        </span>
        <Pill color="positive">certifié CESP · eRetail Data Trust</Pill>
      </div>

      <svg
        viewBox="0 0 720 770"
        className="w-full"
        style={{ fontFamily: "inherit", height: "auto" }}
        role="img"
        aria-label="Arborescence des 8 indicateurs certifiés"
      >
        {/* ---- Connecteurs ---- */}
        {/* Racine → bus de répartition */}
        <Line d="M360 72 L360 96" />
        <Line d="M110 96 L610 96" />
        <Line d="M110 96 L110 122" />
        <Line d="M360 96 L360 122" />
        <Line d="M610 96 L610 122" />

        {/* Branche centrale : Impressions → CPM (à droite) */}
        <Line d="M452 159 L518 159" />
        {/* Impressions → CTR */}
        <Line d="M360 196 L360 230" />
        {/* CTR → Clics */}
        <Line d="M360 304 L360 338" />
        {/* Clics → CPC (droite) */}
        <Line d="M452 375 L518 375" />
        {/* Clics → Add-to-cart */}
        <Line d="M360 412 L360 446" />
        {/* Add-to-cart → Ventes */}
        <Line d="M360 520 L360 554" />
        {/* Ventes → split ROAS / iROAS */}
        <Line d="M360 628 L360 650" />
        <Line d="M300 650 L500 650" />
        <Line d="M300 650 L300 662" />
        <Line d="M500 650 L500 662" />

        {/* Rail gauche : Reach ─────► Nouveaux acheteurs (parmi les acheteurs) */}
        <Line d="M110 196 L110 662" />
        <text x={118} y={430} fontSize={9.5} fill="var(--muted)">
          <tspan x={118} dy={0}>parmi</tspan>
          <tspan x={118} dy={12}>les</tspan>
          <tspan x={118} dy={12}>acheteurs</tspan>
        </text>

        {/* ---- Racine ---- */}
        <g>
          <rect x={260} y={22} width={200} height={50} rx={9} fill="var(--surface)" stroke="var(--border)" />
          <text x={360} y={40} textAnchor="middle" fontSize={11} fontWeight={600} fill="var(--muted)">
            DÉPENSE MÉDIA
          </text>
          <text x={360} y={61} textAnchor="middle" fontSize={17} fontWeight={700} fill="var(--foreground)" style={{ fontVariantNumeric: "tabular-nums" }}>
            {formatEuro(g.totalSpend)}
          </text>
        </g>

        {/* ---- Niveau 1 : Reach / Impressions / CPM ---- */}
        <NodeBox cx={110} ty={122} num="①" title="Reach" value={formatCompact(cesp.reach)} sub="personnes uniques" variant="cost" />
        <NodeBox cx={360} ty={122} title="Impressions" value={formatCompact(reach.totalImpressions)} sub={`Reach × fréquence ${formatMultiplier(reach.dedupFrequency, 1)}`} variant="input" />
        <NodeBox cx={610} ty={122} num="②" title="CPM" value={formatEuro(cesp.cpm, 2)} sub="dépense ÷ impr. × 1000" variant="cost" />

        {/* ---- Niveau 2 : CTR ---- */}
        <NodeBox cx={360} ty={230} num="③" title="CTR" value={formatPct(cesp.ctr)} sub="clics ÷ impressions" variant="engagement" />

        {/* ---- Niveau 3 : Clics → CPC ---- */}
        <NodeBox cx={360} ty={338} title="Clics" value={formatCompact(clicks)} sub="CTR × impressions" variant="input" />
        <NodeBox cx={610} ty={338} num="④" title="CPC" value={cpcVal} sub="dépense ÷ clics" variant="engagement" />

        {/* ---- Niveau 4 : Add-to-cart ---- */}
        <NodeBox cx={360} ty={446} num="⑤" title="Add-to-cart" value={formatPct(cesp.addToCart)} sub="ajouts panier ÷ exposés" variant="engagement" />

        {/* ---- Niveau 5 : Ventes attribuées ---- */}
        <NodeBox cx={360} ty={554} title="Ventes attribuées" value={formatEuroCompact(g.grossAttributedSales)} sub="CA rattaché (closed-loop)" variant="input" />

        {/* ---- Niveau 6 : ROAS / iROAS + Nouveaux acheteurs ---- */}
        <NodeBox cx={300} ty={662} w={196} num="⑥" title="ROAS brut" value={formatMultiplier(cesp.roas)} sub="ventes ÷ dépense · corrélationnel ⚠" variant="impact" />
        <NodeBox cx={500} ty={662} w={196} num="⑦" title="iROAS  ★" value={formatMultiplier(cesp.iroas)} sub="ventes incrém. ÷ dépense · causal" variant="judge" />
        <NodeBox cx={110} ty={662} num="⑧" title="Nouv. acheteurs" value={formatCompact(cesp.newBuyers)} sub={`${formatPct(newToBrandRate)} new-to-brand`} variant="impact" />
      </svg>

      {/* Légende */}
      <div className="mt-3 flex flex-wrap items-center gap-x-4 gap-y-1 text-[11px] text-muted">
        <span className="inline-flex items-center gap-1.5">
          <span className="inline-block h-3 w-4 rounded border border-border bg-surface" /> indicateur certifié ①–⑧
        </span>
        <span className="inline-flex items-center gap-1.5">
          <span className="inline-block h-3 w-4 rounded border border-dashed border-border bg-surface-2" /> donnée d&apos;entrée
        </span>
        <span className="inline-flex items-center gap-1.5">
          <span className="inline-block h-3 w-4 rounded border border-brand bg-brand/10" /> ★ juge causal
        </span>
      </div>

      {/* Verdict */}
      <InfoNote className="mt-3">
        Les 7 premiers indicateurs peuvent tous être au vert{" "}
        <span className="text-foreground">sans</span> que la campagne soit rentable. Seul l&apos;
        <span className="font-semibold text-brand-strong">iROAS</span> est{" "}
        <span className="text-foreground">causal</span> : il isole les ventes réellement provoquées
        par la pub — c&apos;est lui qui tranche. L&apos;écart{" "}
        <span className="tabular-nums">{formatMultiplier(cesp.roas)}</span> →{" "}
        <span className="tabular-nums">{formatMultiplier(cesp.iroas)}</span> mesure le
        sur-comptage du ROAS brut.
      </InfoNote>
    </div>
  );
}
