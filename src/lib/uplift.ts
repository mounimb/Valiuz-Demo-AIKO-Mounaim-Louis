/**
 * Heterogeneous treatment effect by segment (stratified T-learner CATE),
 * with persuadable / sure-thing / lost-cause classification and validation
 * against the injected per-segment ground truth.
 */

import type { Individual, Segment, SegmentMetrics } from "./types";
import { SEGMENTS } from "./types";

interface Agg {
  nExp: number;
  convExp: number;
  nCtrl: number;
  convCtrl: number;
  trueEffectSum: number;
  trueEffectN: number;
  baselineSum: number;
  n: number;
}

export function computeUplift(inds: Individual[], window: number): SegmentMetrics[] {
  const agg: Record<Segment, Agg> = {} as Record<Segment, Agg>;
  for (const s of SEGMENTS) {
    agg[s] = {
      nExp: 0,
      convExp: 0,
      nCtrl: 0,
      convCtrl: 0,
      trueEffectSum: 0,
      trueEffectN: 0,
      baselineSum: 0,
      n: 0,
    };
  }

  let total = 0;
  for (const p of inds) {
    const a = agg[p.segment];
    a.n++;
    total++;
    a.baselineSum += p.baselineP;
    const cw = p.converted && p.conversionLagDays <= window;
    if (p.group === "control") {
      a.nCtrl++;
      if (cw) a.convCtrl++;
    } else {
      const touched = p.exposure.onsite || p.exposure.offsite || p.exposure.instore;
      if (touched) {
        a.nExp++;
        if (cw) a.convExp++;
        a.trueEffectSum +=
          p.appliedEffect.onsite + p.appliedEffect.offsite + p.appliedEffect.instore;
        a.trueEffectN++;
      }
    }
  }

  const out: SegmentMetrics[] = SEGMENTS.map((segment) => {
    const a = agg[segment];
    const pExposed = a.nExp ? a.convExp / a.nExp : 0;
    const pControl = a.nCtrl ? a.convCtrl / a.nCtrl : 0;
    const cate = pExposed - pControl;
    const trueCate = a.trueEffectN ? a.trueEffectSum / a.trueEffectN : 0;
    const baseline = a.n ? a.baselineSum / a.n : 0;

    let upliftClass: SegmentMetrics["upliftClass"];
    if (cate < -0.0005) upliftClass = "sleeping-dog";
    else if (cate >= 0.012) upliftClass = "persuadable";
    else if (baseline >= 0.06) upliftClass = "sure-thing";
    else upliftClass = "lost-cause";

    return {
      segment,
      n: a.n,
      share: total ? a.n / total : 0,
      pExposed,
      pControl,
      cate,
      trueCate,
      upliftClass,
    };
  });

  return out.sort((a, b) => b.cate - a.cate);
}
