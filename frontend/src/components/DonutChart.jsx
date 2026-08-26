import Icon from "./Icon";

const SIZE = 160;
const STROKE = 22;
const RADIUS = (SIZE - STROKE) / 2;
const CIRCUMFERENCE = 2 * Math.PI * RADIUS;
const GAP_DEGREES = 3;

export default function DonutChart({ segments, total }) {
  const visible = segments.filter((s) => s.value > 0);
  let offsetDegrees = -90;

  return (
    <div className="flex flex-col sm:flex-row items-center gap-6">
      <div className="relative shrink-0" style={{ width: SIZE, height: SIZE }}>
        <svg width={SIZE} height={SIZE} viewBox={`0 0 ${SIZE} ${SIZE}`}>
          <circle
            cx={SIZE / 2}
            cy={SIZE / 2}
            r={RADIUS}
            fill="none"
            stroke="var(--color-surface-container-low)"
            strokeWidth={STROKE}
          />
          {total > 0 &&
            visible.map((segment) => {
              const fraction = segment.value / total;
              const arcDegrees = fraction * 360;
              const drawDegrees = Math.max(arcDegrees - GAP_DEGREES, 0);
              const dash = (drawDegrees / 360) * CIRCUMFERENCE;
              const el = (
                <circle
                  key={segment.key}
                  cx={SIZE / 2}
                  cy={SIZE / 2}
                  r={RADIUS}
                  fill="none"
                  stroke={segment.color}
                  strokeWidth={STROKE}
                  strokeLinecap="round"
                  strokeDasharray={`${dash} ${CIRCUMFERENCE - dash}`}
                  transform={`rotate(${offsetDegrees} ${SIZE / 2} ${SIZE / 2})`}
                >
                  <title>
                    {segment.label}: {segment.value} ({Math.round(fraction * 100)}%)
                  </title>
                </circle>
              );
              offsetDegrees += arcDegrees;
              return el;
            })}
        </svg>
        <div className="absolute inset-0 flex flex-col items-center justify-center">
          <span className="text-2xl font-bold text-on-surface tabular-nums">{total}</span>
          <span className="text-[11px] text-on-surface-variant uppercase tracking-wider">Total</span>
        </div>
      </div>

      <div className="flex flex-col gap-2 w-full">
        {segments.map((segment) => {
          const pct = total > 0 ? Math.round((segment.value / total) * 100) : 0;
          return (
            <div key={segment.key} className="flex items-center gap-2 text-sm">
              <span
                className="w-2.5 h-2.5 rounded-full shrink-0"
                style={{ backgroundColor: segment.color }}
                aria-hidden="true"
              />
              <Icon name={segment.icon} className="text-on-surface-variant" size="16px" />
              <span className="text-on-surface-variant flex-1">{segment.label}</span>
              <span className="font-semibold text-on-surface tabular-nums">{segment.value}</span>
              <span className="text-on-surface-variant text-xs tabular-nums w-9 text-right">{pct}%</span>
            </div>
          );
        })}
      </div>
    </div>
  );
}
