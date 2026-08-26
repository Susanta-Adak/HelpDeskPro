const STATUS_STYLES = {
  open: "bg-primary/10 text-primary",
  in_progress: "bg-tertiary-container/10 text-tertiary",
  closed: "bg-surface-variant text-on-surface-variant",
};

const STATUS_LABELS = {
  open: "Open",
  in_progress: "In Progress",
  closed: "Closed",
};

export default function StatusBadge({ status, className = "" }) {
  const style = STATUS_STYLES[status] ?? "bg-surface-variant text-on-surface-variant";
  const label = STATUS_LABELS[status] ?? status;
  return (
    <span
      className={`inline-flex items-center px-2 py-1 rounded-full font-semibold text-[11px] leading-[14px] whitespace-nowrap ${style} ${className}`}
    >
      {label}
    </span>
  );
}

const PRIORITY_STYLES = {
  high: "text-error",
  medium: "text-tertiary",
  low: "text-on-surface-variant",
};

const PRIORITY_ICONS = {
  high: "arrow_upward",
  medium: "horizontal_rule",
  low: "arrow_downward",
};

const PRIORITY_LABELS = {
  high: "High",
  medium: "Medium",
  low: "Low",
};

export function PriorityBadge({ priority, className = "" }) {
  const style = PRIORITY_STYLES[priority] ?? "text-on-surface-variant";
  const icon = PRIORITY_ICONS[priority] ?? "horizontal_rule";
  const label = PRIORITY_LABELS[priority] ?? priority;
  return (
    <span className={`inline-flex items-center gap-1 text-xs font-medium ${style} ${className}`}>
      <span className="material-symbols-outlined" style={{ fontSize: "16px" }}>
        {icon}
      </span>
      {label}
    </span>
  );
}

export { STATUS_LABELS };
