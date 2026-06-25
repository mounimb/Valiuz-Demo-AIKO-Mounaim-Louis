"use client";

import { ShieldCheck } from "lucide-react";
import { ScenarioSelector } from "./ScenarioSelector";
import { ThemeToggle } from "./ThemeToggle";
import { ValiuzLogo } from "./ValiuzLogo";
import { Pill } from "./ui";

export function Header({
  scenarioKey,
  onSelect,
}: {
  scenarioKey: string;
  onSelect: (key: string) => void;
}) {
  return (
    <header className="sticky top-0 z-20 border-b border-border bg-background/85 backdrop-blur">
      <div className="mx-auto flex max-w-[1500px] flex-wrap items-center gap-x-4 gap-y-2 px-5 py-3">
        <div className="flex items-center gap-2.5">
          <ValiuzLogo size="md" priority />
          <div className="leading-tight">
            <div className="text-sm font-semibold tracking-tight">
              Connect <span className="text-muted">· Studio de Mesure</span>
            </div>
            <div className="text-[11px] text-muted">
              Mesure multi-levier — on-site · off-site · in-store / DOOH
            </div>
          </div>
        </div>

        <div className="ml-auto flex flex-wrap items-center gap-2">
          <ScenarioSelector scenarioKey={scenarioKey} onSelect={onSelect} />
          <Pill color="positive">
            <ShieldCheck className="h-3 w-3" /> CESP · RGPD
          </Pill>
          <ThemeToggle />
        </div>
      </div>
    </header>
  );
}
