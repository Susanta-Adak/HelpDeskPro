import { useEffect, useState } from "react";
import AdminLayout from "../../components/AdminLayout";
import Avatar from "../../components/Avatar";
import Icon from "../../components/Icon";
import { LoadingState, ErrorState } from "../../components/States";
import { listUsers, createUser, updateUserStatus } from "../../api/adminApi";
import { extractErrorMessage } from "../../api/client";
import { useAuth } from "../../context/AuthContext";

const ROLE_STYLES = {
  admin: "bg-primary/10 text-primary",
  support: "bg-secondary/10 text-secondary",
};

const ROLE_LABELS = {
  admin: "Admin",
  support: "Support",
};

function RoleBadge({ role }) {
  return (
    <span
      className={`inline-flex items-center px-2 py-1 rounded-full text-[11px] font-semibold ${ROLE_STYLES[role] ?? ROLE_STYLES.support}`}
    >
      {ROLE_LABELS[role] ?? role}
    </span>
  );
}

const ACTIVE_STYLES = {
  true: "bg-secondary/10 text-secondary",
  false: "bg-surface-variant text-on-surface-variant",
};

function ActiveBadge({ isActive }) {
  return (
    <span
      className={`inline-flex items-center px-2 py-1 rounded-full text-[11px] font-semibold ${ACTIVE_STYLES[isActive]}`}
    >
      {isActive ? "Active" : "Inactive"}
    </span>
  );
}

const USERNAME_MIN = 3;
const PASSWORD_MIN = 8;

export default function Users() {
  const { user: currentUser } = useAuth();
  const [users, setUsers] = useState(null);
  const [error, setError] = useState("");
  const [statusBusyId, setStatusBusyId] = useState(null);
  const [statusErrors, setStatusErrors] = useState({});

  const [showForm, setShowForm] = useState(false);
  const [username, setUsername] = useState("");
  const [password, setPassword] = useState("");
  const [role, setRole] = useState("support");
  const [formErrors, setFormErrors] = useState({});
  const [formError, setFormError] = useState("");
  const [submitting, setSubmitting] = useState(false);

  function load() {
    setError("");
    setUsers(null);
    listUsers()
      .then(setUsers)
      .catch((err) => setError(extractErrorMessage(err, "Could not load users.")));
  }

  useEffect(load, []);

  function resetForm() {
    setUsername("");
    setPassword("");
    setRole("support");
    setFormErrors({});
    setFormError("");
  }

  function validate() {
    const errs = {};
    const u = username.trim();
    if (!u) errs.username = "Username is required.";
    else if (u.length < USERNAME_MIN) errs.username = `Username must be at least ${USERNAME_MIN} characters.`;
    if (!password) errs.password = "Password is required.";
    else if (password.length < PASSWORD_MIN) errs.password = `Password must be at least ${PASSWORD_MIN} characters.`;
    return errs;
  }

  async function handleSubmit(e) {
    e.preventDefault();
    setFormError("");
    const validationErrors = validate();
    setFormErrors(validationErrors);
    if (Object.keys(validationErrors).length > 0) return;

    setSubmitting(true);
    try {
      const created = await createUser({ username: username.trim(), password, role });
      setUsers((prev) => [...(prev ?? []), created].sort((a, b) => a.username.localeCompare(b.username)));
      resetForm();
      setShowForm(false);
    } catch (err) {
      setFormError(extractErrorMessage(err, "Could not create this user."));
    } finally {
      setSubmitting(false);
    }
  }

  async function handleToggleActive(targetUser) {
    setStatusBusyId(targetUser.id);
    setStatusErrors((prev) => ({ ...prev, [targetUser.id]: "" }));
    try {
      const updated = await updateUserStatus(targetUser.id, !targetUser.is_active);
      setUsers((prev) => prev.map((u) => (u.id === updated.id ? updated : u)));
    } catch (err) {
      setStatusErrors((prev) => ({
        ...prev,
        [targetUser.id]: extractErrorMessage(err, "Could not update this user."),
      }));
    } finally {
      setStatusBusyId(null);
    }
  }

  return (
    <AdminLayout>
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 mb-6">
        <div>
          <h2 className="text-2xl font-semibold text-on-surface">Users</h2>
          <p className="text-sm text-on-surface-variant mt-1">
            Create and manage support and admin accounts.
          </p>
        </div>
        <button
          type="button"
          onClick={() => {
            if (showForm) resetForm();
            setShowForm((v) => !v);
          }}
          className="inline-flex h-10 px-4 rounded-lg bg-primary text-on-primary text-sm font-medium items-center justify-center gap-2 hover:bg-primary/90 transition-colors self-start"
        >
          <Icon name={showForm ? "close" : "person_add"} size="18px" />
          {showForm ? "Cancel" : "Add User"}
        </button>
      </div>

      {showForm && (
        <form
          onSubmit={handleSubmit}
          noValidate
          className="bg-surface-container-lowest rounded-xl border border-surface-variant card-shadow p-6 mb-6 flex flex-col gap-4"
        >
          <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
            <div className="flex flex-col gap-2">
              <label htmlFor="username" className="text-xs font-medium text-on-surface">
                Username
              </label>
              <input
                id="username"
                value={username}
                onChange={(e) => setUsername(e.target.value)}
                placeholder="e.g. jsmith"
                className={`w-full h-10 px-3 rounded-lg border outline-none transition-colors text-sm text-on-surface bg-surface-container-lowest focus:ring-2 focus:ring-primary/10 ${
                  formErrors.username ? "border-error" : "border-outline-variant focus:border-primary"
                }`}
              />
              {formErrors.username && <p className="text-xs text-error">{formErrors.username}</p>}
            </div>
            <div className="flex flex-col gap-2">
              <label htmlFor="password" className="text-xs font-medium text-on-surface">
                Password
              </label>
              <input
                id="password"
                type="password"
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                placeholder="At least 8 characters"
                className={`w-full h-10 px-3 rounded-lg border outline-none transition-colors text-sm text-on-surface bg-surface-container-lowest focus:ring-2 focus:ring-primary/10 ${
                  formErrors.password ? "border-error" : "border-outline-variant focus:border-primary"
                }`}
              />
              {formErrors.password && <p className="text-xs text-error">{formErrors.password}</p>}
            </div>
            <div className="flex flex-col gap-2">
              <label htmlFor="role" className="text-xs font-medium text-on-surface">
                Role
              </label>
              <select
                id="role"
                value={role}
                onChange={(e) => setRole(e.target.value)}
                className="w-full h-10 px-3 rounded-lg border border-outline-variant bg-surface-container-lowest text-sm text-on-surface focus:outline-none focus:border-primary focus:ring-2 focus:ring-primary/10"
              >
                <option value="support">Support</option>
                <option value="admin">Admin</option>
              </select>
            </div>
          </div>

          {formError && (
            <p className="text-sm text-error bg-error-container/50 rounded-lg px-3 py-2" role="alert">
              {formError}
            </p>
          )}

          <div className="flex justify-end">
            <button
              type="submit"
              disabled={submitting}
              className="h-9 px-5 rounded-lg bg-primary text-on-primary text-sm font-medium hover:bg-primary/90 transition-colors disabled:opacity-60"
            >
              {submitting ? "Creating…" : "Create User"}
            </button>
          </div>
        </form>
      )}

      <div className="bg-surface-container-lowest rounded-xl border border-surface-variant card-shadow overflow-hidden">
        {users === null && !error && <LoadingState label="Loading users…" />}
        {error && <ErrorState message={error} onRetry={load} />}
        {users && users.length > 0 && (
          <table className="w-full text-left border-collapse">
            <thead>
              <tr className="bg-surface-container-low border-b border-surface-variant text-on-surface-variant text-[11px] font-semibold uppercase tracking-wider">
                <th className="p-4">User</th>
                <th className="p-4">Role</th>
                <th className="p-4">Status</th>
                <th className="p-4 text-right">Actions</th>
              </tr>
            </thead>
            <tbody className="text-sm text-on-surface divide-y divide-surface-variant">
              {users.map((u) => {
                const isSelf = u.id === currentUser?.id;
                return (
                  <tr key={u.id} className="hover:bg-surface-bright transition-colors">
                    <td className="p-4">
                      <div className="flex items-center gap-3">
                        <Avatar name={u.username} />
                        {u.username}
                        {isSelf && <span className="text-xs text-on-surface-variant">(you)</span>}
                      </div>
                    </td>
                    <td className="p-4">
                      <RoleBadge role={u.role} />
                    </td>
                    <td className="p-4">
                      <ActiveBadge isActive={u.is_active} />
                    </td>
                    <td className="p-4 text-right">
                      {isSelf ? (
                        <span className="text-xs text-on-surface-variant">—</span>
                      ) : (
                        <button
                          type="button"
                          onClick={() => handleToggleActive(u)}
                          disabled={statusBusyId === u.id}
                          className={`text-sm font-medium hover:underline disabled:opacity-60 ${
                            u.is_active ? "text-error" : "text-primary"
                          }`}
                        >
                          {statusBusyId === u.id ? "Updating…" : u.is_active ? "Deactivate" : "Activate"}
                        </button>
                      )}
                      {statusErrors[u.id] && (
                        <p className="text-xs text-error mt-1">{statusErrors[u.id]}</p>
                      )}
                    </td>
                  </tr>
                );
              })}
            </tbody>
          </table>
        )}
      </div>
    </AdminLayout>
  );
}
