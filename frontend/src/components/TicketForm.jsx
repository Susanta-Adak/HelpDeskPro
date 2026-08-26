import { useRef, useState } from "react";
import { Link } from "react-router-dom";
import Icon from "./Icon";
import { CATEGORY_LABELS, PRIORITY_LABELS } from "../lib/ticket";
import { formatBytes } from "../lib/format";

const TITLE_MIN = 3;
const TITLE_MAX = 200;
const DESC_MIN = 10;
const DESC_MAX = 5000;
const MAX_FILE_BYTES = 10 * 1024 * 1024;
const ALLOWED_FILE_TYPES = ["image/png", "image/jpeg", "application/pdf"];

export default function TicketForm({ onSubmit, cancelTo, submitLabel = "Submit Ticket" }) {
  const fileInputRef = useRef(null);

  const [title, setTitle] = useState("");
  const [category, setCategory] = useState("general");
  const [priority, setPriority] = useState("medium");
  const [description, setDescription] = useState("");
  const [file, setFile] = useState(null);

  const [errors, setErrors] = useState({});
  const [formError, setFormError] = useState("");
  const [submitting, setSubmitting] = useState(false);

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
    if (file) {
      if (!ALLOWED_FILE_TYPES.includes(file.type)) {
        errs.file = "Attachment must be a PNG, JPG, or PDF file.";
      } else if (file.size > MAX_FILE_BYTES) {
        errs.file = "Attachment must be 10 MB or smaller.";
      }
    }
    return errs;
  }

  function handleFileChange(e) {
    const selected = e.target.files?.[0] ?? null;
    setFile(selected);
    setErrors((prev) => ({ ...prev, file: undefined }));
  }

  function clearFile() {
    setFile(null);
    if (fileInputRef.current) fileInputRef.current.value = "";
  }

  async function handleSubmit(e) {
    e.preventDefault();
    setFormError("");
    const validationErrors = validate();
    setErrors(validationErrors);
    if (Object.keys(validationErrors).length > 0) return;

    const formData = new FormData();
    formData.append("title", title.trim());
    formData.append("description", description.trim());
    formData.append("category", category);
    formData.append("priority", priority);
    if (file) formData.append("file", file);

    setSubmitting(true);
    try {
      await onSubmit(formData);
    } catch (err) {
      setFormError(err.message || "Could not submit the ticket. Please try again.");
    } finally {
      setSubmitting(false);
    }
  }

  return (
    <form className="flex flex-col gap-6" onSubmit={handleSubmit} noValidate>
      {/* 1. Title */}
      <div className="flex flex-col gap-2">
        <label htmlFor="title" className="text-xs font-medium text-on-surface">
          Title
        </label>
        <input
          id="title"
          value={title}
          onChange={(e) => setTitle(e.target.value)}
          placeholder="Brief summary of the issue"
          maxLength={TITLE_MAX}
          className={`w-full h-10 px-3 rounded-lg border outline-none transition-colors text-sm text-on-surface bg-surface-container-lowest focus:ring-2 focus:ring-primary/10 ${
            errors.title ? "border-error" : "border-outline-variant focus:border-primary"
          }`}
        />
        {errors.title && <p className="text-xs text-error">{errors.title}</p>}
      </div>

      {/* 2 & 3. Category + Priority */}
      <div className="grid grid-cols-1 sm:grid-cols-2 gap-5">
        <div className="flex flex-col gap-2">
          <label htmlFor="category" className="text-xs font-medium text-on-surface">
            Category
          </label>
          <select
            id="category"
            value={category}
            onChange={(e) => setCategory(e.target.value)}
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
          <label htmlFor="priority" className="text-xs font-medium text-on-surface">
            Priority
          </label>
          <select
            id="priority"
            value={priority}
            onChange={(e) => setPriority(e.target.value)}
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

      {/* 4. Description */}
      <div className="flex flex-col gap-2">
        <label htmlFor="description" className="text-xs font-medium text-on-surface">
          Description
        </label>
        <textarea
          id="description"
          value={description}
          onChange={(e) => setDescription(e.target.value)}
          placeholder="Include as much detail as possible: steps to reproduce, expected vs actual behavior, etc."
          rows={6}
          maxLength={DESC_MAX}
          className={`w-full px-3 py-2 rounded-lg border outline-none transition-colors text-sm text-on-surface bg-surface-container-lowest focus:ring-2 focus:ring-primary/10 resize-y ${
            errors.description ? "border-error" : "border-outline-variant focus:border-primary"
          }`}
        />
        {errors.description ? (
          <p className="text-xs text-error">{errors.description}</p>
        ) : (
          <p className="text-xs text-on-surface-variant">
            {description.trim().length}/{DESC_MAX} characters (min {DESC_MIN})
          </p>
        )}
      </div>

      {/* 5. Attachment */}
      <div className="flex flex-col gap-2">
        <label className="text-xs font-medium text-on-surface">Attachment (optional)</label>
        {!file ? (
          <button
            type="button"
            onClick={() => fileInputRef.current?.click()}
            className="flex flex-col items-center justify-center gap-2 border border-dashed border-outline-variant rounded-lg py-6 text-on-surface-variant hover:border-primary hover:text-primary transition-colors"
          >
            <Icon name="upload_file" size="24px" />
            <span className="text-sm">Click to upload a PNG, JPG, or PDF (max 10 MB)</span>
          </button>
        ) : (
          <div className="flex items-center justify-between gap-3 border border-outline-variant rounded-lg px-3 py-2">
            <div className="flex items-center gap-2 min-w-0">
              <Icon name="description" className="text-on-surface-variant" size="20px" />
              <span className="text-sm text-on-surface truncate">{file.name}</span>
              <span className="text-xs text-on-surface-variant shrink-0">{formatBytes(file.size)}</span>
            </div>
            <button
              type="button"
              onClick={clearFile}
              className="text-on-surface-variant hover:text-error transition-colors shrink-0"
            >
              <Icon name="close" size="18px" />
            </button>
          </div>
        )}
        <input
          ref={fileInputRef}
          type="file"
          accept=".png,.jpg,.jpeg,.pdf,image/png,image/jpeg,application/pdf"
          onChange={handleFileChange}
          className="hidden"
        />
        {errors.file && <p className="text-xs text-error">{errors.file}</p>}
      </div>

      {formError && (
        <p className="text-sm text-error bg-error-container/50 rounded-lg px-3 py-2" role="alert">
          {formError}
        </p>
      )}

      <div className="flex justify-end gap-3 pt-2">
        <Link
          to={cancelTo}
          className="h-10 px-4 rounded-lg border border-outline-variant text-on-surface-variant text-sm font-medium flex items-center hover:bg-surface-container-low transition-colors"
        >
          Cancel
        </Link>
        <button
          type="submit"
          disabled={submitting}
          className="h-10 px-5 rounded-lg bg-primary text-on-primary text-sm font-medium hover:bg-primary/90 transition-colors disabled:opacity-60"
        >
          {submitting ? "Submitting…" : submitLabel}
        </button>
      </div>
    </form>
  );
}
