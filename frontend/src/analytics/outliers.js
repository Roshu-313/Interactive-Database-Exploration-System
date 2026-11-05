/**
 * Tukey IQR potential-outlier detection.
 * Does not mutate input rows. Constant or tiny series yield no outliers.
 */

import { classifyColumns, inferColumns } from "./columnTyping.js";
import { coerceNumberForStats, roundStat } from "./formatters.js";

const MIN_N = 4;
const IQR_K = 1.5;
const VALUE_CAP = 25;

function quantileSorted(sorted, q) {
  if (!sorted.length) return null;
  if (sorted.length === 1) return sorted[0];
  const pos = (sorted.length - 1) * q;
  const lo = Math.floor(pos);
  const hi = Math.ceil(pos);
  if (lo === hi) return sorted[lo];
  const w = pos - lo;
  return sorted[lo] * (1 - w) + sorted[hi] * w;
}

function detectColumnOutliers(rows, col) {
  const points = [];
  for (let i = 0; i < rows.length; i++) {
    const n = coerceNumberForStats(rows[i]?.[col]);
    if (n !== null) points.push({ index: i, value: n });
  }
  const n = points.length;
  if (n < MIN_N) {
    return {
      column: col,
      skipped: true,
      reason: "insufficient_numeric_values",
      count: 0,
      lowerFence: null,
      upperFence: null,
      q1: null,
      q3: null,
      iqr: null,
      values: [],
    };
  }

  const sortedVals = points.map((p) => p.value).sort((a, b) => a - b);
  const q1 = quantileSorted(sortedVals, 0.25);
  const q3 = quantileSorted(sortedVals, 0.75);
  const iqr = q3 - q1;

  if (!Number.isFinite(iqr) || iqr === 0) {
    return {
      column: col,
      skipped: true,
      reason: "zero_or_undefined_iqr",
      count: 0,
      lowerFence: q1,
      upperFence: q3,
      q1: roundStat(q1),
      q3: roundStat(q3),
      iqr: 0,
      values: [],
    };
  }

  const lowerFence = q1 - IQR_K * iqr;
  const upperFence = q3 + IQR_K * iqr;
  const hits = points.filter(
    (p) => p.value < lowerFence || p.value > upperFence,
  );

  return {
    column: col,
    skipped: false,
    reason: null,
    count: hits.length,
    lowerFence: roundStat(lowerFence),
    upperFence: roundStat(upperFence),
    q1: roundStat(q1),
    q3: roundStat(q3),
    iqr: roundStat(iqr),
    values: hits.slice(0, VALUE_CAP).map((p) => ({
      rowIndex: p.index,
      value: p.value,
    })),
  };
}

/**
 * @param {unknown[]} rows
 * @param {ReturnType<typeof classifyColumns>} [classification]
 */
export function detectOutliers(rows, classification) {
  const safeRows = Array.isArray(rows) ? rows : [];
  const typed =
    classification ?? classifyColumns(safeRows, inferColumns(safeRows));
  const byColumn = {};
  for (const col of typed.numericColumns) {
    byColumn[col] = detectColumnOutliers(safeRows, col);
  }
  const totalOutliers = Object.values(byColumn).reduce(
    (acc, r) => acc + (r.count ?? 0),
    0,
  );
  return { byColumn, totalOutliers };
}
