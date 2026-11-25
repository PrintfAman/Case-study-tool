/**
 * FORMATTING HELPERS
 * ------------------
 * Presentation logic that several panels share. Keeping it here stops each
 * component inventing its own uptime string, and makes the rules testable.
 */

/** 3725 -> "1h 02m" ; 185 -> "3m 05s" ; 42 -> "42s" */
export function formatUptime(totalSeconds: number): string {
  const safeSeconds = Math.max(0, Math.floor(totalSeconds));

  const hours = Math.floor(safeSeconds / 3600);
  const minutes = Math.floor((safeSeconds % 3600) / 60);
  const seconds = safeSeconds % 60;

  const pad = (value: number) => String(value).padStart(2, '0');

  if (hours > 0) return `${hours}h ${pad(minutes)}m`;
  if (minutes > 0) return `${minutes}m ${pad(seconds)}s`;
  return `${seconds}s`;
}

/** A local clock time, e.g. "17:42:09". */
export function formatClockTime(date: Date): string {
  return date.toLocaleTimeString([], {
    hour: '2-digit',
    minute: '2-digit',
    second: '2-digit',
  });
}

/** Bytes-per-megabyte values arrive already rounded; this only adds the unit. */
export function formatMegabytes(value: number): string {
  return `${value.toFixed(1)} MB`;
}

/** Milliseconds, with a floor so a very fast call reads "1 ms" not "0 ms". */
export function formatMilliseconds(value: number): string {
  return `${Math.max(1, Math.round(value))} ms`;
}
