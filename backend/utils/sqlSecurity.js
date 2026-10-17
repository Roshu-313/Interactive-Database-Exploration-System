/**
 * Server-side SQL security validation (SELECT-only, single statement, blocklist).
 * Schema-aware table checks when table list is provided.
 */
const FORBIDDEN_KEYWORD_RE =
  /\b(INSERT|UPDATE|DELETE|DROP|ALTER|CREATE|TRUNCATE|REPLACE|GRANT|REVOKE|EXEC|EXECUTE|CALL|LOAD|INTO\s+OUTFILE|INTO\s+DUMPFILE|LOCK\s+TABLES|UNLOCK\s+TABLES)\b/i;

const SELECT_START_RE = /^\s*(WITH\b[\s\S]*?\bSELECT\b[\s\S]*|SELECT\b[\s\S]*)/i;

function stripSqlComments(sql) {
  let s = String(sql);
  s = s.replace(/\/\*[\s\S]*?\*\//g, ' ');
  s = s.replace(/--[^\n\r]*/g, ' ');
  return s;
}

function normalizeForInspection(sql) {
  return stripSqlComments(String(sql)).trim();
}

/**
 * @param {string} sql
 * @returns {{ ok: true, sql: string } | { ok: false, reason: string }}
 */
function validateSqlSecuritySync(sql) {
  if (sql == null || String(sql).trim() === '') {
    return { ok: false, reason: 'Empty SQL' };
  }

  const cleaned = normalizeForInspection(sql);
  const withoutTrailingSemi = cleaned.replace(/;\s*$/, '').trim();

  if (withoutTrailingSemi.includes(';')) {
    return { ok: false, reason: 'Multiple SQL statements are not allowed' };
  }

  if (!SELECT_START_RE.test(withoutTrailingSemi)) {
    return { ok: false, reason: 'Only SELECT queries are allowed' };
  }

  if (FORBIDDEN_KEYWORD_RE.test(withoutTrailingSemi)) {
    return { ok: false, reason: 'Disallowed SQL operation detected' };
  }

  return { ok: true, sql: withoutTrailingSemi };
}

function extractReferencedTables(sql) {
  const tables = new Set();
  const fromJoinRe =
    /\b(?:FROM|JOIN)\s+([`"]?)([a-zA-Z0-9_]+)\1/gi;
  let m;
  const text = normalizeForInspection(sql);
  while ((m = fromJoinRe.exec(text)) !== null) {
    tables.add(m[2].toLowerCase());
  }
  return [...tables];
}

/**
 * @param {string} sql
 * @param {string[] | Set<string>} allowedTables — lowercase table names
 */
function validateSqlSchemaSync(sql, allowedTables) {
  const base = validateSqlSecuritySync(sql);
  if (!base.ok) return base;

  if (!allowedTables || (Array.isArray(allowedTables) && allowedTables.length === 0)) {
    return base;
  }

  const allowed = allowedTables instanceof Set
    ? allowedTables
    : new Set(allowedTables.map((t) => String(t).toLowerCase()));

  const referenced = extractReferencedTables(base.sql);
  for (const t of referenced) {
    if (!allowed.has(t)) {
      return {
        ok: false,
        reason: `Table "${t}" is not available or not recognized`,
      };
    }
  }

  return base;
}

/**
 * @param {string} sql
 * @param {() => Promise<string[]>} listTablesFn
 */
async function validateSqlForExecution(sql, listTablesFn) {
  const sync = validateSqlSecuritySync(sql);
  if (!sync.ok) return sync;

  if (typeof listTablesFn === 'function') {
    try {
      const tables = await listTablesFn();
      const allowed = new Set(tables.map((t) => String(t).toLowerCase()));
      return validateSqlSchemaSync(sync.sql, allowed);
    } catch {
      return sync;
    }
  }

  return sync;
}

function sanitizeDbErrorMessage(message) {
  if (!message || typeof message !== 'string') {
    return 'The database could not run this query.';
  }
  let m = message;
  m = m.replace(/at\s+[\w./\\-]+:\d+:\d+/gi, '');
  m = m.replace(/\b(password|secret|token)\b/gi, '[redacted]');
  if (m.length > 280) {
    m = `${m.slice(0, 277)}…`;
  }
  return m.trim() || 'The database could not run this query.';
}

function categorizeExecutionError(err) {
  const code = err?.parent?.code || err?.original?.code || err?.code;
  const msg = sanitizeDbErrorMessage(
    err?.parent?.sqlMessage || err?.original?.sqlMessage || err?.message,
  );

  if (code === 'ER_PARSE_ERROR' || /syntax/i.test(msg)) {
    return { category: 'SQL_SYNTAX', message: msg };
  }
  if (
    code === 'ER_NO_SUCH_TABLE' ||
    code === 'ER_BAD_FIELD_ERROR' ||
    code === 'ER_UNKNOWN_TABLE' ||
    /unknown column|doesn't exist/i.test(msg)
  ) {
    return { category: 'UNKNOWN_SCHEMA', message: msg };
  }
  if (
    code === 'ER_WRONG_VALUE' ||
    code === 'ER_TRUNCATED_WRONG_VALUE' ||
    code === 'ER_DATA_TOO_LONG' ||
    /incorrect|incompatible|type/i.test(msg)
  ) {
    return { category: 'INVALID_FILTER_OR_TYPE', message: msg };
  }
  if (code === 'ECONNREFUSED' || code === 'PROTOCOL_CONNECTION_LOST') {
    return { category: 'DATABASE_ERROR', message: 'Database connection failed.' };
  }
  return { category: 'DATABASE_ERROR', message: msg };
}

module.exports = {
  validateSqlSecuritySync,
  validateSqlSchemaSync,
  validateSqlForExecution,
  sanitizeDbErrorMessage,
  categorizeExecutionError,
  extractReferencedTables,
  normalizeForInspection,
};
