/**
 * Cross-lever deduplicated reach & frequency, overlap matrix, halo, and the
 * light geospatial drive-to-store view.
 */

import type {
  Individual,
  LeverKey,
  OverlapRegion,
  ReachMetrics,
  DriveToStoreMetrics,
  ScatterPoint,
  Zone,
  ZoneMetrics,
} from "./types";
import { LEVERS, ZONES, LEVER_LABEL } from "./types";

function leverSet(p: Individual): LeverKey[] {
  return LEVERS.filter((l) => p.exposure[l]);
}

export function computeReach(
  inds: Individual[],
  audienceWeight: number,
  avgBasket: number,
  optInRate: number
): ReachMetrics {
  const w = audienceWeight;
  let dedupReach = 0;
  let totalImpressions = 0;
  let offsiteReach = 0;
  let nExposedAssigned = 0;
  let optInCount = 0;
  const regionCounts = new Map<string, { levers: LeverKey[]; count: number }>();

  let haloMono = 0;
  let haloCross = 0;

  for (const p of inds) {
    if (p.optIn) optInCount++;
    if (p.group !== "exposed") continue;
    nExposedAssigned++;
    const set = leverSet(p);
    totalImpressions += p.frequency.onsite + p.frequency.offsite + p.frequency.instore;
    if (p.exposure.offsite) offsiteReach++;
    if (set.length === 0) continue;
    dedupReach++;
    const key = set.join("+");
    const entry = regionCounts.get(key) ?? { levers: set, count: 0 };
    entry.count++;
    regionCounts.set(key, entry);

    const applied =
      p.appliedEffect.onsite + p.appliedEffect.offsite + p.appliedEffect.instore;
    if (set.length >= 2) haloCross += applied;
    else haloMono += applied;
  }

  const overlap: OverlapRegion[] = [...regionCounts.entries()]
    .map(([key, v]) => ({ key, levers: v.levers, count: v.count * w }))
    .sort((a, b) => b.count - a.count);

  const dedupReachPop = dedupReach * w;
  const totalImpressionsPop = totalImpressions * w;
  const haloMonoSales = haloMono * avgBasket * w;
  const haloCrossSales = haloCross * avgBasket * w;
  const haloTotal = haloMonoSales + haloCrossSales;

  return {
    dedupReach: dedupReachPop,
    dedupReachRate: nExposedAssigned > 0 ? dedupReach / nExposedAssigned : 0,
    dedupFrequency: dedupReachPop > 0 ? totalImpressionsPop / dedupReachPop : 0,
    totalImpressions: totalImpressionsPop,
    overlap,
    offsiteReach: offsiteReach * w,
    offsiteCapReach: optInCount * w, // theoretical opt-in ceiling
    haloMonoIncrSales: haloMonoSales,
    haloCrossIncrSales: haloCrossSales,
    haloSynergyPct: haloTotal > 0 ? haloCrossSales / haloTotal : 0,
  };
}

/** Human-readable region label, e.g. "On-site + In-store / DOOH". */
export function regionLabel(levers: LeverKey[]): string {
  return levers.map((l) => LEVER_LABEL[l]).join(" + ");
}

export function computeDriveToStore(
  inds: Individual[],
  audienceWeight: number,
  avgBasket: number
): DriveToStoreMetrics {
  const w = audienceWeight;

  // ROPO: ad-driven, digitally-exposed conversions that land in store.
  let adDrivenDigital = 0;
  let ropo = 0;
  let inStoreIncrConv = 0;

  // Per-zone store-conversion lift (exposed vs control).
  const zoneAgg: Record<
    Zone,
    { expStore: number; nExp: number; ctrlStore: number; nCtrl: number; dist: number; n: number }
  > = {
    core: { expStore: 0, nExp: 0, ctrlStore: 0, nCtrl: 0, dist: 0, n: 0 },
    fringe: { expStore: 0, nExp: 0, ctrlStore: 0, nCtrl: 0, dist: 0, n: 0 },
    far: { expStore: 0, nExp: 0, ctrlStore: 0, nCtrl: 0, dist: 0, n: 0 },
  };

  // Distance-binned scatter (store lift vs distance).
  const bins = new Map<number, { exp: number; nExp: number; ctrl: number; nCtrl: number; zone: Zone; distSum: number }>();

  for (const p of inds) {
    const z = zoneAgg[p.zone];
    z.dist += p.distancePdvKm;
    z.n++;
    const storeConv = p.converted && p.channel === "store" ? 1 : 0;
    const bucket = Math.min(7, Math.floor(p.distancePdvKm / 3));
    const b =
      bins.get(bucket) ??
      { exp: 0, nExp: 0, ctrl: 0, nCtrl: 0, zone: p.zone, distSum: 0 };
    b.distSum += p.distancePdvKm;

    if (p.group === "exposed") {
      z.nExp++;
      if (storeConv) z.expStore++;
      b.nExp++;
      if (storeConv) b.exp++;
      if (p.adDriven && (p.exposure.onsite || p.exposure.offsite)) {
        adDrivenDigital++;
        if (p.channel === "store") ropo++;
      }
      inStoreIncrConv += p.appliedEffect.instore;
    } else {
      z.nCtrl++;
      if (storeConv) z.ctrlStore++;
      b.nCtrl++;
      if (storeConv) b.ctrl++;
    }
    bins.set(bucket, b);
  }

  const byZone: ZoneMetrics[] = ZONES.map((zone) => {
    const z = zoneAgg[zone];
    const pe = z.nExp ? z.expStore / z.nExp : 0;
    const pc = z.nCtrl ? z.ctrlStore / z.nCtrl : 0;
    return {
      zone,
      n: z.n * w,
      avgDistanceKm: z.n ? z.dist / z.n : 0,
      driveToStoreUplift: Math.max(0, pe - pc),
    };
  });

  const scatter: ScatterPoint[] = [...bins.entries()]
    .map(([, b]) => {
      const pe = b.nExp ? b.exp / b.nExp : 0;
      const pc = b.nCtrl ? b.ctrl / b.nCtrl : 0;
      const n = b.nExp + b.nCtrl;
      return {
        distanceKm: n ? b.distSum / n : 0,
        uplift: Math.max(0, pe - pc),
        zone: b.zone,
      };
    })
    .sort((a, b) => a.distanceKm - b.distanceKm);

  return {
    ropoRate: adDrivenDigital > 0 ? ropo / adDrivenDigital : 0,
    byZone,
    scatter,
    doohMeasuredShare: 1,
    inStoreIncrementalSales: inStoreIncrConv * avgBasket * w,
  };
}
