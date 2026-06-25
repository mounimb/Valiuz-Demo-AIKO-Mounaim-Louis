/**
 * Domain types for the Valiuz multi-lever measurement engine.
 * Everything downstream (data generation, metrics, MMM, UI, AI snapshot) is typed here.
 */

export type LeverKey = "onsite" | "offsite" | "instore";

export const LEVERS: LeverKey[] = ["onsite", "offsite", "instore"];

export const LEVER_LABEL: Record<LeverKey, string> = {
  onsite: "On-site",
  offsite: "Off-site",
  instore: "In-store / DOOH",
};

export type LeverValues = Record<LeverKey, number>;

export type Segment = "champions" | "loyal" | "potential" | "atRisk" | "new";

export const SEGMENTS: Segment[] = [
  "champions",
  "loyal",
  "potential",
  "atRisk",
  "new",
];

export const SEGMENT_LABEL: Record<Segment, string> = {
  champions: "Champions",
  loyal: "Fidèles",
  potential: "Potentiels",
  atRisk: "À risque",
  new: "Nouveaux",
};

export type Zone = "core" | "fringe" | "far";

export const ZONES: Zone[] = ["core", "fringe", "far"];

export const ZONE_LABEL: Record<Zone, string> = {
  core: "Cœur de zone",
  fringe: "Périphérie",
  far: "Éloignée",
};

export type AttributionWindow = 7 | 14 | 30;

/** True data-generating parameters injected per scenario (the "ground truth"). */
export interface GroundTruth {
  /** Absolute uplift in conversion probability when fully exposed to a lever. */
  effects: LeverValues;
  /** Geometric adstock decay (carry-over) per lever, in [0, 0.8]. */
  adstock: LeverValues;
  /** Hill half-saturation point per lever (in k€ of adstocked spend). */
  hillK: LeverValues;
  /** Hill slope (Hill coefficient) per lever, in [1, 3]. */
  hillSlope: LeverValues;
  /** Organic baseline = this multiple x mean daily incremental sales (sets signal/noise of the MMM series). */
  baselineMultiple: number;
  /** Weekly seasonality amplitude (0..1). */
  seasonalityAmp: number;
  /** Gaussian noise sd as a fraction of mean daily sales (for the MMM series). */
  noiseFrac: number;
}

export interface ScenarioConfig {
  key: string;
  enseigne: string;
  brand: string;
  category: string;
  accent: string; // one-line "what this scenario showcases"
  /** Target global iROAS at default params (used to auto-calibrate the audience weight). */
  targetIroas: number;
  /** Gross-ROAS / iROAS ratio at the default window (organic + cannibalization overstatement). */
  organicMultiple: number;
  defaultBudgetK: number;
  defaultDurationWeeks: number;
  defaultLeverShares: LeverValues;
  /** Median basket (€) and log-sd for the log-normal basket distribution. */
  basketMedian: number;
  basketSdLog: number;
  /** Mix of customer segments (weights, need not sum to 1). */
  segmentMix: Record<Segment, number>;
  /** Mix of catchment-area zones. */
  zoneMix: Record<Zone, number>;
  /** Share of opted-in individuals (caps off-site reach — RGPD 2nd consent). */
  optInRate: number;
  /** Probability a conversion happens in store (vs online) at baseline. */
  storeBaseProb: number;
  /** Strength of ROPO (digital exposure -> in-store purchase) effect. */
  ropoStrength: number;
  /** Base probability a converting customer is new-to-brand, by responsiveness. */
  newToBrandBase: number;
  /** How intensively each lever reaches the exposed group (0..1 cap). */
  reachIntensity: LeverValues;
  /** Mean exposure frequency per lever (Poisson). */
  freqMean: LeverValues;
  groundTruth: GroundTruth;
}

/** UI-adjustable parameters (the sliders). */
export interface ScenarioParams {
  budgetK: number;
  durationWeeks: number;
  controlShare: number; // 0.05 .. 0.25
  attributionDays: AttributionWindow;
  leverShares: LeverValues; // sums to 1
  panelN: number; // 8000 .. 40000
}

export interface Individual {
  id: number;
  segment: Segment;
  affinity: number;
  zone: Zone;
  distancePdvKm: number;
  optIn: boolean;
  baselineP: number;
  group: "exposed" | "control";
  exposure: Record<LeverKey, boolean>;
  frequency: Record<LeverKey, number>;
  /** Per-lever causal uplift actually applied to this individual (saturated). */
  appliedEffect: Record<LeverKey, number>;
  conversionLagDays: number;
  converted: boolean;
  /** Whether the conversion was caused by the ads (vs organic) — drives ROPO & lag. */
  adDriven: boolean;
  basket: number;
  channel: "online" | "store";
  newToBrand: boolean;
}

export interface DailyRow {
  day: number;
  date: string;
  seasonality: number;
  spend: LeverValues;
  impressions: LeverValues;
  baselineSales: number;
  trueIncrementalSales: LeverValues;
  totalSales: number;
}

export interface CI {
  lo: number;
  hi: number;
}

export interface PerLeverMetrics {
  lever: LeverKey;
  spend: number;
  impressions: number;
  reach: number;
  frequency: number;
  cpm: number;
  cpc: number;
  ctr: number;
  addToCartRate: number;
  incrementalConversions: number;
  incrementalSales: number;
  iroas: number;
  iroasCI: CI;
  contributionShare: number; // share of total incremental sales
}

export interface SegmentMetrics {
  segment: Segment;
  n: number;
  share: number;
  pExposed: number;
  pControl: number;
  cate: number; // estimated conditional uplift
  trueCate: number; // injected uplift (validation)
  upliftClass: "persuadable" | "sure-thing" | "lost-cause" | "sleeping-dog";
}

export interface ZoneMetrics {
  zone: Zone;
  n: number;
  avgDistanceKm: number;
  driveToStoreUplift: number;
}

export interface OverlapRegion {
  key: string; // e.g. "onsite", "onsite+offsite", "onsite+offsite+instore"
  levers: LeverKey[];
  count: number;
}

export interface GlobalMetrics {
  nExposed: number;
  nExposedTouched: number;
  nControl: number;
  pExposed: number; // per-protocol: touched exposed
  pControl: number;
  pExposedITT: number; // intention-to-treat: all assigned exposed
  liftAbs: number;
  liftRel: number;
  liftAbsCI: CI;
  liftITT: number;
  zScore: number;
  pValue: number;
  incrementalConversions: number;
  incrementalSales: number;
  trueIncrementalConversions: number; // model-based ground truth
  trueIncrementalSales: number;
  grossAttributedSales: number; // closed-loop, window-dependent (biased)
  grossRoas: number;
  iroas: number;
  trueIroas: number;
  iCpa: number;
  iroasCI: CI;
  bootstrapIroas: number[]; // for the histogram
  avgBasketExposed: number;
  totalSpend: number;
}

export interface AttributionByWindow {
  window: AttributionWindow;
  grossAttributedSales: number;
  grossRoas: number;
  iroas: number;
}

export interface ReachMetrics {
  dedupReach: number;
  dedupReachRate: number;
  dedupFrequency: number;
  totalImpressions: number;
  overlap: OverlapRegion[];
  offsiteReach: number;
  offsiteCapReach: number; // theoretical cap from opt-in
  haloMonoIncrSales: number;
  haloCrossIncrSales: number;
  haloSynergyPct: number;
}

export interface CespIndicators {
  cpm: number;
  cpc: number;
  ctr: number;
  addToCart: number;
  roas: number;
  iroas: number;
  newBuyers: number;
  reach: number;
}

export interface MmmLeverParams {
  lambda: number;
  K: number;
  slope: number;
  beta: number;
}

export interface MmmFit {
  params: Record<LeverKey, MmmLeverParams>;
  trueParams: Record<LeverKey, MmmLeverParams>;
  baseline: number;
  trueBaseline: number;
  r2: number;
  mape: number;
  observed: number[];
  fitted: number[];
  dates: string[];
  responseCurves: Record<LeverKey, { spend: number; response: number }[]>;
  operatingSpend: LeverValues;
  iterations: number;
}

export interface ScatterPoint {
  distanceKm: number;
  uplift: number;
  zone: Zone;
}

export interface DriveToStoreMetrics {
  ropoRate: number;
  byZone: ZoneMetrics[];
  scatter: ScatterPoint[];
  doohMeasuredShare: number; // = 1 (100% mesuré caisse+fidélité)
  inStoreIncrementalSales: number;
}

export interface KpiBundle {
  scenario: ScenarioConfig;
  params: ScenarioParams;
  seed: number;
  global: GlobalMetrics;
  perLever: PerLeverMetrics[];
  segments: SegmentMetrics[];
  reach: ReachMetrics;
  cesp: CespIndicators;
  newToBrandRate: number;
  attribution: AttributionByWindow[];
  lastTouchRoas: number;
  driveToStore: DriveToStoreMetrics;
  daily: DailyRow[];
  mmm: MmmFit;
  computeMs: number;
}
