export function statusLabel(status: string): string {
  return status.charAt(0).toUpperCase() + status.slice(1);
}

export function StatusBadge({ status }: { status: string }) {
  return <span className={`status status--${status}`}>{statusLabel(status)}</span>;
}
