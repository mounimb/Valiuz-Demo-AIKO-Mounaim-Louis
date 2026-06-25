/**
 * Engine: turns (scenario, params) into a fully computed KpiBundle.
 * Pure and deterministic — same seed => same numbers. Designed to run in <60ms
 * so every slider move can recompute everything live.
 */

import { hashSeed } from "./rng";
import { generatePanel, buildDailySeries, mapLevers } from "./data";
import { computeIncrementality } from "./incrementality";
import { computeIroas } from "./iroas";
import { computeReach, computeDriveToStore } from "./reach";
import { computeUplift } from "./uplift";
import { computeAttribution } from "./attribution";
import { fitMMM } from "./mmm/fit";
import type {
  ScenarioConfig,
  ScenarioParams,
  KpiBundle,
  GlobalMetrics,
  CespIndicators,
  LeverValues,
} from "./types";

export function paramsSeed(scenario: ScenarioConfig, params: ScenarioParams): number {
  return (hashSeed(scenario.key) ^ hashSeed(JSON.stringify(params))) >>> 0;
}

function now(): number {
  return typeof performance !== "undefined" ? performance.now() : 0;
}

export function runEngine(scenario: ScenarioConfig, params: ScenarioParams): KpiBundle {
  const t0 = now();
  const seed = paramsSeed(scenario, params);
  const window = params.attributionDays;

  const { individuals, audienceWeight } = generatePanel(scenario, params, seed);
  const incr = computeIncrementality(individuals, window);
  const iroas = computeIroas(individuals, scenario, params, incr, audienceWeight, window, seed);
  const reach = computeReach(individuals, audienceWeight, iroas.avgBasket, scenario.optInRate);
  const segments = computeUplift(individuals, window);
  const attribution = computeAttribution(
    individuals,
    scenario,
    params,
    iroas.totalSpend,
    audienceWeight
  );
  const driveToStore = computeDriveToStore(individuals, audienceWeight, iroas.avgBasket);

  // Per-lever iROAS feeds the daily series so the MMM and the causal engine agree.
  const targetIroas: LeverValues = mapLevers((l) => {
    const pl = iroas.perLever.find((p) => p.lever === l);
    return pl && pl.spend > 0 ? pl.incrementalSales / pl.spend : 0;
  });
  const { daily, trueParams, trueBaseline } = buildDailySeries(
    scenario,
    params,
    targetIroas,
    seed
  );
  const measuredIncrSales: LeverValues = mapLevers((l) => {
    const pl = iroas.perLever.find((p) => p.lever === l);
    return pl ? pl.incrementalSales : 0;
  });
  const mmm = fitMMM(daily, trueParams, trueBaseline, measuredIncrSales);

  const w = audienceWeight;
  const global: GlobalMetrics = {
    nExposed: incr.nExposedAssigned,
    nExposedTouched: incr.nExposedTouched,
    nControl: incr.nControl,
    pExposed: incr.pExposed,
    pControl: incr.pControl,
    pExposedITT: incr.pExposedITT,
    liftAbs: incr.liftAbs,
    liftRel: incr.liftRel,
    liftAbsCI: iroas.liftAbsCI,
    liftITT: incr.liftITT,
    zScore: incr.zScore,
    pValue: incr.pValue,
    incrementalConversions: incr.incrementalConversions * w,
    incrementalSales: iroas.incrementalSales,
    trueIncrementalConversions: incr.trueIncrementalConversions * w,
    trueIncrementalSales: incr.trueIncrementalConversions * iroas.avgBasket * w,
    grossAttributedSales: iroas.grossAttributedSales,
    grossRoas: iroas.grossRoas,
    iroas: iroas.iroas,
    trueIroas: iroas.trueIroas,
    iCpa: iroas.iCpa,
    iroasCI: iroas.iroasCI,
    bootstrapIroas: iroas.bootstrapIroas,
    avgBasketExposed: iroas.avgBasket,
    totalSpend: iroas.totalSpend,
  };

  const totalClicks = iroas.perLever.reduce((s, pl) => s + pl.impressions * pl.ctr, 0);
  const totalAddToCart = iroas.perLever.reduce(
    (s, pl) => s + pl.impressions * pl.addToCartRate,
    0
  );
  const cesp: CespIndicators = {
    cpm: reach.totalImpressions > 0 ? (iroas.totalSpend / reach.totalImpressions) * 1000 : 0,
    cpc: totalClicks > 0 ? iroas.totalSpend / totalClicks : 0,
    ctr: reach.totalImpressions > 0 ? totalClicks / reach.totalImpressions : 0,
    addToCart: reach.totalImpressions > 0 ? totalAddToCart / reach.totalImpressions : 0,
    roas: iroas.grossRoas,
    iroas: iroas.iroas,
    newBuyers: iroas.newBuyers,
    reach: reach.dedupReach,
  };

  return {
    scenario,
    params,
    seed,
    global,
    perLever: iroas.perLever,
    segments,
    reach,
    cesp,
    newToBrandRate: iroas.newToBrandRate,
    attribution: attribution.byWindow,
    lastTouchRoas: attribution.lastTouchRoas,
    driveToStore,
    daily,
    mmm,
    computeMs: now() - t0,
  };
}
