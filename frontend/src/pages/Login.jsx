import { useEffect, useState } from "react";
import { Link, useLocation, useNavigate } from "react-router-dom";
import { AuthLayout, AuthLoadingScreen } from "../components/auth/AuthLayout";
import { PasswordField } from "../components/auth/PasswordField";
import { Alert } from "../components/ui/Card";
import { Button } from "../components/ui/Button";
import { FieldError, Input, Label } from "../components/ui/Input";
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
    return <AuthLoadingScreen />;
  }

  return (
    <AuthLayout
      heading="Welcome back"
      subheading="Sign in to explore your database with natural language queries and explainable SQL."
      footer={
        <p className="text-center text-sm text-slate-600">
          No account?{" "}
          <Link to="/signup" className="font-medium text-indigo-600 hover:text-indigo-700">
            Create one
          </Link>
        </p>
      }
    >
      {registered ? (
        <Alert variant="success" title="Account created">
          You can sign in with your new credentials.
        </Alert>
      ) : null}

      {passwordReset ? (
        <Alert variant="success" title="Password updated" className={registered ? "mt-3" : ""}>
          Sign in with your new password.
        </Alert>
      ) : null}

      <form onSubmit={handleSubmit} className="space-y-4 mt-6">
        <div>
          <Label htmlFor="login-email">Email</Label>
          <Input
            id="login-email"
            type="email"
            autoComplete="email"
            required
            value={email}
            onChange={(e) => setEmail(e.target.value)}
            className="mt-1.5"
            placeholder="you@company.com"
          />
        </div>

        <PasswordField
          id="login-password"
          label="Password"
          value={password}
          onChange={(e) => setPassword(e.target.value)}
          autoComplete="current-password"
          required
        />

        <p className="text-right text-sm">
          <Link to="/forgot-password" className="font-medium text-indigo-600 hover:text-indigo-700">
            Forgot password?
          </Link>
        </p>

        <FieldError>{error}</FieldError>

        <Button type="submit" className="w-full" size="lg" loading={loading} disabled={loading}>
          Sign in
        </Button>
      </form>
    </AuthLayout>
  );
}

export default Login;
