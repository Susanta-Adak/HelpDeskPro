import { useState } from "react";
import { useNavigate, Link } from "react-router-dom";
import SupportLayout from "../../components/SupportLayout";
import { createTicket } from "../../api/ticketsApi";
import { extractErrorMessage } from "../../api/client";

const TITLE_MIN = 3;
const TITLE_MAX = 200;
const DESC_MIN = 10;
const DESC_MAX = 5000;

function validate({ title, description }) {
  const errors = {};
  const trimmedTitle = title.trim();
  const trimmedDesc = description.trim();

  if (!trimmedTitle) {
    errors.title = "Title is required.";
  } else if (trimmedTitle.length < TITLE_MIN) {
    errors.title = `Title must be at least ${TITLE_MIN} characters.`;
  } else if (trimmedTitle.length > TITLE_MAX) {
    errors.title = `Title must be at most ${TITLE_MAX} characters.`;
  }

  if (!trimmedDesc) {
    errors.description = "Description is required.";
  } else if (trimmedDesc.length < DESC_MIN) {
    errors.description = `Description must be at least ${DESC_MIN} characters.`;
  } else if (trimmedDesc.length > DESC_MAX) {
    errors.description = `Description must be at most ${DESC_MAX} characters.`;
  }

  return errors;
}

export default function CreateTicket() {
  const navigate = useNavigate();
  const [title, setTitle] = useState("");
  const [description, setDescription] = useState("");
  const [errors, setErrors] = useState({});
  const [formError, setFormError] = useState("");
  const [submitting, setSubmitting] = useState(false);

  async function handleSubmit(e) {
    e.preventDefault();
    setFormError("");
    const validationErrors = validate({ title, description });
    setErrors(validationErrors);
    if (Object.keys(validationErrors).length > 0) return;

    setSubmitting(true);
    try {
      const ticket = await createTicket({ title: title.trim(), description: description.trim() });
      navigate(`/tickets/${ticket.id}`, { replace: true });
    } catch (err) {
      setFormError(extractErrorMessage(err, "Could not create the ticket. Please try again."));
    } finally {
      setSubmitting(false);
    }
  }

  return (
    <SupportLayout>
      <div className="max-w-2xl mx-auto">
        <div className="mb-6">
          <Link to="/tickets" className="text-sm text-primary hover:underline">
            ← Back to My Tickets
          </Link>
        </div>
        <div className="bg-surface-container-lowest rounded-xl border border-surface-variant card-shadow p-6 md:p-8">
          <h2 className="text-xl font-semibold text-on-surface">Create New Ticket</h2>
          <p className="text-sm text-on-surface-variant mt-1 mb-6">
            Describe your issue and our support team will get back to you.
          </p>

          <form className="flex flex-col gap-5" onSubmit={handleSubmit} noValidate>
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
              {errors.title ? (
                <p className="text-xs text-error">{errors.title}</p>
              ) : (
                <p className="text-xs text-on-surface-variant">{title.trim().length}/{TITLE_MAX} characters</p>
              )}
            </div>

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

            {formError && (
              <p className="text-sm text-error bg-error-container/50 rounded-lg px-3 py-2" role="alert">
                {formError}
              </p>
            )}

            <div className="flex justify-end gap-3 pt-2">
              <Link
                to="/tickets"
                className="h-10 px-4 rounded-lg border border-outline-variant text-on-surface-variant text-sm font-medium flex items-center hover:bg-surface-container-low transition-colors"
              >
                Cancel
              </Link>
              <button
                type="submit"
                disabled={submitting}
                className="h-10 px-5 rounded-lg bg-primary text-on-primary text-sm font-medium hover:bg-primary/90 transition-colors disabled:opacity-60"
              >
                {submitting ? "Submitting…" : "Submit Ticket"}
              </button>
            </div>
          </form>
        </div>
      </div>
    </SupportLayout>
  );
}
