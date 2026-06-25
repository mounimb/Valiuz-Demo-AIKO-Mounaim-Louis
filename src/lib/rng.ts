/**
 * Deterministic, seeded pseudo-random number generator + sampling helpers.
 * Everything in the simulation is reproducible from a single integer seed,
 * so the same scenario always yields the same dataset (important for a live demo).
 */

export type RNG = () => number;

/** mulberry32 — fast, good-enough 32-bit seeded generator. */
export function mulberry32(seed: number): RNG {
  let a = seed >>> 0;
  return function () {
    a |= 0;
    a = (a + 0x6d2b79f5) | 0;
    let t = Math.imul(a ^ (a >>> 15), 1 | a);
    t = (t + Math.imul(t ^ (t >>> 7), 61 | t)) ^ t;
    return ((t ^ (t >>> 14)) >>> 0) / 4294967296;
  };
}

/** Stable string -> 32-bit seed (FNV-1a). */
export function hashSeed(str: string): number {
  let h = 2166136261 >>> 0;
  for (let i = 0; i < str.length; i++) {
    h ^= str.charCodeAt(i);
    h = Math.imul(h, 16777619);
  }
  return h >>> 0;
}

export function uniform(rng: RNG, min = 0, max = 1): number {
  return min + (max - min) * rng();
}

/** Standard normal via Box–Muller. */
export function normal(rng: RNG, mean = 0, sd = 1): number {
  let u = 0;
  let v = 0;
  while (u === 0) u = rng();
  while (v === 0) v = rng();
  return mean + sd * Math.sqrt(-2 * Math.log(u)) * Math.cos(2 * Math.PI * v);
}

export function bernoulli(rng: RNG, p: number): boolean {
  return rng() < p;
}

/** Poisson sampling via Knuth's algorithm (fine for small/moderate lambda). */
export function poisson(rng: RNG, lambda: number): number {
  if (lambda <= 0) return 0;
  const L = Math.exp(-lambda);
  let k = 0;
  let p = 1;
  do {
    k++;
    p *= rng();
  } while (p > L);
  return k - 1;
}

export function choice<T>(rng: RNG, arr: readonly T[]): T {
  return arr[Math.floor(rng() * arr.length)];
}

/** Weighted choice; weights need not be normalized. */
export function weightedChoice<T>(rng: RNG, items: readonly T[], weights: readonly number[]): T {
  const total = weights.reduce((s, w) => s + w, 0);
  let r = rng() * total;
  for (let i = 0; i < items.length; i++) {
    r -= weights[i];
    if (r <= 0) return items[i];
  }
  return items[items.length - 1];
}

export function clamp(x: number, lo: number, hi: number): number {
  return Math.max(lo, Math.min(hi, x));
}
