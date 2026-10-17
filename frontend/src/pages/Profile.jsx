import { useEffect, useState } from "react";
import { AppShell } from "../components/AppShell";
import { Badge, Card, CardBody, PageHeader, Skeleton } from "../components/ui/Card";
import { useAuth } from "../context/AuthContext";

function Profile() {
  const { user, refreshUser } = useAuth();
  const [error, setError] = useState(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    let cancelled = false;
    (async () => {
      try {
        setError(null);
        setLoading(true);
        await refreshUser();
      } catch (e) {
        if (!cancelled) {
          setError(e instanceof Error ? e.message : "Could not refresh profile");
        }
      } finally {
        if (!cancelled) setLoading(false);
      }
    })();
    return () => {
      cancelled = true;
    };
  }, [refreshUser]);

  return (
    <AppShell>
      <div className="max-w-2xl mx-auto px-4 py-6 md:py-10 md:px-8">
        <PageHeader
          title="Account settings"
          description="View your IDES profile details. Contact an administrator to change roles or access."
        />

        <Card>
          <CardBody className="space-y-6">
            {error ? (
              <p className="text-sm text-red-600" role="alert">
                {error}
              </p>
            ) : null}

            {loading && !user ? (
              <div className="space-y-4">
                <Skeleton className="h-4 w-32" />
                <Skeleton className="h-6 w-full max-w-sm" />
                <Skeleton className="h-4 w-24 mt-6" />
                <Skeleton className="h-6 w-full max-w-md" />
              </div>
            ) : null}

            {user ? (
              <dl className="grid gap-5 text-sm">
                <div>
                  <dt className="text-xs font-medium uppercase tracking-wide text-slate-500">Name</dt>
                  <dd className="mt-1 text-base font-medium text-slate-900">{user.name}</dd>
                </div>
                <div>
                  <dt className="text-xs font-medium uppercase tracking-wide text-slate-500">Email</dt>
                  <dd className="mt-1 text-base text-slate-900">{user.email}</dd>
                </div>
                <div>
                  <dt className="text-xs font-medium uppercase tracking-wide text-slate-500">Role</dt>
                  <dd className="mt-1.5">
                    <Badge variant={user.role === "admin" ? "accent" : "default"} className="capitalize">
                      {user.role}
                    </Badge>
                  </dd>
                </div>
                <div>
                  <dt className="text-xs font-medium uppercase tracking-wide text-slate-500">User ID</dt>
                  <dd className="mt-1 font-mono text-slate-800 tabular-nums">{user.id}</dd>
                </div>
              </dl>
            ) : null}
          </CardBody>
        </Card>
      </div>
    </AppShell>
  );
}

export default Profile;
