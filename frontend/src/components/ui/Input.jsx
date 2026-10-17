import { cn } from "./cn";

export function Label({ className, children, ...props }) {
  return (
    <label
      className={cn("block text-sm font-medium text-slate-700", className)}
      {...props}
    >
      {children}
    </label>
  );
}

export function FieldHint({ className, children }) {
  return (
    <p className={cn("mt-1.5 text-xs text-slate-500", className)}>{children}</p>
  );
}

export function FieldError({ className, children, id }) {
  if (!children) return null;
  return (
    <p id={id} role="alert" className={cn("mt-1.5 text-sm text-red-600", className)}>
      {children}
    </p>
  );
}

const inputClass =
  "w-full h-10 px-3 rounded-lg border border-slate-200 bg-white text-slate-900 text-sm placeholder:text-slate-400 transition-shadow focus:border-indigo-500 focus:ring-2 focus:ring-indigo-500/20 outline-none disabled:opacity-60 disabled:bg-slate-50";

export function Input({ className, ...props }) {
  return <input className={cn(inputClass, className)} {...props} />;
}

export function Textarea({ className, ...props }) {
  return (
    <textarea
      className={cn(
        "w-full min-h-[120px] px-3 py-2.5 rounded-lg border border-slate-200 bg-white text-slate-900 text-sm placeholder:text-slate-400 transition-shadow focus:border-indigo-500 focus:ring-2 focus:ring-indigo-500/20 outline-none disabled:opacity-60 resize-y",
        className,
      )}
      {...props}
    />
  );
}

export function SearchInput({ className, ...props }) {
  return (
    <input
      type="search"
      className={cn(inputClass, "h-9", className)}
      {...props}
    />
  );
}
