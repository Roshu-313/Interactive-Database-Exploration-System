/**
 * Serialize DB driver values for JSON responses and infer chart/table metadata.
 */

const SAMPLE_LIMIT = 500;

function serializeCell(value) {
  if (value === null || value === undefined) return value;
  if (typeof value === 'bigint') return value.toString();
  if (value instanceof Date) return value.toISOString();
  if (typeof value === 'object' && typeof value.toJSON === 'function') {
    return value.toJSON();
  }
  if (Buffer.isBuffer(value)) return value.toString('base64');
  return value;
}

function serializeRow(row) {
  if (row == null || typeof row !== 'object' || Array.isArray(row)) {
    return row;
  }
  const out = {};
  for (const key of Object.keys(row)) {
    out[key] = serializeCell(row[key]);
  }
  return out;
}

function serializeResults(rows) {
  if (!Array.isArray(rows)) return rows;
  return rows.map(serializeRow);
}

function coerceToNumber(value) {
  if (value === null || value === undefined || value === '') return null;
  if (typeof value === 'bigint') return Number(value);
  if (typeof value === 'number') return Number.isFinite(value) ? value : null;
  if (typeof value === 'boolean') return value ? 1 : 0;
  if (typeof value === 'string') {
    const t = value.trim();
    if (t === '') return null;
    const n = Number(t);
    return Number.isFinite(n) ? n : null;
  }
  return null;
}

function cellLooksNumeric(raw) {
  if (raw === null || raw === undefined) return null;
  if (typeof raw === 'bigint') return true;
  if (typeof raw === 'number') return Number.isFinite(raw);
  if (typeof raw === 'boolean') return true;
  if (typeof raw === 'string') {
    const t = raw.trim();
    if (t === '') return null;
    return /^-?\d+(\.\d+)?([eE][+-]?\d+)?$/.test(t);
  }
  return false;
}

/**
 * Infer columns and visualization hints from plain row objects.
 * @param {Array<Record<string, unknown>>} rows
 */
function buildVisualizationMeta(rows) {
  const safeRows = Array.isArray(rows) ? rows : [];
  const sample = safeRows.slice(0, SAMPLE_LIMIT);

  if (sample.length === 0) {
    return {
      columns: [],
      rowCount: safeRows.length,
      numericColumns: [],
      textColumns: [],
      visualization: {
        chartTypesSupported: [],
        defaultView: 'table',
        suggestedXAxis: null,
        suggestedYAxis: null,
        notes: 'No rows returned — add filters or choose another question.',
      },
    };
  }

  const columnSet = new Set();
  for (const row of sample) {
    if (row && typeof row === 'object' && !Array.isArray(row)) {
      Object.keys(row).forEach((k) => columnSet.add(k));
    }
  }
  const columns = Array.from(columnSet);

  const numericScores = Object.fromEntries(columns.map((c) => [c, { ok: 0, total: 0 }]));

  for (const row of sample) {
    if (!row || typeof row !== 'object') continue;
    for (const col of columns) {
      const raw = row[col];
      if (raw === null || raw === undefined || raw === '') continue;
      numericScores[col].total += 1;
      const looks = cellLooksNumeric(raw);
      if (looks === true) numericScores[col].ok += 1;
    }
  }

  const numericColumns = columns.filter((col) => {
    const { ok, total } = numericScores[col];
    if (total === 0) return false;
    return ok / total >= 0.85;
  });

  const textColumns = columns.filter((c) => !numericColumns.includes(c));

  const suggestedYAxis =
    numericColumns.find((c) => !/^id$/i.test(c)) ?? numericColumns[0] ?? null;

  const categoricalCandidates = textColumns.length
    ? textColumns
    : columns.filter((c) => c !== suggestedYAxis);

  const suggestedXAxis =
    categoricalCandidates.find((c) => !/^id$/i.test(c)) ??
    categoricalCandidates[0] ??
    columns.find((c) => c !== suggestedYAxis) ??
    null;

  const chartTypesSupported = [];
  if (numericColumns.length >= 1 && (suggestedXAxis || columns.length >= 1)) {
    chartTypesSupported.push('bar', 'line');
  }
  if (numericColumns.length >= 1 && suggestedXAxis) {
    chartTypesSupported.push('pie');
  }

  return {
    columns,
    rowCount: safeRows.length,
    numericColumns,
    textColumns,
    visualization: {
      chartTypesSupported,
      defaultView: chartTypesSupported.length ? 'table' : 'table',
      suggestedXAxis,
      suggestedYAxis,
      notes:
        numericColumns.length === 0
          ? 'No numeric columns detected — charts need at least one numeric field.'
          : null,
    },
  };
}

module.exports = {
  serializeCell,
  serializeRow,
  serializeResults,
  buildVisualizationMeta,
  coerceToNumber,
};
