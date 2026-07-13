/**
 * Format a date as DD/MM/YYYY (per UAT).
 * Returns "-" if value is null/undefined/invalid.
 */
export function formatDate(value: string | Date | null | undefined): string {
  if (!value) return "-";
  const d = new Date(value);
  if (isNaN(d.getTime())) return "-";
  const dd = String(d.getDate()).padStart(2, "0");
  const mm = String(d.getMonth() + 1).padStart(2, "0");
  return `${dd}/${mm}/${d.getFullYear()}`;
}

/**
 * Format a date as DD/MM/YYYY HH:MM (per UAT).
 * Returns "-" if value is null/undefined/invalid.
 */
export function formatDateTime(value: string | Date | null | undefined): string {
  if (!value) return "-";
  const d = new Date(value);
  if (isNaN(d.getTime())) return "-";
  const hh = String(d.getHours()).padStart(2, "0");
  const min = String(d.getMinutes()).padStart(2, "0");
  return `${formatDate(d)} ${hh}:${min}`;
}

/**
 * Format an enum-style string for display: SOME_VALUE -> Some Value
 */
export function formatEnum(value: string | null | undefined): string {
  if (!value) return "-";
  return value
    .replace(/_/g, " ")
    .toLowerCase()
    .replace(/\b\w/g, (c) => c.toUpperCase());
}
