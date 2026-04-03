/** Inclusive calendar days from start → end (local midnight boundaries). */
export function inclusiveTermDays(start: Date, end: Date): number {
  const s = new Date(start);
  s.setHours(0, 0, 0, 0);
  const e = new Date(end);
  e.setHours(0, 0, 0, 0);
  if (e.getTime() < s.getTime()) return 0;
  return Math.round((e.getTime() - s.getTime()) / (24 * 60 * 60 * 1000)) + 1;
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
