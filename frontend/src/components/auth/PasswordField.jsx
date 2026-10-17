import { useState } from "react";
import { cn } from "../ui/cn";
import { FieldError, Label } from "../ui/Input";

export function PasswordField({
  id,
  label,
  value,
  onChange,
  error,
  placeholder,
  autoComplete,
  required,
  minLength,
}) {
  const [visible, setVisible] = useState(false);

  return (
    <div>
      <Label htmlFor={id}>{label}</Label>
      <div className="relative mt-1.5">
        <input
          id={id}
          type={visible ? "text" : "password"}
          value={value}
          onChange={onChange}
          placeholder={placeholder}
          autoComplete={autoComplete}
          required={required}
          minLength={minLength}
          className="w-full h-10 pl-3 pr-10 rounded-lg border border-slate-200 bg-white text-sm focus:border-indigo-500 focus:ring-2 focus:ring-indigo-500/20 outline-none"
        />
        <button
          type="button"
          onClick={() => setVisible((v) => !v)}
          className={cn(
            "absolute right-1 top-1/2 -translate-y-1/2 h-8 px-2 text-xs font-medium text-slate-500 hover:text-slate-800 rounded-md",
          )}
          aria-label={visible ? "Hide password" : "Show password"}
        >
          {visible ? "Hide" : "Show"}
        </button>
      </div>
      <FieldError>{error}</FieldError>
    </div>
  );
}
