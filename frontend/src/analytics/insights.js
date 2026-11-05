/**
 * Deterministic findings from calculated statistics only.
 * Does not call Groq or invent numbers that are not in the analysis objects.
 */

import { classifyColumns, inferColumns } from "./columnTyping.js";
import { computeStatistics } from "./statistics.js";
import { detectOutliers } from "./outliers.js";
import { computeCorrelations } from "./correlation.js";

function pushFinding(list, finding) {
  list.push(finding);
}

/**
 * @param {{
 *   statistics: ReturnType<typeof computeStatistics>,
 *   outliers?: ReturnType<typeof detectOutliers>,
 *   correlations?: ReturnType<typeof computeCorrelations>,
 * }} analysis
 */
export function buildInsights(analysis) {
  const findings = [];
  const stats = analysis?.statistics;
  if (!stats) return findings;

  if (stats.rowCount === 0) {
    pushFinding(findings, {
      type: "empty",
      message: "The result set is empty, so no statistics were calculated.",
      evidence: { rowCount: 0 },
    });
    return findings;
  }

  pushFinding(findings, {
    type: "shape",
    message: `The result set has ${stats.rowCount} row(s) and ${stats.columnCount} column(s).`,
    evidence: { rowCount: stats.rowCount, columnCount: stats.columnCount },
  });

  if (stats.missingCells > 0) {
    pushFinding(findings, {
      type: "missing",
      message: `${stats.missingCells} cell(s) are missing (null or empty).`,
      evidence: { missingCells: stats.missingCells },
    });
  }

  for (const [col, num] of Object.entries(stats.numeric ?? {})) {
    if (num.count === 0) continue;
    pushFinding(findings, {
      type: "numeric_range",
      message: `In "${col}", the lowest numeric value is ${num.min} and the highest is ${num.max} (from ${num.count} numeric value(s)).`,
      evidence: {
        column: col,
        min: num.min,
        max: num.max,
        count: num.count,
      },
    });
  }

  for (const [col, cat] of Object.entries(stats.categorical ?? {})) {
    if (!cat.mostFrequent) continue;
    pushFinding(findings, {
      type: "most_frequent",
      message: `In "${col}", the most frequent value is "${cat.mostFrequent.value}" (${cat.mostFrequent.count} occurrence(s)).`,
      evidence: {
        column: col,
        value: cat.mostFrequent.value,
        count: cat.mostFrequent.count,
      },
    });
  }

  const outliers = analysis.outliers;
  if (outliers?.byColumn) {
    for (const [col, report] of Object.entries(outliers.byColumn)) {
      if (report.skipped || report.count === 0) continue;
      pushFinding(findings, {
        type: "potential_outliers",
        message: `"${col}" has ${report.count} potential outlier(s) using the IQR rule (fences ${report.lowerFence} to ${report.upperFence}).`,
        evidence: {
          column: col,
          count: report.count,
          lowerFence: report.lowerFence,
          upperFence: report.upperFence,
        },
      });
    }
  }

  const corr = analysis.correlations;
  if (corr?.pairs) {
    for (const pair of corr.pairs) {
      if (pair.skipped || pair.r == null) continue;
      pushFinding(findings, {
        type: "correlation",
        message: `"${pair.columnA}" and "${pair.columnB}" have a Pearson correlation of ${pair.r} (n=${pair.n}). This is an association, not proof of causation.`,
        evidence: {
          columnA: pair.columnA,
          columnB: pair.columnB,
          r: pair.r,
          n: pair.n,
        },
      });
    }
  }

  return findings;
}

/**
 * Run typing, statistics, outliers, and correlation, then build findings.
 * Input rows are not mutated.
 * @param {unknown[]} rows
 */
export function analyzeDataset(rows) {
  const safeRows = Array.isArray(rows) ? rows : [];
  const classification = classifyColumns(safeRows, inferColumns(safeRows));
  const statistics = computeStatistics(safeRows, classification);
  const outliers = detectOutliers(safeRows, classification);
  const correlations = computeCorrelations(safeRows, classification);
  const insights = buildInsights({ statistics, outliers, correlations });
  return {
    classification,
    statistics,
    outliers,
    correlations,
    insights,
  };
}
