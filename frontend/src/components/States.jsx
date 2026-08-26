import Icon from "./Icon";

export function LoadingState({ label = "Loading…" }) {
  return (
    <div className="flex flex-col items-center justify-center gap-3 py-16 text-on-surface-variant">
      <div className="h-8 w-8 rounded-full border-2 border-outline-variant border-t-primary animate-spin" />
      <p className="text-sm">{label}</p>
    </div>
  );
}

export function EmptyState({ icon = "inbox", title, description, action }) {
  return (
    <div className="flex flex-col items-center justify-center gap-3 py-16 text-center px-4">
      <div className="w-14 h-14 rounded-full bg-surface-container-low flex items-center justify-center text-on-surface-variant">
        <Icon name={icon} size="28px" />
      </div>
      <h3 className="text-base font-semibold text-on-surface">{title}</h3>
      {description && <p className="text-sm text-on-surface-variant max-w-sm">{description}</p>}
      {action}
    </div>
  );
}

export function ErrorState({ message = "Something went wrong.", onRetry }) {
  return (
    <div className="flex flex-col items-center justify-center gap-3 py-16 text-center px-4">
      <div className="w-14 h-14 rounded-full bg-error-container/50 flex items-center justify-center text-error">
        <Icon name="error" size="28px" />
      </div>
      <p className="text-sm text-on-surface-variant max-w-sm">{message}</p>
      {onRetry && (
        <button
          type="button"
          onClick={onRetry}
          className="h-9 px-4 rounded-lg border border-outline-variant text-sm font-medium text-primary hover:bg-surface-container-low transition-colors"
        >
          Try again
        </button>
      )}
    </div>
  );
}
