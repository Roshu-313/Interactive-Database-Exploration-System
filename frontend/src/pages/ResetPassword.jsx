import { useEffect, useState } from "react";
import { Link, useNavigate, useParams } from "react-router-dom";
import { AuthLayout, AuthLoadingScreen } from "../components/auth/AuthLayout";
import { PasswordField } from "../components/auth/PasswordField";
import { resetPasswordRequest } from "../api";
import { Alert } from "../components/ui/Card";
import { Button } from "../components/ui/Button";
import { FieldError, FieldHint } from "../components/ui/Input";
import { useAuth } from "../context/AuthContext";

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
    return <AuthLoadingScreen />;
  }

  return (
    <AuthLayout
      heading="Choose a new password"
      subheading="Enter a strong password for your IDES account."
      footer={
        <p className="text-center text-sm text-slate-600">
          <Link to="/forgot-password" className="font-medium text-indigo-600 hover:text-indigo-700">
            Request a new reset link
          </Link>
          {" · "}
          <Link to="/login" className="font-medium text-indigo-600 hover:text-indigo-700">
            Sign in
          </Link>
        </p>
      }
    >
      {success ? (
        <Alert variant="success" title="Password reset successful">
          Redirecting to sign in…{" "}
          <Link to="/login" className="font-medium underline">
            Continue now
          </Link>
        </Alert>
      ) : (
        <form onSubmit={handleSubmit} className="space-y-4">
          {!token ? (
            <Alert variant="error" title="Invalid link">
              This reset link is missing or expired. Request a new one from the forgot password page.
            </Alert>
          ) : null}

          <PasswordField
            id="reset-password"
            label="New password"
            value={password}
            onChange={(e) => setPassword(e.target.value)}
            autoComplete="new-password"
            required
            minLength={6}
            placeholder="At least 6 characters"
          />
          <FieldHint>Minimum 6 characters.</FieldHint>

          <PasswordField
            id="reset-confirm"
            label="Confirm new password"
            value={confirm}
            onChange={(e) => setConfirm(e.target.value)}
            autoComplete="new-password"
            required
            minLength={6}
          />

          <FieldError>{error}</FieldError>

          <Button
            type="submit"
            className="w-full"
            size="lg"
            loading={loading}
            disabled={loading || !token}
          >
            Update password
          </Button>
        </form>
      )}
    </AuthLayout>
  );
}

export default ResetPassword;
