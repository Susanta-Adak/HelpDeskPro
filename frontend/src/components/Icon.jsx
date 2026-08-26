export default function Icon({ name, className = "", fill = false, size }) {
  return (
    <span
      className={`material-symbols-outlined ${className}`}
      data-fill={fill ? "1" : "0"}
      style={size ? { fontSize: size } : undefined}
      aria-hidden="true"
    >
      {name}
    </span>
  );
}
