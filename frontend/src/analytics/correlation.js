/**
 * Pearson correlation between suitable numeric columns (pairwise complete).
 * Correlation is an association measure only — not causation.
 */

import { classifyColumns, inferColumns } from "./columnTyping.js";
import { coerceNumberForStats, roundStat } from "./formatters.js";

const MIN_PAIRWISE = 5;

function pearson(xs, ys) {
  const n = xs.length;
  if (n < MIN_PAIRWISE) {
    return { skipped: true, reason: "insufficient_pairwise_samples", n, r: null };
  }
  let meanX = 0;
  let meanY = 0;
  for (let i = 0; i < n; i++) {
    meanX += xs[i];
    meanY += ys[i];
  }
  meanX /= n;
  meanY /= n;
  let num = 0;
  let dx2 = 0;
  let dy2 = 0;
  for (let i = 0; i < n; i++) {
    const dx = xs[i] - meanX;
    const dy = ys[i] - meanY;
    num += dx * dy;
    dx2 += dx * dx;
    dy2 += dy * dy;
  }
  if (dx2 === 0 || dy2 === 0) {
    return { skipped: true, reason: "constant_column", n, r: null };
  }
  const r = num / Math.sqrt(dx2 * dy2);
  if (!Number.isFinite(r)) {
    return { skipped: true, reason: "undefined_coefficient", n, r: null };
  }
  return { skipped: false, reason: null, n, r: roundStat(r) };
}

function pairwiseValues(rows, a, b) {
  const xs = [];
  const ys = [];
  for (const row of rows) {
    const x = coerceNumberForStats(row?.[a]);
    const y = coerceNumberForStats(row?.[b]);
    if (x === null || y === null) continue;
    xs.push(x);
    ys.push(y);
  }
  return { xs, ys };
}

/**
 * @param {unknown[]} rows
 * @param {ReturnType<typeof classifyColumns>} [classification]
 */
export function computeCorrelations(rows, classification) {
  const safeRows = Array.isArray(rows) ? rows : [];
  const typed =
    classification ?? classifyColumns(safeRows, inferColumns(safeRows));
  const cols = typed.numericColumns ?? [];
  const pairs = [];

  if (cols.length < 2) {
    return {
      pairs,
      note: "Pearson correlation measures linear association, not causation.",
    };
  }

  for (let i = 0; i < cols.length; i++) {
    for (let j = i + 1; j < cols.length; j++) {
      const a = cols[i];
      const b = cols[j];
      const { xs, ys } = pairwiseValues(safeRows, a, b);
      const result = pearson(xs, ys);
      pairs.push({
        columnA: a,
        columnB: b,
        n: result.n,
        r: result.r,
        skipped: result.skipped,
        reason: result.reason,
      });
    }
  }

  pairs.sort((p, q) => {
    const ar = p.r == null ? -1 : Math.abs(p.r);
    const br = q.r == null ? -1 : Math.abs(q.r);
    return br - ar;
  });

  return {
    pairs,
    note: "Pearson correlation measures linear association, not causation.",
  };
}
