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

export { STATUS_LABELS };
