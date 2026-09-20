/** Inclusive calendar days from start → end (UTC date boundaries; matches session `date` storage). */
export function inclusiveTermDays(start, end) {
  const s = Date.UTC(start.getUTCFullYear(), start.getUTCMonth(), start.getUTCDate());
  const e = Date.UTC(end.getUTCFullYear(), end.getUTCMonth(), end.getUTCDate());
  if (e < s) return 0;
  return Math.round((e - s) / (24 * 60 * 60 * 1000)) + 1;
}

/** Total study hours for the term = days × daily hours from dailyGoalMinutes. */
export function studyGoalHoursFromDaily(start, end, dailyGoalMinutes) {
  const days = inclusiveTermDays(start, end);
  const hours = (days * dailyGoalMinutes) / 60;
  return Math.round(hours * 100) / 100;
}
