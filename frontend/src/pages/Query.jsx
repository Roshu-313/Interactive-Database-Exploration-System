import { useCallback, useEffect, useState } from "react";
import { AppShell } from "../components/AppShell";
import {
  deleteMyQueryHistory,
  fetchMyQueryHistory,
  nlToSqlRequest,
} from "../api";
import { ResultsVisualizer } from "../components/ResultsVisualizer";

function formatTimestamp(iso) {
  if (!iso) return "";
  const d = new Date(iso);
  if (Number.isNaN(d.getTime())) return String(iso);
  return d.toLocaleString(undefined, {
    dateStyle: "medium",
    timeStyle: "short",
  });
}

function Query() {
  const [text, setText] = useState("");
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState(null);
  const [result, setResult] = useState(null);

  const [history, setHistory] = useState([]);
  const [historyLoading, setHistoryLoading] = useState(true);
  const [historyError, setHistoryError] = useState(null);
  const [deletingId, setDeletingId] = useState(null);
  const [selectedHistoryId, setSelectedHistoryId] = useState(null);

  const loadHistory = useCallback(async () => {
    setHistoryLoading(true);
    setHistoryError(null);
    try {
      const rows = await fetchMyQueryHistory();
      setHistory(rows);
    } catch (err) {
      setHistoryError(
        err instanceof Error ? err.message : "Failed to load history",
      );
    } finally {
      setHistoryLoading(false);
    }
  }, []);

  useEffect(() => {
    loadHistory();
  }, [loadHistory]);

  async function runQuery(overrideText) {
    const q = String(overrideText ?? text).trim();
    setError(null);
    setResult(null);
    if (!q) {
      setError("Enter a question in natural language.");
      return;
    }

    setLoading(true);
    try {
      const data = await nlToSqlRequest(q);
      setResult(data);
      await loadHistory();
    } catch (err) {
      setError(err instanceof Error ? err.message : "Something went wrong");
    } finally {
      setLoading(false);
    }
  }

  function handleSubmit(e) {
    e.preventDefault();
    runQuery();
  }

  async function handleDeleteHistory(id, e) {
    e.stopPropagation();
    setDeletingId(id);
    setHistoryError(null);
    try {
      await deleteMyQueryHistory(id);
      setHistory((prev) => prev.filter((h) => h.id !== id));
      if (selectedHistoryId === id) setSelectedHistoryId(null);
    } catch (err) {
      setHistoryError(
        err instanceof Error ? err.message : "Failed to delete entry",
      );
    } finally {
      setDeletingId(null);
    }
  }

  function applyHistoryItem(item) {
    setText(item.naturalLanguageQuery ?? "");
    setSelectedHistoryId(item.id);
    setResult({
      message: "Loaded from history — run again to refresh results.",
      input: item.naturalLanguageQuery,
      sql: item.generatedSql,
      explanation: item.explanation,
      results: null,
      fromHistory: true,
    });
    setError(null);
  }

  return (
    <AppShell title="Natural language → SQL">
      <div className="max-w-7xl mx-auto px-4 py-6 md:py-10 md:px-8">
        <div className="grid grid-cols-1 lg:grid-cols-[minmax(260px,340px)_1fr] gap-6 lg:gap-8 items-start">
          {/* History sidebar */}
          <aside className="order-2 lg:order-1 lg:sticky lg:top-4 space-y-3">
            <div className="rounded-2xl border border-slate-200/90 bg-white shadow-md shadow-slate-200/50 overflow-hidden">
              <div className="px-4 py-3 border-b border-slate-100 bg-gradient-to-r from-slate-50 to-white flex items-center justify-between gap-2">
                <div>
                  <h2 className="text-sm font-semibold text-slate-900 tracking-tight">
                    Query history
                  </h2>
                  <p className="text-xs text-slate-500 mt-0.5">
                    Saved successful runs
                  </p>
                </div>
                <button
                  type="button"
                  onClick={() => loadHistory()}
                  disabled={historyLoading}
                  className="text-xs font-medium text-blue-600 hover:text-blue-700 disabled:opacity-50 px-2 py-1 rounded-lg hover:bg-blue-50 transition-colors"
                >
                  Refresh
                </button>
              </div>

              <div className="max-h-[min(520px,calc(100vh-12rem))] overflow-y-auto p-3 space-y-2">
                {historyLoading && history.length === 0 ? (
                  <div className="space-y-2 animate-pulse">
                    {[1, 2, 3].map((k) => (
                      <div
                        key={k}
                        className="h-20 rounded-xl bg-slate-100"
                      />
                    ))}
                  </div>
                ) : null}

                {!historyLoading && history.length === 0 ? (
                  <div className="text-center py-10 px-4">
                    <div className="mx-auto w-12 h-12 rounded-full bg-slate-100 flex items-center justify-center mb-3">
                      <svg
                        xmlns="http://www.w3.org/2000/svg"
                        fill="none"
                        viewBox="0 0 24 24"
                        strokeWidth={1.5}
                        stroke="currentColor"
                        className="w-6 h-6 text-slate-400"
                        aria-hidden
                      >
                        <path
                          strokeLinecap="round"
                          strokeLinejoin="round"
                          d="M12 6v6h4.5m4.5 0a9 9 0 11-18 0 9 9 0 0118 0z"
                        />
                      </svg>
                    </div>
                    <p className="text-sm font-medium text-slate-700">
                      No history yet
                    </p>
                    <p className="text-xs text-slate-500 mt-1 leading-relaxed">
                      Run a successful query and it will appear here for quick
                      reuse.
                    </p>
                  </div>
                ) : null}

                {history.map((item) => {
                  const active = selectedHistoryId === item.id;
                  return (
                    <div
                      key={item.id}
                      role="button"
                      tabIndex={0}
                      onClick={() => applyHistoryItem(item)}
                      onKeyDown={(e) => {
                        if (e.key === "Enter" || e.key === " ") {
                          e.preventDefault();
                          applyHistoryItem(item);
                        }
                      }}
                      className={`group relative rounded-xl border px-3 py-3 text-left cursor-pointer transition-all outline-none focus-visible:ring-2 focus-visible:ring-blue-500 focus-visible:ring-offset-2 ${
                        active
                          ? "border-blue-300 bg-blue-50/80 shadow-sm"
                          : "border-slate-200 bg-white hover:border-slate-300 hover:shadow-md hover:shadow-slate-200/60"
                      }`}
                    >
                      <p className="text-sm text-slate-800 line-clamp-2 leading-snug pr-16">
                        {item.naturalLanguageQuery}
                      </p>
                      <p className="text-[11px] text-slate-500 mt-2 font-medium tabular-nums">
                        {formatTimestamp(item.createdAt)}
                      </p>
                      <div className="absolute top-2 right-2 flex items-center gap-1 opacity-100 sm:opacity-0 sm:group-hover:opacity-100 transition-opacity">
                        <button
                          type="button"
                          className="p-1.5 rounded-lg text-blue-600 hover:bg-blue-100 transition-colors"
                          aria-label="Re-run this query"
                          title="Re-run"
                          disabled={loading}
                          onClick={(e) => {
                            e.stopPropagation();
                            setText(item.naturalLanguageQuery ?? "");
                            runQuery(item.naturalLanguageQuery);
                          }}
                        >
                          <svg
                            xmlns="http://www.w3.org/2000/svg"
                            viewBox="0 0 24 24"
                            fill="currentColor"
                            className="w-4 h-4"
                            aria-hidden
                          >
                            <path
                              fillRule="evenodd"
                              d="M4.5 5.653c0-1.427 1.529-2.33 2.779-1.643l11.54 6.348a1.75 1.75 0 010 3.286l-11.54 6.347c-1.25.687-2.779-.217-2.779-1.643V5.653z"
                              clipRule="evenodd"
                            />
                          </svg>
                        </button>
                        <button
                          type="button"
                          className="p-1.5 rounded-lg text-red-600 hover:bg-red-50 transition-colors disabled:opacity-50"
                          aria-label="Delete from history"
                          title="Delete"
                          disabled={deletingId === item.id}
                          onClick={(e) => handleDeleteHistory(item.id, e)}
                        >
                          <svg
                            xmlns="http://www.w3.org/2000/svg"
                            viewBox="0 0 24 24"
                            fill="currentColor"
                            className="w-4 h-4"
                            aria-hidden
                          >
                            <path
                              fillRule="evenodd"
                              d="M9 3a1 1 0 011-1h4a1 1 0 011 1v1h4a1 1 0 110 2h-1v11a3 3 0 01-3 3H8a3 3 0 01-3-3V6H4a1 1 0 110-2h5V3zm7 3H8v11a1 1 0 001 1h6a1 1 0 001-1V6zm-7 3a1 1 0 012 0v6a1 1 0 11-2 0V9zm5-1a1 1 0 00-1 1v6a1 1 0 102 0V9a1 1 0 00-1-1z"
                              clipRule="evenodd"
                            />
                          </svg>
                        </button>
                      </div>
                    </div>
                  );
                })}
              </div>

              {historyError ? (
                <p
                  className="text-xs text-red-600 px-4 py-2 border-t border-red-100 bg-red-50"
                  role="alert"
                >
                  {historyError}
                </p>
              ) : null}
            </div>
          </aside>

          {/* Main workspace */}
          <div className="order-1 lg:order-2 space-y-6 min-w-0">
            <form
              onSubmit={handleSubmit}
              className="rounded-2xl border border-slate-200/90 bg-white shadow-md shadow-slate-200/40 p-6 md:p-8 space-y-5"
            >
              <div className="flex flex-col sm:flex-row sm:items-end sm:justify-between gap-3">
                <div>
                  <h2 className="text-base font-semibold text-slate-900">
                    Ask your database
                  </h2>
                  <p className="text-sm text-slate-500 mt-1">
                    Natural language is translated to read-only{" "}
                    <code className="text-xs bg-slate-100 px-1.5 py-0.5 rounded">
                      SELECT
                    </code>{" "}
                    SQL.
                  </p>
                </div>
              </div>

              <label className="block text-sm font-medium text-slate-700">
                Your question
                <textarea
                  className="mt-2 w-full min-h-[140px] p-3 rounded-xl border border-slate-200 bg-slate-50/50 text-slate-900 placeholder:text-slate-400 focus:ring-2 focus:ring-blue-500/30 focus:border-blue-500 outline-none transition-shadow disabled:opacity-60"
                  placeholder='e.g. "Show all users ordered by signup date"'
                  value={text}
                  onChange={(e) => setText(e.target.value)}
                  disabled={loading}
                />
              </label>

              <div className="flex flex-wrap gap-3">
                <button
                  type="submit"
                  disabled={loading}
                  className="inline-flex items-center justify-center px-6 py-2.5 rounded-xl bg-blue-600 text-white text-sm font-semibold hover:bg-blue-700 shadow-sm shadow-blue-600/20 disabled:opacity-60 transition-colors"
                >
                  {loading ? (
                    <span className="inline-flex items-center gap-2">
                      <span className="inline-block h-4 w-4 border-2 border-white/40 border-t-white rounded-full animate-spin" />
                      Running…
                    </span>
                  ) : (
                    "Run query"
                  )}
                </button>
              </div>

              {error && (
                <p className="text-red-600 text-sm" role="alert">
                  {error}
                </p>
              )}
            </form>

            {result && (
              <div className="space-y-5">
                {result.fromHistory ? (
                  <div className="rounded-xl border border-amber-200 bg-amber-50/80 px-4 py-3 text-sm text-amber-900">
                    {result.message}
                  </div>
                ) : null}

                <section className="rounded-2xl border border-slate-200/90 bg-white shadow-md shadow-slate-200/40 p-6 md:p-8">
                  <h3 className="text-sm font-semibold text-slate-900 mb-3">
                    Generated SQL
                  </h3>
                  <pre className="text-sm bg-slate-950 text-slate-100 p-4 rounded-xl overflow-x-auto whitespace-pre-wrap font-mono leading-relaxed">
                    {result.sql}
                  </pre>
                </section>

                {result.explanation != null && result.explanation !== "" && (
                  <section className="rounded-2xl border border-slate-200/90 bg-white shadow-md shadow-slate-200/40 p-6 md:p-8">
                    <h3 className="text-sm font-semibold text-slate-900 mb-3">
                      Explanation
                    </h3>
                    <p className="text-slate-700 text-sm whitespace-pre-wrap leading-relaxed">
                      {result.explanation}
                    </p>
                  </section>
                )}

                {result.results != null ? (
                  <ResultsVisualizer
                    key={String(result.sql ?? "")}
                    results={result.results}
                    resultMeta={result.resultMeta}
                  />
                ) : (
                  <section className="rounded-2xl border border-slate-200/90 bg-white shadow-md shadow-slate-200/40 p-6 md:p-8">
                    <h3 className="text-sm font-semibold text-slate-900 mb-3">
                      Results
                    </h3>
                    <p className="text-sm text-slate-500">
                      Run the query to fetch fresh rows from the database.
                    </p>
                  </section>
                )}
              </div>
            )}
          </div>
        </div>
      </div>
    </AppShell>
  );
}

export default Query;
