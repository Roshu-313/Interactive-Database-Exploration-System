import { useEffect, useState } from "react";
import { AppShell } from "../components/AppShell";
import { useAuth } from "../context/AuthContext";

function Profile() {
  const { user, refreshUser } = useAuth();
  const [error, setError] = useState(null);

  useEffect(() => {
    let cancelled = false;
    (async () => {
      try {
        setError(null);
        await refreshUser();
      } catch (e) {
        if (!cancelled) {
          setError(e instanceof Error ? e.message : "Could not refresh profile");
        }
      }
    })();
    return () => {
      cancelled = true;
    };
  }, [refreshUser]);

  return (
    <AppShell title="Profile">
      <div className="max-w-2xl mx-auto p-6 md:p-10">
        <div className="bg-white rounded-2xl shadow-md p-6 space-y-4">
          <h2 className="text-xl font-semibold text-gray-900">Your account</h2>

          {error && (
            <p className="text-red-600 text-sm" role="alert">
              {error}
            </p>
          )}

          {user && (
            <dl className="grid gap-3 text-sm">
              <div>
                <dt className="text-gray-500">Name</dt>
                <dd className="font-medium text-gray-900">{user.name}</dd>
              </div>
              <div>
                <dt className="text-gray-500">Email</dt>
                <dd className="font-medium text-gray-900">{user.email}</dd>
              </div>
              <div>
                <dt className="text-gray-500">Role</dt>
                <dd className="font-medium text-gray-900 capitalize">
                  {user.role}
                </dd>
              </div>
              <div>
                <dt className="text-gray-500">User ID</dt>
                <dd className="font-mono text-gray-800">{user.id}</dd>
              </div>
            </dl>
          )}
        </div>
      </div>
    </AppShell>
  );
}

export default Profile;
