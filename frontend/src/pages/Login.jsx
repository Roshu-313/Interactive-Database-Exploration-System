import { useEffect, useState } from "react";
import { Link, useLocation, useNavigate } from "react-router-dom";
import { useAuth } from "../context/AuthContext";

function Login() {
  const navigate = useNavigate();
  const location = useLocation();
  const { login, user, loading: authLoading } = useAuth();
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState(null);

  const from = location.state?.from?.pathname || "/query";
  const registered = location.state?.registered;
  const passwordReset = location.state?.passwordReset;

  useEffect(() => {
    if (!authLoading && user) {
      navigate(from, { replace: true });
    }
  }, [user, authLoading, navigate, from]);

  async function handleSubmit(e) {
    e.preventDefault();
    setError(null);
    setLoading(true);
    try {
      await login(email, password);
      navigate(from, { replace: true });
    } catch (err) {
      setError(err instanceof Error ? err.message : "Login failed");
    } finally {
      setLoading(false);
    }
  }

  if (authLoading) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-gray-100">
        Loading…
      </div>
    );
  }

  return (
    <div className="flex items-center justify-center min-h-screen bg-gray-100 p-4">
      <form
        onSubmit={handleSubmit}
        className="bg-white p-8 rounded-2xl shadow-md w-full max-w-md"
      >
        <h2 className="text-2xl font-bold mb-6 text-center">Login</h2>

        {registered && (
          <p className="text-green-700 text-sm mb-4 text-center">
            Account created. You can log in now.
          </p>
        )}

        {passwordReset && (
          <p className="text-green-700 text-sm mb-4 text-center">
            Password updated. You can log in with your new password.
          </p>
        )}

        <input
          type="email"
          placeholder="Email"
          required
          className="w-full p-2 mb-4 border rounded"
          value={email}
          onChange={(e) => setEmail(e.target.value)}
        />

        <input
          type="password"
          placeholder="Password"
          required
          className="w-full p-2 mb-2 border rounded"
          value={password}
          onChange={(e) => setPassword(e.target.value)}
        />

        <p className="text-right text-sm mb-4">
          <Link to="/forgot-password" className="text-blue-600 hover:underline">
            Forgot password?
          </Link>
        </p>

        {error && (
          <p className="text-red-600 text-sm mb-3" role="alert">
            {error}
          </p>
        )}

        <button
          type="submit"
          disabled={loading}
          className="w-full bg-blue-500 text-white py-2 rounded hover:bg-blue-600 disabled:opacity-60"
        >
          {loading ? "Signing in…" : "Login"}
        </button>

        <p className="mt-4 text-center text-sm text-gray-600">
          No account?{" "}
          <Link to="/signup" className="text-blue-600 hover:underline">
            Sign up
          </Link>
        </p>
      </form>
    </div>
  );
}

export default Login;
