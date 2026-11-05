/**
 * Descriptive statistics over query result rows.
 * Numeric summaries exclude boolean and likely-ID columns.
 */

import {
  classifyColumns,
  inferColumns,
  parseStrictDate,
} from "./columnTyping.js";
import {
  coerceNumberForStats,
  formatCell,
  isMissing,
  roundStat,
} from "./formatters.js";

const FREQ_CAP = 20;

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

function medianSorted(sorted) {
  return quantileSorted(sorted, 0.5);
}

function stddevSample(values, mean) {
  if (values.length < 2) return null;
  let ss = 0;
  for (const v of values) {
    const d = v - mean;
    ss += d * d;
  }
  return Math.sqrt(ss / (values.length - 1));
}

function collectNumeric(rows, col) {
  const values = [];
  for (const row of rows) {
    const n = coerceNumberForStats(row?.[col]);
    if (n !== null) values.push(n);
  }
  return values;
}

function numericSummary(rows, col) {
  const values = collectNumeric(rows, col);
  const count = values.length;
  if (count === 0) {
    return {
      count: 0,
      sum: null,
      mean: null,
      median: null,
      min: null,
      max: null,
      stddev: null,
    };
  }
  const sorted = [...values].sort((a, b) => a - b);
  const sum = values.reduce((a, b) => a + b, 0);
  const mean = sum / count;
  return {
    count,
    sum: roundStat(sum),
    mean: roundStat(mean),
    median: roundStat(medianSorted(sorted)),
    min: sorted[0],
    max: sorted[sorted.length - 1],
    stddev: roundStat(stddevSample(values, mean)),
  };
}

function categoricalSummary(rows, col) {
  const freq = new Map();
  let missing = 0;
  for (const row of rows) {
    const v = row?.[col];
    if (isMissing(v)) {
      missing += 1;
      continue;
    }
    const key = formatCell(v);
    freq.set(key, (freq.get(key) ?? 0) + 1);
  }
  const ranked = Array.from(freq.entries()).sort((a, b) => {
    if (b[1] !== a[1]) return b[1] - a[1];
    return a[0].localeCompare(b[0]);
  });
  const mostFrequent = ranked[0]
    ? { value: ranked[0][0], count: ranked[0][1] }
    : null;
  const leastFrequent = ranked.length
    ? { value: ranked[ranked.length - 1][0], count: ranked[ranked.length - 1][1] }
    : null;
  return {
    distinctCount: freq.size,
    missingCount: missing,
    mostFrequent,
    leastFrequent,
    topValues: ranked.slice(0, FREQ_CAP).map(([value, count]) => ({ value, count })),
  };
}

function dateSummary(rows, col) {
  let missing = 0;
  let invalid = 0;
  let valid = 0;
  let earliest = null;
  let latest = null;
  for (const row of rows) {
    const v = row?.[col];
    if (isMissing(v)) {
      missing += 1;
      continue;
    }
    const d = parseStrictDate(v);
    if (!d) {
      invalid += 1;
      continue;
    }
    valid += 1;
    if (!earliest || d.getTime() < earliest.getTime()) earliest = d;
    if (!latest || d.getTime() > latest.getTime()) latest = d;
  }
  return {
    validCount: valid,
    invalidCount: invalid,
    missingCount: missing,
    earliest: earliest ? earliest.toISOString() : null,
    latest: latest ? latest.toISOString() : null,
  };
}

function missingForColumn(rows, col) {
  let n = 0;
  for (const row of rows) {
    if (isMissing(row?.[col])) n += 1;
  }
  return n;
}

function distinctForColumn(rows, col) {
  const set = new Set();
  for (const row of rows) {
    const v = row?.[col];
    if (isMissing(v)) continue;
    set.add(formatCell(v));
  }
  return set.size;
}

/**
 * @param {unknown[]} rows
 * @param {ReturnType<typeof classifyColumns>} [classification]
 */
export function computeStatistics(rows, classification) {
  const safeRows = Array.isArray(rows) ? rows : [];
  const typed =
    classification ??
    classifyColumns(safeRows, inferColumns(safeRows));
  const columns = typed.columns ?? [];
  const rowCount = safeRows.length;
  const columnCount = columns.length;

  const missingByColumn = {};
  const distinctByColumn = {};
  let missingCells = 0;
  for (const col of columns) {
    const m = missingForColumn(safeRows, col);
    missingByColumn[col] = m;
    missingCells += m;
    distinctByColumn[col] = distinctForColumn(safeRows, col);
  }

  const numeric = {};
  for (const col of typed.numericColumns) {
    numeric[col] = numericSummary(safeRows, col);
  }

  const categorical = {};
  for (const col of typed.categoricalColumns) {
    categorical[col] = categoricalSummary(safeRows, col);
  }

  const booleans = {};
  for (const col of typed.booleanColumns) {
    booleans[col] = categoricalSummary(safeRows, col);
  }

  const dates = {};
  for (const col of typed.dateColumns) {
    dates[col] = dateSummary(safeRows, col);
  }

  const totalCells = rowCount * columnCount;
  return {
    rowCount,
    columnCount,
    missingCells,
    missingRatio: totalCells === 0 ? null : roundStat(missingCells / totalCells),
    missingByColumn,
    distinctByColumn,
    numeric,
    categorical,
    booleans,
    dates,
    classification: {
      types: typed.types,
      numericColumns: typed.numericColumns,
      categoricalColumns: typed.categoricalColumns,
      booleanColumns: typed.booleanColumns,
      dateColumns: typed.dateColumns,
      idColumns: typed.idColumns,
    },
  };
}
