// Small, dependency-light formatting helpers.

/** Format an ISO 8601 string for display in the record list. */
export function formatTimestamp(iso: string): string {
  try {
    const d = new Date(iso);
    if (Number.isNaN(d.getTime())) return iso;
    return d.toLocaleString(undefined, {
      year: "numeric",
      month: "short",
      day: "2-digit",
      hour: "2-digit",
      minute: "2-digit",
      second: "2-digit",
    });
  } catch {
    return iso;
  }
}

/** Short relative time, e.g. "3m ago", "2h ago", "just now". */
export function formatRelative(iso: string): string {
  try {
    const d = new Date(iso).getTime();
    if (Number.isNaN(d)) return "";
    const diffMs = Date.now() - d;
    const sec = Math.round(diffMs / 1000);
    if (sec < 5) return "just now";
    if (sec < 60) return `${sec}s ago`;
    const min = Math.round(sec / 60);
    if (min < 60) return `${min}m ago`;
    const hr = Math.round(min / 60);
    if (hr < 24) return `${hr}h ago`;
    const day = Math.round(hr / 24);
    if (day < 7) return `${day}d ago`;
    return formatTimestamp(iso);
  } catch {
    return "";
  }
}

/** Short decimal-degree format like "22.5958, 88.2636" or "—" when null. */
export function formatLatLng(lat: number | null, lon: number | null): string {
  if (lat == null || lon == null) return "—";
  return `${lat.toFixed(4)}, ${lon.toFixed(4)}`;
}
