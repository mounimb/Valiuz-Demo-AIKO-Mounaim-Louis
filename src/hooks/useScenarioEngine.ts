"use client";

import { useCallback, useDeferredValue, useMemo, useState } from "react";
import { SCENARIOS, SCENARIO_BY_KEY, defaultParams } from "@/lib/scenarios";
import { runEngine } from "@/lib/engine";
import { LEVERS } from "@/lib/types";
import type { LeverKey, LeverValues, ScenarioParams } from "@/lib/types";

/** Rescale the two other lever shares so the three always sum to 1. */
function normalizeShares(shares: LeverValues, lever: LeverKey, value: number): LeverValues {
  const v = Math.max(0, Math.min(1, value));
  const others = LEVERS.filter((l) => l !== lever);
  const rest = 1 - v;
  const otherSum = others.reduce((s, l) => s + shares[l], 0);
  const out: LeverValues = { ...shares, [lever]: v };
  if (otherSum <= 1e-6) {
    others.forEach((l) => (out[l] = rest / others.length));
  } else {
    others.forEach((l) => (out[l] = (rest * shares[l]) / otherSum));
  }
  return out;
}

export function useScenarioEngine() {
  const [scenarioKey, setScenarioKey] = useState<string>(SCENARIOS[0].key);
  const scenario = SCENARIO_BY_KEY[scenarioKey];
  const [params, setParams] = useState<ScenarioParams>(() => defaultParams(SCENARIOS[0]));

  const selectScenario = useCallback((key: string) => {
    setScenarioKey(key);
    setParams(defaultParams(SCENARIO_BY_KEY[key]));
  }, []);

  const updateParams = useCallback(
    (patch: Partial<ScenarioParams>) => setParams((p) => ({ ...p, ...patch })),
    []
  );

  const setLeverShare = useCallback(
    (lever: LeverKey, value: number) =>
      setParams((p) => ({ ...p, leverShares: normalizeShares(p.leverShares, lever, value) })),
    []
  );

  const applyMix = useCallback(
    (mix: LeverValues) => setParams((p) => ({ ...p, leverShares: { ...mix } })),
    []
  );

  const reset = useCallback(() => setParams(defaultParams(scenario)), [scenario]);

  // Defer the heavy recompute so slider dragging stays smooth.
  const deferredParams = useDeferredValue(params);
  const bundle = useMemo(() => runEngine(scenario, deferredParams), [scenario, deferredParams]);
  const isStale = params !== deferredParams;

  return {
    scenario,
    scenarioKey,
    params,
    bundle,
    isStale,
    selectScenario,
    updateParams,
    setLeverShare,
    applyMix,
    reset,
  };
}
