import { useEffect, useMemo, useState } from "react";
import { useNavigate } from "react-router-dom";
import SupportLayout from "../../components/SupportLayout";
import StatusBadge from "../../components/Badge";
import StatCard from "../../components/StatCard";
import Icon from "../../components/Icon";
import Pagination from "../../components/Pagination";
import { LoadingState, EmptyState, ErrorState } from "../../components/States";
import { listMyTickets } from "../../api/ticketsApi";
import { extractErrorMessage } from "../../api/client";
import { formatDate, formatRelative } from "../../lib/format";

const PAGE_SIZE = 5;

export default function MyTickets() {
  const navigate = useNavigate();
  const [tickets, setTickets] = useState(null);
  const [error, setError] = useState("");

  const [search, setSearch] = useState("");
  const [status, setStatus] = useState("");
  const [page, setPage] = useState(1);

  function load() {
    setError("");
    setTickets(null);
    listMyTickets()
      .then(setTickets)
      .catch((err) => setError(extractErrorMessage(err, "Could not load your tickets.")));
  }

  useEffect(load, []);
  useEffect(() => setPage(1), [search, status]);

  const stats = useMemo(() => {
    const list = tickets ?? [];
    return {
      open: list.filter((t) => t.status === "open").length,
      inProgress: list.filter((t) => t.status === "in_progress").length,
      closed: list.filter((t) => t.status === "closed").length,
    };
  }, [tickets]);

  const filtered = useMemo(() => {
    const list = tickets ?? [];
    const term = search.trim().toLowerCase();
    return list.filter((t) => {
      const matchesSearch = !term || t.title.toLowerCase().includes(term);
      const matchesStatus = !status || t.status === status;
      return matchesSearch && matchesStatus;
    });
  }, [tickets, search, status]);

  const paginated = filtered.slice((page - 1) * PAGE_SIZE, page * PAGE_SIZE);

  return (
    <SupportLayout>
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4 mb-6">
        <div>
          <h2 className="text-2xl font-semibold text-on-surface">My Tickets</h2>
          <p className="text-sm text-on-surface-variant mt-1">
            Manage and track your support requests.
          </p>
        </div>
        <div className="flex items-center gap-3">
          <div className="relative w-full md:w-64">
            <Icon
              name="search"
              className="absolute left-3 top-1/2 -translate-y-1/2 text-on-surface-variant"
              size="18px"
            />
            <input
              value={search}
              onChange={(e) => setSearch(e.target.value)}
              placeholder="Search tickets..."
              className="w-full h-9 pl-9 pr-3 rounded-lg border border-surface-variant bg-surface-container-lowest text-sm text-on-surface focus:outline-none focus:border-primary focus:ring-1 focus:ring-primary/20 transition-shadow"
            />
          </div>
          <div className="relative">
            <select
              value={status}
              onChange={(e) => setStatus(e.target.value)}
              className="appearance-none h-9 pl-9 pr-9 rounded-lg border border-surface-variant bg-surface-container-lowest text-sm text-on-surface focus:outline-none focus:border-primary focus:ring-1 focus:ring-primary/20 cursor-pointer"
            >
              <option value="">All statuses</option>
              <option value="open">Open</option>
              <option value="in_progress">In Progress</option>
              <option value="closed">Closed</option>
            </select>
            <Icon
              name="filter_list"
              className="absolute left-3 top-1/2 -translate-y-1/2 text-on-surface-variant pointer-events-none"
              size="18px"
            />
            <Icon
              name="expand_more"
              className="absolute right-2 top-1/2 -translate-y-1/2 text-on-surface-variant pointer-events-none"
              size="18px"
            />
          </div>
        </div>
      </div>

      {tickets && (
        <div className="grid grid-cols-1 sm:grid-cols-3 gap-4 mb-8">
          <StatCard label="Open Tickets" value={stats.open} icon="inventory_2" accent="primary" />
          <StatCard label="In Progress" value={stats.inProgress} icon="hourglass_top" accent="tertiary" />
          <StatCard label="Closed" value={stats.closed} icon="check_circle" accent="secondary" />
        </div>
      )}

      <div className="bg-surface-container-lowest rounded-xl border border-surface-variant card-shadow overflow-hidden">
        {tickets === null && !error && <LoadingState label="Loading your tickets…" />}
        {error && <ErrorState message={error} onRetry={load} />}
        {tickets && tickets.length === 0 && (
          <EmptyState
            icon="confirmation_number"
            title="No tickets yet"
            description="Once you create a support ticket, it will show up here."
          />
        )}
        {tickets && tickets.length > 0 && filtered.length === 0 && (
          <EmptyState
            icon="search_off"
            title="No matching tickets"
            description="Try adjusting your search or status filter."
          />
        )}
        {paginated.length > 0 && (
          <>
            <div className="overflow-x-auto">
              <table className="w-full text-left border-collapse min-w-[640px]">
                <thead>
                  <tr className="bg-surface-container-low border-b border-surface-variant text-on-surface-variant text-[11px] font-semibold uppercase tracking-wider">
                    <th className="p-4 min-w-[280px]">Ticket Details</th>
                    <th className="p-4">Status</th>
                    <th className="p-4 hidden md:table-cell">Created</th>
                    <th className="p-4">Last Updated</th>
                    <th className="p-4 w-10" />
                  </tr>
                </thead>
                <tbody className="text-sm text-on-surface divide-y divide-surface-variant">
                  {paginated.map((ticket) => (
                    <tr
                      key={ticket.id}
                      onClick={() => navigate(`/tickets/${ticket.id}`)}
                      className="hover:bg-surface-bright transition-colors cursor-pointer group"
                    >
                      <td className="p-4">
                        <div className="flex flex-col">
                          <span className="font-semibold text-primary group-hover:underline">
                            #{ticket.id}
                          </span>
                          <span className="mt-1 line-clamp-1">{ticket.title}</span>
                        </div>
                      </td>
                      <td className="p-4">
                        <StatusBadge status={ticket.status} />
                      </td>
                      <td className="p-4 hidden md:table-cell text-on-surface-variant">
                        {formatDate(ticket.created_at)}
                      </td>
                      <td className="p-4 text-on-surface-variant">
                        {formatRelative(ticket.updated_at)}
                      </td>
                      <td className="p-4 text-center">
                        <Icon
                          name="chevron_right"
                          className="text-on-surface-variant opacity-0 group-hover:opacity-100 transition-opacity"
                        />
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
            <Pagination page={page} pageSize={PAGE_SIZE} total={filtered.length} onPageChange={setPage} />
          </>
        )}
      </div>
    </SupportLayout>
  );
}
