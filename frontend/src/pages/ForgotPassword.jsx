import { useEffect, useState } from "react";
import { Link, useNavigate } from "react-router-dom";
import { useAuth } from "../context/AuthContext";
import { forgotPasswordRequest } from "../api";

function ForgotPassword() {
  const navigate = useNavigate();
  const { user, loading: authLoading } = useAuth();
  const [email, setEmail] = useState("");
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState(null);
  const [success, setSuccess] = useState(false);
  const [devResetUrl, setDevResetUrl] = useState(null);

  useEffect(() => {
    if (!authLoading && user) {
      navigate("/query", { replace: true });
    }
  }, [user, authLoading, navigate]);

  async function handleSubmit(e) {
    e.preventDefault();
    setError(null);
    setDevResetUrl(null);
    setLoading(true);
    try {
      const data = await forgotPasswordRequest(email);
      setSuccess(true);
      if (data.resetUrl) {
        setDevResetUrl(data.resetUrl);
      }
    } catch (err) {
      setError(err instanceof Error ? err.message : "Request failed");
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
      <div className="bg-white p-8 rounded-2xl shadow-md w-full max-w-md">
        <h2 className="text-2xl font-bold mb-2 text-center">Forgot password</h2>
        <p className="text-sm text-gray-600 text-center mb-6">
          Enter your email and we&apos;ll send you a link to reset your password.
        </p>

        {success ? (
          <div className="space-y-4">
            <p className="text-green-700 text-sm text-center" role="status">
              If an account exists for that email, you will receive password reset
              instructions shortly.
            </p>
            {devResetUrl && (
              <div className="rounded-lg border border-amber-200 bg-amber-50 p-3 text-sm">
                <p className="font-medium text-amber-900 mb-1">Development reset link</p>
                <p className="text-amber-800 break-all mb-2">{devResetUrl}</p>
                <Link
                  to={new URL(devResetUrl).pathname}
                  className="text-blue-600 hover:underline"
                >
                  Open reset page
                </Link>
              </div>
            )}
            <Link
              to="/login"
              className="block w-full text-center bg-blue-500 text-white py-2 rounded hover:bg-blue-600"
            >
              Back to login
            </Link>
          </div>
        ) : (
          <form onSubmit={handleSubmit}>
            <input
              type="email"
              placeholder="Email"
              required
              className="w-full p-2 mb-4 border rounded"
              value={email}
              onChange={(e) => setEmail(e.target.value)}
            />

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
              {loading ? "Sending…" : "Send reset link"}
            </button>

            <p className="mt-4 text-center text-sm text-gray-600">
              Remember your password?{" "}
              <Link to="/login" className="text-blue-600 hover:underline">
                Log in
              </Link>
            </p>
          </form>
        )}
      </div>
    </div>
  );
}

export default ForgotPassword;
