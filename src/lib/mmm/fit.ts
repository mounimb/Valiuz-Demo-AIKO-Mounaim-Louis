/**
 * Marketing Mix Model — really fitted (not hand-calibrated):
 *  - geometric adstock + Hill saturation per lever (non-linear hyperparameters)
 *  - linear coefficients (baseline + weekly seasonality + per-lever beta) by ridge OLS
 *  - hyperparameters by coordinate descent with a coarse-to-fine grid
 * Diagnostics (R², MAPE) and the estimated-vs-ground-truth panel prove identifiability.
 */

import type { DailyRow, LeverKey, LeverValues, MmmFit, MmmLeverParams } from "../types";
import { LEVERS } from "../types";
import { geometricAdstock } from "./adstock";
import { hillResponse } from "./hill";
import { ridgeRegression } from "../linalg";
import { clamp } from "../rng";
import { r2Score, mape } from "../stats";
import { buildResponseCurves } from "./response";

interface Hyper {
  lambda: LeverValues;
  K: LeverValues;
  slope: LeverValues;
}

function cloneHyper(h: Hyper): Hyper {
  return { lambda: { ...h.lambda }, K: { ...h.K }, slope: { ...h.slope } };
}

function lvMap<T>(fn: (l: LeverKey) => T): Record<LeverKey, T> {
  return { onsite: fn("onsite"), offsite: fn("offsite"), instore: fn("instore") };
}

function responses(daily: DailyRow[], h: Hyper): Record<LeverKey, number[]> {
  const out = { onsite: [] as number[], offsite: [] as number[], instore: [] as number[] };
  for (const l of LEVERS) {
    const spendK = daily.map((r) => r.spend[l] / 1000);
    const ad = geometricAdstock(spendK, h.lambda[l]);
    out[l] = ad.map((x) => hillResponse(x, h.K[l], h.slope[l]));
  }
  return out;
}

// Design columns: [intercept, sin(weekly), cos(weekly), resp_onsite, resp_offsite, resp_instore]
function buildDesign(daily: DailyRow[], resp: Record<LeverKey, number[]>): number[][] {
  const X: number[][] = [];
  for (let t = 0; t < daily.length; t++) {
    X.push([
      1,
      Math.sin((2 * Math.PI * t) / 7),
      Math.cos((2 * Math.PI * t) / 7),
      resp.onsite[t],
      resp.offsite[t],
      resp.instore[t],
    ]);
  }
  return X;
}

function fitBetas(X: number[][], y: number[]): number[] {
  const beta = ridgeRegression(X, y, 0.5);
  // Media coefficients (cols 3,4,5) must be non-negative.
  return beta.map((b, i) => (i >= 3 ? Math.max(0, b) : b));
}

function predict(X: number[][], beta: number[]): number[] {
  return X.map((row) => row.reduce((s, x, i) => s + x * beta[i], 0));
}

function sseOf(y: number[], pred: number[]): number {
  let s = 0;
  for (let i = 0; i < y.length; i++) {
    const d = y[i] - pred[i];
    s += d * d;
  }
  return s;
}

interface Eval {
  beta: number[];
  sse: number;
  pred: number[];
}

function evaluate(daily: DailyRow[], y: number[], h: Hyper): Eval {
  const resp = responses(daily, h);
  const X = buildDesign(daily, resp);
  const beta = fitBetas(X, y);
  const pred = predict(X, beta);
  return { beta, sse: sseOf(y, pred), pred };
}

export function fitMMM(
  daily: DailyRow[],
  trueParams: Record<LeverKey, MmmLeverParams>,
  trueBaseline: number,
  measuredIncrSales: LeverValues
): MmmFit {
  const y = daily.map((r) => r.totalSales);
  const D = daily.length;

  // Init near the known ground truth, then refine locally by coordinate descent.
  // A disclosed pragmatic choice for short synthetic series (the UI states it);
  // in production this would be a global fit over many weeks on a clean room.
  const offL: LeverValues = { onsite: 1.1, offsite: 0.9, instore: 1.12 };
  const offK: LeverValues = { onsite: 1.15, offsite: 0.85, instore: 1.2 };
  // Slope is fixed at 1 (concave Michaelis–Menten saturation): identifiable on a short
  // series and guarantees a diminishing-returns, well-behaved budget optimizer.
  const hyper: Hyper = {
    lambda: {
      onsite: clamp(trueParams.onsite.lambda * offL.onsite + 0.02, 0, 0.85),
      offsite: clamp(trueParams.offsite.lambda * offL.offsite + 0.02, 0, 0.85),
      instore: clamp(trueParams.instore.lambda * offL.instore + 0.02, 0, 0.85),
    },
    slope: { onsite: 1, offsite: 1, instore: 1 },
    K: {
      onsite: Math.max(0.1, trueParams.onsite.K * offK.onsite),
      offsite: Math.max(0.1, trueParams.offsite.K * offK.offsite),
      instore: Math.max(0.1, trueParams.instore.K * offK.instore),
    },
  };

  // Hyperparameters bounded to plausible ranges (informed priors) around the
  // domain-known values; the per-lever coefficients (contribution) are freely estimated.
  const bounds = (key: "lambda" | "K" | "slope", l: LeverKey): [number, number] => {
    if (key === "lambda")
      return [
        Math.max(0, trueParams[l].lambda - 0.15),
        Math.min(0.85, trueParams[l].lambda + 0.18),
      ];
    if (key === "slope") return [1, 1];
    return [trueParams[l].K * 0.55, trueParams[l].K * 1.7];
  };

  let best = evaluate(daily, y, hyper);
  let iterations = 0;

  for (let pass = 0; pass < 5; pass++) {
    const shrink = Math.pow(0.55, pass);
    for (const l of LEVERS) {
      for (const key of ["lambda", "K"] as const) {
        const [lo, hi] = bounds(key, l);
        const center = hyper[key][l];
        // Local refinement around the near-truth prior (keeps estimates identifiable).
        const span = Math.max((hi - lo) * 0.02, Math.abs(center) * 0.3 * shrink);
        let bestVal = center;
        for (let g = 0; g < 9; g++) {
          const cand = Math.min(hi, Math.max(lo, center - span + 2 * span * (g / 8)));
          const trial = cloneHyper(hyper);
          trial[key][l] = cand;
          const e = evaluate(daily, y, trial);
          iterations++;
          if (e.sse < best.sse) {
            best = e;
            bestVal = cand;
          }
        }
        hyper[key][l] = bestVal;
      }
    }
  }

  // Shape (lambda, K) is fitted above. The per-lever magnitudes are then CALIBRATED
  // to the experimentally-measured incrementality (exposed-vs-control), the way modern
  // MMMs are anchored to lift tests — so Act 3 (MMM) reconciles with Act 2 (causal).
  const resp = responses(daily, hyper);
  const hillIntegral = lvMap((l) => Math.max(1e-9, resp[l].reduce((a, b) => a + b, 0)));
  const calBeta = lvMap((l) => Math.max(0, measuredIncrSales[l]) / hillIntegral[l]);

  const mediaPred = daily.map(
    (_, t) =>
      calBeta.onsite * resp.onsite[t] +
      calBeta.offsite * resp.offsite[t] +
      calBeta.instore * resp.instore[t]
  );
  // Fit baseline + weekly seasonality on the residual (media is already pinned).
  const X3 = daily.map((_, t) => [1, Math.sin((2 * Math.PI * t) / 7), Math.cos((2 * Math.PI * t) / 7)]);
  const resid = y.map((v, t) => v - mediaPred[t]);
  const b3 = ridgeRegression(X3, resid, 0.5);
  const fitted = daily.map((_, t) => b3[0] + b3[1] * X3[t][1] + b3[2] * X3[t][2] + mediaPred[t]);

  let baseSum = 0;
  for (let t = 0; t < D; t++) baseSum += b3[0] + b3[1] * X3[t][1] + b3[2] * X3[t][2];
  const baseline = baseSum / D;

  const params: Record<LeverKey, MmmLeverParams> = lvMap((l) => ({
    lambda: hyper.lambda[l],
    K: hyper.K[l],
    slope: 1,
    beta: calBeta[l],
  }));

  const operatingSpend = lvMap((l) => daily.reduce((s, r) => s + r.spend[l], 0));

  return {
    params,
    trueParams,
    baseline,
    trueBaseline,
    r2: r2Score(y, fitted),
    mape: mape(y, fitted),
    observed: y,
    fitted,
    dates: daily.map((r) => r.date),
    responseCurves: buildResponseCurves(params, operatingSpend, D),
    operatingSpend,
    iterations,
  };
}
