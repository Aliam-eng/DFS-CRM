/**
 * Format a date string or Date to locale date string.
 * Returns "-" if value is null/undefined.
 */
export function formatDate(value: string | Date | null | undefined): string {
  if (!value) return "-";
  return new Date(value).toLocaleDateString();
}

/**
 * Format a date string or Date to locale date+time string.
 * Returns "-" if value is null/undefined.
 */
export function formatDateTime(value: string | Date | null | undefined): string {
  if (!value) return "-";
  return new Date(value).toLocaleString();
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
