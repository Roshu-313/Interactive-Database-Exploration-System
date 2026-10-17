import { useEffect, useState } from "react";
import { Link, useNavigate } from "react-router-dom";
import { AuthLayout, AuthLoadingScreen } from "../components/auth/AuthLayout";
import { forgotPasswordRequest } from "../api";
import { Alert } from "../components/ui/Card";
import { Button } from "../components/ui/Button";
import { FieldError, Input, Label } from "../components/ui/Input";
import { useAuth } from "../context/AuthContext";

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
    return <AuthLoadingScreen />;
  }

  return (
    <AuthLayout
      heading="Reset your password"
      subheading="Enter the email associated with your account. If it exists, we'll send recovery instructions."
      footer={
        <p className="text-center text-sm text-slate-600">
          Remember your password?{" "}
          <Link to="/login" className="font-medium text-indigo-600 hover:text-indigo-700">
            Back to sign in
          </Link>
        </p>
      }
    >
      {success ? (
        <div className="space-y-4">
          <Alert variant="success">
            If an account exists for that email, you will receive password reset instructions
            shortly.
          </Alert>
          {devResetUrl ? (
            <Alert variant="warning" title="Development reset link">
              <p className="break-all text-xs mt-1">{devResetUrl}</p>
              <Link
                to={new URL(devResetUrl).pathname}
                className="inline-block mt-2 text-sm font-medium text-indigo-700 hover:underline"
              >
                Open reset page
              </Link>
            </Alert>
          ) : null}
          <Link
            to="/login"
            className="flex h-11 w-full items-center justify-center rounded-lg border border-slate-200 bg-white text-sm font-medium text-slate-800 hover:bg-slate-50 transition-colors"
          >
            Back to sign in
          </Link>
        </div>
      ) : (
        <form onSubmit={handleSubmit} className="space-y-4">
          <div>
            <Label htmlFor="forgot-email">Email</Label>
            <Input
              id="forgot-email"
              type="email"
              autoComplete="email"
              required
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              className="mt-1.5"
              placeholder="you@company.com"
            />
          </div>

          <FieldError>{error}</FieldError>

          <Button type="submit" className="w-full" size="lg" loading={loading} disabled={loading}>
            Send reset link
          </Button>
        </form>
      )}
    </AuthLayout>
  );
}

export default ForgotPassword;
