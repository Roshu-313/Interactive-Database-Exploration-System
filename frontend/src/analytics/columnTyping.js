/**
 * Infer column names and types from query result rows.
 * Classification uses spread sampling so later rows can influence types.
 */

import { isMissing, looksNumeric, coerceNumberForStats } from "./formatters.js";

const NUMERIC_RATIO = 0.85;
const DATE_RATIO = 0.85;
const BOOLEAN_RATIO = 0.95;

/** ISO date or datetime (date-only or with time / timezone). */
const ISO_DATE_RE =
  /^\d{4}-\d{2}-\d{2}(?:[T ]\d{2}:\d{2}(?::\d{2}(?:\.\d{1,9})?)?(?:Z|[+-]\d{2}:?\d{2})?)?$/;

/** Unambiguous year-first slash dates, e.g. 2024/03/15 */
const YMD_SLASH_RE = /^\d{4}\/\d{2}\/\d{2}$/;

function nameLooksLikeId(name) {
  const s = String(name);
  return /^id$/i.test(s) || /_id$/i.test(s) || /[a-z]Id$/.test(s);
}

/**
 * Evenly spaced sample of rows (includes start and, when possible, end).
 * @param {unknown[]} rows
 * @param {number} maxSample
 */
export function sampleRows(rows, maxSample = 400) {
  if (!Array.isArray(rows) || rows.length === 0) return [];
  const cap = Math.max(1, maxSample);
  if (rows.length <= cap) return rows;
  const out = [];
  const n = rows.length;
  const last = cap === 1 ? 1 : cap - 1;
  for (let i = 0; i < cap; i++) {
    const idx = Math.floor((i * (n - 1)) / last);
    out.push(rows[idx]);
  }
  return out;
}

/**
 * Column keys from the first rows — same behavior as the original visualizer.
 * @param {unknown[]} rows
 */
export function inferColumns(rows) {
  if (!Array.isArray(rows) || rows.length === 0) return [];
  const set = new Set();
  const cap = Math.min(rows.length, 80);
  for (let i = 0; i < cap; i++) {
    const row = rows[i];
    if (row && typeof row === "object" && !Array.isArray(row)) {
      Object.keys(row).forEach((k) => set.add(k));
    }
  }
  return Array.from(set);
}

/**
 * Chart-compatible numeric columns (first 400 rows, booleans count as numeric).
 * Preserves existing ResultsVisualizer Y-axis detection.
 * @param {unknown[]} rows
 * @param {string[]} columns
 */
export function inferNumericColumns(rows, columns) {
  const sample = Array.isArray(rows) ? rows.slice(0, 400) : [];
  return (columns ?? []).filter((col) => {
    let ok = 0;
    let total = 0;
    for (const row of sample) {
      const v = row?.[col];
      if (isMissing(v)) continue;
      total += 1;
      const ln = looksNumeric(v);
      if (ln === true) ok += 1;
    }
    if (total === 0) return false;
    return ok / total >= NUMERIC_RATIO;
  });
}

function isBooleanLike(value) {
  if (typeof value === "boolean") return true;
  if (typeof value === "string") {
    const t = value.trim().toLowerCase();
    return t === "true" || t === "false";
  }
  return false;
}

/**
 * Parse only ISO / YYYY/MM/DD / Date instances. Rejects arbitrary text.
 * @param {unknown} value
 * @returns {Date | null}
 */
export function parseStrictDate(value) {
  if (value instanceof Date) {
    return Number.isFinite(value.getTime()) ? value : null;
  }
  if (typeof value !== "string") return null;
  const t = value.trim();
  if (t === "") return null;
  if (!ISO_DATE_RE.test(t) && !YMD_SLASH_RE.test(t)) return null;

  if (ISO_DATE_RE.test(t) && /^\d{4}-\d{2}-\d{2}$/.test(t)) {
    const [y, m, d] = t.split("-").map(Number);
    const dt = new Date(Date.UTC(y, m - 1, d));
    if (
      dt.getUTCFullYear() !== y ||
      dt.getUTCMonth() !== m - 1 ||
      dt.getUTCDate() !== d
    ) {
      return null;
    }
    return dt;
  }

  if (YMD_SLASH_RE.test(t)) {
    const [y, m, d] = t.split("/").map(Number);
    const dt = new Date(Date.UTC(y, m - 1, d));
    if (
      dt.getUTCFullYear() !== y ||
      dt.getUTCMonth() !== m - 1 ||
      dt.getUTCDate() !== d
    ) {
      return null;
    }
    return dt;
  }

  const ms = Date.parse(t);
  if (!Number.isFinite(ms)) return null;
  return new Date(ms);
}

/**
 * Full type classification for analysis (not used to change chart axes in Phase 1).
 * @param {unknown[]} rows
 * @param {string[]} [columns]
 */
export function classifyColumns(rows, columns) {
  const safeRows = Array.isArray(rows) ? rows : [];
  const cols =
    Array.isArray(columns) && columns.length > 0
      ? columns
      : inferColumns(safeRows);

  const sample = sampleRows(safeRows, 400);

  const booleanColumns = [];
  const dateColumns = [];
  const idColumns = [];
  const numericColumns = [];
  const categoricalColumns = [];
  const types = {};

  for (const col of cols) {
    let nonMissing = 0;
    let boolHits = 0;
    let dateHits = 0;
    let numericHits = 0;

    for (const row of sample) {
      const v = row?.[col];
      if (isMissing(v)) continue;
      nonMissing += 1;
      if (isBooleanLike(v)) boolHits += 1;
      if (parseStrictDate(v)) dateHits += 1;
      if (coerceNumberForStats(v) !== null) numericHits += 1;
    }

    let kind = "categorical";
    if (nonMissing === 0) {
      kind = "categorical";
    } else if (boolHits / nonMissing >= BOOLEAN_RATIO) {
      kind = "boolean";
    } else if (
      dateHits / nonMissing >= DATE_RATIO &&
      numericHits / nonMissing < NUMERIC_RATIO
    ) {
      kind = "date";
    } else if (nameLooksLikeId(col) && numericHits / nonMissing >= NUMERIC_RATIO) {
      kind = "id";
    } else if (numericHits / nonMissing >= NUMERIC_RATIO) {
      kind = "numeric";
    } else {
      kind = "categorical";
    }

    types[col] = kind;
    if (kind === "boolean") booleanColumns.push(col);
    else if (kind === "date") dateColumns.push(col);
    else if (kind === "id") idColumns.push(col);
    else if (kind === "numeric") numericColumns.push(col);
    else categoricalColumns.push(col);
  }

  return {
    columns: cols,
    types,
    booleanColumns,
    dateColumns,
    idColumns,
    numericColumns,
    categoricalColumns,
  };
}
