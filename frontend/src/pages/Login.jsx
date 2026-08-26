import { useState } from "react";
import { Navigate, useLocation, useNavigate } from "react-router-dom";
import { useAuth } from "../context/AuthContext";
import { extractErrorMessage } from "../api/client";
import Icon from "../components/Icon";
import logo from "../assets/logo.png";

const PORTALS = {
  support: {
    label: "Support",
    icon: "support_agent",
    heading: "Support Sign In",
    subtitle: "Sign in to manage your tickets",
    mismatch: "This account isn't a support account. Switch to the Admin tab.",
  },
  admin: {
    label: "Admin",
    icon: "shield_person",
    heading: "Admin Sign In",
    subtitle: "Sign in to the admin console",
    mismatch: "This account isn't an admin account. Switch to the Support tab.",
  },
};

export default function Login() {
  const { login, logout, isAuthenticated, user } = useAuth();
  const navigate = useNavigate();
  const location = useLocation();

  const [portal, setPortal] = useState("support");
  const [username, setUsername] = useState("");
  const [password, setPassword] = useState("");
  const [error, setError] = useState("");
  const [submitting, setSubmitting] = useState(false);

  if (isAuthenticated) {
    const fallback = user?.role === "admin" ? "/admin" : "/tickets";
    return <Navigate to={location.state?.from?.pathname ?? fallback} replace />;
  }

  const active = PORTALS[portal];

  function switchPortal(next) {
    setPortal(next);
    setError("");
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
      if (loggedInUser.role !== portal) {
        logout();
        setError(active.mismatch);
        return;
      }
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
          </div>

          <div className="flex bg-surface-container p-1 rounded-lg">
            {Object.entries(PORTALS).map(([key, portalInfo]) => (
              <button
                key={key}
                type="button"
                onClick={() => switchPortal(key)}
                className={`flex-1 flex items-center justify-center gap-2 py-2 rounded-md text-sm font-medium transition-all ${
                  portal === key
                    ? "bg-surface-container-lowest card-shadow text-primary"
                    : "text-on-surface-variant hover:text-on-surface"
                }`}
              >
                <Icon name={portalInfo.icon} size="18px" />
                {portalInfo.label}
              </button>
            ))}
          </div>

          <div className="text-center">
            <h1 className="text-2xl font-semibold text-on-surface">{active.heading}</h1>
            <p className="text-sm text-on-surface-variant mt-1">{active.subtitle}</p>
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
              {submitting ? "Signing in…" : `Sign in to ${active.label}`}
            </button>
          </form>
        </div>
      </main>
    </div>
  );
}
