import { useCallback, useEffect, useState } from "react";
import { AppShell } from "../components/AppShell";
import {
  deleteMyQueryHistory,
  fetchMyQueryHistory,
  nlToSqlRequest,
  QueryRequestError,
} from "../api";
import { QueryHistoryPanel } from "../components/QueryHistoryPanel";
import { ResultsVisualizer } from "../components/ResultsVisualizer";
import { QueryErrorPanel } from "../components/QueryErrorPanel";
import { QueryRatingSection } from "../components/QueryRatingSection";
import { SqlExplanation } from "../components/SqlExplanation";
import { Button } from "../components/ui/Button";
import { Card, CardBody, CardHeader, EmptyState, Skeleton } from "../components/ui/Card";
import { Label, Textarea } from "../components/ui/Input";
import { cn } from "../components/ui/cn";

const EXAMPLE_PROMPTS = [
  "Show the first 10 rows from a table",
  "Count how many records exist in a table",
  "List items ordered by date, newest first",
];

function QueryOutputPlaceholder() {
  return (
    <Card>
      <CardHeader className="py-3">
        <h2 className="text-sm font-semibold text-slate-900">Query results</h2>
      </CardHeader>
      <CardBody className="pt-0 pb-8">
        <EmptyState
          icon={
            <svg viewBox="0 0 24 24" fill="none" className="h-6 w-6" stroke="currentColor" strokeWidth="1.75" aria-hidden>
              <path strokeLinecap="round" strokeLinejoin="round" d="M4 7h16M4 12h10M4 17h7" />
            </svg>
          }
          title="No results yet"
          description="Run a question above to see data, generated SQL, and a guided explanation in this workspace."
        />
      </CardBody>
    </Card>
  );
}

function GeneratedSqlSection({ sql }) {
  const [copied, setCopied] = useState(false);

  async function handleCopy() {
    if (!sql) return;
    try {
      await navigator.clipboard.writeText(sql);
      setCopied(true);
      window.setTimeout(() => setCopied(false), 2000);
    } catch {
      /* clipboard unavailable */
    }
  }

  if (!sql) return null;

  return (
    <Card>
      <CardHeader className="py-3 flex flex-row items-center justify-between gap-3">
        <h2 className="text-sm font-semibold text-slate-900">Generated SQL</h2>
        <Button variant="ghost" size="sm" type="button" onClick={handleCopy} className="shrink-0">
          {copied ? "Copied" : "Copy SQL"}
        </Button>
      </CardHeader>
      <CardBody className="pt-0">
        <pre className="text-xs md:text-sm bg-slate-900 text-slate-100 p-3 md:p-4 rounded-lg overflow-x-auto whitespace-pre-wrap font-mono leading-relaxed">
          {sql}
        </pre>
      </CardBody>
    </Card>
  );
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
  const [mobileHistoryOpen, setMobileHistoryOpen] = useState(false);

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

  function handleHistoryRerun(naturalLanguageQuery) {
    setText(naturalLanguageQuery ?? "");
    runQuery(naturalLanguageQuery);
  }

  const historyPanelProps = {
    history,
    historyLoading,
    historyError,
    selectedHistoryId,
    deletingId,
    loading,
    onRefresh: loadHistory,
    onSelect: applyHistoryItem,
    onRerun: handleHistoryRerun,
    onDelete: handleDeleteHistory,
  };

  const showOutputPlaceholder = !result && !loading && !errorDetail;

  return (
    <AppShell>
      <div className="max-w-7xl mx-auto px-4 py-4 md:py-6 md:px-6 lg:px-8">
        <header className="mb-4 md:mb-5">
          <h1 className="text-lg md:text-xl font-semibold tracking-tight text-slate-900">
            Query Workspace
          </h1>
          <p className="mt-1 text-sm text-slate-600 leading-snug">
            Ask questions about your database in plain language.
          </p>
        </header>

        <div className="grid grid-cols-1 xl:grid-cols-[minmax(0,1fr)_minmax(240px,300px)] gap-4 xl:gap-5 items-start">
          <div className="min-w-0 space-y-4 order-1">
            <Card>
              <CardHeader className="py-3 border-b border-slate-100">
                <h2 className="text-sm font-semibold text-slate-900">Ask your database</h2>
              </CardHeader>
              <CardBody className="pt-4 pb-4 space-y-3">
                <form onSubmit={handleSubmit} className="space-y-3">
                  <div>
                    <Label htmlFor="nl-query" className="sr-only">
                      Natural language question
                    </Label>
                    <Textarea
                      id="nl-query"
                      className="min-h-[96px] max-h-[200px] text-sm"
                      placeholder='e.g. "Show all users who signed up this month"'
                      value={text}
                      onChange={(e) => setText(e.target.value)}
                      onKeyDown={handleTextareaKeyDown}
                      disabled={loading}
                    />
                    <p className="mt-1.5 text-xs text-slate-500">
                      Press{" "}
                      <kbd className="rounded border border-slate-200 bg-slate-50 px-1 font-mono text-[10px]">
                        Ctrl
                      </kbd>
                      +
                      <kbd className="rounded border border-slate-200 bg-slate-50 px-1 font-mono text-[10px]">
                        Enter
                      </kbd>{" "}
                      to run
                    </p>
                  </div>

                  <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-3">
                    <div className="flex flex-wrap gap-1.5 min-w-0">
                      {EXAMPLE_PROMPTS.map((prompt) => (
                        <button
                          key={prompt}
                          type="button"
                          disabled={loading}
                          onClick={() => setText(prompt)}
                          className="text-xs rounded-md border border-slate-200 bg-slate-50 px-2.5 py-1 text-slate-700 hover:border-indigo-200 hover:bg-indigo-50 hover:text-indigo-800 transition-colors disabled:opacity-50 text-left max-w-full truncate sm:max-w-[14rem]"
                          title={prompt}
                        >
                          {prompt}
                        </button>
                      ))}
                    </div>
                    <Button
                      type="submit"
                      loading={loading}
                      disabled={loading || !text.trim()}
                      className="gap-2 w-full sm:w-auto shrink-0"
                    >
                      <svg viewBox="0 0 20 20" fill="currentColor" className="h-4 w-4" aria-hidden>
                        <path d="M4.5 5.653A1.75 1.75 0 016.28 4h7.44a1.75 1.75 0 011.53 2.653l-2.482 4.006H14a1.75 1.75 0 010 3.5H5.5a1.75 1.75 0 01-1.53-2.653l2.482-4.006H4.5A1.75 1.75 0 014.5 5.653z" />
                      </svg>
                      Run query
                    </Button>
                  </div>
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

            <section aria-label="Query output" className="space-y-4">
              {loading && !result ? (
                <Card>
                  <CardHeader className="py-3">
                    <h2 className="text-sm font-semibold text-slate-900">Query results</h2>
                  </CardHeader>
                  <CardBody className="pt-0 space-y-2">
                    <Skeleton className="h-8 w-48" />
                    <Skeleton className="h-40 w-full" />
                  </CardBody>
                </Card>
              ) : null}

              {showOutputPlaceholder ? <QueryOutputPlaceholder /> : null}

              {result ? (
                <>
                  {result.fromHistory ? (
                    <div className="rounded-lg border border-amber-200 bg-amber-50 px-3 py-2.5 text-sm text-amber-950">
                      {result.message}
                    </div>
                  ) : null}

                  {result.results != null ? (
                    <ResultsVisualizer
                      key={String(result.sql ?? "")}
                      results={result.results}
                      resultMeta={result.resultMeta}
                    />
                  ) : (
                    <Card>
                      <CardHeader className="py-3">
                        <h2 className="text-sm font-semibold text-slate-900">Query results</h2>
                      </CardHeader>
                      <CardBody className="pt-0">
                        <p className="text-sm text-slate-500 leading-relaxed">
                          Run the query again to fetch fresh rows from the database.
                        </p>
                      </CardBody>
                    </Card>
                  )}

                  <GeneratedSqlSection sql={result.sql} />

                  <SqlExplanation explanation={result.explanation} />

                  {result.results != null && !result.fromHistory ? (
                    <QueryRatingSection queryHistoryId={result.queryHistoryId} />
                  ) : null}
                </>
              ) : null}
            </section>
          </div>

          <aside className="order-3 xl:order-2 min-w-0 xl:sticky xl:top-4 xl:self-start xl:max-h-[calc(100vh-2rem)] xl:flex xl:flex-col">
            <div className="xl:hidden mb-1">
              <button
                type="button"
                onClick={() => setMobileHistoryOpen((o) => !o)}
                className="w-full flex items-center justify-between gap-2 rounded-lg border border-slate-200 bg-white px-3 py-2.5 text-sm font-medium text-slate-800 hover:bg-slate-50 transition-colors"
                aria-expanded={mobileHistoryOpen}
              >
                <span>Query history ({history.length})</span>
                <svg
                  viewBox="0 0 20 20"
                  fill="currentColor"
                  className={cn("h-4 w-4 text-slate-500 transition-transform", mobileHistoryOpen && "rotate-180")}
                  aria-hidden
                >
                  <path
                    fillRule="evenodd"
                    d="M5.23 7.21a.75.75 0 011.06.02L10 11.168l3.71-3.94a.75.75 0 111.08 1.04l-4.25 4.5a.75.75 0 01-1.08 0l-4.25-4.5a.75.75 0 01.02-1.06z"
                    clipRule="evenodd"
                  />
                </svg>
              </button>
            </div>

            <QueryHistoryPanel
              {...historyPanelProps}
              className={cn("xl:flex-1 xl:min-h-0", !mobileHistoryOpen && "hidden xl:flex")}
              listClassName="xl:max-h-[calc(100vh-9.5rem)]"
            />
          </aside>
        </div>
      </div>
    </AppShell>
  );
}

export default Query;
