import { useEffect, useState } from "react";
import { Link, useNavigate, useParams } from "react-router-dom";
import SupportLayout from "../../components/SupportLayout";
import StatusBadge from "../../components/Badge";
import Modal from "../../components/Modal";
import { LoadingState, ErrorState } from "../../components/States";
import { deleteTicket, getTicket, updateTicket } from "../../api/ticketsApi";
import { extractErrorMessage } from "../../api/client";
import { formatDateTime } from "../../lib/format";

const TITLE_MIN = 3;
const TITLE_MAX = 200;
const DESC_MIN = 10;
const DESC_MAX = 5000;

export default function TicketDetails() {
  const { ticketId } = useParams();
  const navigate = useNavigate();

  const [ticket, setTicket] = useState(null);
  const [loadError, setLoadError] = useState("");

  const [title, setTitle] = useState("");
  const [description, setDescription] = useState("");
  const [errors, setErrors] = useState({});
  const [formError, setFormError] = useState("");
  const [saving, setSaving] = useState(false);
  const [saved, setSaved] = useState(false);

  const [deleting, setDeleting] = useState(false);
  const [showDeleteModal, setShowDeleteModal] = useState(false);
  const [deleteError, setDeleteError] = useState("");

  function load() {
    setLoadError("");
    setTicket(null);
    getTicket(ticketId)
      .then((data) => {
        setTicket(data);
        setTitle(data.title);
        setDescription(data.description);
      })
      .catch((err) => setLoadError(extractErrorMessage(err, "Could not load this ticket.")));
  }

  useEffect(load, [ticketId]);

  function validate() {
    const errs = {};
    const t = title.trim();
    const d = description.trim();
    if (!t) errs.title = "Title is required.";
    else if (t.length < TITLE_MIN) errs.title = `Title must be at least ${TITLE_MIN} characters.`;
    else if (t.length > TITLE_MAX) errs.title = `Title must be at most ${TITLE_MAX} characters.`;
    if (!d) errs.description = "Description is required.";
    else if (d.length < DESC_MIN) errs.description = `Description must be at least ${DESC_MIN} characters.`;
    else if (d.length > DESC_MAX) errs.description = `Description must be at most ${DESC_MAX} characters.`;
    return errs;
  }

  async function handleSave(e) {
    e.preventDefault();
    setFormError("");
    setSaved(false);
    const validationErrors = validate();
    setErrors(validationErrors);
    if (Object.keys(validationErrors).length > 0) return;

    setSaving(true);
    try {
      const updated = await updateTicket(ticketId, { title: title.trim(), description: description.trim() });
      setTicket(updated);
      setSaved(true);
    } catch (err) {
      setFormError(extractErrorMessage(err, "Could not save changes."));
    } finally {
      setSaving(false);
    }
  }

  async function handleDelete() {
    setDeleteError("");
    setDeleting(true);
    try {
      await deleteTicket(ticketId);
      navigate("/tickets", { replace: true });
    } catch (err) {
      setDeleteError(extractErrorMessage(err, "Could not delete this ticket."));
      setDeleting(false);
      setShowDeleteModal(false);
    }
  }

  return (
    <SupportLayout>
      <div className="max-w-3xl mx-auto">
        <div className="mb-6">
          <Link to="/tickets" className="text-sm text-primary hover:underline">
            ← Back to My Tickets
          </Link>
        </div>

        {ticket === null && !loadError && <LoadingState label="Loading ticket…" />}
        {loadError && <ErrorState message={loadError} onRetry={load} />}

        {ticket && (
          <div className="flex flex-col gap-6">
            <div className="bg-surface-container-lowest rounded-xl border border-surface-variant card-shadow p-6 md:p-8">
              <div className="flex flex-wrap items-start justify-between gap-3 mb-2">
                <div>
                  <p className="text-xs font-semibold text-on-surface-variant">#{ticket.id}</p>
                  <h2 className="text-xl font-semibold text-on-surface mt-1">{ticket.title}</h2>
                </div>
                <StatusBadge status={ticket.status} />
              </div>

              <div className="flex flex-wrap gap-x-8 gap-y-2 text-sm text-on-surface-variant border-b border-surface-variant pb-4 mt-4 mb-4">
                <span>Created {formatDateTime(ticket.created_at)}</span>
                <span>
                  Assigned to{" "}
                  <span className="text-on-surface font-medium">
                    {ticket.assignee?.username ?? "Unassigned"}
                  </span>
                </span>
              </div>

              {ticket.status !== "open" ? (
                <>
                  <p className="text-sm text-on-surface-variant whitespace-pre-wrap">
                    {ticket.description}
                  </p>
                  <p className="text-xs text-on-surface-variant bg-surface-container-low rounded-lg px-3 py-2 mt-6 flex items-center gap-2">
                    This ticket can no longer be edited or deleted because it is no longer Open.
                  </p>
                </>
              ) : (
                <form className="flex flex-col gap-5 mt-2" onSubmit={handleSave} noValidate>
                  <div className="flex flex-col gap-2">
                    <label htmlFor="title" className="text-xs font-medium text-on-surface">
                      Title
                    </label>
                    <input
                      id="title"
                      value={title}
                      onChange={(e) => setTitle(e.target.value)}
                      maxLength={TITLE_MAX}
                      className={`w-full h-10 px-3 rounded-lg border outline-none transition-colors text-sm text-on-surface bg-surface-container-lowest focus:ring-2 focus:ring-primary/10 ${
                        errors.title ? "border-error" : "border-outline-variant focus:border-primary"
                      }`}
                    />
                    {errors.title && <p className="text-xs text-error">{errors.title}</p>}
                  </div>

                  <div className="flex flex-col gap-2">
                    <label htmlFor="description" className="text-xs font-medium text-on-surface">
                      Description
                    </label>
                    <textarea
                      id="description"
                      value={description}
                      onChange={(e) => setDescription(e.target.value)}
                      rows={6}
                      maxLength={DESC_MAX}
                      className={`w-full px-3 py-2 rounded-lg border outline-none transition-colors text-sm text-on-surface bg-surface-container-lowest focus:ring-2 focus:ring-primary/10 resize-y ${
                        errors.description
                          ? "border-error"
                          : "border-outline-variant focus:border-primary"
                      }`}
                    />
                    {errors.description && <p className="text-xs text-error">{errors.description}</p>}
                  </div>

                  {formError && (
                    <p className="text-sm text-error bg-error-container/50 rounded-lg px-3 py-2" role="alert">
                      {formError}
                    </p>
                  )}
                  {saved && !formError && (
                    <p className="text-sm text-secondary bg-secondary-container/40 rounded-lg px-3 py-2">
                      Changes saved.
                    </p>
                  )}

                  <div className="flex flex-wrap justify-between gap-3 pt-2 border-t border-surface-variant mt-2">
                    <button
                      type="button"
                      onClick={() => setShowDeleteModal(true)}
                      className="h-9 px-4 rounded-lg border border-error text-error text-sm font-medium hover:bg-error hover:text-on-error transition-colors"
                    >
                      Delete Ticket
                    </button>
                    <button
                      type="submit"
                      disabled={saving}
                      className="h-9 px-5 rounded-lg bg-primary text-on-primary text-sm font-medium hover:bg-primary/90 transition-colors disabled:opacity-60"
                    >
                      {saving ? "Saving…" : "Save Changes"}
                    </button>
                  </div>
                  {deleteError && (
                    <p className="text-sm text-error bg-error-container/50 rounded-lg px-3 py-2" role="alert">
                      {deleteError}
                    </p>
                  )}
                </form>
              )}
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
    </SupportLayout>
  );
}
