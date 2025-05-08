import { STATUSES, type Status } from "./api";
import { statusLabel } from "./StatusBadge";

export function CandidateFilters({
  search,
  onSearchChange,
  status,
  onStatusChange,
}: {
  search: string;
  onSearchChange: (search: string) => void;
  status: Status | null;
  onStatusChange: (status: Status | null) => void;
}) {
  return (
    <div className="filters" role="search">
      <label className="field field--search">
        <span className="field__label">Search</span>
        <input
          type="search"
          value={search}
          placeholder="Name, email or role"
          maxLength={200}
          onChange={(event) => onSearchChange(event.target.value)}
        />
      </label>
      <label className="field">
        <span className="field__label">Status</span>
        <select
          value={status ?? ""}
          onChange={(event) => onStatusChange((event.target.value || null) as Status | null)}
        >
          <option value="">All statuses</option>
          {STATUSES.map((s) => (
            <option key={s} value={s}>
              {statusLabel(s)}
            </option>
          ))}
        </select>
      </label>
    </div>
  );
}
