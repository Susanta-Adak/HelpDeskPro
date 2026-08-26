import { useEffect, useState } from "react";
import { Link, useNavigate, useParams } from "react-router-dom";
import AdminLayout from "../../components/AdminLayout";
import StatusBadge, { STATUS_LABELS } from "../../components/Badge";
import Modal from "../../components/Modal";
import { LoadingState, ErrorState } from "../../components/States";
import * as adminApi from "../../api/adminApi";
import { extractErrorMessage } from "../../api/client";
import { formatDateTime } from "../../lib/format";

const STATUS_ORDER = ["open", "in_progress", "closed"];
const ALLOWED_NEXT = {
  open: "in_progress",
  in_progress: "closed",
  closed: null,
};

export default function TicketDetails() {
  const { ticketId } = useParams();
  const navigate = useNavigate();

  const [ticket, setTicket] = useState(null);
  const [loadError, setLoadError] = useState("");
  const [supportUsers, setSupportUsers] = useState([]);

  const [statusBusy, setStatusBusy] = useState(false);
  const [statusError, setStatusError] = useState("");

  const [assigneeId, setAssigneeId] = useState("");
  const [assignBusy, setAssignBusy] = useState(false);
  const [assignError, setAssignError] = useState("");

  const [showDeleteModal, setShowDeleteModal] = useState(false);
  const [deleting, setDeleting] = useState(false);
  const [deleteError, setDeleteError] = useState("");

  function load() {
    setLoadError("");
    setTicket(null);
    Promise.all([adminApi.getTicket(ticketId), adminApi.listSupportUsers()])
      .then(([ticketData, users]) => {
        setTicket(ticketData);
        setAssigneeId(ticketData.assignee?.id ? String(ticketData.assignee.id) : "");
        setSupportUsers(users);
      })
      .catch((err) => setLoadError(extractErrorMessage(err, "Could not load this ticket.")));
  }

  useEffect(load, [ticketId]);

  async function handleStatusChange(nextStatus) {
    setStatusError("");
    setStatusBusy(true);
    try {
      const updated = await adminApi.changeTicketStatus(ticketId, nextStatus);
      setTicket(updated);
    } catch (err) {
      setStatusError(extractErrorMessage(err, "Could not change ticket status."));
    } finally {
      setStatusBusy(false);
    }
  }

  async function handleAssign(e) {
    const value = e.target.value;
    setAssigneeId(value);
    if (!value) return;
    setAssignError("");
    setAssignBusy(true);
    try {
      const updated = await adminApi.assignTicket(ticketId, Number(value));
      setTicket(updated);
    } catch (err) {
      setAssignError(extractErrorMessage(err, "Could not assign this ticket."));
    } finally {
      setAssignBusy(false);
    }
  }

  async function handleDelete() {
    setDeleteError("");
    setDeleting(true);
    try {
      await adminApi.deleteTicket(ticketId);
      navigate("/admin/tickets", { replace: true });
    } catch (err) {
      setDeleteError(extractErrorMessage(err, "Could not delete this ticket."));
      setDeleting(false);
      setShowDeleteModal(false);
    }
  }

  return (
    <AdminLayout>
      <div className="max-w-4xl mx-auto">
        <div className="mb-6">
          <Link to="/admin/tickets" className="text-sm text-primary hover:underline">
            ← Back to All Tickets
          </Link>
        </div>

        {ticket === null && !loadError && <LoadingState label="Loading ticket…" />}
        {loadError && <ErrorState message={loadError} onRetry={load} />}

        {ticket && (
          <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
            <div className="lg:col-span-2 bg-surface-container-lowest rounded-xl border border-surface-variant card-shadow p-6 md:p-8 h-fit">
              <div className="flex flex-wrap items-start justify-between gap-3 mb-4">
                <div>
                  <p className="text-xs font-semibold text-on-surface-variant">#{ticket.id}</p>
                  <h2 className="text-xl font-semibold text-on-surface mt-1">{ticket.title}</h2>
                </div>
                <StatusBadge status={ticket.status} />
              </div>
              <div className="flex flex-wrap gap-x-8 gap-y-2 text-sm text-on-surface-variant border-b border-surface-variant pb-4 mb-4">
                <span>
                  Requester{" "}
                  <span className="text-on-surface font-medium">{ticket.creator?.username}</span>
                </span>
                <span>Created {formatDateTime(ticket.created_at)}</span>
                <span>Last updated {formatDateTime(ticket.updated_at)}</span>
              </div>
              <p className="text-sm text-on-surface-variant whitespace-pre-wrap">
                {ticket.description}
              </p>
            </div>

            <div className="flex flex-col gap-6">
              <div className="bg-surface-container-lowest rounded-xl border border-surface-variant card-shadow p-6">
                <h3 className="text-base font-semibold text-on-surface mb-1">Change Status</h3>
                <p className="text-sm text-on-surface-variant mb-4">
                  Tickets move forward one step at a time.
                </p>
                <div className="flex bg-surface-container-low p-1 rounded-lg">
                  {STATUS_ORDER.map((s) => {
                    const isCurrent = ticket.status === s;
                    const isNext = ALLOWED_NEXT[ticket.status] === s;
                    return (
                      <button
                        key={s}
                        type="button"
                        disabled={!isNext || statusBusy}
                        onClick={() => handleStatusChange(s)}
                        className={`flex-1 py-1.5 px-2 rounded-md text-xs font-medium transition-all ${
                          isCurrent
                            ? "bg-surface-container-lowest card-shadow text-primary"
                            : isNext
                              ? "text-on-surface hover:bg-surface-container-lowest/60 cursor-pointer"
                              : "text-on-surface-variant/50 cursor-not-allowed"
                        }`}
                      >
                        {STATUS_LABELS[s]}
                      </button>
                    );
                  })}
                </div>
                {statusError && <p className="text-xs text-error mt-3">{statusError}</p>}
              </div>

              <div className="bg-surface-container-lowest rounded-xl border border-surface-variant card-shadow p-6">
                <h3 className="text-base font-semibold text-on-surface mb-1">Assign To</h3>
                <p className="text-sm text-on-surface-variant mb-4">
                  Select a support agent to handle this request.
                </p>
                <select
                  value={assigneeId}
                  onChange={handleAssign}
                  disabled={assignBusy}
                  className="w-full h-10 px-3 rounded-lg border border-outline-variant bg-surface-container-lowest text-sm text-on-surface focus:outline-none focus:border-primary focus:ring-2 focus:ring-primary/10"
                >
                  <option value="" disabled>
                    Select an agent…
                  </option>
                  {supportUsers.map((u) => (
                    <option key={u.id} value={u.id}>
                      {u.username}
                    </option>
                  ))}
                </select>
                {assignError && <p className="text-xs text-error mt-3">{assignError}</p>}
              </div>

              <div className="flex justify-end">
                <button
                  type="button"
                  onClick={() => setShowDeleteModal(true)}
                  className="h-9 px-4 rounded-lg border border-error text-error text-sm font-medium hover:bg-error hover:text-on-error transition-colors flex items-center gap-2"
                >
                  Delete Ticket
                </button>
              </div>
              {deleteError && <p className="text-xs text-error text-right">{deleteError}</p>}
            </div>
          </div>
        )}
      </div>

      {showDeleteModal && (
        <Modal
          title="Delete this ticket?"
          description="This action cannot be undone."
          confirmLabel="Delete"
          danger
          busy={deleting}
          onConfirm={handleDelete}
          onCancel={() => setShowDeleteModal(false)}
        />
      )}
    </AdminLayout>
  );
}
