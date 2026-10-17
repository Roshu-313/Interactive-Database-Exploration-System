function parsePagination(query, defaults = {}) {
  const defaultLimit = defaults.limit ?? 20;
  const maxLimit = defaults.maxLimit ?? 100;

  const rawLimit = Number.parseInt(query.limit, 10);
  const rawOffset = Number.parseInt(query.offset, 10);

  const limit = Number.isFinite(rawLimit)
    ? Math.min(Math.max(rawLimit, 1), maxLimit)
    : defaultLimit;
  const offset = Number.isFinite(rawOffset) ? Math.max(rawOffset, 0) : 0;

  return { limit, offset };
}

function sanitizeSearchTerm(term, maxLen = 120) {
  if (term == null) return '';
  return String(term).trim().slice(0, maxLen);
}

module.exports = { parsePagination, sanitizeSearchTerm };
