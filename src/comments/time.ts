const MINUTE = 60_000;
const HOUR = 60 * MINUTE;
const DAY = 24 * HOUR;
const WEEK = 7 * DAY;

/** Short age for a comment: "just now", "5m", "3h", "2d", then a date. */
export function formatAge(at: number, now: number = Date.now()): string {
  const elapsed = now - at;
  if (elapsed < MINUTE) return 'just now';
  if (elapsed < HOUR) return `${Math.floor(elapsed / MINUTE)}m`;
  if (elapsed < DAY) return `${Math.floor(elapsed / HOUR)}h`;
  if (elapsed < WEEK) return `${Math.floor(elapsed / DAY)}d`;
  return new Date(at).toLocaleDateString(undefined, { day: 'numeric', month: 'short' });
}
