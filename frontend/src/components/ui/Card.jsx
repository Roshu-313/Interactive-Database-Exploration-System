import { cn } from "./cn";

export function Card({ className, children }) {
  return (
    <div
      className={cn(
        "rounded-xl border border-slate-200/90 bg-white shadow-[var(--shadow-card)]",
        className,
      )}
    >
      {children}
    </div>
  );
}

export function CardHeader({ className, children }) {
  return (
    <div className={cn("px-5 py-4 border-b border-slate-100", className)}>
      {children}
    </div>
  );
}

export function CardBody({ className, children }) {
  return <div className={cn("p-5 md:p-6", className)}>{children}</div>;
}

export function PageHeader({ title, description, actions, className }) {
  return (
    <div className={cn("flex flex-col sm:flex-row sm:items-end sm:justify-between gap-4 mb-6 md:mb-8", className)}>
      <div className="min-w-0">
        <h1 className="text-xl md:text-2xl font-semibold tracking-tight text-slate-900">
          {title}
        </h1>
        {description ? (
          <p className="mt-1.5 text-sm text-slate-600 max-w-2xl leading-relaxed">
            {description}
          </p>
        ) : null}
      </div>
      {actions ? <div className="shrink-0 flex flex-wrap gap-2">{actions}</div> : null}
    </div>
  );
}

export function Badge({ variant = "default", className, children }) {
  const styles = {
    default: "bg-slate-100 text-slate-700 border-slate-200",
    accent: "bg-indigo-50 text-indigo-800 border-indigo-100",
    success: "bg-emerald-50 text-emerald-800 border-emerald-100",
    warning: "bg-amber-50 text-amber-900 border-amber-100",
    error: "bg-red-50 text-red-800 border-red-100",
  };
  return (
    <span
      className={cn(
        "inline-flex items-center rounded-md border px-2 py-0.5 text-[11px] font-medium",
        styles[variant],
        className,
      )}
    >
      {children}
    </span>
  );
}

export function Alert({ variant = "error", title, children, className }) {
  const styles = {
    error: "border-red-200 bg-red-50/80 text-red-900",
    success: "border-emerald-200 bg-emerald-50/80 text-emerald-900",
    warning: "border-amber-200 bg-amber-50/80 text-amber-950",
    info: "border-slate-200 bg-slate-50 text-slate-800",
  };
  return (
    <div
      role={variant === "error" ? "alert" : "status"}
      className={cn("rounded-lg border px-4 py-3 text-sm", styles[variant], className)}
    >
      {title ? <p className="font-semibold">{title}</p> : null}
      {children ? <div className={title ? "mt-1" : ""}>{children}</div> : null}
    </div>
  );
}

export function EmptyState({ icon, title, description, action }) {
  return (
    <div className="text-center py-10 px-4">
      {icon ? (
        <div className="mx-auto w-12 h-12 rounded-full bg-slate-100 flex items-center justify-center mb-3 text-slate-400">
          {icon}
        </div>
      ) : null}
      <p className="text-sm font-medium text-slate-800">{title}</p>
      {description ? (
        <p className="text-xs text-slate-500 mt-1 max-w-sm mx-auto leading-relaxed">
          {description}
        </p>
      ) : null}
      {action ? <div className="mt-4">{action}</div> : null}
    </div>
  );
}

export function Skeleton({ className }) {
  return <div className={cn("animate-pulse rounded-lg bg-slate-100", className)} />;
}
