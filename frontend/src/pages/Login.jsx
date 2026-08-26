import { useState } from "react";
import { Navigate, useLocation, useNavigate } from "react-router-dom";
import { useAuth } from "../context/AuthContext";
import { extractErrorMessage } from "../api/client";
import logo from "../assets/logo.png";

export default function Login() {
  const { login, isAuthenticated, user } = useAuth();
  const navigate = useNavigate();
  const location = useLocation();

  const [username, setUsername] = useState("");
  const [password, setPassword] = useState("");
  const [error, setError] = useState("");
  const [submitting, setSubmitting] = useState(false);

  if (isAuthenticated) {
    const fallback = user?.role === "admin" ? "/admin" : "/tickets";
    return <Navigate to={location.state?.from?.pathname ?? fallback} replace />;
  }

  async function handleSubmit(e) {
    e.preventDefault();
    setError("");
    if (!username.trim() || !password) {
      setError("Please enter both username and password.");
      return;
    }
    setSubmitting(true);
    try {
      const loggedInUser = await login(username.trim(), password);
      navigate(loggedInUser.role === "admin" ? "/admin" : "/tickets", { replace: true });
    } catch (err) {
      setError(extractErrorMessage(err, "Incorrect username or password."));
    } finally {
      setSubmitting(false);
    }
  }

  return (
    <div className="min-h-screen flex flex-col bg-surface-container">
      <header className="w-full bg-surface-container-lowest border-b border-outline-variant">
        <div className="flex items-center gap-3 px-6 py-4 max-w-[1440px] mx-auto">
          <img src={logo} alt="HelpDeskPro" className="h-8 w-8 object-contain" />
          <span className="text-xl font-bold text-primary">HelpDeskPro</span>
        </div>
      </header>

      <main className="flex-1 flex items-center justify-center p-4">
        <div className="w-full max-w-md bg-surface-container-lowest rounded-xl border border-outline-variant card-shadow p-8 flex flex-col gap-6">
          <div className="text-center flex flex-col items-center gap-3">
            <img src={logo} alt="HelpDeskPro" className="h-14 w-14 object-contain" />
            <div>
              <h1 className="text-2xl font-semibold text-on-surface">Welcome back</h1>
              <p className="text-sm text-on-surface-variant mt-1">
                Sign in to your HelpDeskPro workspace
              </p>
            </div>
          </div>

          <form className="flex flex-col gap-4" onSubmit={handleSubmit} noValidate>
            <div className="flex flex-col gap-2">
              <label className="text-xs font-medium text-on-surface" htmlFor="username">
                Username
              </label>
              <input
                id="username"
                name="username"
                type="text"
                autoComplete="username"
                value={username}
                onChange={(e) => setUsername(e.target.value)}
                placeholder="Enter your username"
                className="w-full h-10 px-3 rounded-lg border border-outline-variant focus:border-primary focus:ring-2 focus:ring-primary/10 outline-none transition-colors text-sm text-on-surface bg-surface-container-lowest"
              />
            </div>
            <div className="flex flex-col gap-2">
              <label className="text-xs font-medium text-on-surface" htmlFor="password">
                Password
              </label>
              <input
                id="password"
                name="password"
                type="password"
                autoComplete="current-password"
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                placeholder="Enter your password"
                className="w-full h-10 px-3 rounded-lg border border-outline-variant focus:border-primary focus:ring-2 focus:ring-primary/10 outline-none transition-colors text-sm text-on-surface bg-surface-container-lowest"
              />
            </div>

            {error && (
              <p className="text-sm text-error bg-error-container/50 rounded-lg px-3 py-2" role="alert">
                {error}
              </p>
            )}

            <button
              type="submit"
              disabled={submitting}
              className="w-full h-11 bg-primary text-on-primary rounded-lg text-sm font-medium hover:bg-primary/90 transition-colors mt-1 disabled:opacity-60"
            >
              {submitting ? "Signing in…" : "Sign in"}
            </button>
          </form>

          <div className="text-center border-t border-outline-variant pt-4">
            <p className="text-xs text-on-surface-variant">
              Demo credentials — admin: <span className="font-mono">admin / admin123</span>
              <br />
              support: <span className="font-mono">alice / alice123</span>
            </p>
          </div>
        </div>
      </main>
    </div>
  );
}
