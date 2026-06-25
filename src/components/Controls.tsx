"use client";

import { RotateCcw } from "lucide-react";
import { Card, MiniBar } from "./ui";
import { LEVERS, LEVER_LABEL } from "@/lib/types";
import type { AttributionWindow, LeverKey, ScenarioConfig, ScenarioParams } from "@/lib/types";
import { formatNumber } from "@/lib/format";

function Slider({
  label,
  value,
  min,
  max,
  step,
  onChange,
  display,
}: {
  label: string;
  value: number;
  min: number;
  max: number;
  step: number;
  onChange: (v: number) => void;
  display: string;
}) {
  return (
    <div>
      <div className="mb-1 flex items-center justify-between text-xs">
        <span className="font-medium text-foreground">{label}</span>
        <span className="tabular-nums text-muted">{display}</span>
      </div>
      <input
        type="range"
        min={min}
        max={max}
        step={step}
        value={value}
        onChange={(e) => onChange(parseFloat(e.target.value))}
        aria-label={label}
        className="h-1.5 w-full cursor-pointer appearance-none rounded-full bg-surface-2"
        style={{ accentColor: "var(--brand)" }}
      />
    </div>
  );
}

const LEVER_COLOR: Record<LeverKey, string> = {
  onsite: "var(--onsite)",
  offsite: "var(--offsite)",
  instore: "var(--instore)",
};

export function Controls({
  scenario,
  params,
  updateParams,
  setLeverShare,
  reset,
}: {
  scenario: ScenarioConfig;
  params: ScenarioParams;
  updateParams: (patch: Partial<ScenarioParams>) => void;
  setLeverShare: (lever: LeverKey, value: number) => void;
  reset: () => void;
}) {
  const windows: AttributionWindow[] = [7, 14, 30];

  return (
    <Card className="sticky top-[68px] p-4">
      <div className="mb-3 flex items-center justify-between">
        <h3 className="text-sm font-semibold">Paramètres de campagne</h3>
        <button
          type="button"
          onClick={reset}
          className="inline-flex items-center gap-1 text-xs text-muted transition-colors hover:text-foreground"
        >
          <RotateCcw className="h-3 w-3" /> Réinit.
        </button>
      </div>

      <div className="space-y-4">
        <Slider
          label="Budget total"
          value={params.budgetK}
          min={30}
          max={600}
          step={10}
          onChange={(v) => updateParams({ budgetK: v })}
          display={`${params.budgetK} k€`}
        />
        <Slider
          label="Durée"
          value={params.durationWeeks}
          min={2}
          max={16}
          step={1}
          onChange={(v) => updateParams({ durationWeeks: v })}
          display={`${params.durationWeeks} sem.`}
        />
        <Slider
          label="Groupe contrôle (holdout)"
          value={params.controlShare}
          min={0.05}
          max={0.25}
          step={0.01}
          onChange={(v) => updateParams({ controlShare: v })}
          display={`${Math.round(params.controlShare * 100)} %`}
        />

        <div>
          <div className="mb-1 text-xs font-medium">Fenêtre d&apos;attribution</div>
          <div className="flex gap-1 rounded-lg border border-border bg-surface-2 p-0.5">
            {windows.map((w) => (
              <button
                key={w}
                type="button"
                onClick={() => updateParams({ attributionDays: w })}
                className={`flex-1 rounded-md px-2 py-1 text-xs font-medium transition-colors ${
                  params.attributionDays === w
                    ? "bg-brand text-brand-foreground"
                    : "text-muted hover:text-foreground"
                }`}
              >
                {w} j
              </button>
            ))}
          </div>
        </div>

        <div className="border-t border-border pt-3">
          <div className="mb-2 text-xs font-medium">Répartition des leviers</div>
          <div className="space-y-3">
            {LEVERS.map((l) => (
              <div key={l}>
                <div className="mb-1 flex items-center justify-between text-xs">
                  <span className="flex items-center gap-1.5">
                    <span
                      className="h-2 w-2 rounded-full"
                      style={{ background: LEVER_COLOR[l] }}
                    />
                    {LEVER_LABEL[l]}
                  </span>
                  <span className="tabular-nums text-muted">
                    {Math.round(params.leverShares[l] * 100)} %
                  </span>
                </div>
                <input
                  type="range"
                  min={0}
                  max={1}
                  step={0.01}
                  value={params.leverShares[l]}
                  onChange={(e) => setLeverShare(l, parseFloat(e.target.value))}
                  aria-label={`Part ${LEVER_LABEL[l]}`}
                  className="h-1.5 w-full cursor-pointer appearance-none rounded-full bg-surface-2"
                  style={{ accentColor: LEVER_COLOR[l] }}
                />
                <div className="mt-1.5">
                  <MiniBar value={params.leverShares[l]} color={LEVER_COLOR[l]} />
                </div>
              </div>
            ))}
          </div>
        </div>

        <div className="border-t border-border pt-3">
          <Slider
            label="Taille du panel"
            value={params.panelN}
            min={8000}
            max={40000}
            step={1000}
            onChange={(v) => updateParams({ panelN: v })}
            display={`${formatNumber(params.panelN)} ind.`}
          />
        </div>

        <p className="border-t border-border pt-3 text-[11px] leading-relaxed text-muted">
          Scénario : <span className="text-foreground">{scenario.accent}</span>
        </p>
      </div>
    </Card>
  );
}
