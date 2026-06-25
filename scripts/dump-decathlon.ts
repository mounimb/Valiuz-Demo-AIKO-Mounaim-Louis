/* Dump every displayed number for the default Decathlon scenario. Run: npx tsx scripts/dump-decathlon.ts */
import { runEngine } from "../src/lib/engine";
import { SCENARIO_BY_KEY, defaultParams } from "../src/lib/scenarios";
import { LEVERS } from "../src/lib/types";

const sc = SCENARIO_BY_KEY["decathlon_sport"];
const p = defaultParams(sc);
const b = runEngine(sc, p);
const g = b.global;

const trueLiftAbs = g.iroas > 0 ? g.liftAbs * (g.trueIroas / g.iroas) : g.liftAbs;

const out = {
  scenario: { enseigne: sc.enseigne, brand: sc.brand, category: sc.category },
  params: {
    budget: g.totalSpend,
    durationWeeks: p.durationWeeks,
    leverShares: p.leverShares,
    controlShare: p.controlShare,
    attributionDays: p.attributionDays,
    panelN: p.panelN,
    organicMultiple: sc.organicMultiple,
    targetIroas: sc.targetIroas,
  },
  act1: {
    cpm: b.cesp.cpm,
    cpc: b.cesp.cpc,
    ctr: b.cesp.ctr,
    addToCart: b.cesp.addToCart,
    roas: b.cesp.roas,
    iroas: b.cesp.iroas,
    newBuyers: b.cesp.newBuyers,
    reach: b.cesp.reach,
    dedupReach: b.reach.dedupReach,
    dedupFrequency: b.reach.dedupFrequency,
    totalImpressions: b.reach.totalImpressions,
    grossAttributedSales: g.grossAttributedSales,
    grossRoas: g.grossRoas,
    newToBrandRate: b.newToBrandRate,
    attribution: b.attribution,
  },
  act2: {
    nExposedTouched: g.nExposedTouched,
    nControl: g.nControl,
    pExposed: g.pExposed,
    pControl: g.pControl,
    pExposedITT: g.pExposedITT,
    liftAbs: g.liftAbs,
    liftRel: g.liftRel,
    liftITT: g.liftITT,
    zScore: g.zScore,
    pValue: g.pValue,
    iroas: g.iroas,
    iroasCI: g.iroasCI,
    bootstrapB: g.bootstrapIroas.length,
    trueIroas: g.trueIroas,
    trueLiftAbs,
    incrementalSales: g.incrementalSales,
    avgBasket: g.avgBasketExposed,
  },
  act3mmm: {
    r2: b.mmm.r2,
    mape: b.mmm.mape,
    iterations: b.mmm.iterations,
    baseline: b.mmm.baseline,
    trueBaseline: b.mmm.trueBaseline,
    params: LEVERS.map((l) => ({
      lever: l,
      lambda: b.mmm.params[l].lambda,
      trueLambda: b.mmm.trueParams[l].lambda,
      K: b.mmm.params[l].K,
      trueK: b.mmm.trueParams[l].K,
      beta: b.mmm.params[l].beta,
      trueBeta: b.mmm.trueParams[l].beta,
    })),
  },
  perLever: b.perLever.map((pl) => ({
    lever: pl.lever,
    spend: pl.spend,
    iroas: pl.iroas,
    contributionShare: pl.contributionShare,
    incrementalSales: pl.incrementalSales,
    reach: pl.reach,
    cpm: pl.cpm,
  })),
};

console.log(JSON.stringify(out, null, 2));
