"use client";

import { useEffect, useRef, useState } from "react";
import { ChevronDown, Check } from "lucide-react";
import { SCENARIOS } from "@/lib/scenarios";
import { LEVER_LABEL } from "@/lib/types";

export function ScenarioSelector({
  scenarioKey,
  onSelect,
}: {
  scenarioKey: string;
  onSelect: (key: string) => void;
}) {
  const [open, setOpen] = useState(false);
  const ref = useRef<HTMLDivElement>(null);
  const current = SCENARIOS.find((s) => s.key === scenarioKey) ?? SCENARIOS[0];

  useEffect(() => {
    function onClick(e: MouseEvent) {
      if (ref.current && !ref.current.contains(e.target as Node)) setOpen(false);
    }
    document.addEventListener("mousedown", onClick);
    return () => document.removeEventListener("mousedown", onClick);
  }, []);

  return (
    <div className="relative" ref={ref}>
      <button
        type="button"
        onClick={() => setOpen((o) => !o)}
        className="flex items-center gap-2 rounded-lg border border-border bg-surface px-3 py-1.5 text-sm font-medium transition-colors hover:bg-surface-2"
      >
        <span className="h-2 w-2 rounded-full bg-brand" />
        <span>{current.enseigne}</span>
        <span className="text-muted">· {current.brand}</span>
        <ChevronDown className="h-4 w-4 text-muted" />
      </button>

      {open && (
        <div className="absolute left-0 z-30 mt-2 w-80 overflow-hidden rounded-xl border border-border bg-surface shadow-xl">
          {SCENARIOS.map((s) => {
            const active = s.key === scenarioKey;
            return (
              <button
                key={s.key}
                type="button"
                onClick={() => {
                  onSelect(s.key);
                  setOpen(false);
                }}
                className={`flex w-full items-start gap-3 px-3 py-2.5 text-left transition-colors hover:bg-surface-2 ${
                  active ? "bg-surface-2" : ""
                }`}
              >
                <div className="mt-0.5 w-4">
                  {active && <Check className="h-4 w-4 text-brand" />}
                </div>
                <div className="min-w-0">
                  <div className="flex items-center gap-2 text-sm font-medium">
                    {s.enseigne}
                    <span className="text-muted">· {s.brand}</span>
                  </div>
                  <div className="mt-0.5 text-xs text-muted">
                    {s.defaultBudgetK} k€ · {s.defaultDurationWeeks} sem. ·{" "}
                    {Math.round(s.defaultLeverShares.onsite * 100)}/
                    {Math.round(s.defaultLeverShares.offsite * 100)}/
                    {Math.round(s.defaultLeverShares.instore * 100)}{" "}
                    {LEVER_LABEL.onsite.toLowerCase()}/off/in-store
                  </div>
                </div>
              </button>
            );
          })}
        </div>
      )}
    </div>
  );
}
