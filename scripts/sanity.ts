/* Headless validation of the measurement engine. Run: npx tsx scripts/sanity.ts */
import { runEngine } from "../src/lib/engine";
import { SCENARIOS, defaultParams } from "../src/lib/scenarios";
import { LEVERS } from "../src/lib/types";

for (const sc of SCENARIOS) {
  const p = defaultParams(sc);
  const t0 = performance.now();
  const b = runEngine(sc, p);
  const ms = performance.now() - t0;

  console.log("=".repeat(72));
  console.log(`${sc.enseigne} · ${sc.brand} · ${sc.category}`);
  console.log(`compute ${ms.toFixed(1)}ms`);
  console.log(
    `iROAS=${b.global.iroas.toFixed(2)} (cible ${sc.targetIroas}) | grossROAS=${b.global.grossRoas.toFixed(
      2
    )} | trueIroas=${b.global.trueIroas.toFixed(2)} | iROAS CI[${b.global.iroasCI.lo.toFixed(
      2
    )},${b.global.iroasCI.hi.toFixed(2)}]`
  );
  console.log(
    `lift=${(b.global.liftAbs * 100).toFixed(3)}pp CI[${(b.global.liftAbsCI.lo * 100).toFixed(3)},${(
      b.global.liftAbsCI.hi * 100
    ).toFixed(3)}] rel=${(b.global.liftRel * 100).toFixed(1)}% p=${b.global.pValue.toExponential(2)} sig=${
      b.global.pValue < 0.05
    }`
  );
  console.log(
    `incrSales=${Math.round(b.global.incrementalSales)} spend=${b.global.totalSpend} reach=${Math.round(
      b.reach.dedupReach
    )} freq=${b.reach.dedupFrequency.toFixed(2)} newToBrand=${(b.newToBrandRate * 100).toFixed(
      1
    )}% ropo=${(b.driveToStore.ropoRate * 100).toFixed(1)}%`
  );
  for (const pl of b.perLever)
    console.log(
      `  ${pl.lever.padEnd(8)} spend=${String(Math.round(pl.spend)).padStart(7)} iROAS=${pl.iroas
        .toFixed(2)
        .padStart(5)} share=${(pl.contributionShare * 100).toFixed(0).padStart(3)}% cpm=${pl.cpm.toFixed(
        2
      )} reach=${Math.round(pl.reach)}`
    );
  console.log(
    `MMM R2=${b.mmm.r2.toFixed(3)} MAPE=${(b.mmm.mape * 100).toFixed(1)}% iters=${b.mmm.iterations} baseline ${Math.round(
      b.mmm.baseline
    )}/${Math.round(b.mmm.trueBaseline)}`
  );
  for (const l of LEVERS) {
    const e = b.mmm.params[l];
    const tr = b.mmm.trueParams[l];
    console.log(
      `  ${l.padEnd(8)} lambda ${e.lambda.toFixed(2)}/${tr.lambda.toFixed(2)}  K ${e.K
        .toFixed(2)
        .padStart(5)}/${tr.K.toFixed(2)}  slope ${e.slope.toFixed(2)}/${tr.slope.toFixed(
        2
      )}  beta ${Math.round(e.beta)}/${Math.round(tr.beta)}`
    );
  }
  console.log(
    "segments " +
      b.segments
        .map((s) => `${s.segment}:${(s.cate * 100).toFixed(2)}/${(s.trueCate * 100).toFixed(2)}(${s.upliftClass})`)
        .join("  ")
  );

  const b2 = runEngine(sc, p);
  console.log(`reproducible=${b.global.iroas === b2.global.iroas && b.mmm.r2 === b2.mmm.r2}`);
}
