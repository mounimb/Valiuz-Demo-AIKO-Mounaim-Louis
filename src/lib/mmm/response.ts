/** Media response curves and marginal ROAS derived from the fitted MMM. */

import type { LeverKey, LeverValues, MmmLeverParams } from "../types";
import { LEVERS } from "../types";
import { hillResponse, hillDerivative } from "./hill";

/** Predicted incremental sales (€) over the period for a given total spend on a lever. */
export function incrementalForSpend(
  p: MmmLeverParams,
  totalSpend: number,
  durationDays: number
): number {
  if (totalSpend <= 0) return 0;
  const daily = totalSpend / durationDays;
  const adstockedK = daily / 1000 / (1 - p.lambda); // steady-state adstock in k€
  return p.beta * durationDays * hillResponse(adstockedK, p.K, p.slope);
}

/** Marginal ROAS = d(incremental sales)/d(spend) at the given total spend. */
export function marginalRoas(
  p: MmmLeverParams,
  totalSpend: number,
  durationDays: number
): number {
  const daily = Math.max(1, totalSpend) / durationDays;
  const adstockedK = daily / 1000 / (1 - p.lambda);
  return (p.beta * hillDerivative(adstockedK, p.K, p.slope)) / (1000 * (1 - p.lambda));
}

export function buildResponseCurves(
  params: Record<LeverKey, MmmLeverParams>,
  currentSpend: LeverValues,
  durationDays: number,
  points = 32
): Record<LeverKey, { spend: number; response: number }[]> {
  const out = {
    onsite: [] as { spend: number; response: number }[],
    offsite: [] as { spend: number; response: number }[],
    instore: [] as { spend: number; response: number }[],
  };
  for (const l of LEVERS) {
    const maxS = Math.max(currentSpend[l] * 2.2, 5000);
    for (let i = 0; i <= points; i++) {
      const spend = (maxS * i) / points;
      out[l].push({ spend, response: incrementalForSpend(params[l], spend, durationDays) });
    }
  }
  return out;
}
