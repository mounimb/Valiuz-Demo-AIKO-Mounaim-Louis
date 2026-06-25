/**
 * The four campaign scenarios, each with a fully specified causal "ground truth".
 * These are the parameters the measurement engine must re-estimate blind:
 *  - per-lever conversion uplift (incrementality)
 *  - adstock / Hill saturation / response magnitude (MMM)
 * Numbers are calibrated so each scenario tells a distinct retail-media story.
 */

import type { LeverValues, ScenarioConfig, Segment, Zone } from "./types";

function seg(
  champions: number,
  loyal: number,
  potential: number,
  atRisk: number,
  newC: number
): Record<Segment, number> {
  return { champions, loyal, potential, atRisk, new: newC };
}

function zone(core: number, fringe: number, far: number): Record<Zone, number> {
  return { core, fringe, far };
}

function lv(onsite: number, offsite: number, instore: number): LeverValues {
  return { onsite, offsite, instore };
}

export const SCENARIOS: ScenarioConfig[] = [
  {
    key: "decathlon_sport",
    enseigne: "Decathlon",
    brand: "Kalenji (running)",
    category: "Sport / running",
    accent:
      "On-site dominant (sponsored products + brand page decathlon.fr) ; fort drive-to-store et halo on-site → magasin.",
    targetIroas: 3.5,
    organicMultiple: 1.7,
    defaultBudgetK: 120,
    defaultDurationWeeks: 6,
    defaultLeverShares: lv(0.55, 0.3, 0.15),
    basketMedian: 75,
    basketSdLog: 0.45,
    segmentMix: seg(0.12, 0.22, 0.3, 0.16, 0.2),
    zoneMix: zone(0.45, 0.35, 0.2),
    optInRate: 0.22,
    storeBaseProb: 0.55,
    ropoStrength: 0.38,
    newToBrandBase: 0.32,
    reachIntensity: lv(0.72, 0.6, 0.42),
    freqMean: lv(3.4, 4.6, 2.4),
    groundTruth: {
      effects: lv(0.018, 0.013, 0.012),
      adstock: lv(0.3, 0.5, 0.2),
      hillK: lv(2.6, 2.0, 0.8),
      hillSlope: lv(1, 1, 1),
      baselineMultiple: 2.6,
      seasonalityAmp: 0.18,
      noiseFrac: 0.04,
    },
  },
  {
    key: "auchan_fmcg",
    enseigne: "Auchan",
    brand: "Coca-Cola / FMCG",
    category: "Grande consommation (boissons)",
    accent:
      "In-store / DOOH dominant (3 400 écrans Imediacenter) ; fort volume → IC serrés, halo catégorie marqué.",
    targetIroas: 2.6,
    organicMultiple: 1.55,
    defaultBudgetK: 250,
    defaultDurationWeeks: 4,
    defaultLeverShares: lv(0.35, 0.25, 0.4),
    basketMedian: 14,
    basketSdLog: 0.35,
    segmentMix: seg(0.18, 0.3, 0.26, 0.14, 0.12),
    zoneMix: zone(0.5, 0.32, 0.18),
    optInRate: 0.2,
    storeBaseProb: 0.82,
    ropoStrength: 0.12,
    newToBrandBase: 0.18,
    reachIntensity: lv(0.6, 0.56, 0.66),
    freqMean: lv(3.0, 4.0, 5.2),
    groundTruth: {
      effects: lv(0.01, 0.01, 0.022),
      adstock: lv(0.28, 0.48, 0.22),
      hillK: lv(5.0, 4.5, 5.2),
      hillSlope: lv(1, 1, 1),
      baselineMultiple: 3.6,
      seasonalityAmp: 0.14,
      noiseFrac: 0.04,
    },
  },
  {
    key: "boulanger_electro",
    enseigne: "Boulanger",
    brand: "Samsung (électroménager)",
    category: "Électroménager / high-tech",
    accent:
      "Cycle long, faible volume → IC LARGES ; ROAS brut très > iROAS (forte cannibalisation), fenêtre 30 j.",
    targetIroas: 2.3,
    organicMultiple: 3.0,
    defaultBudgetK: 180,
    defaultDurationWeeks: 8,
    defaultLeverShares: lv(0.45, 0.4, 0.15),
    basketMedian: 520,
    basketSdLog: 0.4,
    segmentMix: seg(0.1, 0.18, 0.32, 0.18, 0.22),
    zoneMix: zone(0.4, 0.36, 0.24),
    optInRate: 0.21,
    storeBaseProb: 0.48,
    ropoStrength: 0.34,
    newToBrandBase: 0.4,
    reachIntensity: lv(0.66, 0.66, 0.34),
    freqMean: lv(3.2, 4.8, 2.0),
    groundTruth: {
      effects: lv(0.013, 0.016, 0.009),
      adstock: lv(0.35, 0.55, 0.2),
      hillK: lv(2.6, 3.0, 0.9),
      hillSlope: lv(1, 1, 1),
      baselineMultiple: 4.2,
      seasonalityAmp: 0.1,
      noiseFrac: 0.06,
    },
  },
  {
    key: "leroymerlin_brico",
    enseigne: "Leroy Merlin",
    brand: "Bosch (outillage)",
    category: "Bricolage / outillage",
    accent:
      "Mix équilibré, DOOH centres + drive-to-store par zone de chalandise ; saisonnalité week-end, ROPO marqué.",
    targetIroas: 3.1,
    organicMultiple: 1.8,
    defaultBudgetK: 150,
    defaultDurationWeeks: 6,
    defaultLeverShares: lv(0.4, 0.25, 0.35),
    basketMedian: 95,
    basketSdLog: 0.5,
    segmentMix: seg(0.13, 0.2, 0.3, 0.17, 0.2),
    zoneMix: zone(0.42, 0.34, 0.24),
    optInRate: 0.22,
    storeBaseProb: 0.6,
    ropoStrength: 0.3,
    newToBrandBase: 0.26,
    reachIntensity: lv(0.68, 0.58, 0.5),
    freqMean: lv(3.3, 4.2, 2.8),
    groundTruth: {
      effects: lv(0.013, 0.012, 0.015),
      adstock: lv(0.3, 0.45, 0.22),
      hillK: lv(2.4, 1.9, 1.8),
      hillSlope: lv(1, 1, 1),
      baselineMultiple: 2.8,
      seasonalityAmp: 0.22,
      noiseFrac: 0.05,
    },
  },
];

export const SCENARIO_BY_KEY: Record<string, ScenarioConfig> = Object.fromEntries(
  SCENARIOS.map((s) => [s.key, s])
);

export function defaultParams(scenario: ScenarioConfig) {
  return {
    budgetK: scenario.defaultBudgetK,
    durationWeeks: scenario.defaultDurationWeeks,
    controlShare: 0.2,
    attributionDays: 14 as const,
    leverShares: { ...scenario.defaultLeverShares },
    panelN: 25000,
  };
}
