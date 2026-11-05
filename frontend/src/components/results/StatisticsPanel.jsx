import { classifyColumns } from "../../analytics/columnTyping.js";
import { computeStatistics } from "../../analytics/statistics.js";
import { detectOutliers } from "../../analytics/outliers.js";

function dash(title = "Not available for this column") {
  return (
    <span className="text-slate-400" title={title}>
      —
    </span>
  );
}

function formatNumber(value, options = {}) {
  if (value === null || value === undefined) return dash(options.unavailable);
  if (typeof value !== "number" || !Number.isFinite(value)) {
    return dash(options.unavailable);
  }
  const maxFrac = options.maximumFractionDigits ?? 4;
  return value.toLocaleString(undefined, {
    maximumFractionDigits: maxFrac,
    minimumFractionDigits: options.minimumFractionDigits,
  });
}

function formatPercent(part, whole) {
  if (!whole || part == null || typeof part !== "number") return null;
  return `${((part / whole) * 100).toLocaleString(undefined, {
    maximumFractionDigits: 1,
  })}%`;
}

function formatDateLabel(iso) {
  if (!iso) return dash("No valid dates in this column");
  const d = new Date(iso);
  if (!Number.isFinite(d.getTime())) return iso;
  return d.toISOString().slice(0, 10);
}

function outlierReasonLabel(reason) {
  if (reason === "insufficient_numeric_values") {
    return "Need at least 4 numeric values";
  }
  if (reason === "zero_or_undefined_iqr") {
    return "No spread (constant or identical values)";
  }
  return "Could not be calculated";
}

function SectionTitle({ children }) {
  return (
    <h4 className="text-xs font-semibold uppercase tracking-wide text-slate-500 mb-2">
      {children}
    </h4>
  );
}

function KpiCard({ label, value, hint }) {
  return (
    <div className="rounded-lg border border-slate-200 bg-slate-50/80 px-3 py-2.5 min-w-0">
      <p className="text-[11px] font-medium text-slate-500 truncate">{label}</p>
      <p className="mt-0.5 text-lg font-semibold tabular-nums text-slate-900 tracking-tight">
        {value}
      </p>
      {hint ? <p className="text-[10px] text-slate-400 mt-0.5">{hint}</p> : null}
    </div>
  );
}

function EmptyAnalysis() {
  return (
    <div className="rounded-xl border border-dashed border-slate-200 bg-slate-50/70 px-4 py-6 text-center">
      <p className="text-sm font-medium text-slate-700">No statistics to show</p>
      <p className="text-xs text-slate-500 mt-1.5 max-w-md mx-auto leading-relaxed">
        This query returned no rows, so totals, averages, and quality checks
        cannot be calculated.
      </p>
    </div>
  );
}

/**
 * Statistical analysis for the current query result set (unfiltered).
 * @param {{
 *   statistics: import("../../analytics/statistics.js").computeStatistics extends Function ? object : object,
 *   outliers: object,
 *   error?: Error | string | null,
 * }} props
 */
export function StatisticsPanel({ statistics, outliers, error }) {
  if (error) {
    return (
      <div
        role="alert"
        className="rounded-xl border border-red-200 bg-red-50/80 px-4 py-3 text-sm text-red-900"
      >
        <p className="font-semibold">Statistical analysis could not run</p>
        <p className="text-xs mt-1 text-red-800">
          {typeof error === "string" ? error : error?.message || "Unexpected error."}
        </p>
      </div>
    );
  }

  if (!statistics || statistics.rowCount === 0) {
    return <EmptyAnalysis />;
  }

  const cls = statistics.classification ?? {};
  const numericCols = cls.numericColumns ?? Object.keys(statistics.numeric ?? {});
  const categoricalCols =
    cls.categoricalColumns ?? Object.keys(statistics.categorical ?? {});
  const dateCols = cls.dateColumns ?? Object.keys(statistics.dates ?? {});
  const booleanCols = cls.booleanColumns ?? [];
  const idCols = cls.idColumns ?? [];
  const missingByColumn = statistics.missingByColumn ?? {};
  const outlierByColumn = outliers?.byColumn ?? {};
  const allColumns = cls.numericColumns
    ? [
        ...(cls.numericColumns ?? []),
        ...(cls.categoricalColumns ?? []),
        ...(cls.booleanColumns ?? []),
        ...(cls.dateColumns ?? []),
        ...(cls.idColumns ?? []),
      ]
    : Object.keys(missingByColumn);

  const missingEntries = allColumns
    .map((col) => ({
      col,
      missing: missingByColumn[col] ?? 0,
      type: cls.types?.[col] ?? "unknown",
    }))
    .sort((a, b) => b.missing - a.missing);

  const missingCellShare = formatPercent(
    statistics.missingCells,
    statistics.rowCount * statistics.columnCount,
  );

  return (
    <div className="space-y-4">
      <div>
        <h3 className="text-sm font-semibold text-slate-900 tracking-tight">
          Statistical analysis
        </h3>
        <p className="text-xs text-slate-500 mt-0.5 leading-relaxed">
          Calculated from the returned query rows. Boolean and ID columns are
          excluded from averages and sums.
        </p>
      </div>

      <div>
        <SectionTitle>Dataset overview</SectionTitle>
        <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-6 gap-2">
          <KpiCard
            label="Records"
            value={statistics.rowCount.toLocaleString()}
          />
          <KpiCard
            label="Columns"
            value={statistics.columnCount.toLocaleString()}
          />
          <KpiCard
            label="Missing cells"
            value={statistics.missingCells.toLocaleString()}
            hint={missingCellShare ? `${missingCellShare} of cells` : undefined}
          />
          <KpiCard label="Numeric" value={String(numericCols.length)} />
          <KpiCard label="Categorical" value={String(categoricalCols.length)} />
          <KpiCard label="Date" value={String(dateCols.length)} />
        </div>
      </div>

      <div>
        <SectionTitle>Numeric analysis</SectionTitle>
        {numericCols.length === 0 ? (
          <p className="text-xs text-slate-500 rounded-lg border border-slate-100 bg-slate-50 px-3 py-2">
            No suitable numeric columns for averages or sums.
            {idCols.length
              ? ` ID column${idCols.length === 1 ? "" : "s"} (${idCols.join(", ")}) excluded.`
              : ""}
            {booleanCols.length
              ? ` Boolean column${booleanCols.length === 1 ? "" : "s"} excluded.`
              : ""}
          </p>
        ) : (
          <div className="rounded-lg border border-slate-200 overflow-hidden">
            <div className="overflow-x-auto">
              <table className="min-w-full text-xs">
                <thead className="bg-slate-50 text-slate-600">
                  <tr>
                    {[
                      "Column",
                      "Count",
                      "Sum",
                      "Average",
                      "Median",
                      "Min",
                      "Max",
                      "Std. dev.",
                    ].map((h) => (
                      <th
                        key={h}
                        className="text-left font-semibold px-3 py-2 whitespace-nowrap"
                      >
                        {h}
                      </th>
                    ))}
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-100 bg-white">
                  {numericCols.map((col) => {
                    const n = statistics.numeric?.[col];
                    const none =
                      !n || n.count === 0
                        ? "No numeric values in this column"
                        : undefined;
                    const stdHint =
                      n && n.count < 2
                        ? "Need at least 2 numeric values"
                        : none;
                    return (
                      <tr key={col}>
                        <td className="px-3 py-2 font-medium text-slate-800 whitespace-nowrap">
                          {col}
                        </td>
                        <td className="px-3 py-2 tabular-nums text-slate-700">
                          {n ? n.count.toLocaleString() : dash(none)}
                        </td>
                        <td className="px-3 py-2 tabular-nums text-slate-700">
                          {formatNumber(n?.sum, { unavailable: none })}
                        </td>
                        <td className="px-3 py-2 tabular-nums text-slate-700">
                          {formatNumber(n?.mean, { unavailable: none })}
                        </td>
                        <td className="px-3 py-2 tabular-nums text-slate-700">
                          {formatNumber(n?.median, { unavailable: none })}
                        </td>
                        <td className="px-3 py-2 tabular-nums text-slate-700">
                          {formatNumber(n?.min, { unavailable: none })}
                        </td>
                        <td className="px-3 py-2 tabular-nums text-slate-700">
                          {formatNumber(n?.max, { unavailable: none })}
                        </td>
                        <td className="px-3 py-2 tabular-nums text-slate-700">
                          {formatNumber(n?.stddev, { unavailable: stdHint })}
                        </td>
                      </tr>
                    );
                  })}
                </tbody>
              </table>
            </div>
          </div>
        )}
      </div>

      <div>
        <SectionTitle>Categorical analysis</SectionTitle>
        {categoricalCols.length === 0 && booleanCols.length === 0 ? (
          <p className="text-xs text-slate-500 rounded-lg border border-slate-100 bg-slate-50 px-3 py-2">
            No categorical columns detected in this result set.
          </p>
        ) : (
          <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
            {categoricalCols.map((col) => {
              const cat = statistics.categorical?.[col];
              const nonMissing = statistics.rowCount - (cat?.missingCount ?? 0);
              return (
                <div
                  key={col}
                  className="rounded-lg border border-slate-200 overflow-hidden"
                >
                  <div className="px-3 py-2 bg-slate-50 border-b border-slate-100 flex items-baseline justify-between gap-2">
                    <p className="text-xs font-semibold text-slate-800 truncate">
                      {col}
                    </p>
                    <p className="text-[11px] text-slate-500 shrink-0">
                      {cat?.distinctCount?.toLocaleString() ?? "—"} unique
                    </p>
                  </div>
                  {!cat || cat.distinctCount === 0 ? (
                    <p className="px-3 py-3 text-xs text-slate-500">
                      No non-empty values.
                    </p>
                  ) : (
                    <table className="min-w-full text-xs">
                      <thead>
                        <tr className="text-slate-500">
                          <th className="text-left font-medium px-3 py-1.5">
                            Value
                          </th>
                          <th className="text-right font-medium px-3 py-1.5">
                            Count
                          </th>
                          <th className="text-right font-medium px-3 py-1.5">
                            Share
                          </th>
                        </tr>
                      </thead>
                      <tbody className="divide-y divide-slate-50">
                        {(cat.topValues ?? []).slice(0, 8).map((row) => (
                          <tr key={row.value}>
                            <td
                              className="px-3 py-1.5 text-slate-800 max-w-[12rem] truncate"
                              title={row.value}
                            >
                              {row.value}
                            </td>
                            <td className="px-3 py-1.5 text-right tabular-nums text-slate-700">
                              {row.count.toLocaleString()}
                            </td>
                            <td className="px-3 py-1.5 text-right tabular-nums text-slate-500">
                              {formatPercent(row.count, nonMissing) ??
                                dash("Not enough values to compute a percentage")}
                            </td>
                          </tr>
                        ))}
                      </tbody>
                    </table>
                  )}
                </div>
              );
            })}
            {booleanCols.map((col) => {
              const cat = statistics.booleans?.[col];
              const nonMissing = statistics.rowCount - (cat?.missingCount ?? 0);
              return (
                <div
                  key={col}
                  className="rounded-lg border border-slate-200 overflow-hidden"
                >
                  <div className="px-3 py-2 bg-slate-50 border-b border-slate-100 flex items-baseline justify-between gap-2">
                    <p className="text-xs font-semibold text-slate-800 truncate">
                      {col}{" "}
                      <span className="font-medium text-slate-400">(boolean)</span>
                    </p>
                    <p className="text-[11px] text-slate-500 shrink-0">
                      {cat?.distinctCount?.toLocaleString() ?? "—"} unique
                    </p>
                  </div>
                  <table className="min-w-full text-xs">
                    <tbody className="divide-y divide-slate-50">
                      {(cat?.topValues ?? []).map((row) => (
                        <tr key={row.value}>
                          <td className="px-3 py-1.5 text-slate-800">{row.value}</td>
                          <td className="px-3 py-1.5 text-right tabular-nums">
                            {row.count.toLocaleString()}
                          </td>
                          <td className="px-3 py-1.5 text-right tabular-nums text-slate-500">
                            {formatPercent(row.count, nonMissing) ??
                              dash("Not enough values to compute a percentage")}
                          </td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>
              );
            })}
          </div>
        )}
      </div>

      <div>
        <SectionTitle>Date analysis</SectionTitle>
        {dateCols.length === 0 ? (
          <p className="text-xs text-slate-500 rounded-lg border border-slate-100 bg-slate-50 px-3 py-2">
            No date columns detected (ISO or YYYY/MM/DD values).
          </p>
        ) : (
          <div className="rounded-lg border border-slate-200 overflow-hidden">
            <div className="overflow-x-auto">
              <table className="min-w-full text-xs">
                <thead className="bg-slate-50 text-slate-600">
                  <tr>
                    {["Column", "Earliest", "Latest", "Valid dates", "Invalid"].map(
                      (h) => (
                        <th
                          key={h}
                          className="text-left font-semibold px-3 py-2 whitespace-nowrap"
                        >
                          {h}
                        </th>
                      ),
                    )}
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-100 bg-white">
                  {dateCols.map((col) => {
                    const d = statistics.dates?.[col];
                    return (
                      <tr key={col}>
                        <td className="px-3 py-2 font-medium text-slate-800">
                          {col}
                        </td>
                        <td className="px-3 py-2 tabular-nums">
                          {formatDateLabel(d?.earliest)}
                        </td>
                        <td className="px-3 py-2 tabular-nums">
                          {formatDateLabel(d?.latest)}
                        </td>
                        <td className="px-3 py-2 tabular-nums">
                          {d ? d.validCount.toLocaleString() : dash()}
                        </td>
                        <td className="px-3 py-2 tabular-nums">
                          {d ? d.invalidCount.toLocaleString() : dash()}
                        </td>
                      </tr>
                    );
                  })}
                </tbody>
              </table>
            </div>
          </div>
        )}
      </div>

      <div>
        <SectionTitle>Data quality</SectionTitle>
        <div className="rounded-lg border border-slate-200 overflow-hidden">
          <div className="overflow-x-auto">
            <table className="min-w-full text-xs">
              <thead className="bg-slate-50 text-slate-600">
                <tr>
                  {["Column", "Type", "Missing", "Potential outliers"].map((h) => (
                    <th
                      key={h}
                      className="text-left font-semibold px-3 py-2 whitespace-nowrap"
                    >
                      {h}
                    </th>
                  ))}
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-100 bg-white">
                {missingEntries.map(({ col, missing, type }) => {
                  const out = outlierByColumn[col];
                  let outlierCell;
                  if (type !== "numeric") {
                    outlierCell = dash("IQR outliers apply to numeric columns only");
                  } else if (!out) {
                    outlierCell = dash();
                  } else if (out.skipped) {
                    outlierCell = dash(outlierReasonLabel(out.reason));
                  } else {
                    outlierCell = (
                      <span className="tabular-nums text-slate-700">
                        {out.count.toLocaleString()}
                      </span>
                    );
                  }
                  return (
                    <tr key={col}>
                      <td className="px-3 py-2 font-medium text-slate-800">
                        {col}
                      </td>
                      <td className="px-3 py-2 text-slate-500 capitalize">{type}</td>
                      <td className="px-3 py-2 tabular-nums text-slate-700">
                        {missing.toLocaleString()}
                        {statistics.rowCount
                          ? ` (${
                              formatPercent(missing, statistics.rowCount) ?? "—"
                            })`
                          : ""}
                      </td>
                      <td className="px-3 py-2">{outlierCell}</td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          </div>
        </div>
      </div>
    </div>
  );
}

/**
 * Run typing, stats, and outliers once per result set. Does not mutate rows.
 * Correlation is omitted here (not shown in this panel).
 */
export function computeResultAnalysis(rows, columns) {
  const safeRows = Array.isArray(rows) ? rows : [];
  const classification = classifyColumns(
    safeRows,
    Array.isArray(columns) && columns.length ? columns : undefined,
  );
  const statistics = computeStatistics(safeRows, classification);
  const outliers = detectOutliers(safeRows, classification);
  return { statistics, outliers };
}
