/**
 * Exposed-vs-control incrementality (ghost-ads holdout).
 * Estimates the causal lift and validates it against the injected ground truth.
 */

import type { Individual, LeverKey, LeverValues } from "./types";
import { twoProportionZTest } from "./stats";

export interface IncrementalityResult {
  nExposedAssigned: number;
  nExposedTouched: number;
  nControl: number;
  convExposedTouched: number;
  convExposedAssigned: number;
  convControl: number;
  pExposed: number; // per-protocol (touched)
  pExposedITT: number; // intention-to-treat (all assigned)
  pControl: number;
  liftAbs: number;
  liftRel: number;
  liftITT: number;
  zScore: number;
  pValue: number;
  significant: boolean;
  incrementalConversions: number; // measured, per-protocol, panel scale
  trueIncrementalConversions: number; // model-based, panel scale
  perLeverTrueConv: LeverValues; // Σ appliedEffect_l, panel scale (sums to true total)
  avgBasketExposed: number;
}

function touched(p: Individual): boolean {
  return p.exposure.onsite || p.exposure.offsite || p.exposure.instore;
}

export function computeIncrementality(
  inds: Individual[],
  window: number
): IncrementalityResult {
  let nExposedAssigned = 0;
  let nExposedTouched = 0;
  let nControl = 0;
  let convExposedTouched = 0;
  let convExposedAssigned = 0;
  let convControl = 0;
  let basketSum = 0;
  let trueIncr = 0;
  const perLeverTrueConv: LeverValues = { onsite: 0, offsite: 0, instore: 0 };

  for (const p of inds) {
    const cw = p.converted && p.conversionLagDays <= window;
    if (p.group === "control") {
      nControl++;
      if (cw) convControl++;
      continue;
    }
    nExposedAssigned++;
    if (cw) convExposedAssigned++;
    trueIncr +=
      p.appliedEffect.onsite + p.appliedEffect.offsite + p.appliedEffect.instore;
    (Object.keys(perLeverTrueConv) as LeverKey[]).forEach((l) => {
      perLeverTrueConv[l] += p.appliedEffect[l];
    });
    if (touched(p)) {
      nExposedTouched++;
      if (cw) {
        convExposedTouched++;
        basketSum += p.basket;
      }
    }
  }

  const pExposed = nExposedTouched ? convExposedTouched / nExposedTouched : 0;
  const pExposedITT = nExposedAssigned ? convExposedAssigned / nExposedAssigned : 0;
  const pControl = nControl ? convControl / nControl : 0;
  const liftAbs = pExposed - pControl;
  const liftRel = pControl > 0 ? liftAbs / pControl : 0;
  const liftITT = pExposedITT - pControl;
  const zt = twoProportionZTest(
    convExposedTouched,
    nExposedTouched,
    convControl,
    nControl
  );

  return {
    nExposedAssigned,
    nExposedTouched,
    nControl,
    convExposedTouched,
    convExposedAssigned,
    convControl,
    pExposed,
    pExposedITT,
    pControl,
    liftAbs,
    liftRel,
    liftITT,
    zScore: zt.z,
    pValue: zt.pValue,
    significant: zt.significant,
    incrementalConversions: Math.max(0, liftAbs * nExposedTouched),
    trueIncrementalConversions: trueIncr,
    perLeverTrueConv,
    avgBasketExposed: convExposedTouched ? basketSum / convExposedTouched : 0,
  };
}
