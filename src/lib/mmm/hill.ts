/** Hill saturation curve: concave, diminishing-returns media response. */

export function hillResponse(x: number, K: number, slope: number): number {
  if (x <= 0) return 0;
  const xs = Math.pow(x, slope);
  const ks = Math.pow(K, slope);
  return xs / (xs + ks);
}

/** d/dx of the Hill response — used for marginal ROAS in the budget optimizer. */
export function hillDerivative(x: number, K: number, slope: number): number {
  if (x <= 0) return 0;
  const ks = Math.pow(K, slope);
  const xs = Math.pow(x, slope);
  const denom = (xs + ks) * (xs + ks);
  return (slope * ks * Math.pow(x, slope - 1)) / denom;
}
