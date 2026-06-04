import { useCallback, useEffect, useMemo, useState } from "react";
import { AppShell } from "../components/AppShell";
import {
  fetchSchemaRelationships,
  fetchSchemaTable,
  fetchSchemaTables,
} from "../api";

function TypeBadge({ label }) {
  return (
    <span className="inline-flex items-center rounded-lg bg-slate-100 text-slate-800 border border-slate-200/80 px-2 py-0.5 text-[11px] font-mono font-medium tracking-tight">
      {label}
    </span>
  );
}

function SchemaExplorer() {
  const [tables, setTables] = useState([]);
  const [tablesLoading, setTablesLoading] = useState(true);
  const [tablesError, setTablesError] = useState(null);
  const [meta, setMeta] = useState(null);

  const [relationships, setRelationships] = useState([]);
  const [relLoading, setRelLoading] = useState(true);
  const [relError, setRelError] = useState(null);

  const [selectedTable, setSelectedTable] = useState(null);
  const [schemaLoading, setSchemaLoading] = useState(false);
  const [schemaError, setSchemaError] = useState(null);
  const [schema, setSchema] = useState(null);

  const [filter, setFilter] = useState("");

  const loadTables = useCallback(async () => {
    setTablesLoading(true);
    setTablesError(null);
    try {
      const data = await fetchSchemaTables();
      setTables(data.tables);
      setMeta(data.meta ?? null);
    } catch (err) {
      setTablesError(
        err instanceof Error ? err.message : "Failed to load tables",
      );
      setTables([]);
      setMeta(null);
    } finally {
      setTablesLoading(false);
    }
  }, []);

  const loadRelationships = useCallback(async () => {
    setRelLoading(true);
    setRelError(null);
    try {
      const data = await fetchSchemaRelationships();
      setRelationships(data.relationships);
    } catch (err) {
      setRelError(
        err instanceof Error ? err.message : "Failed to load relationships",
      );
      setRelationships([]);
    } finally {
      setRelLoading(false);
    }
  }, []);

  useEffect(() => {
    loadTables();
    loadRelationships();
  }, [loadTables, loadRelationships]);

  const selectTable = useCallback(async (tableName) => {
    setSelectedTable(tableName);
    setSchema(null);
    setSchemaError(null);
    setSchemaLoading(true);
    try {
      const data = await fetchSchemaTable(tableName);
      setSchema(data.schema);
    } catch (err) {
      setSchemaError(
        err instanceof Error ? err.message : "Failed to load schema",
      );
    } finally {
      setSchemaLoading(false);
    }
  }, []);

  const filteredTables = useMemo(() => {
    const q = filter.trim().toLowerCase();
    if (!q) return tables;
    return tables.filter((t) => t.toLowerCase().includes(q));
  }, [tables, filter]);

  const relatedForSelection = useMemo(() => {
    if (!selectedTable) return { outgoing: [], incoming: [] };
    const sel = selectedTable.toLowerCase();
    const out = relationships.filter(
      (r) => (r.fromTable || "").toLowerCase() === sel,
    );
    const inc = relationships.filter(
      (r) => (r.toTable || "").toLowerCase() === sel,
    );
    return { outgoing: out, incoming: inc };
  }, [relationships, selectedTable]);

  return (
    <AppShell title="Schema Explorer">
      <div className="max-w-7xl mx-auto px-4 py-6 md:py-10 md:px-8">
        <div className="mb-6 md:mb-8 rounded-2xl border border-indigo-200/80 bg-gradient-to-r from-indigo-50 via-white to-sky-50 p-5 md:p-6 shadow-sm shadow-indigo-100/60">
          <div className="flex flex-col md:flex-row md:items-start md:justify-between gap-4">
            <div className="space-y-2 min-w-0">
              <p className="text-xs font-semibold uppercase tracking-wider text-indigo-600">
                Interactive map
              </p>
              <h2 className="text-lg md:text-xl font-semibold text-slate-900 tracking-tight">
                Understand how your database is structured
              </h2>
              <p className="text-sm text-slate-600 max-w-2xl leading-relaxed">
                Browse tables, inspect columns and types, and see how rows
                link across tables. This view is read-only and helps you connect
                natural-language questions to real SQL later.
              </p>
            </div>
            <div className="shrink-0 flex flex-wrap gap-2 text-xs">
              <span className="rounded-full bg-white/90 border border-slate-200 px-3 py-1.5 text-slate-700 shadow-sm">
                {meta?.database ? (
                  <>
                    Database{" "}
                    <span className="font-mono font-medium text-slate-900">
                      {meta.database}
                    </span>
                  </>
                ) : (
                  "Schema introspection"
                )}
              </span>
              {!tablesLoading && (
                <span className="rounded-full bg-emerald-50 border border-emerald-200 px-3 py-1.5 text-emerald-800">
                  {tables.length} table{tables.length === 1 ? "" : "s"}
                </span>
              )}
            </div>
          </div>
        </div>

        <div className="grid grid-cols-1 lg:grid-cols-[minmax(260px,320px)_1fr] gap-6 lg:gap-8 items-start">
          <aside className="lg:sticky lg:top-4 space-y-3">
            <div className="rounded-2xl border border-slate-200/90 bg-white shadow-md shadow-slate-200/50 overflow-hidden">
              <div className="px-4 py-3 border-b border-slate-100 bg-gradient-to-r from-slate-50 to-white flex items-center justify-between gap-2">
                <div>
                  <h2 className="text-sm font-semibold text-slate-900 tracking-tight">
                    Tables
                  </h2>
                  <p className="text-xs text-slate-500 mt-0.5">
                    Click a table to inspect columns
                  </p>
                </div>
                <button
                  type="button"
                  onClick={() => {
                    loadTables();
                    loadRelationships();
                  }}
                  disabled={tablesLoading}
                  className="text-xs font-medium text-blue-600 hover:text-blue-700 disabled:opacity-50 px-2 py-1 rounded-lg hover:bg-blue-50 transition-colors"
                >
                  Refresh
                </button>
              </div>

              <div className="p-3 border-b border-slate-100 bg-white">
                <label className="block text-[11px] font-medium text-slate-600 mb-1.5">
                  Filter
                  <input
                    type="search"
                    value={filter}
                    onChange={(e) => setFilter(e.target.value)}
                    placeholder="Search tables…"
                    className="mt-1 w-full rounded-xl border border-slate-200 bg-slate-50/80 px-3 py-2 text-sm text-slate-900 placeholder:text-slate-400 focus:ring-2 focus:ring-blue-500/25 focus:border-blue-500 outline-none"
                  />
                </label>
              </div>

              <div className="max-h-[min(560px,calc(100vh-14rem))] overflow-y-auto p-3 space-y-1.5">
                {tablesLoading && tables.length === 0 ? (
                  <div className="space-y-2 animate-pulse">
                    {[1, 2, 3, 4, 5].map((k) => (
                      <div
                        key={k}
                        className="h-11 rounded-xl bg-slate-100"
                      />
                    ))}
                  </div>
                ) : null}

                {!tablesLoading && tables.length === 0 && !tablesError ? (
                  <div className="text-center py-10 px-4">
                    <p className="text-sm font-medium text-slate-700">
                      No tables found
                    </p>
                    <p className="text-xs text-slate-500 mt-1">
                      Connect a database with tables to explore schema here.
                    </p>
                  </div>
                ) : null}

                {filteredTables.map((name) => {
                  const active = selectedTable === name;
                  return (
                    <button
                      key={name}
                      type="button"
                      onClick={() => selectTable(name)}
                      className={`w-full text-left rounded-xl border px-3 py-2.5 text-sm transition-all outline-none focus-visible:ring-2 focus-visible:ring-blue-500 focus-visible:ring-offset-2 ${
                        active
                          ? "border-indigo-300 bg-indigo-50/90 text-indigo-950 shadow-sm"
                          : "border-slate-200 bg-white text-slate-800 hover:border-slate-300 hover:bg-slate-50/90 hover:shadow-sm"
                      }`}
                    >
                      <span className="font-mono text-[13px] font-medium tracking-tight">
                        {name}
                      </span>
                    </button>
                  );
                })}

                {!tablesLoading &&
                tables.length > 0 &&
                filteredTables.length === 0 ? (
                  <p className="text-xs text-slate-500 px-1 py-4 text-center">
                    No tables match your filter.
                  </p>
                ) : null}
              </div>

              {tablesError ? (
                <p
                  className="text-xs text-red-600 px-4 py-2 border-t border-red-100 bg-red-50"
                  role="alert"
                >
                  {tablesError}
                </p>
              ) : null}
            </div>
          </aside>

          <div className="space-y-6 min-w-0">
            {!selectedTable ? (
              <div className="rounded-2xl border border-dashed border-slate-300 bg-white/70 p-10 md:p-14 text-center shadow-inner shadow-slate-100">
                <div className="mx-auto w-14 h-14 rounded-2xl bg-slate-100 flex items-center justify-center mb-4 ring-1 ring-slate-200/80">
                  <svg
                    xmlns="http://www.w3.org/2000/svg"
                    fill="none"
                    viewBox="0 0 24 24"
                    strokeWidth={1.5}
                    stroke="currentColor"
                    className="w-7 h-7 text-slate-500"
                    aria-hidden
                  >
                    <path
                      strokeLinecap="round"
                      strokeLinejoin="round"
                      d="M3.75 6A2.25 2.25 0 016 3.75h2.25A2.25 2.25 0 0110.5 6v2.25a2.25 2.25 0 01-2.25 2.25H6a2.25 2.25 0 01-2.25-2.25V6zM3.75 15.75A2.25 2.25 0 016 13.5h2.25a2.25 2.25 0 012.25 2.25V18a2.25 2.25 0 01-2.25 2.25H6A2.25 2.25 0 013.75 18v-2.25zM13.5 6a2.25 2.25 0 012.25-2.25H18A2.25 2.25 0 0120.25 6v2.25A2.25 2.25 0 0118 10.5h-2.25a2.25 2.25 0 01-2.25-2.25V6zM13.5 15.75a2.25 2.25 0 012.25-2.25H18a2.25 2.25 0 012.25 2.25V18A2.25 2.25 0 0118 20.25h-2.25A2.25 2.25 0 0113.5 18v-2.25z"
                    />
                  </svg>
                </div>
                <h3 className="text-base font-semibold text-slate-900">
                  Pick a table to explore
                </h3>
                <p className="text-sm text-slate-600 mt-2 max-w-md mx-auto leading-relaxed">
                  The sidebar lists every table Sequelize can see in your
                  database. Selecting one loads column names, types, null rules,
                  and primary keys.
                </p>
              </div>
            ) : null}

            {selectedTable ? (
              <section className="rounded-2xl border border-slate-200/90 bg-white shadow-md shadow-slate-200/40 overflow-hidden">
                <div className="px-5 py-4 border-b border-slate-100 bg-gradient-to-r from-slate-50 to-white flex flex-wrap items-center justify-between gap-3">
                  <div className="min-w-0">
                    <p className="text-[11px] font-semibold uppercase tracking-wide text-slate-500">
                      Table
                    </p>
                    <h3 className="text-lg font-semibold text-slate-900 font-mono tracking-tight truncate">
                      {schema?.table ?? selectedTable}
                    </h3>
                  </div>
                  {schemaLoading ? (
                    <span className="inline-flex items-center gap-2 text-xs text-slate-500">
                      <span className="inline-block h-4 w-4 border-2 border-slate-300 border-t-indigo-600 rounded-full animate-spin" />
                      Loading schema…
                    </span>
                  ) : schema?.primaryKeys?.length ? (
                    <div className="flex flex-wrap items-center gap-2 text-xs">
                      <span className="text-slate-500">Primary key</span>
                      {schema.primaryKeys.map((pk) => (
                        <span
                          key={pk}
                          className="inline-flex items-center gap-1 rounded-full bg-amber-50 border border-amber-200 px-2.5 py-1 text-amber-900 font-mono"
                        >
                          <svg
                            xmlns="http://www.w3.org/2000/svg"
                            viewBox="0 0 20 20"
                            fill="currentColor"
                            className="w-3.5 h-3.5 shrink-0"
                            aria-hidden
                          >
                            <path
                              fillRule="evenodd"
                              d="M10 1a4.5 4.5 0 00-4.5 4.5V9H5a2 2 0 00-2 2v2a2 2 0 002 2h10a2 2 0 002-2v-2a2 2 0 00-2-2h-.5V5.5A4.5 4.5 0 0010 1zm3 8V5.5a3 3 0 10-6 0V9h6z"
                              clipRule="evenodd"
                            />
                          </svg>
                          {pk}
                        </span>
                      ))}
                    </div>
                  ) : null}
                </div>

                {schemaError ? (
                  <div
                    className="px-5 py-4 text-sm text-red-700 bg-red-50 border-b border-red-100"
                    role="alert"
                  >
                    {schemaError}
                  </div>
                ) : null}

                {!schemaLoading && schema && !schemaError ? (
                  <div className="overflow-x-auto">
                    <table className="min-w-full text-sm">
                      <thead>
                        <tr className="bg-slate-50/90 text-left text-xs uppercase tracking-wide text-slate-500 border-b border-slate-200">
                          <th className="px-5 py-3 font-semibold">Column</th>
                          <th className="px-5 py-3 font-semibold">Type</th>
                          <th className="px-5 py-3 font-semibold">Nullable</th>
                          <th className="px-5 py-3 font-semibold">Flags</th>
                        </tr>
                      </thead>
                      <tbody className="divide-y divide-slate-100">
                        {schema.columns.map((col) => (
                          <tr
                            key={col.name}
                            className="hover:bg-slate-50/80 transition-colors"
                          >
                            <td className="px-5 py-3 align-top">
                              <div className="flex flex-wrap items-center gap-2">
                                <span className="font-mono text-[13px] font-medium text-slate-900">
                                  {col.name}
                                </span>
                                {col.primaryKey ? (
                                  <span className="inline-flex items-center rounded-md bg-amber-100 text-amber-900 border border-amber-200 px-1.5 py-0.5 text-[10px] font-bold uppercase tracking-wide">
                                    PK
                                  </span>
                                ) : null}
                              </div>
                            </td>
                            <td className="px-5 py-3 align-top">
                              <TypeBadge label={col.dataType} />
                            </td>
                            <td className="px-5 py-3 align-top">
                              {col.nullable ? (
                                <span className="text-slate-600">Yes</span>
                              ) : (
                                <span className="inline-flex items-center rounded-lg bg-rose-50 text-rose-800 border border-rose-100 px-2 py-0.5 text-xs font-medium">
                                  NOT NULL
                                </span>
                              )}
                            </td>
                            <td className="px-5 py-3 align-top">
                              <div className="flex flex-wrap gap-1.5">
                                {col.autoIncrement ? (
                                  <span className="text-[11px] rounded-md bg-violet-50 text-violet-800 border border-violet-100 px-2 py-0.5">
                                    auto increment
                                  </span>
                                ) : null}
                                {col.unique ? (
                                  <span className="text-[11px] rounded-md bg-sky-50 text-sky-800 border border-sky-100 px-2 py-0.5">
                                    unique
                                  </span>
                                ) : null}
                                {col.defaultValue != null &&
                                col.defaultValue !== "" ? (
                                  <span
                                    className="text-[11px] rounded-md bg-slate-100 text-slate-700 border border-slate-200 px-2 py-0.5 font-mono max-w-[220px] truncate"
                                    title={String(col.defaultValue)}
                                  >
                                    default: {String(col.defaultValue)}
                                  </span>
                                ) : null}
                                {!col.autoIncrement &&
                                !col.unique &&
                                (col.defaultValue == null ||
                                  col.defaultValue === "") ? (
                                  <span className="text-xs text-slate-400">
                                    —
                                  </span>
                                ) : null}
                              </div>
                            </td>
                          </tr>
                        ))}
                      </tbody>
                    </table>
                  </div>
                ) : null}

                {schemaLoading && !schemaError ? (
                  <div className="p-6 space-y-3 animate-pulse">
                    <div className="h-10 rounded-xl bg-slate-100" />
                    <div className="h-10 rounded-xl bg-slate-100" />
                    <div className="h-10 rounded-xl bg-slate-100" />
                  </div>
                ) : null}
              </section>
            ) : null}

            <section className="rounded-2xl border border-slate-200/90 bg-white shadow-md shadow-slate-200/40 p-5 md:p-6">
              <div className="flex flex-wrap items-start justify-between gap-3 mb-4">
                <div>
                  <h3 className="text-sm font-semibold text-slate-900">
                    Relationships (foreign keys)
                  </h3>
                  <p className="text-xs text-slate-500 mt-1 max-w-xl leading-relaxed">
                    When MySQL declares foreign keys, they appear here. Many
                    teaching databases use logical links without enforced FKs —
                    in that case this panel may be empty even though columns
                    still relate informally.
                  </p>
                </div>
                {relLoading ? (
                  <span className="inline-flex items-center gap-2 text-xs text-slate-500">
                    <span className="inline-block h-4 w-4 border-2 border-slate-300 border-t-indigo-600 rounded-full animate-spin" />
                    Loading…
                  </span>
                ) : (
                  <span className="text-xs rounded-full bg-slate-100 border border-slate-200 px-2.5 py-1 text-slate-700">
                    {relationships.length} link
                    {relationships.length === 1 ? "" : "s"}
                  </span>
                )}
              </div>

              {relError ? (
                <p className="text-sm text-red-600" role="alert">
                  {relError}
                </p>
              ) : null}

              {!relLoading &&
              !relError &&
              relationships.length === 0 ? (
                <div className="rounded-xl border border-dashed border-slate-200 bg-slate-50/60 px-4 py-8 text-center">
                  <p className="text-sm text-slate-700 font-medium">
                    No foreign keys detected
                  </p>
                  <p className="text-xs text-slate-500 mt-2 max-w-md mx-auto">
                    Your schema might still connect tables through naming
                    conventions (for example{" "}
                    <code className="font-mono bg-white px-1 rounded border border-slate-200">
                      userId
                    </code>
                    ). Use column names alongside this explorer when writing
                    SQL.
                  </p>
                </div>
              ) : null}

              {selectedTable &&
              !relLoading &&
              relationships.length > 0 ? (
                <div className="space-y-4">
                  {relatedForSelection.outgoing.length > 0 ? (
                    <div>
                      <p className="text-xs font-semibold text-slate-600 mb-2">
                        References from{" "}
                        <span className="font-mono text-slate-900">
                          {schema?.table ?? selectedTable}
                        </span>
                      </p>
                      <ul className="space-y-2">
                        {relatedForSelection.outgoing.map((r) => (
                          <li
                            key={`${r.constraintName}-${r.fromColumn}`}
                            className="rounded-xl border border-slate-200 bg-slate-50/50 px-3 py-2.5 text-xs md:text-sm text-slate-800 flex flex-wrap items-center gap-x-2 gap-y-1"
                          >
                            <span className="font-mono font-medium">
                              {r.fromColumn}
                            </span>
                            <span className="text-slate-400">→</span>
                            <button
                              type="button"
                              onClick={() => selectTable(r.toTable)}
                              className="font-mono text-indigo-700 hover:underline"
                            >
                              {r.toTable}.{r.toColumn}
                            </button>
                          </li>
                        ))}
                      </ul>
                    </div>
                  ) : null}
                  {relatedForSelection.incoming.length > 0 ? (
                    <div>
                      <p className="text-xs font-semibold text-slate-600 mb-2">
                        Referenced by other tables
                      </p>
                      <ul className="space-y-2">
                        {relatedForSelection.incoming.map((r) => (
                          <li
                            key={`${r.constraintName}-${r.fromTable}-${r.fromColumn}`}
                            className="rounded-xl border border-slate-200 bg-slate-50/50 px-3 py-2.5 text-xs md:text-sm text-slate-800 flex flex-wrap items-center gap-x-2 gap-y-1"
                          >
                            <button
                              type="button"
                              onClick={() => selectTable(r.fromTable)}
                              className="font-mono text-indigo-700 hover:underline"
                            >
                              {r.fromTable}.{r.fromColumn}
                            </button>
                            <span className="text-slate-400">→</span>
                            <span className="font-mono font-medium">
                              {r.toColumn}
                            </span>
                          </li>
                        ))}
                      </ul>
                    </div>
                  ) : null}
                  {relatedForSelection.outgoing.length === 0 &&
                  relatedForSelection.incoming.length === 0 ? (
                    <p className="text-xs text-slate-500">
                      This table has no declared foreign keys in{" "}
                      <span className="font-mono">{meta?.database}</span>.
                    </p>
                  ) : null}
                </div>
              ) : null}

              {!selectedTable &&
              !relLoading &&
              relationships.length > 0 ? (
                <ul className="space-y-2 max-h-56 overflow-y-auto pr-1">
                  {relationships.slice(0, 12).map((r) => (
                    <li
                      key={`${r.constraintName}-${r.fromTable}-${r.fromColumn}`}
                      className="rounded-xl border border-slate-100 bg-slate-50/40 px-3 py-2 text-xs text-slate-700 flex flex-wrap gap-2"
                    >
                      <button
                        type="button"
                        onClick={() => selectTable(r.fromTable)}
                        className="font-mono text-indigo-700 hover:underline"
                      >
                        {r.fromTable}
                      </button>
                      <span className="text-slate-400">·</span>
                      <span className="font-mono">{r.fromColumn}</span>
                      <span className="text-slate-400">→</span>
                      <button
                        type="button"
                        onClick={() => selectTable(r.toTable)}
                        className="font-mono text-indigo-700 hover:underline"
                      >
                        {r.toTable}.{r.toColumn}
                      </button>
                    </li>
                  ))}
                  {relationships.length > 12 ? (
                    <li className="text-[11px] text-slate-500 px-1 pt-1">
                      Showing 12 of {relationships.length}. Select a table to
                      focus links.
                    </li>
                  ) : null}
                </ul>
              ) : null}
            </section>
          </div>
        </div>
      </div>
    </AppShell>
  );
}

export default SchemaExplorer;
