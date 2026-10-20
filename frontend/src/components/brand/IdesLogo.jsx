import { cn } from "../ui/cn";

export function IdesLogo({
  className,
  showWordmark = true,
  compact = false,
  theme = "light",
  subtitle,
}) {
  const isDark = theme === "dark";
  const defaultSubtitle = isDark ? null : "Database exploration";

  return (
    <div className={cn("flex items-center gap-2.5 min-w-0", className)}>
      <div
        className={cn(
          "flex h-9 w-9 shrink-0 items-center justify-center rounded-lg text-white shadow-sm",
          isDark ? "bg-indigo-600 shadow-indigo-900/40" : "bg-indigo-600 shadow-indigo-600/25",
        )}
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
          <p
            className={cn(
              "font-semibold tracking-tight",
              compact ? "text-sm" : "text-base",
              isDark ? "text-white" : "text-slate-900",
            )}
          >
            IDES
          </p>
          {(subtitle ?? defaultSubtitle) && !compact ? (
            <p
              className={cn(
                "text-[11px] truncate",
                isDark ? "text-slate-400" : "text-slate-500 hidden sm:block",
              )}
            >
              {subtitle ?? defaultSubtitle}
            </p>
          ) : null}
        </div>
      ) : null}
    </div>
  );
}
