/**
 * Chart series helpers extracted from ResultsVisualizer.
 * Behavior matches the original visualizer (including summing Y by X).
 */

import { coerceNumber } from "./formatters.js";

export function aggregateXY(rows, xKey, yKey, limit = 24) {
  const map = new Map();
  const list = Array.isArray(rows) ? rows : [];
  for (const row of list) {
    const yv = coerceNumber(row?.[yKey]);
    if (yv === null || !Number.isFinite(yv)) continue;
    const xv = row?.[xKey];
    const label =
      xv === null || xv === undefined || xv === "" ? "—" : String(xv);
    map.set(label, (map.get(label) ?? 0) + yv);
  }
  const sorted = Array.from(map.entries()).sort((a, b) => b[1] - a[1]);
  const top = sorted.slice(0, limit);
  const rest = sorted.slice(limit);
  const restSum = rest.reduce((acc, [, v]) => acc + v, 0);
  const data = top.map(([name, value]) => ({ name, value }));
  if (restSum !== 0) data.push({ name: `Other (${rest.length} …)`, value: restSum });
  return data;
}

export function lineSeries(rows, xKey, yKey, maxPoints = 180) {
  const list = Array.isArray(rows) ? rows : [];
  const out = [];
  let skipped = 0;
  for (let i = 0; i < list.length; i++) {
    const row = list[i];
    const yv = coerceNumber(row?.[yKey]);
    if (yv === null || !Number.isFinite(yv)) {
      skipped += 1;
      continue;
    }
    const xv = row?.[xKey];
    const name =
      xv !== null && xv !== undefined && xv !== ""
        ? String(xv)
        : `Row ${i + 1}`;
    out.push({ name, value: yv, __i: i });
    if (out.length >= maxPoints) break;
  }
  return { data: out, skipped, truncated: list.length > out.length };
}
