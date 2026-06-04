import { Link, useNavigate } from "react-router-dom";
import { useAuth } from "../context/AuthContext";

export function AppShell({ children, title }) {
  const { user, logout } = useAuth();
  const navigate = useNavigate();

  function handleLogout() {
    logout();
    navigate("/login");
  }

  return (
    <div className="min-h-screen bg-gray-100">
      <header className="bg-white border-b border-gray-200 shadow-sm">
        <div className="max-w-5xl mx-auto px-4 py-3 flex flex-wrap items-center justify-between gap-3">
          <div className="flex items-center gap-4">
            {title && (
              <h1 className="text-lg font-semibold text-gray-900">{title}</h1>
            )}
            <nav className="flex flex-wrap gap-3 text-sm">
              <Link
                to="/query"
                className="text-blue-600 hover:underline"
              >
                Query
              </Link>
              <Link
                to="/schema"
                className="text-blue-600 hover:underline"
              >
                Schema Explorer
              </Link>
              <Link
                to="/profile"
                className="text-blue-600 hover:underline"
              >
                Profile
              </Link>
              {user?.role === "admin" && (
                <Link
                  to="/admin"
                  className="text-blue-600 hover:underline"
                >
                  Admin
                </Link>
              )}
            </nav>
          </div>
          <div className="flex items-center gap-3 text-sm text-gray-600">
            {user && (
              <span className="truncate max-w-[200px]" title={user.email}>
                {user.name || user.email}
              </span>
            )}
            <button
              type="button"
              onClick={handleLogout}
              className="text-red-600 hover:underline"
            >
              Log out
            </button>
          </div>
        </div>
      </header>
      <main>{children}</main>
    </div>
  );
}
