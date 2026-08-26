import { useEffect, useState } from "react";
import AdminLayout from "../../components/AdminLayout";
import StatCard from "../../components/StatCard";
import { LoadingState, ErrorState, EmptyState } from "../../components/States";
import { getDashboardStats } from "../../api/adminApi";
import { extractErrorMessage } from "../../api/client";

export default function Dashboard() {
  const [stats, setStats] = useState(null);
  const [error, setError] = useState("");

  function load() {
    setError("");
    setStats(null);
    getDashboardStats()
      .then(setStats)
      .catch((err) => setError(extractErrorMessage(err, "Could not load dashboard stats.")));
  }

  useEffect(load, []);

  const byAssignee = stats ? Object.entries(stats.by_assignee ?? {}) : [];
  const maxAssigned = byAssignee.reduce((max, [, count]) => Math.max(max, count), 0);

  return (
    <AdminLayout>
      <div className="mb-8">
        <h2 className="text-2xl font-semibold text-on-surface">Dashboard</h2>
        <p className="text-sm text-on-surface-variant mt-1">
          Overview of ticket volume across the helpdesk.
        </p>
      </div>

      {stats === null && !error && <LoadingState label="Loading dashboard…" />}
      {error && <ErrorState message={error} onRetry={load} />}

      {stats && (
        <div className="flex flex-col gap-6">
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
            <StatCard label="Total Tickets" value={stats.total} icon="confirmation_number" accent="primary" />
            <StatCard label="Open" value={stats.open} icon="fiber_manual_record" accent="error" />
            <StatCard label="In Progress" value={stats.in_progress} icon="clock_loader_60" accent="tertiary" />
            <StatCard label="Closed" value={stats.closed} icon="check_circle" accent="secondary" />
          </div>

          <div className="bg-surface-container-lowest rounded-xl border border-surface-variant card-shadow p-6">
            <h3 className="text-base font-semibold text-on-surface mb-1">Tickets by Assignee</h3>
            <p className="text-sm text-on-surface-variant mb-6">
              Distribution of assigned tickets across support agents.
            </p>
            {byAssignee.length === 0 ? (
              <EmptyState
                icon="groups"
                title="No assignments yet"
                description="Assign tickets to support agents to see distribution here."
              />
            ) : (
              <div className="flex flex-col gap-4">
                {byAssignee.map(([username, count]) => (
                  <div key={username} className="flex items-center gap-4">
                    <span className="w-28 shrink-0 text-sm font-medium text-on-surface truncate">
                      {username}
                    </span>
                    <div className="flex-1 h-3 rounded-full bg-surface-container-low overflow-hidden">
                      <div
                        className="h-full bg-primary rounded-full transition-all"
                        style={{ width: `${maxAssigned ? (count / maxAssigned) * 100 : 0}%` }}
                      />
                    </div>
                    <span className="w-8 text-right text-sm text-on-surface-variant tabular-nums">
                      {count}
                    </span>
                  </div>
                ))}
              </div>
            )}
          </div>
        </div>
      )}
    </AdminLayout>
  );
}
