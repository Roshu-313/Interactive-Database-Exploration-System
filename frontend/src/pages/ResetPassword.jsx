import { useEffect, useState } from "react";
import { Link, useNavigate, useParams } from "react-router-dom";
import { useAuth } from "../context/AuthContext";
import { resetPasswordRequest } from "../api";

function ResetPassword() {
  const navigate = useNavigate();
  const { token } = useParams();
  const { user, loading: authLoading } = useAuth();
  const [password, setPassword] = useState("");
  const [confirm, setConfirm] = useState("");
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState(null);
  const [success, setSuccess] = useState(false);

  useEffect(() => {
    if (!authLoading && user) {
      navigate("/query", { replace: true });
    }
  }, [user, authLoading, navigate]);

  useEffect(() => {
    if (!token) {
      setError("Invalid reset link. Please request a new password reset.");
    }
  }, [token]);

  async function handleSubmit(e) {
    e.preventDefault();
    setError(null);

    if (!token) {
      setError("Invalid reset link. Please request a new password reset.");
      return;
    }
    if (password !== confirm) {
      setError("Passwords do not match.");
      return;
    }
    if (password.length < 6) {
      setError("Password must be at least 6 characters.");
      return;
    }

    setLoading(true);
    try {
      await resetPasswordRequest(token, password);
      setSuccess(true);
      setTimeout(() => {
        navigate("/login", {
          replace: true,
          state: { passwordReset: true },
        });
      }, 2500);
    } catch (err) {
      setError(err instanceof Error ? err.message : "Password reset failed");
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
        <h2 className="text-2xl font-bold mb-2 text-center">Reset password</h2>
        <p className="text-sm text-gray-600 text-center mb-6">
          Choose a new password for your account.
        </p>

        {success ? (
          <div className="space-y-4 text-center">
            <p className="text-green-700 text-sm" role="status">
              Password reset successful. Redirecting to login…
            </p>
            <Link to="/login" className="text-blue-600 hover:underline text-sm">
              Go to login now
            </Link>
          </div>
        ) : (
          <>
            <input
              type="password"
              placeholder="New password (min 6 characters)"
              required
              minLength={6}
              className="w-full p-2 mb-4 border rounded"
              value={password}
              onChange={(e) => setPassword(e.target.value)}
            />

            <input
              type="password"
              placeholder="Confirm new password"
              required
              minLength={6}
              className="w-full p-2 mb-4 border rounded"
              value={confirm}
              onChange={(e) => setConfirm(e.target.value)}
            />

            {error && (
              <p className="text-red-600 text-sm mb-3" role="alert">
                {error}
              </p>
            )}

            <button
              type="submit"
              disabled={loading || !token}
              className="w-full bg-blue-500 text-white py-2 rounded hover:bg-blue-600 disabled:opacity-60"
            >
              {loading ? "Updating…" : "Reset password"}
            </button>

            <p className="mt-4 text-center text-sm text-gray-600">
              <Link to="/forgot-password" className="text-blue-600 hover:underline">
                Request a new reset link
              </Link>
              {" · "}
              <Link to="/login" className="text-blue-600 hover:underline">
                Back to login
              </Link>
            </p>
          </>
        )}
      </form>
    </div>
  );
}

export default ResetPassword;
