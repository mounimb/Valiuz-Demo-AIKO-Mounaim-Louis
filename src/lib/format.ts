/** fr-FR number / currency / percentage formatting helpers. */

const eur0 = new Intl.NumberFormat("fr-FR", {
  style: "currency",
  currency: "EUR",
  maximumFractionDigits: 0,
});

const eurCompact = new Intl.NumberFormat("fr-FR", {
  style: "currency",
  currency: "EUR",
  notation: "compact",
  maximumFractionDigits: 1,
});

const num0 = new Intl.NumberFormat("fr-FR", { maximumFractionDigits: 0 });
const numCompact = new Intl.NumberFormat("fr-FR", {
  notation: "compact",
  maximumFractionDigits: 1,
});

export function formatEuro(v: number, digits = 0): string {
  if (!Number.isFinite(v)) return "—";
  if (digits === 0) return eur0.format(v);
  return new Intl.NumberFormat("fr-FR", {
    style: "currency",
    currency: "EUR",
    maximumFractionDigits: digits,
  }).format(v);
}

export function formatEuroCompact(v: number): string {
  if (!Number.isFinite(v)) return "—";
  return eurCompact.format(v);
}

export function formatNumber(v: number, digits = 0): string {
  if (!Number.isFinite(v)) return "—";
  return new Intl.NumberFormat("fr-FR", { maximumFractionDigits: digits }).format(v);
}

export function formatCompact(v: number): string {
  if (!Number.isFinite(v)) return "—";
  return numCompact.format(v);
}

/** ratio (e.g. 0.123) -> "12,3 %" */
export function formatPct(ratio: number, digits = 1): string {
  if (!Number.isFinite(ratio)) return "—";
  return `${new Intl.NumberFormat("fr-FR", {
    minimumFractionDigits: digits,
    maximumFractionDigits: digits,
  }).format(ratio * 100)} %`;
}

/** already-a-percentage value (e.g. 12.3) -> "12,3 %" */
export function formatPctValue(v: number, digits = 1): string {
  if (!Number.isFinite(v)) return "—";
  return `${new Intl.NumberFormat("fr-FR", {
    minimumFractionDigits: digits,
    maximumFractionDigits: digits,
  }).format(v)} %`;
}

/** multiplier (e.g. 4.21) -> "4,21×" */
export function formatMultiplier(v: number, digits = 2): string {
  if (!Number.isFinite(v)) return "—";
  return `${new Intl.NumberFormat("fr-FR", {
    minimumFractionDigits: digits,
    maximumFractionDigits: digits,
  }).format(v)}×`;
}

export function formatSignedPct(ratio: number, digits = 1): string {
  if (!Number.isFinite(ratio)) return "—";
  const s = ratio >= 0 ? "+" : "";
  return `${s}${formatPct(ratio, digits)}`;
}

void num0;
