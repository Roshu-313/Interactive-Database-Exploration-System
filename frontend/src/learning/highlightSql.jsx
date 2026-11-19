const KEYWORDS = new Set([
  "SELECT",
  "FROM",
  "WHERE",
  "AND",
  "OR",
  "NOT",
  "IN",
  "LIKE",
  "BETWEEN",
  "IS",
  "NULL",
  "ORDER",
  "BY",
  "ASC",
  "DESC",
  "GROUP",
  "HAVING",
  "LIMIT",
  "OFFSET",
  "DISTINCT",
  "INSERT",
  "INTO",
  "VALUES",
  "UPDATE",
  "SET",
  "DELETE",
  "JOIN",
  "INNER",
  "LEFT",
  "RIGHT",
  "FULL",
  "OUTER",
  "ON",
  "AS",
  "COUNT",
  "SUM",
  "AVG",
  "MIN",
  "MAX",
  "CASE",
  "WHEN",
  "THEN",
  "ELSE",
  "END",
  "UNION",
  "ALL",
  "EXISTS",
  "CREATE",
  "TABLE",
  "DROP",
  "ALTER",
  "PRIMARY",
  "KEY",
  "FOREIGN",
  "REFERENCES",
  "CROSS",
  "USING",
]);

const TOKEN = /('(?:\\'|[^'])*'|"(?:\\"|[^"])*"|`[^`]+`|\b[A-Za-z_][\w]*\b|\d+(?:\.\d+)?|[^\s\w]+|\s+)/g;

function tokenClass(token) {
  if (/^\s+$/.test(token)) return null;
  if (/^['"]/.test(token)) return "text-amber-200";
  if (/^`/.test(token)) return "text-sky-200";
  if (/^\d/.test(token)) return "text-violet-200";
  if (KEYWORDS.has(token.toUpperCase()) && /^[A-Za-z]/.test(token)) {
    return "text-indigo-300 font-semibold";
  }
  if (/^--/.test(token)) return "text-slate-500 italic";
  return "text-slate-100";
}

export function HighlightedSql({ sql }) {
  const source = String(sql ?? "");
  const parts = source.match(TOKEN) ?? [source];

  return (
    <code className="font-mono">
      {parts.map((part, i) => {
        const cls = tokenClass(part);
        if (!cls) return part;
        return (
          <span key={`${i}-${part.slice(0, 12)}`} className={cls}>
            {part}
          </span>
        );
      })}
    </code>
  );
}
