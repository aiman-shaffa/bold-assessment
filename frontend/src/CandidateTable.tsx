import type { CandidateListItem } from "./api";
import { StatusBadge } from "./StatusBadge";

// Applied dates are calendar dates; format them in UTC so no time zone shifts the day.
const appliedFormat = new Intl.DateTimeFormat("en-GB", {
  day: "numeric",
  month: "short",
  year: "numeric",
  timeZone: "UTC",
});

function AppliedDate({ value }: { value: string | null }) {
  if (value === null) return <span className="muted">—</span>;
  return <time dateTime={value}>{appliedFormat.format(new Date(value))}</time>;
}

export function CandidateTable({ items }: { items: CandidateListItem[] }) {
  return (
    <div className="table-wrap">
      <table className="candidates">
        <caption className="visually-hidden">Candidates in the current scope</caption>
        <thead>
          <tr>
            <th scope="col">Name</th>
            <th scope="col">Email</th>
            <th scope="col">Region</th>
            <th scope="col">Role</th>
            <th scope="col">Status</th>
            <th scope="col">Applied</th>
            <th scope="col">Legacy ID</th>
          </tr>
        </thead>
        <tbody>
          {items.map((c) => (
            <tr key={c.id}>
              <td data-label="Name" className="candidates__name">
                {c.first_name} {c.last_name}
              </td>
              <td data-label="Email" className="candidates__email">
                {c.email}
              </td>
              <td data-label="Region">
                <span className="region">{c.region}</span>
              </td>
              <td data-label="Role">{c.desired_role ?? <span className="muted">—</span>}</td>
              <td data-label="Status">
                <StatusBadge status={c.status} />
              </td>
              <td data-label="Applied">
                <AppliedDate value={c.applied_date} />
              </td>
              <td data-label="Legacy ID" className="mono">
                {c.legacy_id}
              </td>
            </tr>
          ))}
        </tbody>
      </table>
    </div>
  );
}

export function CandidateTableSkeleton({ rows = 6 }: { rows?: number }) {
  return (
    <div className="table-wrap" aria-hidden="true">
      <div className="skeleton">
        {Array.from({ length: rows }, (_, i) => (
          <div key={i} className="skeleton__row" />
        ))}
      </div>
    </div>
  );
}
