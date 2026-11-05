/**
 * Shared coercion and display helpers for query-result analysis and charts.
 * Pure functions; do not mutate inputs.
 */

export function isMissing(value) {
  return value === null || value === undefined || value === "";
}

/**
 * Whether a cell looks numeric for chart axis detection.
 * Returns null for missing values (skipped in ratios), true/false otherwise.
 * Booleans are treated as numeric here to preserve existing chart Y-axis behavior.
 */
export function looksNumeric(value) {
  if (value === null || value === undefined || value === "") return null;
  if (typeof value === "number") return Number.isFinite(value);
  if (typeof value === "boolean") return true;
  if (typeof value === "string") {
    const t = value.trim();
    if (t === "") return null;
    return /^-?\d+(\.\d+)?([eE][+-]?\d+)?$/.test(t);
  }
  return false;
}

/**
 * Coerce a cell to a finite number, or null.
 * Booleans become 1/0 so existing bar/line/pie aggregation is unchanged.
 */
export function coerceNumber(value) {
  if (value === null || value === undefined || value === "") return null;
  if (typeof value === "number") return Number.isFinite(value) ? value : null;
  if (typeof value === "boolean") return value ? 1 : 0;
  if (typeof value === "string") {
    const n = Number(value.trim());
    return Number.isFinite(n) ? n : null;
  }
  return null;
}

/**
 * Numeric coercion for statistical analysis (not charts).
 * Booleans are excluded so they are not summed or averaged.
 */
export function coerceNumberForStats(value) {
  if (value === null || value === undefined || value === "") return null;
  if (typeof value === "boolean") return null;
  if (typeof value === "number") return Number.isFinite(value) ? value : null;
  if (typeof value === "string") {
    const t = value.trim();
    if (t === "") return null;
    if (!/^-?\d+(\.\d+)?([eE][+-]?\d+)?$/.test(t)) return null;
    const n = Number(t);
    return Number.isFinite(n) ? n : null;
  }
  return null;
}

export function formatCell(value) {
  if (value === null || value === undefined) return "";
  if (typeof value === "object") return JSON.stringify(value);
  return String(value);
}

export function compareValues(a, b, col) {
  const va = a?.[col];
  const vb = b?.[col];
  const na = coerceNumber(va);
  const nb = coerceNumber(vb);
  if (na !== null && nb !== null && na !== nb) return na - nb;
  return formatCell(va).localeCompare(formatCell(vb), undefined, {
    numeric: true,
    sensitivity: "base",
  });
}

export function roundStat(value, digits = 6) {
  if (value === null || value === undefined) return null;
  if (typeof value !== "number" || !Number.isFinite(value)) return null;
  const f = 10 ** digits;
  return Math.round(value * f) / f;
}
