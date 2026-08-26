import { useEffect, useState } from "react";
import AdminLayout from "../../components/AdminLayout";
import StatCard from "../../components/StatCard";
import DonutChart from "../../components/DonutChart";
import Icon from "../../components/Icon";
import { LoadingState, ErrorState, EmptyState } from "../../components/States";
import { getDashboardStats, getTeamOverview } from "../../api/adminApi";
import { extractErrorMessage } from "../../api/client";

const AGENT_PREVIEW_COUNT = 4;

const AGENT_STATUS_STYLES = {
  active: "bg-secondary/10 text-secondary",
  idle: "bg-surface-variant text-on-surface-variant",
};

const AGENT_STATUS_LABELS = {
  active: "Active",
  idle: "Idle",
};

function AgentStatusPill({ status }) {
  return (
    <span
      className={`inline-flex items-center px-2 py-1 rounded-full text-[11px] font-semibold ${
        AGENT_STATUS_STYLES[status] ?? AGENT_STATUS_STYLES.idle
      }`}
    >
      {AGENT_STATUS_LABELS[status] ?? status}
    </span>
  );
}

function AgentRow({ agent }) {
  return (
    <div className="flex items-center gap-3 py-3 border-b border-surface-variant last:border-b-0">
      <div className="w-8 h-8 shrink-0 rounded-full bg-primary-fixed text-primary flex items-center justify-center text-xs font-semibold">
        {agent.username[0]?.toUpperCase()}
      </div>
      <span className="text-sm font-medium text-on-surface flex-1 truncate">{agent.username}</span>
      <span className="text-sm text-on-surface-variant tabular-nums w-24">
        {agent.active_tickets} active
      </span>
      <AgentStatusPill status={agent.status} />
    </div>
  );
}

export default function Dashboard() {
  const [stats, setStats] = useState(null);
  const [statsError, setStatsError] = useState("");

  const [agents, setAgents] = useState(null);
  const [agentsError, setAgentsError] = useState("");

  const [showAllAgents, setShowAllAgents] = useState(false);

  function loadStats() {
    setStatsError("");
    setStats(null);
    getDashboardStats()
      .then(setStats)
      .catch((err) => setStatsError(extractErrorMessage(err, "Could not load dashboard stats.")));
  }

  function loadAgents() {
    setAgentsError("");
    setAgents(null);
    getTeamOverview()
      .then(setAgents)
      .catch((err) => setAgentsError(extractErrorMessage(err, "Could not load team overview.")));
  }

  useEffect(loadStats, []);
  useEffect(loadAgents, []);

  const donutSegments = stats
    ? [
        { key: "open", label: "Open", value: stats.open, color: "#ec835a", icon: "inventory_2" },
        {
          key: "in_progress",
          label: "In Progress",
          value: stats.in_progress,
          color: "#fab219",
          icon: "hourglass_top",
        },
        { key: "closed", label: "Closed", value: stats.closed, color: "#0ca30c", icon: "check_circle" },
      ]
    : [];

  return (
    <AdminLayout>
      <div className="mb-8">
        <h2 className="text-2xl font-semibold text-on-surface">Dashboard</h2>
        <p className="text-sm text-on-surface-variant mt-1">
          Overview of ticket volume across the helpdesk.
        </p>
      </div>

      {stats === null && !statsError && <LoadingState label="Loading dashboard…" />}
      {statsError && <ErrorState message={statsError} onRetry={loadStats} />}

      {stats && (
        <div className="flex flex-col gap-6">
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
            <StatCard label="Total Tickets" value={stats.total} icon="confirmation_number" accent="primary" />
            <StatCard label="Open" value={stats.open} icon="fiber_manual_record" accent="error" />
            <StatCard label="In Progress" value={stats.in_progress} icon="clock_loader_60" accent="tertiary" />
            <StatCard label="Closed" value={stats.closed} icon="check_circle" accent="secondary" />
          </div>

          <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
            <div className="bg-surface-container-lowest rounded-xl border border-surface-variant card-shadow p-6">
              <h3 className="text-base font-semibold text-on-surface mb-1">Ticket Distribution</h3>
              <p className="text-sm text-on-surface-variant mb-6">Tickets grouped by current status.</p>
              {stats.total === 0 ? (
                <EmptyState icon="donut_large" title="No tickets yet" description="Create a ticket to see the breakdown." />
              ) : (
                <DonutChart segments={donutSegments} total={stats.total} />
              )}
            </div>

            <div className="bg-surface-container-lowest rounded-xl border border-surface-variant card-shadow p-6">
              <div className="flex items-center justify-between mb-1">
                <h3 className="text-base font-semibold text-on-surface">Team Overview</h3>
                {agents && agents.length > AGENT_PREVIEW_COUNT && (
                  <button
                    type="button"
                    onClick={() => setShowAllAgents(true)}
                    className="text-sm font-medium text-primary hover:underline"
                  >
                    View all
                  </button>
                )}
              </div>
              <p className="text-sm text-on-surface-variant mb-4">Active workload per support agent.</p>

              {agents === null && !agentsError && <LoadingState label="Loading team…" />}
              {agentsError && <ErrorState message={agentsError} onRetry={loadAgents} />}
              {agents && agents.length === 0 && (
                <EmptyState icon="groups" title="No agents yet" description="Support users will appear here." />
              )}
              {agents && agents.length > 0 && (
                <div className="flex flex-col">
                  {agents.slice(0, AGENT_PREVIEW_COUNT).map((agent) => (
                    <AgentRow key={agent.username} agent={agent} />
                  ))}
                </div>
              )}
            </div>
          </div>
        </div>
      )}

      {showAllAgents && agents && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/40 p-4">
          <div className="w-full max-w-md bg-surface-container-lowest rounded-xl border border-surface-variant shadow-lg p-6 flex flex-col gap-4 max-h-[80vh]">
            <div className="flex items-center justify-between">
              <h3 className="text-lg font-semibold text-on-surface">All Agents</h3>
              <button
                type="button"
                onClick={() => setShowAllAgents(false)}
                className="text-on-surface-variant hover:text-primary transition-colors"
              >
                <Icon name="close" size="20px" />
              </button>
            </div>
            <div className="overflow-y-auto -mx-1 px-1">
              {agents.map((agent) => (
                <AgentRow key={agent.username} agent={agent} />
              ))}
            </div>
          </div>
        </div>
      )}
    </AdminLayout>
  );
}
