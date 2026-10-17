import { Badge } from "./ui/Card";
import { Button } from "./ui/Button";

const categoryLabels = {
  validation: "Validation",
  database: "Database",
  generation: "SQL generation",
  security: "Security",
};

export function QueryErrorPanel({
  errorDetail,
  loadingAssistance,
  onUseSuggestedQuestion,
  onRerunCorrectedSql,
  rerunLoading,
}) {
  if (!errorDetail) return null;

  const assistance = errorDetail.assistance;
  const title = assistance?.title || errorDetail.message || "Query failed";
  const explanation = assistance?.explanation || errorDetail.message;
  const category = errorDetail.errorCategory
    ? categoryLabels[errorDetail.errorCategory] || errorDetail.errorCategory
    : null;

  return (
    <section
      className="rounded-xl border border-red-200 bg-red-50/50 p-5 md:p-6 space-y-4"
      role="alert"
      aria-live="polite"
    >
      <div className="flex flex-wrap items-start gap-2">
        <h3 className="text-sm font-semibold text-red-950 flex-1">{title}</h3>
        {category ? <Badge variant="error">{category}</Badge> : null}
      </div>
      <p className="text-sm text-red-900/90 leading-relaxed">{explanation}</p>

      {loadingAssistance ? (
        <p className="text-xs text-red-800 inline-flex items-center gap-2">
          <span className="inline-block h-3.5 w-3.5 border-2 border-red-300 border-t-red-800 rounded-full animate-spin" />
          Generating suggestions…
        </p>
      ) : null}

      {assistance?.likelyCause ? (
        <div className="rounded-lg border border-red-100 bg-white/60 px-4 py-3">
          <p className="text-xs font-semibold uppercase tracking-wide text-red-900/70">
            Likely cause
          </p>
          <p className="text-sm text-red-900 mt-1">{assistance.likelyCause}</p>
        </div>
      ) : null}

      {errorDetail.sql ? (
        <div>
          <p className="text-xs font-semibold text-red-900/80 mb-1.5">Generated SQL</p>
          <pre className="text-xs bg-slate-900 text-slate-100 p-3 rounded-lg overflow-x-auto font-mono leading-relaxed">
            {errorDetail.sql}
          </pre>
        </div>
      ) : null}

      {assistance?.suggestedNaturalLanguage ? (
        <div className="rounded-lg border border-red-100 bg-white/70 p-4 space-y-3">
          <p className="text-sm text-red-950">
            <span className="font-medium">Suggested question: </span>
            {assistance.suggestedNaturalLanguage}
          </p>
          <Button
            type="button"
            variant="secondary"
            size="sm"
            onClick={() => onUseSuggestedQuestion?.(assistance.suggestedNaturalLanguage)}
          >
            Use suggestion
          </Button>
        </div>
      ) : null}

      {assistance?.suggestedSqlSafe && assistance?.suggestedSql ? (
        <div className="rounded-lg border border-red-100 bg-white/70 p-4 space-y-3">
          <p className="text-xs font-semibold text-red-900/80">Suggested correction (validated)</p>
          <pre className="text-xs bg-slate-900 text-slate-100 p-3 rounded-lg overflow-x-auto font-mono">
            {assistance.suggestedSql}
          </pre>
          {assistance.correctionRationale ? (
            <p className="text-sm text-red-900/90">{assistance.correctionRationale}</p>
          ) : null}
          <Button
            type="button"
            variant="primary"
            size="sm"
            disabled={rerunLoading}
            loading={rerunLoading}
            onClick={() =>
              onRerunCorrectedSql?.(assistance.suggestedSql, assistance.suggestedNaturalLanguage)
            }
          >
            Rerun corrected query
          </Button>
        </div>
      ) : null}
    </section>
  );
}
