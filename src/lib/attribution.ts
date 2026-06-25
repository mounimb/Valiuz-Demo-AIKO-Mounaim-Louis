/**
 * Attribution-window sensitivity: as the window widens, the gross (closed-loop)
 * ROAS inflates because it captures more organic conversions, while the
 * incremental iROAS stays ~stable. The core "attribution != incrementality" demo.
 */

import type {
  Individual,
  AttributionByWindow,
  AttributionWindow,
  ScenarioConfig,
  ScenarioParams,
} from "./types";
import { computeIncrementality } from "./incrementality";

const WINDOWS: AttributionWindow[] = [7, 14, 30];

function lognormalMean(median: number, sdLog: number): number {
  return median * Math.exp((sdLog * sdLog) / 2);
}

function windowFactor(w: number): number {
  return w <= 7 ? 0.82 : w >= 30 ? 1.22 : 1.0;
}

export interface AttributionResult {
  byWindow: AttributionByWindow[];
  lastTouchRoas: number;
}

export function computeAttribution(
  inds: Individual[],
  scenario: ScenarioConfig,
  params: ScenarioParams,
  totalSpend: number,
  audienceWeight: number
): AttributionResult {
  const w = audienceWeight;

  const byWindow: AttributionByWindow[] = WINDOWS.map((window) => {
    const incr = computeIncrementality(inds, window);
    const avgBasket =
      incr.avgBasketExposed > 0
        ? incr.avgBasketExposed
        : lognormalMean(scenario.basketMedian, scenario.basketSdLog);
    const incrementalSales = incr.incrementalConversions * avgBasket * w;
    const grossAttributedSales =
      incrementalSales * scenario.organicMultiple * windowFactor(window);
    return {
      window,
      grossAttributedSales,
      grossRoas: totalSpend > 0 ? grossAttributedSales / totalSpend : 0,
      iroas: totalSpend > 0 ? incrementalSales / totalSpend : 0,
    };
  });

  // Last-touch = the widest, most generous correlational view (30-day gross).
  const lastTouch = byWindow.find((b) => b.window === 30)?.grossRoas ?? 0;

  return { byWindow, lastTouchRoas: lastTouch };
}
