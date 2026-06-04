import axios from "axios";

/** Backend base URL — override with VITE_API_URL in .env (e.g. http://127.0.0.1:3000) */
export const API_BASE =
  import.meta.env.VITE_API_URL ?? "http://127.0.0.1:3000";

export function getToken() {
  return localStorage.getItem("token");
}

const axiosApi = axios.create({
  baseURL: `${API_BASE}/api`,
  headers: { "Content-Type": "application/json" },
});

axiosApi.interceptors.request.use((config) => {
  const token = getToken();
  if (token) {
    config.headers.Authorization = `Bearer ${token}`;
  }
  return config;
});

axiosApi.interceptors.response.use(
  (response) => response,
  (error) => {
    if (error.response?.status === 401) {
      clearToken();
    }
    return Promise.reject(error);
  },
);

export function clearToken() {
  localStorage.removeItem("token");
}

async function parseJson(res) {
  return res.json().catch(() => ({}));
}

export async function loginRequest(email, password) {
  const res = await fetch(`${API_BASE}/api/auth/login`, {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({ email, password }),
  });
  const data = await parseJson(res);
  if (!res.ok) {
    throw new Error(data.message || `Login failed (${res.status})`);
  }
  return data;
}

export async function signupRequest(name, email, password) {
  const res = await fetch(`${API_BASE}/api/auth/signup`, {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({ name, email, password }),
  });
  const data = await parseJson(res);
  if (!res.ok) {
    throw new Error(data.message || `Signup failed (${res.status})`);
  }
  return data;
}

export async function forgotPasswordRequest(email) {
  const res = await fetch(`${API_BASE}/api/auth/forgot-password`, {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({ email: email.trim() }),
  });
  const data = await parseJson(res);
  if (!res.ok) {
    throw new Error(data.message || `Request failed (${res.status})`);
  }
  return data;
}

export async function resetPasswordRequest(token, password) {
  const res = await fetch(`${API_BASE}/api/auth/reset-password`, {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({ token, password }),
  });
  const data = await parseJson(res);
  if (!res.ok) {
    throw new Error(data.message || `Request failed (${res.status})`);
  }
  return data;
}

export async function fetchProfileRequest() {
  const token = getToken();
  if (!token) return null;

  const res = await fetch(`${API_BASE}/api/auth/profile`, {
    headers: { Authorization: `Bearer ${token}` },
  });
  const data = await parseJson(res);

  if (res.status === 401) {
    clearToken();
    return null;
  }
  if (!res.ok) {
    throw new Error(data.message || `Profile failed (${res.status})`);
  }
  return data.user;
}

export async function adminDashboardRequest() {
  const token = getToken();
  if (!token) {
    throw new Error("Not logged in.");
  }

  const res = await fetch(`${API_BASE}/api/admin/dashboard`, {
    headers: { Authorization: `Bearer ${token}` },
  });
  const data = await parseJson(res);

  if (res.status === 401) {
    clearToken();
    throw new Error("Session expired. Please log in again.");
  }
  if (!res.ok) {
    throw new Error(data.message || `Request failed (${res.status})`);
  }
  return data;
}

export async function nlToSqlRequest(naturalLanguage) {
  if (!getToken()) {
    throw new Error("Not logged in. Log in on the home page first.");
  }

  try {
    const { data } = await axiosApi.post("/query/nl-to-sql", {
      query: naturalLanguage,
    });
    return data;
  } catch (err) {
    const status = err.response?.status;
    const payload = err.response?.data;
    const msg =
      payload?.message ||
      payload?.error ||
      (typeof payload === "string" ? payload : null) ||
      err.message ||
      (status ? `Request failed (${status})` : "Request failed");
    if (status === 401) {
      throw new Error("Session expired. Please log in again.");
    }
    throw new Error(typeof msg === "string" ? msg : JSON.stringify(msg));
  }
}

/**
 * Current user's saved NL→SQL runs (latest first).
 * @returns {Promise<Array<{ id: number, naturalLanguageQuery: string, generatedSql: string, explanation: string, createdAt: string }>>}
 */
export async function fetchMyQueryHistory() {
  if (!getToken()) {
    throw new Error("Not logged in. Log in on the home page first.");
  }

  try {
    const { data } = await axiosApi.get("/query/history");
    return Array.isArray(data.history) ? data.history : [];
  } catch (err) {
    const payload = err.response?.data;
    const msg =
      payload?.message ||
      payload?.error ||
      err.message ||
      "Failed to load history";
    throw new Error(typeof msg === "string" ? msg : JSON.stringify(msg));
  }
}

function axiosErrorMessage(err, fallback) {
  const payload = err.response?.data;
  const msg =
    payload?.message ||
    payload?.error ||
    err.message ||
    fallback;
  return typeof msg === "string" ? msg : JSON.stringify(msg);
}

/** @returns {Promise<{ tables: string[], meta: { count: number, database: string } }>} */
export async function fetchSchemaTables() {
  if (!getToken()) {
    throw new Error("Not logged in. Log in on the home page first.");
  }
  try {
    const { data } = await axiosApi.get("/schema/tables");
    if (data.status !== "ok" || !Array.isArray(data.tables)) {
      throw new Error("Unexpected response from schema API");
    }
    return data;
  } catch (err) {
    if (err.response?.status === 401) {
      throw new Error("Session expired. Please log in again.");
    }
    throw new Error(axiosErrorMessage(err, "Failed to load tables"));
  }
}

/** @returns {Promise<{ schema: { table: string, columns: Array, primaryKeys: string[] } }>} */
export async function fetchSchemaTable(tableName) {
  if (!getToken()) {
    throw new Error("Not logged in. Log in on the home page first.");
  }
  const segment = encodeURIComponent(String(tableName));
  try {
    const { data } = await axiosApi.get(`/schema/table/${segment}`);
    if (data.status !== "ok" || !data.schema) {
      throw new Error("Unexpected response from schema API");
    }
    return data;
  } catch (err) {
    if (err.response?.status === 401) {
      throw new Error("Session expired. Please log in again.");
    }
    if (err.response?.status === 404) {
      throw new Error(
        err.response?.data?.message || "Table not found",
      );
    }
    throw new Error(axiosErrorMessage(err, "Failed to load table schema"));
  }
}

/** @returns {Promise<{ relationships: Array<{ fromTable: string, fromColumn: string, toTable: string, toColumn: string, constraintName: string }> }>} */
export async function fetchSchemaRelationships() {
  if (!getToken()) {
    throw new Error("Not logged in. Log in on the home page first.");
  }
  try {
    const { data } = await axiosApi.get("/schema/relationships");
    if (data.status !== "ok" || !Array.isArray(data.relationships)) {
      throw new Error("Unexpected response from schema API");
    }
    return data;
  } catch (err) {
    if (err.response?.status === 401) {
      throw new Error("Session expired. Please log in again.");
    }
    throw new Error(
      axiosErrorMessage(err, "Failed to load relationships"),
    );
  }
}

export async function deleteMyQueryHistory(id) {
  if (!getToken()) {
    throw new Error("Not logged in. Log in on the home page first.");
  }

  try {
    await axiosApi.delete(`/query/history/${id}`);
  } catch (err) {
    const status = err.response?.status;
    const payload = err.response?.data;
    const msg =
      payload?.message ||
      payload?.error ||
      err.message ||
      (status ? `Request failed (${status})` : "Request failed");
    throw new Error(typeof msg === "string" ? msg : JSON.stringify(msg));
  }
}
