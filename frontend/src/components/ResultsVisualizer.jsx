import { useMemo, useState } from "react";
import {
  ResponsiveContainer,
  BarChart,
  Bar,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  Legend,
  LineChart,
  Line,
  PieChart,
  Pie,
  Cell,
} from "recharts";

const PAGE_SIZES = [10, 25, 50, 100];
const CHART_COLORS = [
  "#2563eb",
  "#7c3aed",
  "#db2777",
  "#ea580c",
  "#16a34a",
  "#0891b2",
  "#ca8a04",
  "#4f46e5",
  "#0d9488",
  "#be123c",
];

function looksNumeric(value) {
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

function coerceNumber(value) {
  if (value === null || value === undefined || value === "") return null;
  if (typeof value === "number") return Number.isFinite(value) ? value : null;
  if (typeof value === "boolean") return value ? 1 : 0;
  if (typeof value === "string") {
    const n = Number(value.trim());
    return Number.isFinite(n) ? n : null;
  }
  return null;
}

function inferColumns(rows) {
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

function inferNumericColumns(rows, columns) {
  const sample = rows.slice(0, 400);
  return columns.filter((col) => {
    let ok = 0;
    let total = 0;
    for (const row of sample) {
      const v = row?.[col];
      if (v === null || v === undefined || v === "") continue;
      total += 1;
      const ln = looksNumeric(v);
      if (ln === true) ok += 1;
    }
    if (total === 0) return false;
    return ok / total >= 0.85;
  });
}

function formatCell(value) {
  if (value === null || value === undefined) return "";
  if (typeof value === "object") return JSON.stringify(value);
  return String(value);
}

function aggregateXY(rows, xKey, yKey, limit = 24) {
  const map = new Map();
  for (const row of rows) {
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

function lineSeries(rows, xKey, yKey, maxPoints = 180) {
  const out = [];
  let skipped = 0;
  for (let i = 0; i < rows.length; i++) {
    const row = rows[i];
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
  return { data: out, skipped, truncated: rows.length > out.length };
}

function compareValues(a, b, col) {
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

/**
 * Rich query results: sortable table, filter, pagination, and Recharts views.
 * @param {{ results: unknown[], resultMeta?: Record<string, unknown> }} props
 */
export function ResultsVisualizer({ results, resultMeta }) {
  const rows = useMemo(
    () => (Array.isArray(results) ? results : []),
    [results],
  );

  const columns = useMemo(() => {
    if (resultMeta?.columns?.length) return resultMeta.columns;
    return inferColumns(rows);
  }, [resultMeta, rows]);

  const numericColumns = useMemo(() => {
    if (resultMeta?.numericColumns?.length) return resultMeta.numericColumns;
    return inferNumericColumns(rows, columns);
  }, [resultMeta, rows, columns]);

  const serverNotes = resultMeta?.visualization?.notes;

  const [view, setView] = useState("table");
  const [filterText, setFilterText] = useState("");
  const [sort, setSort] = useState({ column: null, dir: "asc" });
  const [pageSize, setPageSize] = useState(25);
  const [page, setPage] = useState(1);

  const suggestedX = resultMeta?.visualization?.suggestedXAxis ?? null;
  const suggestedY = resultMeta?.visualization?.suggestedYAxis ?? null;

  const [xAxis, setXAxis] = useState(suggestedX ?? "");
  const [yAxis, setYAxis] = useState(suggestedY ?? "");

  const resolvedX = xAxis || suggestedX || columns[0] || "";
  const resolvedY =
    yAxis ||
    suggestedY ||
    numericColumns.find((c) => !/^id$/i.test(c)) ||
    numericColumns[0] ||
    "";

  const filteredRows = useMemo(() => {
    const q = filterText.trim().toLowerCase();
    if (!q) return rows;
    return rows.filter((row) => {
      if (!row || typeof row !== "object") return false;
      return columns.some((col) =>
        formatCell(row[col]).toLowerCase().includes(q),
      );
    });
  }, [rows, columns, filterText]);

  const sortedRows = useMemo(() => {
    if (!sort.column) return filteredRows;
    const col = sort.column;
    const dir = sort.dir === "desc" ? -1 : 1;
    const copy = [...filteredRows];
    copy.sort((a, b) => dir * compareValues(a, b, col));
    return copy;
  }, [filteredRows, sort]);

  const totalFiltered = sortedRows.length;
  const pageCount = Math.max(1, Math.ceil(totalFiltered / pageSize));
  const safePage = Math.min(page, pageCount);
  const pageSlice = useMemo(() => {
    const start = (safePage - 1) * pageSize;
    return sortedRows.slice(start, start + pageSize);
  }, [sortedRows, safePage, pageSize]);

  function toggleSort(col) {
    setSort((prev) => {
      if (prev.column !== col) return { column: col, dir: "asc" };
      return { column: col, dir: prev.dir === "asc" ? "desc" : "asc" };
    });
    setPage(1);
  }

  const chartIssues = useMemo(() => {
    const issues = [];
    if (!resolvedY || !numericColumns.includes(resolvedY)) {
      issues.push(
        "Pick a numeric column for the Y axis (or values axis on pie charts).",
      );
    }
    if ((view === "bar" || view === "pie") && !resolvedX) {
      issues.push("Pick a label/category column for the X axis.");
    }
    if ((view === "line" || view === "bar") && resolvedX === resolvedY) {
      issues.push("Choose different columns for X and Y so the chart is readable.");
    }
    return issues;
  }, [view, resolvedX, resolvedY, numericColumns]);

  const barPieData =
    resolvedX && resolvedY && numericColumns.includes(resolvedY)
      ? aggregateXY(rows, resolvedX, resolvedY)
      : [];

  const linePack =
    resolvedX && resolvedY && numericColumns.includes(resolvedY)
      ? lineSeries(rows, resolvedX, resolvedY)
      : { data: [], skipped: 0, truncated: false };

  const pieData = barPieData.filter((d) => d.value > 0);

  const canChart =
    numericColumns.length > 0 &&
    chartIssues.length === 0 &&
    rows.length > 0 &&
    ((view === "line" && linePack.data.length > 0) ||
      ((view === "bar" || view === "pie") && pieData.length > 0));

  const summaryChips = (
    <div className="flex flex-wrap gap-2 text-xs">
      <span className="inline-flex items-center rounded-full bg-slate-100 px-3 py-1 font-medium text-slate-700">
        {rows.length.toLocaleString()} rows
      </span>
      <span className="inline-flex items-center rounded-full bg-emerald-50 px-3 py-1 font-medium text-emerald-800">
        {columns.length} columns
      </span>
      {numericColumns.length ? (
        <span className="inline-flex items-center rounded-full bg-indigo-50 px-3 py-1 font-medium text-indigo-800">
          {numericColumns.length} numeric fields detected
        </span>
      ) : (
        <span className="inline-flex items-center rounded-full bg-amber-50 px-3 py-1 font-medium text-amber-900">
          No numeric fields detected
        </span>
      )}
    </div>
  );

  return (
    <section className="rounded-2xl border border-slate-200/90 bg-gradient-to-br from-white via-slate-50/40 to-white shadow-lg shadow-slate-200/50 overflow-hidden">
      <div className="border-b border-slate-100 bg-white/80 backdrop-blur px-5 py-4 md:px-6 md:py-5 flex flex-col gap-4">
        <div className="flex flex-col lg:flex-row lg:items-start lg:justify-between gap-4">
          <div className="space-y-2 min-w-0">
            <div className="flex items-center gap-2 flex-wrap">
              <h3 className="text-sm font-semibold text-slate-900 tracking-tight">
                Results explorer
              </h3>
              <span className="text-[11px] uppercase tracking-wide text-slate-400 font-semibold">
                Visualizer
              </span>
            </div>
            <p className="text-xs text-slate-600 leading-relaxed max-w-2xl">
              Inspect rows in a structured grid, filter quickly, and flip to
              charts when numeric columns are present — useful for spotting
              trends and distributions.
            </p>
            {summaryChips}
            {serverNotes ? (
              <p className="text-xs text-amber-800 bg-amber-50 border border-amber-100 rounded-lg px-3 py-2">
                {serverNotes}
              </p>
            ) : null}
          </div>

          <div
            className="flex flex-wrap gap-2 shrink-0"
            role="tablist"
            aria-label="Result view"
          >
            {[
              { id: "table", label: "Table" },
              { id: "bar", label: "Bar" },
              { id: "line", label: "Line" },
              { id: "pie", label: "Pie" },
            ].map((t) => (
              <button
                key={t.id}
                type="button"
                role="tab"
                aria-selected={view === t.id}
                onClick={() => setView(t.id)}
                className={`px-3 py-2 rounded-xl text-xs font-semibold transition-all border shadow-sm ${
                  view === t.id
                    ? "bg-slate-900 text-white border-slate-900 shadow-slate-300/40"
                    : "bg-white text-slate-700 border-slate-200 hover:border-slate-300 hover:bg-slate-50"
                }`}
              >
                {t.label}
              </button>
            ))}
          </div>
        </div>

        {view !== "table" ? (
          <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
            <label className="flex flex-col gap-1 text-xs font-medium text-slate-600">
              X axis / labels
              <select
                value={resolvedX}
                onChange={(e) => setXAxis(e.target.value)}
                className="rounded-xl border border-slate-200 bg-white px-3 py-2 text-sm text-slate-900 shadow-inner shadow-slate-100 focus:outline-none focus:ring-2 focus:ring-blue-500/25 focus:border-blue-500"
              >
                <option value="">Select column…</option>
                {columns.map((c) => (
                  <option key={c} value={c}>
                    {c}
                  </option>
                ))}
              </select>
            </label>
            <label className="flex flex-col gap-1 text-xs font-medium text-slate-600">
              Y axis / values
              <select
                value={resolvedY}
                onChange={(e) => setYAxis(e.target.value)}
                className="rounded-xl border border-slate-200 bg-white px-3 py-2 text-sm text-slate-900 shadow-inner shadow-slate-100 focus:outline-none focus:ring-2 focus:ring-blue-500/25 focus:border-blue-500"
              >
                <option value="">Select numeric column…</option>
                {numericColumns.map((c) => (
                  <option key={c} value={c}>
                    {c}
                  </option>
                ))}
              </select>
            </label>
          </div>
        ) : (
          <div className="flex flex-col sm:flex-row gap-3 sm:items-end">
            <label className="flex-1 flex flex-col gap-1 text-xs font-medium text-slate-600">
              Search within results
              <input
                type="search"
                value={filterText}
                onChange={(e) => {
                  setFilterText(e.target.value);
                  setPage(1);
                }}
                placeholder="Filter across all columns…"
                className="rounded-xl border border-slate-200 bg-white px-3 py-2 text-sm text-slate-900 placeholder:text-slate-400 shadow-inner shadow-slate-100 focus:outline-none focus:ring-2 focus:ring-blue-500/25 focus:border-blue-500"
              />
            </label>
            <label className="flex flex-col gap-1 text-xs font-medium text-slate-600 w-full sm:w-40">
              Page size
              <select
                value={pageSize}
                onChange={(e) => {
                  setPageSize(Number(e.target.value));
                  setPage(1);
                }}
                className="rounded-xl border border-slate-200 bg-white px-3 py-2 text-sm text-slate-900 shadow-inner shadow-slate-100 focus:outline-none focus:ring-2 focus:ring-blue-500/25 focus:border-blue-500"
              >
                {PAGE_SIZES.map((n) => (
                  <option key={n} value={n}>
                    {n} rows
                  </option>
                ))}
              </select>
            </label>
          </div>
        )}
      </div>

      <div className="p-4 md:p-6 bg-white">
        {rows.length === 0 ? (
          <div className="rounded-xl border border-dashed border-slate-200 bg-slate-50/70 px-6 py-12 text-center">
            <p className="text-sm font-medium text-slate-700">
              Query returned no rows
            </p>
            <p className="text-xs text-slate-500 mt-2 max-w-md mx-auto leading-relaxed">
              Try broadening filters in your question or checking spelling.
              Charts activate automatically when numeric columns are present.
            </p>
          </div>
        ) : view === "table" ? (
          <div className="space-y-4">
            <div className="rounded-xl border border-slate-200 overflow-hidden shadow-inner shadow-slate-100">
              <div className="overflow-x-auto">
                <table className="min-w-full text-sm">
                  <thead className="bg-slate-900 text-white sticky top-0 z-10">
                    <tr>
                      {columns.map((col) => {
                        const active = sort.column === col;
                        const arrow =
                          active && sort.dir === "desc" ? "▼" : active ? "▲" : "";
                        return (
                          <th key={col} className="text-left font-semibold">
                            <button
                              type="button"
                              onClick={() => toggleSort(col)}
                              className="w-full text-left px-4 py-3 hover:bg-slate-800/90 transition-colors flex items-center gap-2 outline-none focus-visible:ring-2 focus-visible:ring-inset focus-visible:ring-amber-400"
                            >
                              <span className="truncate">{col}</span>
                              <span className="text-[10px] opacity-80">{arrow}</span>
                            </button>
                          </th>
                        );
                      })}
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-slate-100 bg-white">
                    {pageSlice.map((row, idx) => (
                      <tr
                        key={`${safePage}-${idx}`}
                        className="hover:bg-blue-50/40 transition-colors"
                      >
                        {columns.map((col) => (
                          <td
                            key={col}
                            className="px-4 py-2.5 align-top text-slate-800 whitespace-nowrap max-w-[240px] overflow-hidden text-ellipsis"
                            title={formatCell(row?.[col])}
                          >
                            {formatCell(row?.[col])}
                          </td>
                        ))}
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            </div>

            <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-3 text-xs text-slate-600">
              <p>
                Showing{" "}
                <span className="font-semibold text-slate-800">
                  {totalFiltered === 0
                    ? 0
                    : (safePage - 1) * pageSize + 1}
                  –
                  {Math.min(safePage * pageSize, totalFiltered)}
                </span>{" "}
                of{" "}
                <span className="font-semibold text-slate-800">
                  {totalFiltered.toLocaleString()}
                </span>{" "}
                filtered rows
                {filterText.trim() ? (
                  <span className="text-slate-400">
                    {" "}
                    ({rows.length.toLocaleString()} total)
                  </span>
                ) : null}
              </p>
              <div className="flex items-center gap-2">
                <button
                  type="button"
                  disabled={safePage <= 1}
                  onClick={() => setPage((p) => Math.max(1, p - 1))}
                  className="px-3 py-1.5 rounded-lg border border-slate-200 bg-white hover:bg-slate-50 disabled:opacity-40 disabled:hover:bg-white transition-colors font-medium"
                >
                  Prev
                </button>
                <span className="tabular-nums px-2">
                  Page {safePage} / {pageCount}
                </span>
                <button
                  type="button"
                  disabled={safePage >= pageCount}
                  onClick={() =>
                    setPage((p) => Math.min(pageCount, p + 1))
                  }
                  className="px-3 py-1.5 rounded-lg border border-slate-200 bg-white hover:bg-slate-50 disabled:opacity-40 disabled:hover:bg-white transition-colors font-medium"
                >
                  Next
                </button>
              </div>
            </div>
          </div>
        ) : (
          <div className="space-y-4">
            {chartIssues.length > 0 ? (
              <div className="rounded-xl border border-amber-200 bg-amber-50 text-amber-950 px-4 py-3 text-sm space-y-1">
                <p className="font-semibold">Chart needs a quick tweak</p>
                <ul className="list-disc pl-5 text-xs space-y-1">
                  {chartIssues.map((msg) => (
                    <li key={msg}>{msg}</li>
                  ))}
                </ul>
              </div>
            ) : null}

            {!canChart ? (
              <div className="rounded-xl border border-dashed border-slate-200 bg-slate-50 px-6 py-12 text-center">
                <p className="text-sm font-medium text-slate-700">
                  Nothing to plot yet
                </p>
                <p className="text-xs text-slate-500 mt-2 max-w-lg mx-auto leading-relaxed">
                  {numericColumns.length === 0
                    ? "This dataset has no numeric columns, so charts stay disabled. Export or reshape the query to include counts or measurements."
                    : "Adjust axes or switch back to the table — some combinations skip rows without numeric values."}
                </p>
              </div>
            ) : (
              <>
                <div className="rounded-xl border border-slate-100 bg-slate-50/80 px-4 py-3 text-xs text-slate-600 flex flex-wrap gap-3">
                  <span>
                    <span className="font-semibold text-slate-800">X:</span>{" "}
                    {resolvedX}
                  </span>
                  <span>
                    <span className="font-semibold text-slate-800">Y:</span>{" "}
                    {resolvedY}
                  </span>
                  {view === "line" && linePack.truncated ? (
                    <span className="text-amber-700 font-medium">
                      Showing first {linePack.data.length} points with numeric Y
                      values.
                    </span>
                  ) : null}
                  {view === "bar" || view === "pie" ? (
                    <span className="text-slate-500">
                      Repeated labels are summed so bars stay readable.
                    </span>
                  ) : null}
                </div>

                <div className="h-[340px] w-full">
                  <ResponsiveContainer width="100%" height="100%">
                    {view === "bar" ? (
                      <BarChart
                        data={barPieData}
                        margin={{ top: 8, right: 16, left: 0, bottom: 8 }}
                      >
                        <CartesianGrid strokeDasharray="3 3" stroke="#e2e8f0" />
                        <XAxis
                          dataKey="name"
                          tick={{ fontSize: 11, fill: "#475569" }}
                          interval={0}
                          angle={-18}
                          textAnchor="end"
                          height={70}
                        />
                        <YAxis tick={{ fontSize: 11, fill: "#475569" }} />
                        <Tooltip
                          contentStyle={{
                            borderRadius: 12,
                            borderColor: "#e2e8f0",
                          }}
                        />
                        <Legend />
                        <Bar
                          dataKey="value"
                          name={resolvedY}
                          fill="#2563eb"
                          radius={[6, 6, 0, 0]}
                          maxBarSize={48}
                        />
                      </BarChart>
                    ) : view === "line" ? (
                      <LineChart
                        data={linePack.data}
                        margin={{ top: 8, right: 16, left: 0, bottom: 8 }}
                      >
                        <CartesianGrid strokeDasharray="3 3" stroke="#e2e8f0" />
                        <XAxis dataKey="name" tick={{ fontSize: 11, fill: "#475569" }} />
                        <YAxis tick={{ fontSize: 11, fill: "#475569" }} />
                        <Tooltip
                          contentStyle={{
                            borderRadius: 12,
                            borderColor: "#e2e8f0",
                          }}
                        />
                        <Legend />
                        <Line
                          type="monotone"
                          dataKey="value"
                          name={resolvedY}
                          stroke="#7c3aed"
                          strokeWidth={2}
                          dot={{ r: 3 }}
                          activeDot={{ r: 5 }}
                        />
                      </LineChart>
                    ) : (
                      <PieChart>
                        <Pie
                          data={pieData}
                          dataKey="value"
                          nameKey="name"
                          cx="50%"
                          cy="50%"
                          outerRadius={118}
                          paddingAngle={2}
                          label
                        >
                          {pieData.map((_, i) => (
                            <Cell
                              key={`slice-${i}`}
                              fill={CHART_COLORS[i % CHART_COLORS.length]}
                            />
                          ))}
                        </Pie>
                        <Tooltip
                          contentStyle={{
                            borderRadius: 12,
                            borderColor: "#e2e8f0",
                          }}
                        />
                        <Legend />
                      </PieChart>
                    )}
                  </ResponsiveContainer>
                </div>
              </>
            )}
          </div>
        )}
      </div>
    </section>
  );
}
