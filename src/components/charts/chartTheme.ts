"use client";

import { useEffect, useState } from "react";
import { useTheme } from "@/components/theme-provider";
import type { LeverKey } from "@/lib/types";

export interface ChartColors {
  onsite: string;
  offsite: string;
  instore: string;
  brand: string;
  foreground: string;
  muted: string;
  border: string;
  grid: string;
  positive: string;
  negative: string;
}

const LIGHT: ChartColors = {
  onsite: "#2f6bff",
  offsite: "#8b5cf6",
  instore: "#f5821f",
  brand: "#f5821f",
  foreground: "#0b0b0c",
  muted: "#687184",
  border: "#e6e7ea",
  grid: "#e6e7ea",
  positive: "#15a34a",
  negative: "#dc2626",
};

function readVar(name: string, fallback: string): string {
  if (typeof window === "undefined") return fallback;
  const v = getComputedStyle(document.documentElement).getPropertyValue(name).trim();
  return v || fallback;
}

export function useChartColors(): ChartColors {
  const { resolvedTheme } = useTheme();
  const [colors, setColors] = useState<ChartColors>(LIGHT);

  useEffect(() => {
    setColors({
      onsite: readVar("--onsite", LIGHT.onsite),
      offsite: readVar("--offsite", LIGHT.offsite),
      instore: readVar("--instore", LIGHT.instore),
      brand: readVar("--brand", LIGHT.brand),
      foreground: readVar("--foreground", LIGHT.foreground),
      muted: readVar("--muted", LIGHT.muted),
      border: readVar("--border", LIGHT.border),
      grid: readVar("--border", LIGHT.grid),
      positive: readVar("--positive", LIGHT.positive),
      negative: readVar("--negative", LIGHT.negative),
    });
  }, [resolvedTheme]);

  return colors;
}

export function leverColor(c: ChartColors, lever: LeverKey): string {
  return c[lever];
}
