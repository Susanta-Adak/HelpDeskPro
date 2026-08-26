import Icon from "./Icon";

const ACCENTS = {
  primary: "bg-primary/10 text-primary",
  error: "bg-error-container/50 text-error",
  tertiary: "bg-tertiary-container/10 text-tertiary",
  secondary: "bg-secondary-container/30 text-secondary",
};

export default function StatCard({ label, value, icon, accent = "primary" }) {
  return (
    <div className="bg-surface-container-lowest rounded-xl p-4 border border-surface-variant card-shadow flex items-center justify-between gap-4">
      <div>
        <p className="text-[11px] font-semibold uppercase tracking-wider text-on-surface-variant">
          {label}
        </p>
        <p className="text-4xl font-bold text-on-background mt-2 tabular-nums">{value}</p>
      </div>
      <div className={`w-10 h-10 shrink-0 rounded-full flex items-center justify-center ${ACCENTS[accent]}`}>
        <Icon name={icon} />
      </div>
    </div>
  );
}
