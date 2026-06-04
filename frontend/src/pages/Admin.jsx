import { useEffect, useState } from "react";
import { AppShell } from "../components/AppShell";
import { adminDashboardRequest } from "../api";

function Admin() {
  const [data, setData] = useState(null);
  const [error, setError] = useState(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    let cancelled = false;
    (async () => {
      try {
        setError(null);
        const res = await adminDashboardRequest();
        if (!cancelled) setData(res);
      } catch (e) {
        if (!cancelled) {
          setError(e instanceof Error ? e.message : "Failed to load admin data");
        }
      } finally {
        if (!cancelled) setLoading(false);
      }
    })();
    return () => {
      cancelled = true;
    };
  }, []);

  return (
    <AppShell title="Admin">
      <div className="max-w-2xl mx-auto p-6 md:p-10">
        <div className="bg-white rounded-2xl shadow-md p-6 space-y-4">
          <h2 className="text-xl font-semibold text-gray-900">
            Admin dashboard
          </h2>

          {loading && <p className="text-gray-600 text-sm">Loading…</p>}

          {error && (
            <p className="text-red-600 text-sm" role="alert">
              {error}
            </p>
          )}

          {data && (
            <div className="text-sm space-y-2">
              <p className="text-gray-700">{data.message}</p>
              <pre className="bg-gray-50 p-4 rounded-lg overflow-x-auto text-xs">
                {JSON.stringify(data.user, null, 2)}
              </pre>
            </div>
          )}
        </div>
      </div>
    </AppShell>
  );
}

export default Admin;
