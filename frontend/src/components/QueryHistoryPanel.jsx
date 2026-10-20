import { Button } from "./ui/Button";
import { Card, CardHeader, EmptyState, Skeleton } from "./ui/Card";
import { cn } from "./ui/cn";

function formatTimestamp(iso) {
  if (!iso) return "";
  const d = new Date(iso);
  if (Number.isNaN(d.getTime())) return String(iso);
  return d.toLocaleString(undefined, {
    dateStyle: "medium",
    timeStyle: "short",
  });
}

/**
 * @param {{
 *   history: Array<{ id: number, naturalLanguageQuery: string, createdAt: string }>,
 *   historyLoading: boolean,
 *   historyError: string | null,
 *   selectedHistoryId: number | null,
 *   deletingId: number | null,
 *   loading: boolean,
 *   onRefresh: () => void,
 *   onSelect: (item: object) => void,
 *   onRerun: (naturalLanguageQuery: string) => void,
 *   onDelete: (id: number, e: import("react").MouseEvent) => void,
 *   className?: string,
 *   listClassName?: string,
 * }} props
 */
export function QueryHistoryPanel({
  history,
  historyLoading,
  historyError,
  selectedHistoryId,
  deletingId,
  loading,
  onRefresh,
  onSelect,
  onRerun,
  onDelete,
  className,
  listClassName,
}) {
  return (
    <Card className={cn("overflow-hidden flex flex-col min-h-0", className)}>
      <CardHeader className="flex flex-row items-start justify-between gap-2 py-3 px-4 border-b border-slate-100 bg-slate-50/40 shrink-0">
        <div className="min-w-0">
          <h2 className="text-sm font-semibold text-slate-900">Query history</h2>
          <p className="text-xs text-slate-500 mt-0.5 leading-snug">Reuse past successful questions</p>
        </div>
        <Button
          variant="ghost"
          size="sm"
          onClick={onRefresh}
          disabled={historyLoading}
          className="shrink-0 -mr-1"
        >
          Refresh
        </Button>
      </CardHeader>

      <div
        className={cn(
          "flex-1 min-h-0 overflow-y-auto overscroll-contain p-2 space-y-1.5",
          listClassName,
        )}
      >
        {historyLoading && history.length === 0 ? (
          <div className="space-y-1.5 p-1">
            {[1, 2, 3, 4].map((k) => (
              <Skeleton key={k} className="h-[4.25rem]" />
            ))}
          </div>
        ) : null}

        {!historyLoading && history.length === 0 ? (
          <EmptyState
            title="No history yet"
            description="Successful queries are saved here for quick reuse."
          />
        ) : null}

        {history.map((item) => {
          const active = selectedHistoryId === item.id;
          return (
            <div
              key={item.id}
              role="button"
              tabIndex={0}
              onClick={() => onSelect(item)}
              onKeyDown={(e) => {
                if (e.key === "Enter" || e.key === " ") {
                  e.preventDefault();
                  onSelect(item);
                }
              }}
              className={cn(
                "group relative rounded-lg border px-2.5 py-2 text-left cursor-pointer transition-colors outline-none",
                "focus-visible:ring-2 focus-visible:ring-indigo-500 focus-visible:ring-offset-1",
                active
                  ? "border-indigo-300 bg-indigo-50/90 ring-1 ring-indigo-200/60"
                  : "border-slate-200/90 bg-white hover:border-slate-300 hover:bg-slate-50/90",
              )}
            >
              <p className="text-[13px] text-slate-800 line-clamp-2 leading-snug pr-14 break-words">
                {item.naturalLanguageQuery}
              </p>
              <p className="text-[10px] text-slate-500 mt-1.5 font-medium tabular-nums">
                {formatTimestamp(item.createdAt)}
              </p>
              <div className="absolute top-1.5 right-1 flex items-center gap-0.5 opacity-100 xl:opacity-0 xl:group-hover:opacity-100 xl:group-focus-within:opacity-100 transition-opacity">
                <button
                  type="button"
                  className="p-1.5 rounded-md text-indigo-600 hover:bg-indigo-100 transition-colors"
                  aria-label="Re-run this query"
                  title="Re-run"
                  disabled={loading}
                  onClick={(e) => {
                    e.stopPropagation();
                    onRerun(item.naturalLanguageQuery ?? "");
                  }}
                >
                  <svg viewBox="0 0 20 20" fill="currentColor" className="w-3.5 h-3.5" aria-hidden>
                    <path d="M4.5 5.653A1.75 1.75 0 016.28 4h7.44a1.75 1.75 0 011.53 2.653l-2.482 4.006H14a1.75 1.75 0 010 3.5H5.5a1.75 1.75 0 01-1.53-2.653l2.482-4.006H4.5A1.75 1.75 0 014.5 5.653z" />
                  </svg>
                </button>
                <button
                  type="button"
                  className="p-1.5 rounded-md text-red-600 hover:bg-red-50 transition-colors disabled:opacity-50"
                  aria-label="Delete from history"
                  title="Delete"
                  disabled={deletingId === item.id}
                  onClick={(e) => onDelete(item.id, e)}
                >
                  <svg viewBox="0 0 20 20" fill="currentColor" className="w-3.5 h-3.5" aria-hidden>
                    <path
                      fillRule="evenodd"
                      d="M8.75 1A2.75 2.75 0 006 3.75v.443c-.795.077-1.584.176-2.365.298a.75.75 0 10.23 1.482l.149-.022.841 8.24A2.75 2.75 0 007.596 16h4.807a2.75 2.75 0 002.742-2.53l.841-8.24.149.023a.75.75 0 00.23-1.482A41.03 41.03 0 0014 4.193V3.75A2.75 2.75 0 0011.25 1h-2.5zM10 4c.84 0 1.673.025 2.5.075V3.75c0-.69-.56-1.25-1.25-1.25h-2.5c-.69 0-1.25.56-1.25 1.25v.325C8.327 4.025 9.16 4 10 4zM8.58 7.72a.75.75 0 00-1.5.06l.3 7.5a.75.75 0 101.5-.06l-.3-7.5zm4.34.06a.75.75 0 10-1.5-.06l-.3 7.5a.75.75 0 101.5.06l.3-7.5z"
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
        <p className="text-xs text-red-600 px-3 py-2 border-t border-red-100 bg-red-50 shrink-0" role="alert">
          {historyError}
        </p>
      ) : null}
    </Card>
  );
}
