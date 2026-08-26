import { BrowserRouter, Navigate, Route, Routes } from "react-router-dom";
import { AuthProvider, RequireAdmin, RequireAuth, RequireSupport, useAuth } from "./context/AuthContext";
import Login from "./pages/Login";
import MyTickets from "./pages/support/MyTickets";
import CreateTicket from "./pages/support/CreateTicket";
import SupportTicketDetails from "./pages/support/TicketDetails";
import Dashboard from "./pages/admin/Dashboard";
import AllTickets from "./pages/admin/AllTickets";
import AdminTicketDetails from "./pages/admin/TicketDetails";

function Home() {
  const { isAuthenticated, user } = useAuth();
  if (!isAuthenticated) return <Navigate to="/login" replace />;
  return <Navigate to={user?.role === "admin" ? "/admin" : "/tickets"} replace />;
}

function NotFound() {
  return (
    <div className="min-h-screen flex flex-col items-center justify-center gap-2 bg-background text-center px-4">
      <h1 className="text-2xl font-semibold text-on-surface">Page not found</h1>
      <p className="text-sm text-on-surface-variant">
        The page you're looking for doesn't exist.
      </p>
    </div>
  );
}

export default function App() {
  return (
    <BrowserRouter>
      <AuthProvider>
        <Routes>
          <Route path="/" element={<Home />} />
          <Route path="/login" element={<Login />} />

          <Route
            path="/tickets"
            element={
              <RequireSupport>
                <MyTickets />
              </RequireSupport>
            }
          />
          <Route
            path="/tickets/new"
            element={
              <RequireSupport>
                <CreateTicket />
              </RequireSupport>
            }
          />
          <Route
            path="/tickets/:ticketId"
            element={
              <RequireSupport>
                <SupportTicketDetails />
              </RequireSupport>
            }
          />

          <Route
            path="/admin"
            element={
              <RequireAdmin>
                <Dashboard />
              </RequireAdmin>
            }
          />
          <Route
            path="/admin/tickets"
            element={
              <RequireAdmin>
                <AllTickets />
              </RequireAdmin>
            }
          />
          <Route
            path="/admin/tickets/:ticketId"
            element={
              <RequireAdmin>
                <AdminTicketDetails />
              </RequireAdmin>
            }
          />

          <Route
            path="*"
            element={
              <RequireAuth>
                <NotFound />
              </RequireAuth>
            }
          />
        </Routes>
      </AuthProvider>
    </BrowserRouter>
  );
}
