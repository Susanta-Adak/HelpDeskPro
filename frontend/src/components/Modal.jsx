import Icon from "./Icon";

export default function Modal({
  title,
  description,
  confirmLabel = "Confirm",
  cancelLabel = "Cancel",
  danger = false,
  busy = false,
  onConfirm,
  onCancel,
}) {
  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/40 p-4">
      <div className="w-full max-w-sm bg-surface-container-lowest rounded-xl border border-surface-variant shadow-lg p-6 flex flex-col gap-4">
        <div className="flex items-start gap-3">
          {danger && (
            <div className="w-10 h-10 shrink-0 rounded-full bg-error-container/50 text-error flex items-center justify-center">
              <Icon name="warning" />
            </div>
          )}
          <div>
            <h3 className="text-lg font-semibold text-on-surface">{title}</h3>
            {description && (
              <p className="text-sm text-on-surface-variant mt-1">{description}</p>
            )}
          </div>
        </div>
        <div className="flex justify-end gap-3 mt-2">
          <button
            type="button"
            onClick={onCancel}
            disabled={busy}
            className="h-9 px-4 rounded-lg border border-outline-variant text-on-surface-variant text-sm font-medium hover:bg-surface-container-low transition-colors disabled:opacity-50"
          >
            {cancelLabel}
          </button>
          <button
            type="button"
            onClick={onConfirm}
            disabled={busy}
            className={`h-9 px-4 rounded-lg text-sm font-medium transition-colors disabled:opacity-50 ${
              danger
                ? "bg-error text-on-error hover:bg-error/90"
                : "bg-primary text-on-primary hover:bg-primary/90"
            }`}
          >
            {busy ? "Please wait…" : confirmLabel}
          </button>
        </div>
      </div>
    </div>
  );
}
