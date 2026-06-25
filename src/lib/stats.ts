/**
 * Self-contained statistics helpers (no external ML/stats dependency).
 * Used for the incrementality z-test, bootstrap confidence intervals and MMM diagnostics.
 */

import type { RNG } from "./rng";
import { normal } from "./rng";
import type { CI } from "./types";

export function mean(xs: number[]): number {
  if (xs.length === 0) return 0;
  let s = 0;
  for (const x of xs) s += x;
  return s / xs.length;
}

export function variance(xs: number[]): number {
  if (xs.length < 2) return 0;
  const m = mean(xs);
  let s = 0;
  for (const x of xs) s += (x - m) * (x - m);
  return s / (xs.length - 1);
}

export function sd(xs: number[]): number {
  return Math.sqrt(variance(xs));
}

/** Percentile (0..100) via linear interpolation on the sorted sample. */
export function percentile(xs: number[], p: number): number {
  if (xs.length === 0) return NaN;
  const sorted = [...xs].sort((a, b) => a - b);
  if (sorted.length === 1) return sorted[0];
  const rank = (p / 100) * (sorted.length - 1);
  const lo = Math.floor(rank);
  const hi = Math.ceil(rank);
  if (lo === hi) return sorted[lo];
  const frac = rank - lo;
  return sorted[lo] * (1 - frac) + sorted[hi] * frac;
}

/** Abramowitz & Stegun 7.1.26 approximation of erf. */
export function erf(x: number): number {
  const sign = x < 0 ? -1 : 1;
  const ax = Math.abs(x);
  const t = 1 / (1 + 0.3275911 * ax);
  const y =
    1 -
    ((((1.061405429 * t - 1.453152027) * t + 1.421413741) * t -
      0.284496736) *
      t +
      0.254829592) *
      t *
      Math.exp(-ax * ax);
  return sign * y;
}

/** Standard normal CDF. */
export function normalCdf(x: number): number {
  return 0.5 * (1 + erf(x / Math.SQRT2));
}

/**
 * Sample a Binomial(n, p) count. For the panel sizes used here (n in the
 * thousands) the normal approximation is accurate and O(1) — fast enough to run
 * hundreds of bootstrap replicates on every slider move.
 */
export function binomialSample(rng: RNG, n: number, p: number): number {
  if (n <= 0) return 0;
  p = Math.max(0, Math.min(1, p));
  const mu = n * p;
  const sigma = Math.sqrt(n * p * (1 - p));
  if (sigma < 1e-9) return Math.round(mu);
  const draw = Math.round(normal(rng, mu, sigma));
  return Math.max(0, Math.min(n, draw));
}

export interface TwoPropTest {
  p1: number;
  p2: number;
  diff: number;
  se: number;
  z: number;
  pValue: number;
  significant: boolean;
}

/** Two-sample z-test of proportions (exposed vs control). */
export function twoProportionZTest(
  conv1: number,
  n1: number,
  conv2: number,
  n2: number,
  alpha = 0.05
): TwoPropTest {
  const p1 = n1 > 0 ? conv1 / n1 : 0;
  const p2 = n2 > 0 ? conv2 / n2 : 0;
  const se = Math.sqrt((p1 * (1 - p1)) / Math.max(n1, 1) + (p2 * (1 - p2)) / Math.max(n2, 1));
  const z = se > 0 ? (p1 - p2) / se : 0;
  const pValue = 2 * (1 - normalCdf(Math.abs(z)));
  return {
    p1,
    p2,
    diff: p1 - p2,
    se,
    z,
    pValue,
    significant: pValue < alpha,
  };
}

export interface BootstrapResult {
  samples: number[];
  ci: CI;
  pointEstimate: number;
}

/**
 * Parametric bootstrap on aggregated counts.
 * Each replicate redraws conversion counts for exposed/control from their
 * sampling distribution, then re-evaluates `statistic`. Returns the percentile CI.
 */
export function bootstrapAggregated(
  rng: RNG,
  params: {
    nExposed: number;
    convExposed: number;
    nControl: number;
    convControl: number;
  },
  statistic: (pExposed: number, pControl: number) => number,
  B = 600,
  level = 0.95
): BootstrapResult {
  const { nExposed, convExposed, nControl, convControl } = params;
  const pExp = nExposed > 0 ? convExposed / nExposed : 0;
  const pCtrl = nControl > 0 ? convControl / nControl : 0;
  const samples: number[] = new Array(B);
  for (let b = 0; b < B; b++) {
    const cExp = binomialSample(rng, nExposed, pExp);
    const cCtrl = binomialSample(rng, nControl, pCtrl);
    const peb = nExposed > 0 ? cExp / nExposed : 0;
    const pcb = nControl > 0 ? cCtrl / nControl : 0;
    samples[b] = statistic(peb, pcb);
  }
  const lowerP = ((1 - level) / 2) * 100;
  const upperP = (1 - (1 - level) / 2) * 100;
  return {
    samples,
    ci: { lo: percentile(samples, lowerP), hi: percentile(samples, upperP) },
    pointEstimate: statistic(pExp, pCtrl),
  };
}

export function r2Score(observed: number[], fitted: number[]): number {
  const m = mean(observed);
  let ssRes = 0;
  let ssTot = 0;
  for (let i = 0; i < observed.length; i++) {
    ssRes += (observed[i] - fitted[i]) ** 2;
    ssTot += (observed[i] - m) ** 2;
  }
  return ssTot > 0 ? 1 - ssRes / ssTot : 0;
}

export function mape(observed: number[], fitted: number[]): number {
  let s = 0;
  let k = 0;
  for (let i = 0; i < observed.length; i++) {
    if (Math.abs(observed[i]) > 1e-9) {
      s += Math.abs((observed[i] - fitted[i]) / observed[i]);
      k++;
    }
  }
  return k > 0 ? s / k : 0;
}
