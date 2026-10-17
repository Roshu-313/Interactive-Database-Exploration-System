import { useCallback, useEffect, useState } from "react";
import { AppShell } from "../components/AppShell";
import {
  deleteMyQueryHistory,
  fetchMyQueryHistory,
  nlToSqlRequest,
  QueryRequestError,
} from "../api";
import { ResultsVisualizer } from "../components/ResultsVisualizer";
import { QueryErrorPanel } from "../components/QueryErrorPanel";
import { QueryRatingSection } from "../components/QueryRatingSection";
import { Button } from "../components/ui/Button";
import { Card, CardBody, CardHeader, EmptyState, PageHeader, Skeleton } from "../components/ui/Card";
import { Label, Textarea } from "../components/ui/Input";

const EXAMPLE_PROMPTS = [
  "Show the first 10 rows from a table",
  "Count how many records exist in a table",
  "List items ordered by date, newest first",
];

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
  const [errorDetail, setErrorDetail] = useState(null);
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

  async function runQuery(overrideText, options = {}) {
    const q = String(overrideText ?? text).trim();
    setError(null);
    setErrorDetail(null);
    if (!options.keepResultOnError) {
      setResult(null);
    }
    if (!q) {
      setError("Enter a question in natural language.");
      setErrorDetail({
        message: "Enter a question in natural language.",
        assistance: {
          title: "Missing or invalid question",
          explanation: "Type what you want to know about the database, then run the query.",
        },
      });
      return;
    }

    setLoading(true);
    try {
      const data = await nlToSqlRequest(q, {
        rerunSql: options.rerunSql,
      });
      setResult(data);
      setSelectedHistoryId(data.queryHistoryId ?? selectedHistoryId);
      await loadHistory();
    } catch (err) {
      if (err instanceof QueryRequestError && err.detail) {
        setErrorDetail({
          message: err.message,
          sql: err.detail.sql,
          assistance: err.detail.assistance,
          errorCategory: err.detail.errorCategory,
        });
        setError(err.message);
      } else {
        setError(err instanceof Error ? err.message : "Something went wrong");
        setErrorDetail({
          message: err instanceof Error ? err.message : "Something went wrong",
          assistance: {
            title: "Query error",
            explanation:
              err instanceof Error ? err.message : "Something went wrong",
          },
        });
      }
    } finally {
      setLoading(false);
    }
  }

  function handleUseSuggestedQuestion(suggested) {
    setText(suggested);
  }

  function handleTextareaKeyDown(e) {
    if ((e.ctrlKey || e.metaKey) && e.key === "Enter") {
      e.preventDefault();
      if (!loading && text.trim()) {
        runQuery();
      }
    }
  }

  function handleRerunCorrectedSql(sql, suggestedNl) {
    const q = String(suggestedNl || text).trim();
    if (!q) return;
    setText(q);
    runQuery(q, { rerunSql: sql });
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
    setErrorDetail(null);
  }

  return (
    <AppShell>
      <div className="max-w-7xl mx-auto px-4 py-6 md:py-10 md:px-8">
        <PageHeader
          title="Explore your database"
          description="Ask questions in plain language. Get validated SQL, understandable explanations, and visual insights."
        />

        <div className="grid grid-cols-1 lg:grid-cols-[minmax(0,2fr)_minmax(260px,1fr)] gap-6 lg:gap-8 items-start">
          <div className="space-y-6 min-w-0">
            <Card>
              <CardBody>
                <form onSubmit={handleSubmit} className="space-y-4">
                  <div>
                    <Label htmlFor="nl-query">Ask a question</Label>
                    <Textarea
                      id="nl-query"
                      className="mt-1.5 min-h-[140px]"
                      placeholder='e.g. "Show all users who signed up this month"'
                      value={text}
                      onChange={(e) => setText(e.target.value)}
                      onKeyDown={handleTextareaKeyDown}
                      disabled={loading}
                    />
                    <p className="mt-1.5 text-xs text-slate-500">
                      Press <kbd className="rounded border border-slate-200 bg-slate-50 px-1 font-mono text-[10px]">Ctrl</kbd>
                      +<kbd className="rounded border border-slate-200 bg-slate-50 px-1 font-mono text-[10px]">Enter</kbd> to run
                    </p>
                  </div>

                  <div className="flex flex-wrap gap-2">
                    {EXAMPLE_PROMPTS.map((prompt) => (
                      <button
                        key={prompt}
                        type="button"
                        disabled={loading}
                        onClick={() => setText(prompt)}
                        className="text-xs rounded-full border border-slate-200 bg-slate-50 px-3 py-1.5 text-slate-700 hover:border-indigo-200 hover:bg-indigo-50 hover:text-indigo-800 transition-colors disabled:opacity-50"
                      >
                        {prompt}
                      </button>
                    ))}
                  </div>

                  <Button type="submit" loading={loading} disabled={loading || !text.trim()} className="gap-2">
                    <svg viewBox="0 0 20 20" fill="currentColor" className="h-4 w-4" aria-hidden>
                      <path d="M4.5 5.653A1.75 1.75 0 016.28 4h7.44a1.75 1.75 0 011.53 2.653l-2.482 4.006H14a1.75 1.75 0 010 3.5H5.5a1.75 1.75 0 01-1.53-2.653l2.482-4.006H4.5A1.75 1.75 0 014.5 5.653z" />
                    </svg>
                    Run query
                  </Button>
                </form>
              </CardBody>
            </Card>

            {errorDetail ? (
              <QueryErrorPanel
                errorDetail={errorDetail}
                loadingAssistance={loading && !errorDetail.assistance}
                onUseSuggestedQuestion={handleUseSuggestedQuestion}
                onRerunCorrectedSql={handleRerunCorrectedSql}
                rerunLoading={loading}
              />
            ) : error ? (
              <p className="text-red-600 text-sm" role="alert">
                {error}
              </p>
            ) : null}

            {result && (
              <div className="space-y-5">
                {result.fromHistory ? (
                  <div className="rounded-lg border border-amber-200 bg-amber-50 px-4 py-3 text-sm text-amber-950">
                    {result.message}
                  </div>
                ) : null}

                <Card>
                  <CardHeader>
                    <h3 className="text-sm font-semibold text-slate-900">Generated SQL</h3>
                  </CardHeader>
                  <CardBody className="pt-0">
                    <pre className="text-sm bg-slate-900 text-slate-100 p-4 rounded-lg overflow-x-auto whitespace-pre-wrap font-mono leading-relaxed">
                      {result.sql}
                    </pre>
                  </CardBody>
                </Card>

                {result.explanation != null && result.explanation !== "" && (
                  <Card>
                    <CardHeader>
                      <h3 className="text-sm font-semibold text-slate-900">Explanation</h3>
                    </CardHeader>
                    <CardBody className="pt-0">
                      <p className="text-slate-700 text-sm whitespace-pre-wrap leading-relaxed">
                        {result.explanation}
                      </p>
                    </CardBody>
                  </Card>
                )}

                {result.results != null && !result.fromHistory ? (
                  <QueryRatingSection queryHistoryId={result.queryHistoryId} />
                ) : null}

                {result.results != null ? (
                  <ResultsVisualizer
                    key={String(result.sql ?? "")}
                    results={result.results}
                    resultMeta={result.resultMeta}
                  />
                ) : (
                  <Card>
                    <CardHeader>
                      <h3 className="text-sm font-semibold text-slate-900">Results</h3>
                    </CardHeader>
                    <CardBody className="pt-0">
                      <p className="text-sm text-slate-500">
                        Run the query to fetch fresh rows from the database.
                      </p>
                    </CardBody>
                  </Card>
                )}
              </div>
            )}
          </div>

          <aside className="lg:sticky lg:top-[4.5rem] space-y-3">
            <Card className="overflow-hidden">
              <CardHeader className="flex flex-row items-center justify-between gap-2 bg-slate-50/50">
                <div>
                  <h2 className="text-sm font-semibold text-slate-900">Query history</h2>
                  <p className="text-xs text-slate-500 mt-0.5">Saved successful runs</p>
                </div>
                <Button variant="ghost" size="sm" onClick={() => loadHistory()} disabled={historyLoading}>
                  Refresh
                </Button>
              </CardHeader>

              <div className="max-h-[min(520px,calc(100vh-12rem))] overflow-y-auto p-3 space-y-2">
                {historyLoading && history.length === 0 ? (
                  <div className="space-y-2">
                    {[1, 2, 3].map((k) => (
                      <Skeleton key={k} className="h-20" />
                    ))}
                  </div>
                ) : null}

                {!historyLoading && history.length === 0 ? (
                  <EmptyState
                    title="No history yet"
                    description="Run a successful query and it will appear here for quick reuse."
                  />
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
                      className={`group relative rounded-lg border px-3 py-3 text-left cursor-pointer transition-all outline-none focus-visible:ring-2 focus-visible:ring-indigo-500 focus-visible:ring-offset-2 ${
                        active
                          ? "border-indigo-300 bg-indigo-50/80 shadow-sm"
                          : "border-slate-200 bg-white hover:border-slate-300 hover:bg-slate-50/80"
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
            </Card>
          </aside>
        </div>
      </div>
    </AppShell>
  );
}

export default Query;
