/**
 * Seeded, deterministic data generation — the simulation backbone.
 *
 * Two coherent levels share the same ground truth:
 *  (1) generatePanel  -> individual-by-individual panel (deterministic ticket<->loyalty match),
 *      used for incrementality / iROAS / uplift / reach.
 *  (2) buildDailySeries -> aggregated daily series, used to FIT the MMM.
 *
 * The audience weight is auto-calibrated once per scenario so that the default
 * iROAS lands on the scenario target; it then stays fixed, so the iROAS reacts
 * realistically (with diminishing returns) when the budget slider moves.
 */

import {
  mulberry32,
  hashSeed,
  normal,
  bernoulli,
  poisson,
  weightedChoice,
  clamp,
} from "./rng";
import type {
  ScenarioConfig,
  ScenarioParams,
  Individual,
  DailyRow,
  LeverKey,
  LeverValues,
  MmmLeverParams,
  Segment,
  Zone,
} from "./types";
import { LEVERS, SEGMENTS, ZONES } from "./types";
import { defaultParams } from "./scenarios";
import { hillResponse } from "./mmm/hill";
import { geometricAdstock } from "./mmm/adstock";

const BASE_RATE: Record<Segment, number> = {
  champions: 0.1,
  loyal: 0.06,
  potential: 0.03,
  atRisk: 0.02,
  new: 0.015,
};
const RESP: Record<Segment, number> = {
  champions: 0.6,
  loyal: 0.85,
  potential: 1.1,
  atRisk: 1.45,
  new: 1.3,
};
const AFF_MEAN: Record<Segment, number> = {
  champions: 0.7,
  loyal: 0.6,
  potential: 0.5,
  atRisk: 0.42,
  new: 0.5,
};
const NTB_FACTOR: Record<Segment, number> = {
  champions: 0.3,
  loyal: 0.5,
  potential: 1.2,
  atRisk: 1.1,
  new: 2.0,
};
const ZONE_DIST: Record<Zone, [number, number]> = {
  core: [3, 1],
  fringe: [9, 2.5],
  far: [20, 6],
};
const CPM: LeverValues = { onsite: 8, offsite: 6, instore: 12 };

export function mapLevers<T>(fn: (l: LeverKey) => T): Record<LeverKey, T> {
  return { onsite: fn("onsite"), offsite: fn("offsite"), instore: fn("instore") };
}

export function spendByLever(params: ScenarioParams): LeverValues {
  const total = params.budgetK * 1000;
  return mapLevers((l) => total * params.leverShares[l]);
}

/** Max reachable share of the exposed group for a lever (headroom above default). */
function maxReachOf(scenario: ScenarioConfig, l: LeverKey): number {
  return Math.min(0.97, scenario.reachIntensity[l] * 1.6);
}

/** Spend-to-reach saturation constant, fixed so default budget reproduces reachIntensity. */
function reachConstants(scenario: ScenarioConfig): LeverValues {
  return mapLevers((l) => {
    const maxReach = maxReachOf(scenario, l);
    const d = scenario.defaultBudgetK * 1000 * scenario.defaultLeverShares[l];
    const r0 = clamp(scenario.reachIntensity[l] / maxReach, 0.01, 0.95);
    return d / -Math.log(1 - r0);
  });
}

function reachProbs(scenario: ScenarioConfig, params: ScenarioParams): LeverValues {
  const k = reachConstants(scenario);
  const spend = spendByLever(params);
  return mapLevers((l) => maxReachOf(scenario, l) * (1 - Math.exp(-spend[l] / k[l])));
}

function buildIndividuals(
  scenario: ScenarioConfig,
  params: ScenarioParams,
  rng: () => number
): Individual[] {
  const N = Math.round(params.panelN);
  const reachProb = reachProbs(scenario, params);
  const durationDays = params.durationWeeks * 7;
  const adLagMean = clamp(durationDays * 0.12, 2, 10);
  const orgLagMean = clamp(durationDays * 0.45, 10, 25);
  const segWeights = SEGMENTS.map((s) => scenario.segmentMix[s]);
  const zoneWeights = ZONES.map((z) => scenario.zoneMix[z]);

  const out = new Array<Individual>(N);
  for (let i = 0; i < N; i++) {
    const segment = weightedChoice(rng, SEGMENTS, segWeights);
    const affinity = clamp(normal(rng, AFF_MEAN[segment], 0.18), 0, 1);
    const zone = weightedChoice(rng, ZONES, zoneWeights);
    const [dm, dsd] = ZONE_DIST[zone];
    const distancePdvKm = Math.max(0.3, normal(rng, dm, dsd));
    const optIn = bernoulli(rng, scenario.optInRate);
    const baselineP = clamp(BASE_RATE[segment] * (0.7 + 0.6 * affinity), 0, 0.5);
    const group: Individual["group"] = bernoulli(rng, params.controlShare)
      ? "control"
      : "exposed";

    const exposure = { onsite: false, offsite: false, instore: false };
    const frequency = { onsite: 0, offsite: 0, instore: 0 };
    const appliedEffect = { onsite: 0, offsite: 0, instore: 0 };

    if (group === "exposed") {
      for (const l of LEVERS) {
        if (l === "offsite" && !optIn) continue; // RGPD 2nd consent caps off-site
        if (bernoulli(rng, reachProb[l])) {
          const f = Math.max(1, poisson(rng, scenario.freqMean[l]));
          exposure[l] = true;
          frequency[l] = f;
          const sat = 1 - Math.pow(0.55, f); // frequency saturation
          appliedEffect[l] = scenario.groundTruth.effects[l] * RESP[segment] * sat;
        }
      }
    }

    const sumApplied =
      appliedEffect.onsite + appliedEffect.offsite + appliedEffect.instore;
    const pFinal = clamp(baselineP + (group === "exposed" ? sumApplied : 0), 0, 0.98);
    const converted = bernoulli(rng, pFinal);
    const adShare = group === "exposed" && pFinal > 0 ? sumApplied / pFinal : 0;
    const adDriven = converted && bernoulli(rng, adShare);

    let conversionLagDays = 0;
    if (converted) {
      const mLag = adDriven ? adLagMean : orgLagMean;
      conversionLagDays = clamp(Math.round(-mLag * Math.log(1 - rng())), 0, 30);
    }

    const basket = converted
      ? scenario.basketMedian * Math.exp(normal(rng, 0, scenario.basketSdLog))
      : 0;

    let channel: Individual["channel"] = "online";
    if (converted) {
      const pStore = clamp(
        scenario.storeBaseProb +
          (adDriven && (exposure.onsite || exposure.offsite)
            ? scenario.ropoStrength * 0.5
            : 0) +
          (exposure.instore ? 0.12 : 0),
        0.02,
        0.98
      );
      channel = bernoulli(rng, pStore) ? "store" : "online";
    }

    const newToBrand =
      converted &&
      bernoulli(rng, clamp(scenario.newToBrandBase * NTB_FACTOR[segment], 0, 0.95));

    out[i] = {
      id: i,
      segment,
      affinity,
      zone,
      distancePdvKm,
      optIn,
      baselineP,
      group,
      exposure,
      frequency,
      appliedEffect,
      conversionLagDays,
      converted,
      adDriven,
      basket,
      channel,
      newToBrand,
    };
  }
  return out;
}

const CALIB_N = 80000;
const popCache = new Map<string, number>();

/**
 * Calibrate the (fixed) real population represented by the panel, once per scenario,
 * so that the default-params iROAS equals scenario.targetIroas. The audience weight
 * at runtime is realPopulation / panelN, which keeps iROAS invariant to panel size.
 */
function calibrateRealPopulation(scenario: ScenarioConfig): number {
  const cached = popCache.get(scenario.key);
  if (cached !== undefined) return cached;

  const params = { ...defaultParams(scenario), panelN: CALIB_N };
  const window = params.attributionDays;
  const rng = mulberry32(hashSeed(scenario.key + "|calib"));
  const inds = buildIndividuals(scenario, params, rng);

  let nExp = 0;
  let cExp = 0;
  let sExp = 0;
  let nCtrl = 0;
  let cCtrl = 0;
  for (const p of inds) {
    const cw = p.converted && p.conversionLagDays <= window;
    if (p.group === "control") {
      nCtrl++;
      if (cw) cCtrl++;
    } else if (p.exposure.onsite || p.exposure.offsite || p.exposure.instore) {
      nExp++;
      if (cw) {
        cExp++;
        sExp += p.basket;
      }
    }
  }
  const pExp = nExp ? cExp / nExp : 0;
  const pCtrl = nCtrl ? cCtrl / nCtrl : 0;
  const avgBasket = cExp ? sExp / cExp : scenario.basketMedian;
  const incrSales = Math.max(1, (pExp - pCtrl) * nExp * avgBasket); // panel scale (CALIB_N)
  const spend = scenario.defaultBudgetK * 1000;
  // realPop * (incrSales / CALIB_N) / spend = targetIroas
  const realPop = (scenario.targetIroas * spend * CALIB_N) / incrSales;
  popCache.set(scenario.key, realPop);
  return realPop;
}

export interface PanelResult {
  individuals: Individual[];
  audienceWeight: number;
  spend: LeverValues;
  reachProb: LeverValues;
}

export function generatePanel(
  scenario: ScenarioConfig,
  params: ScenarioParams,
  seed: number
): PanelResult {
  const rng = mulberry32((seed ^ 0x9e3779b9) >>> 0);
  const individuals = buildIndividuals(scenario, params, rng);
  const realPop = calibrateRealPopulation(scenario);
  return {
    individuals,
    audienceWeight: realPop / Math.max(1, params.panelN),
    spend: spendByLever(params),
    reachProb: reachProbs(scenario, params),
  };
}

const DATE_BASE = Date.UTC(2026, 2, 2); // fixed Monday 2 Mar 2026 (deterministic, SSR-safe)

function dateLabel(t: number): string {
  const d = new Date(DATE_BASE + t * 86400000);
  return `${String(d.getUTCDate()).padStart(2, "0")}/${String(
    d.getUTCMonth() + 1
  ).padStart(2, "0")}`;
}

export interface DailySeriesResult {
  daily: DailyRow[];
  trueParams: Record<LeverKey, MmmLeverParams>;
  trueBaseline: number;
}

export function buildDailySeries(
  scenario: ScenarioConfig,
  params: ScenarioParams,
  targetIroas: LeverValues,
  seed: number
): DailySeriesResult {
  const rng = mulberry32((seed ^ 0x85ebca6b) >>> 0);
  const D = Math.round(params.durationWeeks * 7);
  const spendTotal = spendByLever(params);

  // Per-lever flighting with DISTINCT temporal patterns (different phase + independent
  // noise) so the MMM regressors are not collinear and per-lever betas are identifiable.
  const phase: LeverValues = { onsite: 0, offsite: 2.1, instore: 4.2 };
  // Independent per-lever multiplicative shocks => decorrelated regressors, so the MMM
  // separates each lever's contribution cleanly (no sign-splitting from collinearity).
  const spendDaily = mapLevers((l) => {
    const f: number[] = [];
    for (let t = 0; t < D; t++) {
      const weekly = 1 + 0.12 * Math.sin((2 * Math.PI * t) / 7 + phase[l]);
      const shock = Math.exp(normal(rng, 0, 0.5));
      f.push(Math.max(0.1, weekly * shock));
    }
    const sum = f.reduce((a, b) => a + b, 0);
    return f.map((wt) => (spendTotal[l] * wt) / sum);
  });

  const lambdaEff = mapLevers((l) =>
    clamp(scenario.groundTruth.adstock[l], 0, 0.85)
  );
  const adstock = mapLevers((l) =>
    geometricAdstock(
      spendDaily[l].map((s) => s / 1000), // k€
      lambdaEff[l]
    )
  );
  const hill = mapLevers((l) =>
    adstock[l].map((x) =>
      hillResponse(x, scenario.groundTruth.hillK[l], scenario.groundTruth.hillSlope[l])
    )
  );
  const hillSum = mapLevers((l) => Math.max(1e-9, hill[l].reduce((a, b) => a + b, 0)));

  const trueIncrTotal = mapLevers((l) => targetIroas[l] * spendTotal[l]);
  const beta = mapLevers((l) => trueIncrTotal[l] / hillSum[l]);

  const meanDailyIncr =
    (trueIncrTotal.onsite + trueIncrTotal.offsite + trueIncrTotal.instore) / D;
  const baselineDaily = scenario.groundTruth.baselineMultiple * meanDailyIncr;

  const rows: DailyRow[] = [];
  let baselineSalesSum = 0;
  for (let t = 0; t < D; t++) {
    const dow = t % 7;
    const season = Math.max(
      0.3,
      1 +
        scenario.groundTruth.seasonalityAmp * Math.sin((2 * Math.PI * t) / 7) +
        (dow === 5 || dow === 6 ? 0.12 : 0) +
        normal(rng, 0, 0.03)
    );
    const baselineSales = baselineDaily * season;
    baselineSalesSum += baselineSales;
    const trueIncrementalSales = mapLevers((l) => beta[l] * hill[l][t]);
    const incrSum =
      trueIncrementalSales.onsite +
      trueIncrementalSales.offsite +
      trueIncrementalSales.instore;
    const noise = normal(rng, 0, scenario.groundTruth.noiseFrac * (baselineSales + incrSum));
    const totalSales = Math.max(0, baselineSales + incrSum + noise);
    const impressions = mapLevers((l) => (spendDaily[l][t] / CPM[l]) * 1000);
    rows.push({
      day: t,
      date: dateLabel(t),
      seasonality: season,
      spend: mapLevers((l) => spendDaily[l][t]),
      impressions,
      baselineSales,
      trueIncrementalSales,
      totalSales,
    });
  }

  const trueParams = mapLevers<MmmLeverParams>((l) => ({
    lambda: lambdaEff[l],
    K: scenario.groundTruth.hillK[l],
    slope: scenario.groundTruth.hillSlope[l],
    beta: beta[l],
  }));

  return { daily: rows, trueParams, trueBaseline: baselineSalesSum / D };
}
