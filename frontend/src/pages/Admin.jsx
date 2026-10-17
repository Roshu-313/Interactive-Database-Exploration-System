import { useCallback, useEffect, useState } from "react";
import { AppShell } from "../components/AppShell";
import {
  adminDashboardRequest,
  adminFetchUsers,
  adminUpdateUserRole,
  adminFetchQueryHistory,
  adminFetchRatings,
  adminFetchRatingStats,
} from "../api";
import { Badge, Card, CardBody, CardHeader, PageHeader, Skeleton } from "../components/ui/Card";
import { Button } from "../components/ui/Button";
import { ConfirmDialog } from "../components/ui/ConfirmDialog";
import { SearchInput } from "../components/ui/Input";
import { Pagination } from "../components/ui/Pagination";

function formatTimestamp(iso) {
  if (!iso) return "";
  const d = new Date(iso);
  if (Number.isNaN(d.getTime())) return String(iso);
  return d.toLocaleString(undefined, { dateStyle: "medium", timeStyle: "short" });
}

function StatCard({ label, value, sub, icon }) {
  return (
    <Card>
      <CardBody className="flex gap-3 items-start">
        {icon ? (
          <div className="flex h-9 w-9 shrink-0 items-center justify-center rounded-lg bg-indigo-50 text-indigo-600">
            {icon}
          </div>
        ) : null}
        <div className="min-w-0">
          <p className="text-xs font-medium uppercase tracking-wide text-slate-500">{label}</p>
          <p className="text-2xl font-semibold text-slate-900 mt-0.5 tabular-nums">{value}</p>
          {sub ? <p className="text-xs text-slate-500 mt-0.5">{sub}</p> : null}
        </div>
      </CardBody>
    </Card>
  );
}

function Admin() {
  const [stats, setStats] = useState(null);
  const [recentQueries, setRecentQueries] = useState([]);
  const [dashboardError, setDashboardError] = useState(null);
  const [dashboardLoading, setDashboardLoading] = useState(true);

  const [users, setUsers] = useState([]);
  const [userSearch, setUserSearch] = useState("");
  const [userPagination, setUserPagination] = useState(null);
  const [usersLoading, setUsersLoading] = useState(true);
  const [usersError, setUsersError] = useState(null);
  const [roleBusyId, setRoleBusyId] = useState(null);
  const [roleMessage, setRoleMessage] = useState(null);
  const [roleConfirm, setRoleConfirm] = useState(null);

  const [queries, setQueries] = useState([]);
  const [querySearch, setQuerySearch] = useState("");
  const [queryPagination, setQueryPagination] = useState(null);
  const [queriesLoading, setQueriesLoading] = useState(true);
  const [queriesError, setQueriesError] = useState(null);

  const [ratings, setRatings] = useState([]);
  const [ratingStats, setRatingStats] = useState(null);
  const [ratingPagination, setRatingPagination] = useState(null);
  const [ratingsLoading, setRatingsLoading] = useState(true);
  const [ratingsError, setRatingsError] = useState(null);

  const loadDashboard = useCallback(async () => {
    setDashboardLoading(true);
    setDashboardError(null);
    try {
      const data = await adminDashboardRequest();
      setStats(data.stats);
      setRecentQueries(data.recentQueries || []);
    } catch (e) {
      setDashboardError(e instanceof Error ? e.message : "Failed to load dashboard");
    } finally {
      setDashboardLoading(false);
    }
  }, []);

  const loadUsers = useCallback(async (offset = 0) => {
    setUsersLoading(true);
    setUsersError(null);
    try {
      const data = await adminFetchUsers({ search: userSearch, limit: 15, offset });
      setUsers(data.users || []);
      setUserPagination(data.pagination);
    } catch (e) {
      setUsersError(e instanceof Error ? e.message : "Failed to load users");
    } finally {
      setUsersLoading(false);
    }
  }, [userSearch]);

  const loadQueries = useCallback(async (offset = 0) => {
    setQueriesLoading(true);
    setQueriesError(null);
    try {
      const data = await adminFetchQueryHistory({
        search: querySearch,
        limit: 20,
        offset,
      });
      setQueries(data.history || []);
      setQueryPagination(data.pagination);
    } catch (e) {
      setQueriesError(e instanceof Error ? e.message : "Failed to load queries");
    } finally {
      setQueriesLoading(false);
    }
  }, [querySearch]);

  const loadRatings = useCallback(async (offset = 0) => {
    setRatingsLoading(true);
    setRatingsError(null);
    try {
      const [list, statsData] = await Promise.all([
        adminFetchRatings({ limit: 15, offset }),
        adminFetchRatingStats(),
      ]);
      setRatings(list.ratings || []);
      setRatingPagination(list.pagination);
      setRatingStats(statsData);
    } catch (e) {
      setRatingsError(e instanceof Error ? e.message : "Failed to load feedback");
    } finally {
      setRatingsLoading(false);
    }
  }, []);

  useEffect(() => {
    loadDashboard();
  }, [loadDashboard]);

  useEffect(() => {
    loadUsers(0);
  }, [loadUsers]);

  useEffect(() => {
    loadQueries(0);
  }, [loadQueries]);

  useEffect(() => {
    loadRatings(0);
  }, [loadRatings]);

  async function confirmRoleChange() {
    if (!roleConfirm) return;
    const { userId, nextRole } = roleConfirm;
    setRoleBusyId(userId);
    setRoleMessage(null);
    try {
      await adminUpdateUserRole(userId, nextRole);
      setRoleMessage("Role updated.");
      await loadUsers(userPagination?.offset ?? 0);
      setRoleConfirm(null);
    } catch (e) {
      setRoleMessage(e instanceof Error ? e.message : "Role update failed");
    } finally {
      setRoleBusyId(null);
    }
  }

  return (
    <AppShell>
      <ConfirmDialog
        open={Boolean(roleConfirm)}
        title="Change user role?"
        description={
          roleConfirm
            ? `This will set the user's role to "${roleConfirm.nextRole}". This is a privileged action.`
            : ""
        }
        confirmLabel="Change role"
        loading={roleBusyId != null}
        onConfirm={confirmRoleChange}
        onCancel={() => setRoleConfirm(null)}
      />

      <div className="max-w-7xl mx-auto px-4 py-6 md:py-10 md:px-8 space-y-10">
        <PageHeader
          title="Admin monitor"
          description="System statistics, users, query activity, and feedback."
        />

        {dashboardLoading ? (
          <div className="grid grid-cols-2 lg:grid-cols-3 xl:grid-cols-6 gap-4">
            {[1, 2, 3, 4, 5, 6].map((k) => (
              <Skeleton key={k} className="h-24" />
            ))}
          </div>
        ) : null}
        {dashboardError ? (
          <p className="text-sm text-red-600" role="alert">
            {dashboardError}
          </p>
        ) : null}

        {stats ? (
          <section className="grid grid-cols-2 lg:grid-cols-3 xl:grid-cols-6 gap-4">
            <StatCard
              label="Users"
              value={stats.totalUsers}
              icon={
                <svg viewBox="0 0 24 24" fill="none" className="h-5 w-5" stroke="currentColor" strokeWidth="1.75" aria-hidden>
                  <path strokeLinecap="round" d="M16 7a4 4 0 11-8 0 4 4 0 018 0zM6 21v-2a4 4 0 014-4h4a4 4 0 014 4v2" />
                </svg>
              }
            />
            <StatCard
              label="Queries"
              value={stats.totalQueries}
              icon={
                <svg viewBox="0 0 24 24" fill="none" className="h-5 w-5" stroke="currentColor" strokeWidth="1.75" aria-hidden>
                  <path strokeLinecap="round" d="M8 9h8M8 13h5M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
                </svg>
              }
            />
            <StatCard label="Today" value={stats.queriesToday} sub="queries" />
            <StatCard label="Last 7 days" value={stats.queriesLast7Days} sub="queries" />
            <StatCard label="Ratings" value={stats.totalRatings} />
            <StatCard
              label="Avg rating"
              value={stats.avgRating != null ? stats.avgRating : "—"}
            />
          </section>
        ) : null}

        {recentQueries.length > 0 ? (
          <Card>
            <CardHeader>
              <h3 className="text-sm font-semibold text-slate-900">Recent query activity</h3>
            </CardHeader>
            <CardBody className="pt-0 space-y-3">
            <ul className="divide-y divide-slate-100 text-sm">
              {recentQueries.map((q) => (
                <li key={q.id} className="py-3 flex flex-col sm:flex-row sm:justify-between gap-1">
                  <span className="text-slate-800 line-clamp-2">{q.naturalLanguageQuery}</span>
                  <span className="text-xs text-slate-500 shrink-0">
                    {q.user?.name || q.user?.email} · {formatTimestamp(q.createdAt)}
                  </span>
                </li>
              ))}
            </ul>
            </CardBody>
          </Card>
        ) : null}

        {/* Users */}
        <Card>
          <CardBody className="space-y-4">
          <div className="flex flex-col sm:flex-row sm:items-end gap-3 justify-between">
            <div>
              <h3 className="text-sm font-semibold text-slate-900">User management</h3>
              <p className="text-xs text-slate-500 mt-0.5">Search by name or email</p>
            </div>
            <form
              className="flex gap-2"
              onSubmit={(e) => {
                e.preventDefault();
                loadUsers(0);
              }}
            >
              <SearchInput
                value={userSearch}
                onChange={(e) => setUserSearch(e.target.value)}
                placeholder="Search users…"
                className="min-w-[200px]"
              />
              <Button type="submit" size="sm">
                Search
              </Button>
            </form>
          </div>

          {roleMessage ? (
            <p className="text-sm text-slate-700" role="status">
              {roleMessage}
            </p>
          ) : null}
          {usersError ? (
            <p className="text-sm text-red-600">{usersError}</p>
          ) : null}

          {usersLoading ? (
            <p className="text-sm text-slate-500">Loading users…</p>
          ) : users.length === 0 ? (
            <p className="text-sm text-slate-500">No users found.</p>
          ) : (
            <div className="overflow-x-auto rounded-lg border border-slate-200">
              <table className="min-w-full text-sm">
                <thead>
                  <tr className="text-left text-xs uppercase tracking-wide text-slate-500 bg-slate-50 border-b border-slate-200">
                    <th className="py-3 px-4 font-semibold">ID</th>
                    <th className="py-3 px-4 font-semibold">Name</th>
                    <th className="py-3 px-4 font-semibold">Email</th>
                    <th className="py-3 px-4 font-semibold">Role</th>
                    <th className="py-3 px-4 font-semibold">Joined</th>
                    <th className="py-3 px-4 font-semibold">Actions</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-100">
                  {users.map((u) => (
                    <tr key={u.id} className="hover:bg-slate-50/80 transition-colors">
                      <td className="py-3 px-4 tabular-nums text-slate-600">{u.id}</td>
                      <td className="py-3 px-4 font-medium text-slate-900">{u.name}</td>
                      <td className="py-3 px-4 text-slate-700">{u.email}</td>
                      <td className="py-3 px-4">
                        <Badge variant={u.role === "admin" ? "accent" : "default"} className="capitalize">
                          {u.role}
                        </Badge>
                      </td>
                      <td className="py-3 px-4 text-slate-500">{formatTimestamp(u.createdAt)}</td>
                      <td className="py-3 px-4">
                        {u.role === "admin" ? (
                          <Button
                            variant="secondary"
                            size="sm"
                            disabled={roleBusyId === u.id}
                            onClick={() => setRoleConfirm({ userId: u.id, nextRole: "user" })}
                          >
                            Make user
                          </Button>
                        ) : (
                          <Button
                            variant="secondary"
                            size="sm"
                            disabled={roleBusyId === u.id}
                            onClick={() => setRoleConfirm({ userId: u.id, nextRole: "admin" })}
                          >
                            Make admin
                          </Button>
                        )}
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          )}
          <Pagination
            pagination={userPagination}
            onPageChange={(offset) => loadUsers(offset)}
          />
          </CardBody>
        </Card>

        {/* Query activity */}
        <Card>
          <CardBody className="space-y-4">
          <div className="flex flex-col sm:flex-row sm:items-end gap-3 justify-between">
            <h3 className="text-sm font-semibold text-slate-900">Query activity</h3>
            <form
              className="flex gap-2"
              onSubmit={(e) => {
                e.preventDefault();
                loadQueries(0);
              }}
            >
              <SearchInput
                value={querySearch}
                onChange={(e) => setQuerySearch(e.target.value)}
                placeholder="Search NL or SQL…"
                className="min-w-[200px]"
              />
              <Button type="submit" size="sm">
                Search
              </Button>
            </form>
          </div>
          {queriesError ? <p className="text-sm text-red-600">{queriesError}</p> : null}
          {queriesLoading ? (
            <p className="text-sm text-slate-500">Loading queries…</p>
          ) : queries.length === 0 ? (
            <p className="text-sm text-slate-500">No queries recorded yet.</p>
          ) : (
            <ul className="space-y-4">
              {queries.map((q) => (
                <li
                  key={q.id}
                  className="rounded-xl border border-slate-100 p-4 bg-slate-50/50 space-y-2"
                >
                  <p className="text-sm font-medium text-slate-900">{q.naturalLanguageQuery}</p>
                  <pre className="text-xs font-mono bg-slate-900 text-slate-100 p-2 rounded-lg overflow-x-auto">
                    {q.generatedSql}
                  </pre>
                  {q.explanation ? (
                    <p className="text-xs text-slate-600 line-clamp-3">{q.explanation}</p>
                  ) : null}
                  <p className="text-xs text-slate-500">
                    {q.user?.name || q.user?.email} · {formatTimestamp(q.createdAt)}
                  </p>
                </li>
              ))}
            </ul>
          )}
          <Pagination
            pagination={queryPagination}
            onPageChange={(offset) => loadQueries(offset)}
          />
          </CardBody>
        </Card>

        {/* Feedback */}
        <Card>
          <CardBody className="space-y-4">
          <h3 className="text-sm font-semibold text-slate-900">Feedback monitoring</h3>
          {ratingsError ? <p className="text-sm text-red-600">{ratingsError}</p> : null}
          {ratingStats ? (
            <div className="grid grid-cols-2 sm:grid-cols-4 gap-3 text-sm">
              <div className="rounded-xl bg-slate-50 p-3">
                <p className="text-xs text-slate-500">Total</p>
                <p className="font-semibold">{ratingStats.totalRatings}</p>
              </div>
              <div className="rounded-xl bg-slate-50 p-3">
                <p className="text-xs text-slate-500">Average</p>
                <p className="font-semibold">
                  {ratingStats.avgRating != null ? ratingStats.avgRating : "—"}
                </p>
              </div>
              {[1, 2, 3, 4, 5].map((star) => (
                <div key={star} className="rounded-xl bg-slate-50 p-3">
                  <p className="text-xs text-slate-500">{star}★</p>
                  <p className="font-semibold">{ratingStats.distribution?.[star] ?? 0}</p>
                </div>
              ))}
            </div>
          ) : null}
          {ratingsLoading ? (
            <p className="text-sm text-slate-500">Loading feedback…</p>
          ) : ratings.length === 0 ? (
            <p className="text-sm text-slate-500">No ratings submitted yet.</p>
          ) : (
            <ul className="space-y-3">
              {ratings.map((r) => (
                <li key={r.id} className="border border-slate-100 rounded-xl p-4 text-sm">
                  <div className="flex flex-wrap justify-between gap-2">
                    <span className="font-medium text-amber-600">{r.rating} / 5</span>
                    <span className="text-xs text-slate-500">
                      {r.user?.name || r.user?.email} · {formatTimestamp(r.createdAt)}
                    </span>
                  </div>
                  {r.feedback ? (
                    <p className="text-slate-700 mt-2">{r.feedback}</p>
                  ) : (
                    <p className="text-slate-400 mt-2 italic">No written feedback</p>
                  )}
                  {r.queryHistory ? (
                    <p className="text-xs text-slate-500 mt-2 line-clamp-2">
                      Query: {r.queryHistory.naturalLanguageQuery}
                    </p>
                  ) : null}
                </li>
              ))}
            </ul>
          )}
          <Pagination
            pagination={ratingPagination}
            onPageChange={(offset) => loadRatings(offset)}
          />
          </CardBody>
        </Card>
      </div>
    </AppShell>
  );
}

export default Admin;
