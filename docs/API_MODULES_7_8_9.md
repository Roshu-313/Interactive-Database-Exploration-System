# IDES API — Modules 7, 8, and 9

Base URL: `/api` (e.g. `http://127.0.0.1:3000/api`)

Authentication: `Authorization: Bearer <JWT>` unless noted.

---

## Module 7 — Error correction (integrated in query pipeline)

### POST `/query/nl-to-sql`

**Auth:** Required

**Body:**

```json
{
  "query": "show me all customers",
  "rerunSql": "SELECT id, name FROM users LIMIT 10"
}
```

- `query` (required): Natural-language question.
- `rerunSql` (optional): Pre-generated SQL to execute after server-side security validation (used for explicit “rerun corrected query” only).

**Success (200):**

```json
{
  "status": "ok",
  "message": "Query executed successfully",
  "input": "…",
  "sql": "SELECT …",
  "results": [],
  "explanation": "…",
  "resultMeta": {},
  "queryHistoryId": 42
}
```

**Error (400 / 403 / 500):**

```json
{
  "status": "error",
  "message": "Safe user-facing message",
  "errorCategory": "SQL_SYNTAX",
  "input": "…",
  "sql": "SELECT …",
  "assistance": {
    "title": "…",
    "explanation": "…",
    "likelyCause": "…",
    "suggestedNaturalLanguage": "…",
    "suggestedSql": "SELECT …",
    "suggestedSqlSafe": true,
    "correctionRationale": "…"
  }
}
```

**Error categories:** `INVALID_INPUT`, `QUERY_NOT_UNDERSTOOD`, `LLM_FAILURE`, `SECURITY_VIOLATION`, `SQL_SYNTAX`, `UNKNOWN_SCHEMA`, `INVALID_FILTER_OR_TYPE`, `DATABASE_ERROR`, `INTERNAL_ERROR`

**Common errors:**

| Status | Cause |
|--------|--------|
| 400 | Invalid input, NL not understood, SQL/DB errors |
| 403 | Security validation failed |
| 401 | Missing/invalid JWT |

---

## Module 8 — Query ratings (user)

### POST `/query-ratings`

**Auth:** Required

**Body:**

```json
{
  "queryHistoryId": 42,
  "rating": 5,
  "feedback": "Clear results"
}
```

**Success (201):** `{ "status": "ok", "rating": { … } }`

**Errors:** 400 invalid input, 403 not your query history, 409 already rated (use PUT).

### GET `/query-ratings/my`

**Auth:** Required

**Success (200):** `{ "status": "ok", "ratings": [ … ] }`

### GET `/query-ratings/query/:queryHistoryId`

**Auth:** Required (must own the query history row)

**Success (200):** `{ "status": "ok", "rating": { … } | null }`

### PUT `/query-ratings/:id`

**Auth:** Required (own rating only)

**Body:** `{ "rating": 4, "feedback": "Updated comment" }`

**Success (200):** `{ "status": "ok", "rating": { … } }`

---

## Module 8 & 9 — Admin ratings

### GET `/admin/ratings/stats`

**Auth:** Admin

**Success (200):**

```json
{
  "status": "ok",
  "stats": {
    "totalRatings": 10,
    "avgRating": 4.2,
    "distribution": { "1": 0, "2": 1, "3": 2, "4": 3, "5": 4 }
  }
}
```

### GET `/admin/ratings?limit=15&offset=0`

**Auth:** Admin

**Success (200):** `{ "status": "ok", "ratings": [ … ], "pagination": { "total", "limit", "offset" } }`

---

## Module 9 — Admin monitor

### GET `/admin/dashboard`

**Auth:** Admin

**Success (200):** `{ "status": "ok", "stats": { … }, "recentQueries": [ … ] }`

### GET `/admin/users?search=&limit=15&offset=0`

**Auth:** Admin

**Success (200):** `{ "status": "ok", "users": [ … ], "pagination": { … } }`

### GET `/admin/users/:id/activity?limit=10&offset=0`

**Auth:** Admin

**Success (200):** `{ "status": "ok", "user": { … }, "queries": [ … ], "pagination": { … } }`

### PATCH `/admin/users/:id/role`

**Auth:** Admin

**Body:** `{ "role": "admin" | "user" }`

**Success (200):** `{ "status": "ok", "user": { "id", "name", "email", "role" } }`

**Errors:** 400 invalid role or last admin removal.

### GET `/admin/query-history?search=&limit=20&offset=0`

**Auth:** Admin

**Success (200):** `{ "status": "ok", "history": [ … ], "pagination": { … } }`

---

## Database

- New table: `query_ratings` (created via `sequelize.sync({ alter: true })` in non-production, same as existing models).
- Requires existing `users` and `query_histories` tables.

## Environment

- `GROQ_API_KEY` — error assistance and NL→SQL (existing).
- `JWT_SECRET`, MySQL vars — unchanged.
