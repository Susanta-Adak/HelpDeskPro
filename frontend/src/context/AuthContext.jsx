import { createContext, useContext, useEffect, useMemo, useState } from "react";
import { Navigate, useLocation } from "react-router-dom";
import { login as loginRequest } from "../api/authApi";
import { getStoredAuth, registerUnauthorizedHandler, setStoredAuth } from "../api/client";

const AuthContext = createContext(null);

export function AuthProvider({ children }) {
  const [auth, setAuth] = useState(() => getStoredAuth());

  useEffect(() => {
    registerUnauthorizedHandler(() => setAuth(null));
  }, []);

  const value = useMemo(
    () => ({
      user: auth?.user ?? null,
      token: auth?.access_token ?? null,
      isAuthenticated: Boolean(auth?.access_token),
      async login(username, password) {
        const data = await loginRequest(username, password);
        setStoredAuth(data);
        setAuth(data);
        return data.user;
      },
      logout() {
        setStoredAuth(null);
        setAuth(null);
      },
    }),
    [auth],
  );

  return <AuthContext.Provider value={value}>{children}</AuthContext.Provider>;
}

export function useAuth() {
  const ctx = useContext(AuthContext);
  if (!ctx) throw new Error("useAuth must be used within an AuthProvider");
  return ctx;
}

export function RequireAuth({ children }) {
  const { isAuthenticated } = useAuth();
  const location = useLocation();
  if (!isAuthenticated) {
    return <Navigate to="/login" replace state={{ from: location }} />;
  }
  return children;
}

export function RequireAdmin({ children }) {
  const { isAuthenticated, user } = useAuth();
  const location = useLocation();
  if (!isAuthenticated) {
    return <Navigate to="/login" replace state={{ from: location }} />;
  }
  if (user?.role !== "admin") {
    return <Navigate to="/tickets" replace />;
  }
  return children;
}

export function RequireSupport({ children }) {
  const { isAuthenticated, user } = useAuth();
  const location = useLocation();
  if (!isAuthenticated) {
    return <Navigate to="/login" replace state={{ from: location }} />;
  }
  if (user?.role !== "support") {
    return <Navigate to="/admin" replace />;
  }
  return children;
}
