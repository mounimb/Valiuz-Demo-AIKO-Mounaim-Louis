/**
 * iROAS (causal) vs gross ROAS (correlational), global and per lever,
 * with bootstrap confidence intervals on the (non-linear) iROAS ratio.
 */

import type {
  Individual,
  LeverKey,
  LeverValues,
  PerLeverMetrics,
  ScenarioConfig,
  ScenarioParams,
  CI,
} from "./types";
import { LEVERS } from "./types";
import { mulberry32 } from "./rng";
import { bootstrapAggregated } from "./stats";
import { spendByLever } from "./data";
import type { IncrementalityResult } from "./incrementality";

// Display-only engagement metrics per lever (DOOH has no clicks).
const CTR: LeverValues = { onsite: 0.012, offsite: 0.0045, instore: 0 };
const ADD_TO_CART: LeverValues = { onsite: 0.018, offsite: 0.006, instore: 0 };

/** Gross attribution widens with the window (captures more organic conversions). */
function windowFactor(w: number): number {
  return w <= 7 ? 0.82 : w >= 30 ? 1.22 : 1.0;
}

export interface IroasResult {
  totalSpend: number;
  incrementalSales: number;
  grossAttributedSales: number;
  grossRoas: number;
  iroas: number;
  trueIroas: number;
  iCpa: number;
  avgBasket: number;
  iroasCI: CI;
  liftAbsCI: CI;
  bootstrapIroas: number[];
  perLever: PerLeverMetrics[];
  newBuyers: number;
  newToBrandRate: number;
}

function lognormalMean(median: number, sdLog: number): number {
  return median * Math.exp((sdLog * sdLog) / 2);
}

export function computeIroas(
  inds: Individual[],
  scenario: ScenarioConfig,
  params: ScenarioParams,
  incr: IncrementalityResult,
  audienceWeight: number,
  window: number,
  seed: number
): IroasResult {
  const spend = spendByLever(params);
  const totalSpend = spend.onsite + spend.offsite + spend.instore;
  const w = audienceWeight;

  const reachCount: LeverValues = { onsite: 0, offsite: 0, instore: 0 };
  const impr: LeverValues = { onsite: 0, offsite: 0, instore: 0 };
  let newBuyersPanel = 0;

  for (const p of inds) {
    if (p.group !== "exposed") continue;
    for (const l of LEVERS) {
      if (p.exposure[l]) {
        reachCount[l] += 1;
        impr[l] += p.frequency[l];
      }
    }
    const isTouched = p.exposure.onsite || p.exposure.offsite || p.exposure.instore;
    const cw = p.converted && p.conversionLagDays <= window;
    if (isTouched && cw && p.newToBrand && p.adDriven) newBuyersPanel += 1;
  }

  const avgBasket =
    incr.avgBasketExposed > 0
      ? incr.avgBasketExposed
      : lognormalMean(scenario.basketMedian, scenario.basketSdLog);

  const incrementalSales = incr.incrementalConversions * avgBasket * w;
  const grossAttributedSales =
    incrementalSales * scenario.organicMultiple * windowFactor(window);
  const grossRoas = totalSpend > 0 ? grossAttributedSales / totalSpend : 0;
  const iroas = totalSpend > 0 ? incrementalSales / totalSpend : 0;
  const trueIncrementalSales = incr.trueIncrementalConversions * avgBasket * w;
  const trueIroas = totalSpend > 0 ? trueIncrementalSales / totalSpend : 0;
  const incrementalConversionsPop = incr.incrementalConversions * w;
  const iCpa = incrementalConversionsPop > 0 ? totalSpend / incrementalConversionsPop : 0;
  const newBuyers = newBuyersPanel * w;
  const newToBrandRate =
    incrementalConversionsPop > 0
      ? Math.min(1, newBuyers / incrementalConversionsPop)
      : 0;

  // Bootstrap on aggregated counts -> propagate uncertainty into iROAS and lift.
  const rng = mulberry32((seed ^ 0xc2b2ae35) >>> 0);
  const counts = {
    nExposed: incr.nExposedTouched,
    convExposed: incr.convExposedTouched,
    nControl: incr.nControl,
    convControl: incr.convControl,
  };
  const iroasBoot = bootstrapAggregated(
    rng,
    counts,
    (pe, pc) =>
      totalSpend > 0
        ? ((pe - pc) * incr.nExposedTouched * avgBasket * w) / totalSpend
        : 0,
    600
  );
  const rng2 = mulberry32((seed ^ 0x27d4eb2f) >>> 0);
  const liftBoot = bootstrapAggregated(rng2, counts, (pe, pc) => pe - pc, 600);

  // Per-lever: model-based decomposition rescaled so it sums to the measured global.
  const trueTotal =
    incr.perLeverTrueConv.onsite +
    incr.perLeverTrueConv.offsite +
    incr.perLeverTrueConv.instore;
  const scale = trueTotal > 0 ? incr.incrementalConversions / trueTotal : 0;
  const loFactor = iroas > 0 ? iroasBoot.ci.lo / iroas : 1;
  const hiFactor = iroas > 0 ? iroasBoot.ci.hi / iroas : 1;

  const perLeverSales: LeverValues = {
    onsite: incr.perLeverTrueConv.onsite * scale * avgBasket * w,
    offsite: incr.perLeverTrueConv.offsite * scale * avgBasket * w,
    instore: incr.perLeverTrueConv.instore * scale * avgBasket * w,
  };
  const totalLeverSales =
    perLeverSales.onsite + perLeverSales.offsite + perLeverSales.instore;

  const perLever: PerLeverMetrics[] = LEVERS.map((l) => {
    const imprPop = impr[l] * w;
    const reachPop = reachCount[l] * w;
    const clicks = imprPop * CTR[l];
    const iroasL = spend[l] > 0 ? perLeverSales[l] / spend[l] : 0;
    return {
      lever: l,
      spend: spend[l],
      impressions: imprPop,
      reach: reachPop,
      frequency: reachPop > 0 ? imprPop / reachPop : 0,
      cpm: imprPop > 0 ? (spend[l] / imprPop) * 1000 : 0,
      cpc: clicks > 0 ? spend[l] / clicks : 0,
      ctr: CTR[l],
      addToCartRate: ADD_TO_CART[l],
      incrementalConversions: incr.perLeverTrueConv[l] * scale * w,
      incrementalSales: perLeverSales[l],
      iroas: iroasL,
      iroasCI: { lo: iroasL * loFactor, hi: iroasL * hiFactor },
      contributionShare: totalLeverSales > 0 ? perLeverSales[l] / totalLeverSales : 0,
    };
  });

  return {
    totalSpend,
    incrementalSales,
    grossAttributedSales,
    grossRoas,
    iroas,
    trueIroas,
    iCpa,
    avgBasket,
    iroasCI: iroasBoot.ci,
    liftAbsCI: liftBoot.ci,
    bootstrapIroas: iroasBoot.samples,
    perLever,
    newBuyers,
    newToBrandRate,
  };
}
