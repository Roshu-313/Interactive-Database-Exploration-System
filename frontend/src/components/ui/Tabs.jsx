import { cn } from "./cn";

export function TabList({ className, children }) {
  return (
    <div
      className={cn(
        "flex gap-1 p-1 rounded-lg bg-slate-100/80 border border-slate-200/80 overflow-x-auto",
        className,
      )}
      role="tablist"
    >
      {children}
    </div>
  );
}

export function Tab({ active, onClick, children, id }) {
  return (
    <button
      type="button"
      role="tab"
      id={id}
      aria-selected={active}
      onClick={onClick}
      className={cn(
        "shrink-0 px-3 py-1.5 rounded-md text-sm font-medium transition-colors whitespace-nowrap",
        active
          ? "bg-white text-slate-900 shadow-sm"
          : "text-slate-600 hover:text-slate-900 hover:bg-white/60",
      )}
    >
      {children}
    </button>
  );
}

export function TabPanel({ active, children, labelledBy }) {
  if (!active) return null;
  return (
    <div role="tabpanel" aria-labelledby={labelledBy} className="pt-4">
      {children}
    </div>
  );
}
