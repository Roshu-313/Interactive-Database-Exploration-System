import { useState } from "react";
import { Button } from "../ui/Button";
import { Badge } from "../ui/Card";
import { HighlightedSql } from "../../learning/highlightSql";
import { cn } from "../ui/cn";

export function SqlCodeBlock({
  sql,
  mutating = false,
  className,
  label = "SQL",
}) {
  const [copied, setCopied] = useState(false);
  const [copyError, setCopyError] = useState(false);

  async function handleCopy() {
    if (!sql) return;
    setCopyError(false);
    try {
      await navigator.clipboard.writeText(sql);
      setCopied(true);
      window.setTimeout(() => setCopied(false), 1800);
    } catch {
      setCopyError(true);
      window.setTimeout(() => setCopyError(false), 2200);
    }
  }

  return (
    <div className={cn("rounded-lg overflow-hidden border border-slate-800 bg-slate-900", className)}>
      <div className="flex items-center justify-between gap-2 px-3 py-2 border-b border-slate-800 bg-slate-950/80">
        <div className="flex items-center gap-2 min-w-0">
          <span className="text-[11px] font-medium uppercase tracking-wide text-slate-400">
            {label}
          </span>
          {mutating ? (
            <Badge variant="warning" className="border-amber-700/40 bg-amber-500/10 text-amber-200">
              Learning example — not executed
            </Badge>
          ) : (
            <Badge variant="success" className="border-emerald-700/40 bg-emerald-500/10 text-emerald-200">
              Read-only
            </Badge>
          )}
        </div>
        <Button
          variant="ghost"
          size="sm"
          type="button"
          onClick={handleCopy}
          className="shrink-0 text-slate-200 hover:bg-white/10 hover:text-white"
          aria-label={copied ? "SQL copied" : "Copy SQL"}
        >
          {copyError ? "Copy failed" : copied ? "Copied" : "Copy SQL"}
        </Button>
      </div>
      <pre className="text-xs md:text-sm p-3 md:p-4 overflow-x-auto whitespace-pre leading-relaxed">
        <HighlightedSql sql={sql} />
      </pre>
    </div>
  );
}
