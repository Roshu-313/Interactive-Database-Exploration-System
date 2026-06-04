# Interactive DB Explorer (IDES) — Project Report

**Generated:** March 2026  
**Workspace layout:** `backend/` (Express API), `frontend/` (Vite + React). `frontend-archive-create-react-app/` is an obsolete Create React App copy kept only if you still need files from it.

---

## 1. Executive summary

The system is a **web application** that lets authenticated users ask **natural-language questions**, see **generated SQL**, read a short **explanation**, and view **query results** from a **MySQL** database. **JWT** secures API routes; **admin** users get an extra **dashboard** API and UI. The NL→SQL layer is currently **rule-based** (limited phrases), not a full ML/LLM pipeline—suitable as a **foundation** with room for thesis work on smarter translation.

---

## 2. What is implemented (done)

### 2.1 Backend (`backend/`)

| Area | Details |
|------|---------|
| **Runtime** | Node.js, Express 5, `cors`, JSON body parsing, `dotenv` |
| **Database** | Sequelize ORM + MySQL; `User` model (`users` table: id, name, email, password hash, role `user` \| `admin`, timestamps) |
| **Auth** | `POST /api/auth/signup`, `POST /api/auth/login` (bcrypt + JWT), `GET /api/auth/profile` (JWT required; returns **full safe user** from DB: name, email, role, id) |
| **Services** | `services/userService.js` — loads user by id and strips password |
| **NL → SQL** | `POST /api/query/nl-to-sql` — body `{ "query": "..." }`; rule-based `nlToSql.js`; **only SELECT** executed; returns SQL, results, `sqlExplain` text |
| **Admin** | `GET /api/admin/dashboard` — JWT + `role === admin` |
| **Health** | `GET /api/health`, `GET /api/health/db-status` |
| **Security** | JWT middleware; role middleware for admin; SELECT-only guard on generated SQL |
| **Config** | `.env.example` for `PORT`, DB, `JWT_SECRET` |

**Note:** `app.js` mounts API routes once under `/api` (including `/api/query` via `routes/index.js`). Duplicate `/api/query` mounting was removed.

### 2.2 Frontend (`frontend/`)

| Area | Details |
|------|---------|
| **Stack** | Vite, React 19, React Router 7, Tailwind CSS 4 |
| **Auth state** | `AuthContext` — restores session from `localStorage` token; loads profile from API; `login`, `signup`, `logout`, `refreshUser` |
| **Routes** | `/login`, `/signup`, `/` → redirect to login; `/query`, `/profile`, `/admin` (protected); unknown paths → login |
| **Protected routes** | `ProtectedRoute` — requires login; optional `requireAdmin` for `/admin` (non-admins redirected to `/profile`) |
| **Pages** | **Login** (link to signup); **Signup** (name, email, password, confirm); **Query** (NL→SQL); **Profile** (name, email, role, id); **Admin** (calls admin dashboard API) |
| **Layout** | `AppShell` — nav (Query, Profile, Admin if role is admin), user label, **Log out** |
| **API client** | `src/api.js` — `API_BASE` / `VITE_API_URL`; login, signup, profile, admin dashboard, NL→SQL; clears token on 401 where applicable |

### 2.3 End-to-end flows

1. **Register** → Signup → redirect to login → login → JWT stored → **Query** / **Profile**.  
2. **NL query** → Bearer token → NL→SQL → SELECT-only execution → JSON results + explanation.  
3. **Admin** → user with `role: admin` in DB → `/admin` shows dashboard payload; others cannot open `/admin` (redirect to profile).

---

## 3. Partially done / limitations

| Topic | Status |
|-------|--------|
| **NL→SQL intelligence** | Only **fixed phrase rules** in `nlToSql.js`; not a general NLP or LLM solution. |
| **Automated tests** | Backend `npm test` is still a placeholder; no Jest/API tests in repo. |
| **Rate limiting / advanced hardening** | Not implemented. |
| **Thesis / documentation** | This report + code; formal SRS, diagrams, evaluation chapter are **outside** the repo unless you add them. |

---

## 4. How to run locally

1. **MySQL** — Create database (see `backend/.env.example` name), set credentials.  
2. **Backend** — Copy `.env.example` to `.env`, fill `JWT_SECRET` and DB fields. From `backend/`: `npm install` (once), `npm run dev` (or `npm start`). API default: `http://127.0.0.1:3000`.  
3. **Frontend** — From `frontend/`: `npm install` (once), `npm run dev`. Open the printed URL (often `http://localhost:5173`).  
4. **CORS** — Backend allows CORS broadly; frontend calls `http://127.0.0.1:3000` by default. If the API port differs, set `frontend/.env`: `VITE_API_URL=http://127.0.0.1:PORT`.  
5. **Admin user** — Set `role` to `admin` in the `users` table for one user (or seed via DB), then log in as that user to open **Admin**.

---

## 5. Suggested next steps (FYP)

1. Replace or augment **rule-based NL→SQL** with **LLM + schema context**, or a small **template grammar** covering more intents.  
2. Add **API + UI tests** (e.g. Vitest/Supertest).  
3. Add **schema browser** / **table metadata** APIs if the thesis requires “exploration” beyond a single query box.  
4. Remove or archive **`frontend-archive-create-react-app/`** when no longer needed.  
5. Produce **written thesis chapters** (requirements, design, evaluation, future work).

---

## 6. File map (quick reference)

```
FYP IDES/
├── backend/
│   ├── app.js, index.js
│   ├── config/, controllers/, middleware/, models/, routes/, utils/
│   ├── services/userService.js
│   └── .env.example
├── frontend/
│   ├── src/
│   │   ├── api.js
│   │   ├── App.jsx
│   │   ├── context/AuthContext.jsx
│   │   ├── components/AppShell.jsx, ProtectedRoute.jsx
│   │   └── pages/Login.jsx, Signup.jsx, Query.jsx, Profile.jsx, Admin.jsx
│   └── vite.config.js
├── PROJECT_REPORT.md          ← this file
└── frontend-archive-create-react-app/   ← legacy CRA (optional)
```

---

*This report reflects the repository state after completing the previously “partial” UI/auth items (signup, profile API, admin UI, protected routes, logout, service layer for profile loading).*
