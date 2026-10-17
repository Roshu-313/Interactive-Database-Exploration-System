import { cn } from "./cn";

const variants = {
  primary:
    "bg-indigo-600 text-white hover:bg-indigo-700 shadow-sm shadow-indigo-600/20 disabled:bg-indigo-400",
  secondary:
    "bg-white text-slate-800 border border-slate-200 hover:bg-slate-50 disabled:opacity-50",
  outline:
    "bg-transparent text-indigo-700 border border-indigo-200 hover:bg-indigo-50 disabled:opacity-50",
  ghost: "bg-transparent text-slate-700 hover:bg-slate-100 disabled:opacity-50",
  destructive:
    "bg-red-600 text-white hover:bg-red-700 disabled:bg-red-400",
};

const sizes = {
  sm: "h-8 px-3 text-xs gap-1.5",
  md: "h-10 px-4 text-sm gap-2",
  lg: "h-11 px-5 text-sm gap-2",
};

export function Button({
  variant = "primary",
  size = "md",
  className,
  children,
  loading,
  ...props
}) {
  return (
    <button
      type="button"
      className={cn(
        "inline-flex items-center justify-center font-medium rounded-lg transition-colors disabled:cursor-not-allowed",
        variants[variant],
        sizes[size],
        className,
      )}
      disabled={props.disabled || loading}
      {...props}
    >
      {loading ? (
        <span className="inline-block h-4 w-4 border-2 border-current/30 border-t-current rounded-full animate-spin" />
      ) : null}
      {children}
    </button>
  );
}
