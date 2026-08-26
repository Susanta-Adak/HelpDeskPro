import { useEffect, useState } from "react";
import { Link } from "react-router-dom";
import AdminLayout from "../../components/AdminLayout";
import StatusBadge, { PriorityBadge } from "../../components/Badge";
import Icon from "../../components/Icon";
import Pagination from "../../components/Pagination";
import { LoadingState, ErrorState, EmptyState } from "../../components/States";
import { listAllTickets } from "../../api/adminApi";
import { extractErrorMessage } from "../../api/client";
import { formatDate } from "../../lib/format";
import { formatTicketCode } from "../../lib/ticket";

const PAGE_SIZE = 10;

export default function AllTickets() {
  const [searchInput, setSearchInput] = useState("");
  const [search, setSearch] = useState("");
  const [status, setStatus] = useState("");
  const [page, setPage] = useState(1);

  const [result, setResult] = useState(null);
  const [error, setError] = useState("");

  useEffect(() => {
    const timer = setTimeout(() => {
      setSearch(searchInput.trim());
      setPage(1);
    }, 350);
    return () => clearTimeout(timer);
  }, [searchInput]);

  useEffect(() => {
    setPage(1);
  }, [status]);

  function load() {
    setError("");
    setResult(null);
    listAllTickets({ search, status: status || undefined, page, pageSize: PAGE_SIZE })
      .then(setResult)
      .catch((err) => setError(extractErrorMessage(err, "Could not load tickets.")));
  }

  useEffect(load, [search, status, page]);

  return (
    <AdminLayout>
      <div className="mb-6">
        <h2 className="text-2xl font-semibold text-on-surface">All Tickets</h2>
        <p className="text-sm text-on-surface-variant mt-1">
          Search, filter, and manage every ticket in the system.
        </p>
      </div>

      <div className="flex flex-col sm:flex-row sm:items-center gap-3 mb-6">
        <div className="relative w-full sm:w-96">
          <Icon
            name="search"
            className="absolute left-3 top-1/2 -translate-y-1/2 text-on-surface-variant"
            size="18px"
          />
          <input
            value={searchInput}
            onChange={(e) => setSearchInput(e.target.value)}
            placeholder="Search by title or user"
            className="w-full h-9 pl-9 pr-3 rounded-lg border border-outline-variant bg-surface-container-lowest text-sm text-on-surface focus:outline-none focus:border-primary focus:ring-2 focus:ring-primary/10 transition-shadow"
          />
        </div>
        <div className="relative w-full sm:w-52">
          <select
            value={status}
            onChange={(e) => setStatus(e.target.value)}
            className="appearance-none w-full h-9 pl-4 pr-10 rounded-lg border border-outline-variant bg-surface-container-lowest text-sm text-on-surface focus:outline-none focus:border-primary focus:ring-2 focus:ring-primary/10 cursor-pointer"
          >
            <option value="">Status: All</option>
            <option value="open">Status: Open</option>
            <option value="in_progress">Status: In Progress</option>
            <option value="closed">Status: Closed</option>
          </select>
          <Icon
            name="expand_more"
            className="absolute right-3 top-1/2 -translate-y-1/2 text-on-surface-variant pointer-events-none"
            size="18px"
          />
        </div>
      </div>

      <div className="bg-surface-container-lowest rounded-xl border border-surface-variant card-shadow overflow-hidden">
        {result === null && !error && <LoadingState label="Loading tickets…" />}
        {error && <ErrorState message={error} onRetry={load} />}
        {result && result.items.length === 0 && (
          <EmptyState
            icon="search_off"
            title="No tickets found"
            description="Try adjusting your search or status filter."
          />
        )}
        {result && result.items.length > 0 && (
          <>
            <div className="overflow-x-auto">
              <table className="w-full text-left border-collapse min-w-[800px]">
                <thead>
                  <tr className="border-b border-surface-variant bg-surface-container-low text-on-surface-variant text-[11px] font-semibold uppercase tracking-wider">
                    <th className="py-3 px-4">Ticket Details</th>
                    <th className="py-3 px-4">Creator</th>
                    <th className="py-3 px-4">Status</th>
                    <th className="py-3 px-4">Priority</th>
                    <th className="py-3 px-4">Assigned To</th>
                    <th className="py-3 px-4">Created</th>
                    <th className="py-3 px-4 text-right">Actions</th>
                  </tr>
                </thead>
                <tbody className="text-sm text-on-surface divide-y divide-surface-variant">
                  {result.items.map((ticket) => (
                    <tr key={ticket.id} className="hover:bg-surface-bright transition-colors">
                      <td className="py-3 px-4">
                        <div className="flex flex-col">
                          <Link
                            to={`/admin/tickets/${ticket.id}`}
                            className="text-xs font-semibold text-primary hover:underline w-fit"
                          >
                            {formatTicketCode(ticket.id)}
                          </Link>
                          <span className="line-clamp-1">{ticket.title}</span>
                        </div>
                      </td>
                      <td className="py-3 px-4 text-on-surface-variant">
                        {ticket.creator?.username}
                      </td>
                      <td className="py-3 px-4">
                        <StatusBadge status={ticket.status} />
                      </td>
                      <td className="py-3 px-4">
                        <PriorityBadge priority={ticket.priority} />
                      </td>
                      <td className="py-3 px-4 text-on-surface-variant">
                        {ticket.assignee?.username ?? "Unassigned"}
                      </td>
                      <td className="py-3 px-4 text-on-surface-variant">
                        {formatDate(ticket.created_at)}
                      </td>
                      <td className="py-3 px-4 text-right">
                        <Link
                          to={`/admin/tickets/${ticket.id}`}
                          className="text-primary text-sm font-medium hover:underline"
                        >
                          View
                        </Link>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
            <Pagination
              page={result.page}
              pageSize={result.page_size}
              total={result.total}
              onPageChange={setPage}
            />
          </>
        )}
      </div>
    </AdminLayout>
  );
}
