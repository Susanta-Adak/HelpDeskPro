import { getInitials } from "../lib/user";

const SIZES = {
  xs: "w-6 h-6 text-[10px]",
  sm: "w-8 h-8 text-xs",
  md: "w-10 h-10 text-sm",
};

export default function Avatar({ name, size = "sm", className = "" }) {
  return (
    <div
      className={`rounded-full bg-primary-fixed text-primary flex items-center justify-center font-semibold shrink-0 ${SIZES[size]} ${className}`}
      aria-hidden="true"
    >
      {getInitials(name)}
    </div>
  );
}
