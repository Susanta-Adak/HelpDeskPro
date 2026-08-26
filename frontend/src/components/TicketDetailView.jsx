import { useState } from "react";
import { Link } from "react-router-dom";
import StatusBadge, { STATUS_LABELS } from "./Badge";
import { PriorityBadge } from "./Badge";
import Icon from "./Icon";
import Modal from "./Modal";
import { formatTicketCode, CATEGORY_LABELS, PRIORITY_LABELS } from "../lib/ticket";
import { formatDateTime, formatRelative } from "../lib/format";

const TITLE_MIN = 3;
const TITLE_MAX = 200;
const DESC_MIN = 10;
const DESC_MAX = 5000;

const STATUS_ORDER = ["open", "in_progress", "closed"];
const ALLOWED_NEXT_STATUS = {
  open: "in_progress",
  in_progress: "closed",
  closed: null,
};

export default function TicketDetailView({
  ticket,
  currentUser,
  assignableUsers,
  onSave,
  onDelete,
  onAdminDelete,
  onReassign,
  onChangeStatus,
  onAddComment,
  onDownloadAttachment,
  backLink,
}) {
  const isCreator = ticket.creator.id === currentUser.id;
  const isAssignee = ticket.assignee?.id === currentUser.id;
  const isAdmin = currentUser.role === "admin";
  const canDeleteAsCreator = isCreator && ticket.status === "open" && Boolean(onDelete);
  const canReassign = (isCreator || isAssignee || isAdmin) && Boolean(onReassign);
  const canChangeStatus = (isAssignee || isAdmin) && Boolean(onChangeStatus);
  const canComment = (isCreator || isAssignee || isAdmin) && Boolean(onAddComment);

  const [editing, setEditing] = useState(false);
  const [editTitle, setEditTitle] = useState(ticket.title);
  const [editDescription, setEditDescription] = useState(ticket.description);
  const [editCategory, setEditCategory] = useState(ticket.category);
  const [editPriority, setEditPriority] = useState(ticket.priority);
  const [editErrors, setEditErrors] = useState({});
  const [editFormError, setEditFormError] = useState("");
  const [saving, setSaving] = useState(false);

  const [showDeleteModal, setShowDeleteModal] = useState(false);
  const [deleting, setDeleting] = useState(false);
  const [deleteError, setDeleteError] = useState("");

  const [assigneeId, setAssigneeId] = useState(ticket.assignee?.id ? String(ticket.assignee.id) : "");
  const [assignBusy, setAssignBusy] = useState(false);
  const [assignError, setAssignError] = useState("");

  const [commentBody, setCommentBody] = useState("");
  const [commentBusy, setCommentBusy] = useState(false);
  const [commentError, setCommentError] = useState("");

  const [downloading, setDownloading] = useState(false);

  const [statusBusy, setStatusBusy] = useState(false);
  const [statusError, setStatusError] = useState("");

  function startEdit() {
    setEditTitle(ticket.title);
    setEditDescription(ticket.description);
    setEditCategory(ticket.category);
    setEditPriority(ticket.priority);
    setEditErrors({});
    setEditFormError("");
    setEditing(true);
  }

  function validateEdit() {
    const errs = {};
    const t = editTitle.trim();
    const d = editDescription.trim();
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
    setEditFormError("");
    const validationErrors = validateEdit();
    setEditErrors(validationErrors);
    if (Object.keys(validationErrors).length > 0) return;

    setSaving(true);
    try {
      await onSave({
        title: editTitle.trim(),
        description: editDescription.trim(),
        category: editCategory,
        priority: editPriority,
      });
      setEditing(false);
    } catch (err) {
      setEditFormError(err.message || "Could not save changes.");
    } finally {
      setSaving(false);
    }
  }

  async function handleDelete() {
    setDeleteError("");
    setDeleting(true);
    try {
      await (onDelete ?? onAdminDelete)();
    } catch (err) {
      setDeleteError(err.message || "Could not delete this ticket.");
      setDeleting(false);
      setShowDeleteModal(false);
    }
  }

  async function handleReassign(e) {
    const value = e.target.value;
    setAssigneeId(value);
    if (!value) return;
    setAssignError("");
    setAssignBusy(true);
    try {
      await onReassign(Number(value));
    } catch (err) {
      setAssignError(err.message || "Could not reassign this ticket.");
    } finally {
      setAssignBusy(false);
    }
  }

  async function handleAddComment(e) {
    e.preventDefault();
    const body = commentBody.trim();
    if (!body) return;
    setCommentError("");
    setCommentBusy(true);
    try {
      await onAddComment(body);
      setCommentBody("");
    } catch (err) {
      setCommentError(err.message || "Could not post your comment.");
    } finally {
      setCommentBusy(false);
    }
  }

  async function handleDownload() {
    setDownloading(true);
    try {
      await onDownloadAttachment();
    } finally {
      setDownloading(false);
    }
  }

  async function handleStatusChange(nextStatus) {
    setStatusError("");
    setStatusBusy(true);
    try {
      await onChangeStatus(nextStatus);
    } catch (err) {
      setStatusError(err.message || "Could not change ticket status.");
    } finally {
      setStatusBusy(false);
    }
  }

  return (
    <div className="max-w-5xl mx-auto">
      <div className="mb-6">
        <Link to={backLink.to} className="text-sm text-primary hover:underline">
          ← {backLink.label}
        </Link>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        <div className="lg:col-span-2 flex flex-col gap-6">
          <div className="bg-surface-container-lowest rounded-xl border border-surface-variant card-shadow p-6 md:p-8">
            <div className="flex flex-wrap items-start justify-between gap-3">
              <div className="min-w-0">
                <p className="text-xs font-semibold text-on-surface-variant">{formatTicketCode(ticket.id)}</p>
                {!editing && <h2 className="text-xl font-semibold text-on-surface mt-1">{ticket.title}</h2>}
              </div>
              <div className="flex items-center gap-2 shrink-0">
                <StatusBadge status={ticket.status} />
                {isCreator && !editing && (
                  <button
                    type="button"
                    onClick={startEdit}
                    className="text-on-surface-variant hover:text-primary transition-colors"
                    aria-label="Edit ticket"
                  >
                    <Icon name="edit" size="18px" />
                  </button>
                )}
              </div>
            </div>

            {editing ? (
              <form className="flex flex-col gap-4 mt-4" onSubmit={handleSave} noValidate>
                <div className="flex flex-col gap-2">
                  <label className="text-xs font-medium text-on-surface">Title</label>
                  <input
                    value={editTitle}
                    onChange={(e) => setEditTitle(e.target.value)}
                    maxLength={TITLE_MAX}
                    className={`w-full h-10 px-3 rounded-lg border outline-none transition-colors text-sm text-on-surface bg-surface-container-lowest focus:ring-2 focus:ring-primary/10 ${
                      editErrors.title ? "border-error" : "border-outline-variant focus:border-primary"
                    }`}
                  />
                  {editErrors.title && <p className="text-xs text-error">{editErrors.title}</p>}
                </div>

                <div className="grid grid-cols-2 gap-4">
                  <div className="flex flex-col gap-2">
                    <label className="text-xs font-medium text-on-surface">Category</label>
                    <select
                      value={editCategory}
                      onChange={(e) => setEditCategory(e.target.value)}
                      className="w-full h-10 px-3 rounded-lg border border-outline-variant bg-surface-container-lowest text-sm text-on-surface focus:outline-none focus:border-primary focus:ring-2 focus:ring-primary/10"
                    >
                      {Object.entries(CATEGORY_LABELS).map(([value, label]) => (
                        <option key={value} value={value}>
                          {label}
                        </option>
                      ))}
                    </select>
                  </div>
                  <div className="flex flex-col gap-2">
                    <label className="text-xs font-medium text-on-surface">Priority</label>
                    <select
                      value={editPriority}
                      onChange={(e) => setEditPriority(e.target.value)}
                      className="w-full h-10 px-3 rounded-lg border border-outline-variant bg-surface-container-lowest text-sm text-on-surface focus:outline-none focus:border-primary focus:ring-2 focus:ring-primary/10"
                    >
                      {Object.entries(PRIORITY_LABELS).map(([value, label]) => (
                        <option key={value} value={value}>
                          {label}
                        </option>
                      ))}
                    </select>
                  </div>
                </div>

                <div className="flex flex-col gap-2">
                  <label className="text-xs font-medium text-on-surface">Description</label>
                  <textarea
                    value={editDescription}
                    onChange={(e) => setEditDescription(e.target.value)}
                    rows={6}
                    maxLength={DESC_MAX}
                    className={`w-full px-3 py-2 rounded-lg border outline-none transition-colors text-sm text-on-surface bg-surface-container-lowest focus:ring-2 focus:ring-primary/10 resize-y ${
                      editErrors.description
                        ? "border-error"
                        : "border-outline-variant focus:border-primary"
                    }`}
                  />
                  {editErrors.description && <p className="text-xs text-error">{editErrors.description}</p>}
                </div>

                {editFormError && (
                  <p className="text-sm text-error bg-error-container/50 rounded-lg px-3 py-2" role="alert">
                    {editFormError}
                  </p>
                )}

                <div className="flex justify-end gap-3">
                  <button
                    type="button"
                    onClick={() => setEditing(false)}
                    className="h-9 px-4 rounded-lg border border-outline-variant text-on-surface-variant text-sm font-medium hover:bg-surface-container-low transition-colors"
                  >
                    Cancel
                  </button>
                  <button
                    type="submit"
                    disabled={saving}
                    className="h-9 px-5 rounded-lg bg-primary text-on-primary text-sm font-medium hover:bg-primary/90 transition-colors disabled:opacity-60"
                  >
                    {saving ? "Saving…" : "Save Changes"}
                  </button>
                </div>
              </form>
            ) : (
              <>
                <div className="flex flex-wrap gap-x-8 gap-y-2 text-sm text-on-surface-variant border-b border-surface-variant pb-4 mt-4 mb-4">
                  <span>Created {formatDateTime(ticket.created_at)}</span>
                  <span>
                    Assigned to{" "}
                    <span className="text-on-surface font-medium">
                      {ticket.assignee?.username ?? "Unassigned"}
                    </span>
                  </span>
                  <span className="flex items-center gap-1">
                    Priority <PriorityBadge priority={ticket.priority} />
                  </span>
                  <span>
                    Category{" "}
                    <span className="text-on-surface font-medium">
                      {CATEGORY_LABELS[ticket.category] ?? ticket.category}
                    </span>
                  </span>
                </div>
                <p className="text-sm text-on-surface-variant whitespace-pre-wrap">{ticket.description}</p>

                {ticket.attachment_filename && (
                  <div className="flex items-center justify-between gap-3 border border-outline-variant rounded-lg px-3 py-2 mt-4">
                    <div className="flex items-center gap-2 min-w-0">
                      <Icon name="attach_file" className="text-on-surface-variant" size="20px" />
                      <span className="text-sm text-on-surface truncate">{ticket.attachment_filename}</span>
                    </div>
                    <button
                      type="button"
                      onClick={handleDownload}
                      disabled={downloading}
                      className="text-primary text-sm font-medium hover:underline shrink-0 disabled:opacity-60"
                    >
                      {downloading ? "Downloading…" : "Download"}
                    </button>
                  </div>
                )}
              </>
            )}
          </div>

          <div className="bg-surface-container-lowest rounded-xl border border-surface-variant card-shadow p-6 md:p-8">
            <h3 className="text-base font-semibold text-on-surface mb-4">
              Comments {ticket.comments.length > 0 && `(${ticket.comments.length})`}
            </h3>
            {ticket.comments.length === 0 ? (
              <p className="text-sm text-on-surface-variant">No comments yet.</p>
            ) : (
              <div className="flex flex-col gap-4 mb-4">
                {ticket.comments.map((comment) => (
                  <div key={comment.id} className="flex gap-3">
                    <div className="w-8 h-8 shrink-0 rounded-full bg-primary-fixed text-primary flex items-center justify-center text-xs font-semibold">
                      {comment.author.username[0]?.toUpperCase()}
                    </div>
                    <div className="min-w-0 flex-1">
                      <div className="flex items-baseline gap-2">
                        <span className="text-sm font-medium text-on-surface">{comment.author.username}</span>
                        <span className="text-xs text-on-surface-variant">
                          {formatRelative(comment.created_at)}
                        </span>
                      </div>
                      <p className="text-sm text-on-surface-variant whitespace-pre-wrap mt-0.5">
                        {comment.body}
                      </p>
                    </div>
                  </div>
                ))}
              </div>
            )}

            {canComment && (
              <form className="flex flex-col gap-2 border-t border-surface-variant pt-4" onSubmit={handleAddComment}>
                <textarea
                  value={commentBody}
                  onChange={(e) => setCommentBody(e.target.value)}
                  placeholder="Add a comment…"
                  rows={3}
                  maxLength={2000}
                  className="w-full px-3 py-2 rounded-lg border border-outline-variant bg-surface-container-lowest text-sm text-on-surface outline-none focus:border-primary focus:ring-2 focus:ring-primary/10 resize-y"
                />
                {commentError && <p className="text-xs text-error">{commentError}</p>}
                <div className="flex justify-end">
                  <button
                    type="submit"
                    disabled={commentBusy || !commentBody.trim()}
                    className="h-9 px-4 rounded-lg bg-primary text-on-primary text-sm font-medium hover:bg-primary/90 transition-colors disabled:opacity-60"
                  >
                    {commentBusy ? "Posting…" : "Post Comment"}
                  </button>
                </div>
              </form>
            )}
          </div>
        </div>

        <div className="flex flex-col gap-6">
          {canReassign && (
            <div className="bg-surface-container-lowest rounded-xl border border-surface-variant card-shadow p-6">
              <h3 className="text-base font-semibold text-on-surface mb-1">Assign To</h3>
              <p className="text-sm text-on-surface-variant mb-4">
                Select a support agent to handle this request.
              </p>
              <select
                value={assigneeId}
                onChange={handleReassign}
                disabled={assignBusy}
                className="w-full h-10 px-3 rounded-lg border border-outline-variant bg-surface-container-lowest text-sm text-on-surface focus:outline-none focus:border-primary focus:ring-2 focus:ring-primary/10"
              >
                <option value="" disabled>
                  Select an agent…
                </option>
                {assignableUsers.map((u) => (
                  <option key={u.id} value={u.id}>
                    {u.username}
                  </option>
                ))}
              </select>
              {assignError && <p className="text-xs text-error mt-3">{assignError}</p>}
            </div>
          )}

          {canChangeStatus && (
            <div className="bg-surface-container-lowest rounded-xl border border-surface-variant card-shadow p-6">
              <h3 className="text-base font-semibold text-on-surface mb-1">Change Status</h3>
              <p className="text-sm text-on-surface-variant mb-4">
                Tickets move forward one step at a time.
              </p>
              <div className="flex bg-surface-container-low p-1 rounded-lg">
                {STATUS_ORDER.map((s) => {
                  const isCurrent = ticket.status === s;
                  const isNext = ALLOWED_NEXT_STATUS[ticket.status] === s;
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
          )}

          {(canDeleteAsCreator || onAdminDelete) && (
            <div className="flex flex-col items-end gap-2">
              <button
                type="button"
                onClick={() => setShowDeleteModal(true)}
                className="h-9 px-4 rounded-lg border border-error text-error text-sm font-medium hover:bg-error hover:text-on-error transition-colors flex items-center gap-2"
              >
                <Icon name="delete" size="18px" />
                Delete Ticket
              </button>
              {deleteError && <p className="text-xs text-error text-right">{deleteError}</p>}
            </div>
          )}
        </div>
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
    </div>
  );
}
