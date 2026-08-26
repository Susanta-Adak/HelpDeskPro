import { useState } from "react";
import { Link } from "react-router-dom";
import { STATUS_LABELS } from "./Badge";
import Icon from "./Icon";
import Modal from "./Modal";
import Avatar from "./Avatar";
import { formatTicketCode, CATEGORY_LABELS, PRIORITY_LABELS } from "../lib/ticket";
import { formatDateTime, formatRelative, formatBytes } from "../lib/format";

const TITLE_MIN = 3;
const TITLE_MAX = 200;
const DESC_MIN = 10;
const DESC_MAX = 5000;

const STATUS_ORDER = ["open", "in_progress", "closed"];
// Forward transitions move one step at a time; reopening a closed ticket
// (closed -> open) is the only backward move, and it's admin-only.
const ALLOWED_NEXT_STATUS = {
  open: "in_progress",
  in_progress: "closed",
  closed: "open",
};

function isStatusTransitionAllowed(currentStatus, targetStatus, isAdmin) {
  if (ALLOWED_NEXT_STATUS[currentStatus] !== targetStatus) return false;
  if (currentStatus === "closed") return isAdmin;
  return true;
}

const STATUS_PILL_STYLES = {
  open: "bg-primary-fixed/40 text-primary border-primary/20",
  in_progress: "bg-tertiary-container/20 text-tertiary border-tertiary/20",
  closed: "bg-surface-variant text-on-surface-variant border-outline-variant",
};

const STATUS_DOT_STYLES = {
  open: "bg-primary",
  in_progress: "bg-tertiary",
  closed: "bg-on-surface-variant",
};

const PRIORITY_CHIP_STYLES = {
  high: "bg-error-container text-on-error-container",
  medium: "bg-tertiary-container/20 text-tertiary",
  low: "bg-surface-variant text-on-surface-variant",
};

const PRIORITY_CHIP_ICONS = {
  high: "keyboard_double_arrow_up",
  medium: "drag_handle",
  low: "keyboard_double_arrow_down",
};

function attachmentIcon(contentType) {
  if (contentType?.startsWith("image/")) return "image";
  if (contentType === "application/pdf") return "picture_as_pdf";
  return "description";
}

function MetaItem({ label, children }) {
  return (
    <div>
      <p className="text-[11px] font-semibold text-outline mb-1 uppercase tracking-wider">{label}</p>
      {children}
    </div>
  );
}

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
  const canEdit = isCreator && Boolean(onSave);
  const canDeleteAsCreator = isCreator && ticket.status === "open" && Boolean(onDelete);
  const canDelete = canDeleteAsCreator || Boolean(onAdminDelete);
  const canReassign = (isCreator || isAssignee || isAdmin) && Boolean(onReassign);
  // Once closed, only an admin can act further (to reopen it) — an assignee has nothing left to do.
  const canChangeStatus =
    Boolean(onChangeStatus) && (isAdmin || (isAssignee && ticket.status !== "closed"));
  const canComment = (isCreator || isAssignee || isAdmin) && Boolean(onAddComment);
  const canManage = canReassign || canChangeStatus;

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
    <div className="max-w-4xl mx-auto">
      <div className="mb-6">
        <Link
          to={backLink.to}
          className="inline-flex items-center gap-1 text-sm text-on-surface-variant hover:text-primary transition-colors group"
        >
          <Icon name="arrow_back" size="16px" className="group-hover:-translate-x-1 transition-transform" />
          {backLink.label}
        </Link>
      </div>

      <div className="bg-surface-container-lowest border border-surface-variant rounded-xl shadow-sm overflow-hidden flex flex-col">
        {/* Header */}
        <div className="p-6 md:px-8 md:pt-8 md:pb-6 border-b border-surface-variant bg-surface-bright/50">
          {editing ? (
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
          ) : (
            <div className="flex flex-col sm:flex-row sm:items-start justify-between gap-4">
              <div className="flex-1 min-w-0">
                <h2 className="text-xl md:text-2xl font-semibold text-on-surface mb-2">{ticket.title}</h2>
                <p className="text-xs text-outline">
                  Ticket {formatTicketCode(ticket.id)} • Reported by {ticket.creator.username}
                </p>
              </div>
              <div
                className={`inline-flex items-center px-3 py-1 rounded-full border shrink-0 self-start ${STATUS_PILL_STYLES[ticket.status]}`}
              >
                <span className={`w-2 h-2 rounded-full mr-2 ${STATUS_DOT_STYLES[ticket.status]}`} />
                <span className="text-[11px] font-semibold uppercase tracking-wider">
                  {STATUS_LABELS[ticket.status]}
                </span>
              </div>
            </div>
          )}
        </div>

        {/* Meta grid */}
        <div className="grid grid-cols-2 md:grid-cols-4 gap-y-4 gap-x-8 px-6 py-4 md:px-8 border-b border-surface-variant">
          <MetaItem label="Created">
            <p className="text-sm text-on-surface flex items-center gap-2">
              <Icon name="calendar_today" size="16px" className="text-outline" />
              {formatDateTime(ticket.created_at)}
            </p>
          </MetaItem>
          <MetaItem label="Assigned To">
            <div className="flex items-center gap-2">
              {ticket.assignee && <Avatar name={ticket.assignee.username} size="xs" />}
              <p className="text-sm text-on-surface font-medium truncate">
                {ticket.assignee ? (isAssignee ? "You" : ticket.assignee.username) : "Unassigned"}
              </p>
            </div>
          </MetaItem>
          <MetaItem label="Priority">
            {editing ? (
              <select
                value={editPriority}
                onChange={(e) => setEditPriority(e.target.value)}
                className="w-full h-8 px-2 rounded-md border border-outline-variant bg-surface-container-lowest text-sm text-on-surface focus:outline-none focus:border-primary"
              >
                {Object.entries(PRIORITY_LABELS).map(([value, label]) => (
                  <option key={value} value={value}>
                    {label}
                  </option>
                ))}
              </select>
            ) : (
              <div
                className={`inline-flex items-center px-2 py-0.5 rounded-md ${PRIORITY_CHIP_STYLES[ticket.priority]}`}
              >
                <Icon name={PRIORITY_CHIP_ICONS[ticket.priority]} size="14px" className="mr-1" />
                <span className="text-[11px] font-semibold">{PRIORITY_LABELS[ticket.priority]}</span>
              </div>
            )}
          </MetaItem>
          <MetaItem label="Category">
            {editing ? (
              <select
                value={editCategory}
                onChange={(e) => setEditCategory(e.target.value)}
                className="w-full h-8 px-2 rounded-md border border-outline-variant bg-surface-container-lowest text-sm text-on-surface focus:outline-none focus:border-primary"
              >
                {Object.entries(CATEGORY_LABELS).map(([value, label]) => (
                  <option key={value} value={value}>
                    {label}
                  </option>
                ))}
              </select>
            ) : (
              <p className="text-sm text-on-surface font-medium">{CATEGORY_LABELS[ticket.category]}</p>
            )}
          </MetaItem>
        </div>

        {/* Description + attachment */}
        <div className="p-6 md:p-8">
          <h3 className="text-base font-semibold text-on-surface mb-4">Description</h3>
          {editing ? (
            <div className="flex flex-col gap-2">
              <textarea
                value={editDescription}
                onChange={(e) => setEditDescription(e.target.value)}
                rows={6}
                maxLength={DESC_MAX}
                className={`w-full px-3 py-2 rounded-lg border outline-none transition-colors text-sm text-on-surface bg-surface-container-lowest focus:ring-2 focus:ring-primary/10 resize-y ${
                  editErrors.description ? "border-error" : "border-outline-variant focus:border-primary"
                }`}
              />
              {editErrors.description && <p className="text-xs text-error">{editErrors.description}</p>}
              {editFormError && (
                <p className="text-sm text-error bg-error-container/50 rounded-lg px-3 py-2" role="alert">
                  {editFormError}
                </p>
              )}
            </div>
          ) : (
            <p className="text-sm text-on-surface-variant leading-relaxed whitespace-pre-wrap">
              {ticket.description}
            </p>
          )}

          {!editing && ticket.attachment_filename && (
            <div className="mt-8 pt-6 border-t border-dashed border-surface-variant">
              <h4 className="text-[11px] font-semibold text-outline mb-3 uppercase tracking-wider">
                Attachment
              </h4>
              <button
                type="button"
                onClick={handleDownload}
                disabled={downloading}
                className="inline-flex items-center gap-3 p-3 rounded-lg border border-surface-variant hover:bg-surface transition-colors group disabled:opacity-60"
              >
                <div className="w-10 h-10 rounded bg-primary-fixed/40 flex items-center justify-center text-primary group-hover:scale-105 transition-transform shrink-0">
                  <Icon name={attachmentIcon(ticket.attachment_content_type)} />
                </div>
                <div className="text-left">
                  <p className="text-sm text-on-surface font-medium group-hover:text-primary transition-colors">
                    {ticket.attachment_filename}
                  </p>
                  <p className="text-xs text-outline">
                    {downloading ? "Downloading…" : formatBytes(ticket.attachment_size)}
                  </p>
                </div>
                <Icon name="download" className="text-outline ml-4 group-hover:text-primary transition-colors" />
              </button>
            </div>
          )}
        </div>

        {/* Manage: reassign + status */}
        {canManage && !editing && (
          <div className="border-t border-surface-variant px-6 py-6 md:px-8 grid grid-cols-1 sm:grid-cols-2 gap-6">
            {canReassign && (
              <div>
                <h4 className="text-sm font-semibold text-on-surface mb-1">Assign To</h4>
                <p className="text-xs text-on-surface-variant mb-3">Reassign this ticket to another agent.</p>
                <select
                  value={assigneeId}
                  onChange={handleReassign}
                  disabled={assignBusy}
                  className="w-full h-9 px-3 rounded-lg border border-outline-variant bg-surface-container-lowest text-sm text-on-surface focus:outline-none focus:border-primary focus:ring-2 focus:ring-primary/10"
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
                {assignError && <p className="text-xs text-error mt-2">{assignError}</p>}
              </div>
            )}

            {canChangeStatus && (
              <div>
                <h4 className="text-sm font-semibold text-on-surface mb-1">Change Status</h4>
                <p className="text-xs text-on-surface-variant mb-3">
                  {ticket.status === "closed"
                    ? "Only an admin can reopen a closed ticket."
                    : "Moves forward one step at a time."}
                </p>
                <div className="flex bg-surface-container-low p-1 rounded-lg">
                  {STATUS_ORDER.map((s) => {
                    const isCurrent = ticket.status === s;
                    const isNext = isStatusTransitionAllowed(ticket.status, s, isAdmin);
                    return (
                      <button
                        key={s}
                        type="button"
                        disabled={!isNext || statusBusy}
                        onClick={() => handleStatusChange(s)}
                        className={`flex-1 py-1.5 px-2 rounded-md text-xs font-medium transition-all ${
                          isCurrent
                            ? "bg-surface-container-lowest shadow-sm text-primary"
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
                {statusError && <p className="text-xs text-error mt-2">{statusError}</p>}
              </div>
            )}
          </div>
        )}

        {/* Comments */}
        {!editing && (
          <div className="border-t border-surface-variant p-6 md:p-8">
            <h3 className="text-base font-semibold text-on-surface mb-4">
              Comments {ticket.comments.length > 0 && `(${ticket.comments.length})`}
            </h3>
            {ticket.comments.length === 0 ? (
              <p className="text-sm text-on-surface-variant">No comments yet.</p>
            ) : (
              <div className="flex flex-col gap-4 mb-4">
                {ticket.comments.map((comment) => (
                  <div key={comment.id} className="flex gap-3">
                    <Avatar name={comment.author.username} />
                    <div className="min-w-0 flex-1">
                      <div className="flex items-baseline gap-2">
                        <span className="text-sm font-medium text-on-surface">
                          {comment.author.id === currentUser.id ? "You" : comment.author.username}
                        </span>
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
        )}

        {/* Footer actions */}
        {(canEdit || canDelete) && (
          <div className="p-6 md:px-8 md:py-6 border-t border-surface-variant bg-surface-bright flex flex-col sm:flex-row items-center justify-between gap-4">
            <div className="flex items-center gap-3 w-full sm:w-auto">
              {editing ? (
                <>
                  <button
                    type="button"
                    onClick={handleSave}
                    disabled={saving}
                    className="flex-1 sm:flex-none inline-flex items-center justify-center gap-2 px-6 h-9 bg-primary text-on-primary rounded-lg text-sm font-medium hover:bg-primary/90 active:scale-95 transition-all disabled:opacity-60"
                  >
                    {saving ? "Saving…" : "Save Changes"}
                  </button>
                  <button
                    type="button"
                    onClick={() => setEditing(false)}
                    className="flex-1 sm:flex-none inline-flex items-center justify-center gap-2 px-6 h-9 border border-outline-variant text-on-surface-variant rounded-lg text-sm font-medium hover:bg-surface-container-low transition-colors"
                  >
                    Cancel
                  </button>
                </>
              ) : (
                <>
                  {canEdit && (
                    <button
                      type="button"
                      onClick={startEdit}
                      className="flex-1 sm:flex-none inline-flex items-center justify-center gap-2 px-6 h-9 bg-primary text-on-primary rounded-lg text-sm font-medium hover:bg-primary/90 active:scale-95 transition-all shadow-sm"
                    >
                      <Icon name="edit_document" size="18px" />
                      Update Ticket
                    </button>
                  )}
                  {canDelete && (
                    <button
                      type="button"
                      onClick={() => setShowDeleteModal(true)}
                      className="flex-1 sm:flex-none inline-flex items-center justify-center gap-2 px-6 h-9 bg-surface-container-lowest text-error border border-error/30 rounded-lg text-sm font-medium hover:bg-error-container hover:border-error/50 active:scale-95 transition-all"
                    >
                      <Icon name="delete" size="18px" />
                      Delete
                    </button>
                  )}
                </>
              )}
            </div>
            {!editing && isCreator && ticket.status !== "open" && (
              <p className="text-xs text-outline flex items-center gap-1.5">
                <Icon name="info" size="14px" />
                Ticket can only be deleted while Open.
              </p>
            )}
            {deleteError && <p className="text-xs text-error">{deleteError}</p>}
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
    </div>
  );
}
