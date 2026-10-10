// CSV export with proper escaping, BOM for Excel, and formula-injection guard.

import type { SurveyRecord } from "./types";

const COLUMNS = [
  "id",
  "name",
  "households",
  "latitude",
  "longitude",
  "accuracy_m",
  "location_status",
  "captured_at",
] as const;

/**
 * Escape a single cell value. Numbers are emitted as-is (so negative
 * latitudes/longitudes are preserved). Text values that could be interpreted
 * as a spreadsheet formula are prefixed with a single quote.
 */
function cell(value: unknown): string {
  if (value === null || value === undefined) return "";

  // Numbers: emit as-is, no escaping. (Negative lat/long are valid.)
  if (typeof value === "number") {
    if (Number.isFinite(value)) return String(value);
    return "";
  }

  let s = String(value);

  // Formula-injection guard for text columns only.
  if (/^[=+\-@\t\r]/.test(s)) {
    s = "'" + s;
  }

  if (/[",\n\r]/.test(s)) {
    s = '"' + s.replace(/"/g, '""') + '"';
  }
  return s;
}

/** Build the CSV body (with UTF-8 BOM) for the given records. */
export function buildCsv(rows: SurveyRecord[]): string {
  const lines: string[] = [COLUMNS.join(",")];
  for (const r of rows) {
    lines.push(COLUMNS.map((c) => cell(r[c])).join(","));
  }
  // Prepend BOM so Excel opens UTF-8 names correctly.
  return "\uFEFF" + lines.join("\r\n");
}

/** Generate the file name: survey-export-YYYY-MM-DD-HHmm.csv */
export function csvFileName(d: Date = new Date()): string {
  const pad = (n: number) => String(n).padStart(2, "0");
  return `survey-export-${d.getFullYear()}-${pad(d.getMonth() + 1)}-${pad(
    d.getDate(),
  )}-${pad(d.getHours())}${pad(d.getMinutes())}.csv`;
}

/**
 * Trigger a CSV download. Falls back to opening in a new tab if the
 * download attribute approach is blocked.
 */
export function downloadCsv(rows: SurveyRecord[]): boolean {
  if (typeof document === "undefined") return false;
  const body = buildCsv(rows);
  const blob = new Blob([body], { type: "text/csv;charset=utf-8" });
  const url = URL.createObjectURL(blob);
  const a = document.createElement("a");
  a.href = url;
  a.download = csvFileName();
  a.rel = "noopener";
  document.body.appendChild(a);
  a.click();
  a.remove();
  setTimeout(() => URL.revokeObjectURL(url), 1000);
  return true;
}
