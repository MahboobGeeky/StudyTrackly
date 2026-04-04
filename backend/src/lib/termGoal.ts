/** Inclusive calendar days from start → end (UTC date boundaries; matches session `date` storage). */
export function inclusiveTermDays(start: Date, end: Date): number {
  const s = Date.UTC(start.getUTCFullYear(), start.getUTCMonth(), start.getUTCDate());
  const e = Date.UTC(end.getUTCFullYear(), end.getUTCMonth(), end.getUTCDate());
  if (e < s) return 0;
  return Math.round((e - s) / (24 * 60 * 60 * 1000)) + 1;
}

/** Total study hours for the term = days × daily hours from dailyGoalMinutes. */
export function studyGoalHoursFromDaily(
  start: Date,
  end: Date,
  dailyGoalMinutes: number
): number {
  const days = inclusiveTermDays(start, end);
  const hours = (days * dailyGoalMinutes) / 60;
  return Math.round(hours * 100) / 100;
}
