import { cn } from "../ui/cn";

export function MiniResultTable({ columns, rows, caption, className }) {
  if (!columns?.length) return null;

  return (
    <div className={cn("rounded-lg border border-slate-200 overflow-hidden bg-white", className)}>
      {caption ? (
        <p className="px-3 py-2 text-[11px] font-medium uppercase tracking-wide text-slate-500 bg-slate-50 border-b border-slate-200">
          {caption}
        </p>
      ) : null}
      <div className="overflow-x-auto">
        <table className="w-full text-left text-sm">
          <thead>
            <tr className="bg-slate-50/80">
              {columns.map((col) => (
                <th
                  key={col}
                  className="px-3 py-2 text-[11px] font-semibold uppercase tracking-wide text-slate-500 border-b border-slate-200 whitespace-nowrap"
                >
                  {col}
                </th>
              ))}
            </tr>
          </thead>
          <tbody>
            {rows.map((row, i) => (
              <tr key={i} className="odd:bg-white even:bg-slate-50/60">
                {columns.map((col) => (
                  <td
                    key={col}
                    className="px-3 py-1.5 text-slate-800 font-mono text-xs whitespace-nowrap"
                  >
                    {row[col] == null ? (
                      <span className="text-slate-400 italic">NULL</span>
                    ) : (
                      String(row[col])
                    )}
                  </td>
                ))}
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </div>
  );
}
