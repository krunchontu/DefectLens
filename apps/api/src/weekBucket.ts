/**
 * Monday-start ISO week bucketing utility.
 *
 * Given a Date, returns the ISO date string (YYYY-MM-DD) of the Monday
 * that starts the ISO week containing that date.
 * Uses UTC to ensure deterministic behavior regardless of local timezone.
 */
export function getWeekStart(date: Date): string {
  const d = new Date(date);
  // getUTCDay(): 0=Sun, 1=Mon, ..., 6=Sat
  // For ISO weeks, Monday is the first day.
  const day = d.getUTCDay();
  // Offset to get back to Monday: Sunday (0) -> -6, Mon (1) -> 0, Tue (2) -> -1, etc.
  const diff = day === 0 ? -6 : 1 - day;
  d.setUTCDate(d.getUTCDate() + diff);
  // Return YYYY-MM-DD
  const year = d.getUTCFullYear();
  const month = String(d.getUTCMonth() + 1).padStart(2, "0");
  const dayOfMonth = String(d.getUTCDate()).padStart(2, "0");
  return `${year}-${month}-${dayOfMonth}`;
}
