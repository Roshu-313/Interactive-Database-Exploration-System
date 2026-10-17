import { cn } from "../ui/cn";

export function IdesLogo({ className, showWordmark = true, compact = false }) {
  return (
    <div className={cn("flex items-center gap-2.5 min-w-0", className)}>
      <div
        className="flex h-9 w-9 shrink-0 items-center justify-center rounded-lg bg-indigo-600 text-white shadow-sm shadow-indigo-600/25"
        aria-hidden
      >
        <svg viewBox="0 0 24 24" fill="none" className="h-5 w-5" stroke="currentColor" strokeWidth="1.75">
          <ellipse cx="12" cy="5" rx="7" ry="2.5" />
          <path d="M5 5v6c0 1.4 3.1 2.5 7 2.5s7-1.1 7-2.5V5" />
          <path d="M5 11v6c0 1.4 3.1 2.5 7 2.5s7-1.1 7-2.5v-6" />
        </svg>
      </div>
      {showWordmark ? (
        <div className="min-w-0 leading-tight">
          <p className={cn("font-semibold tracking-tight text-slate-900", compact ? "text-sm" : "text-base")}>
            IDES
          </p>
          {!compact ? (
            <p className="text-[11px] text-slate-500 truncate hidden sm:block">
              Database exploration
            </p>
          ) : null}
        </div>
      ) : null}
    </div>
  );
}
