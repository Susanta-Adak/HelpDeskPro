import Icon from "./Icon";

export default function Pagination({ page, pageSize, total, onPageChange }) {
  const totalPages = Math.max(1, Math.ceil(total / pageSize));
  const start = total === 0 ? 0 : (page - 1) * pageSize + 1;
  const end = Math.min(total, page * pageSize);

  return (
    <div className="p-4 border-t border-surface-variant flex items-center justify-between bg-surface-container-lowest">
      <p className="text-xs text-on-surface-variant">
        {total === 0 ? "No results" : `Showing ${start}-${end} of ${total}`}
      </p>
      <div className="flex gap-2">
        <button
          type="button"
          onClick={() => onPageChange(page - 1)}
          disabled={page <= 1}
          className="w-8 h-8 rounded border border-surface-variant flex items-center justify-center text-on-surface-variant hover:bg-surface-container-low disabled:opacity-50 disabled:cursor-not-allowed"
        >
          <Icon name="chevron_left" size="18px" />
        </button>
        <button
          type="button"
          onClick={() => onPageChange(page + 1)}
          disabled={page >= totalPages}
          className="w-8 h-8 rounded border border-surface-variant flex items-center justify-center text-on-surface-variant hover:bg-surface-container-low disabled:opacity-50 disabled:cursor-not-allowed"
        >
          <Icon name="chevron_right" size="18px" />
        </button>
      </div>
    </div>
  );
}
