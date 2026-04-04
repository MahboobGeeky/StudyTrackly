import _ from "lodash";

const TIMEZONE = "Asia/Kolkata";

/** Generates a stable YYYY-MM-DD from given date in Asia/Kolkata */
export function dateKeyTZ(date: Date | string | number): string {
  if (!date) return "";
  const d = new Date(date);
  if (Number.isNaN(d.getTime())) return "";
  return d.toLocaleDateString("en-CA", { timeZone: TIMEZONE });
}

/** Given a date string or Date object, Returns the exact Date for midnight in Asia/Kolkata */
export function startOfDayTZ(date: Date | string | number): Date {
  const dateStr = dateKeyTZ(date);
  // Construct absolute time for Midnight IST (+05:30)
  return new Date(`${dateStr}T00:00:00+05:30`);
}

/** Returns the exact Date for the very end of the day in Asia/Kolkata */
export function endOfDayTZ(date: Date | string | number): Date {
  const dateStr = dateKeyTZ(date);
  return new Date(`${dateStr}T23:59:59.999+05:30`);
}

/** Add arbitrary days while retaining exact timezone boundaries */
export function addDaysTZ(date: Date | string | number, days: number): Date {
  // Since IST does not observe Daylight Saving Time, we can safely perform direct +- 24 hours math:
  const ms = new Date(date).getTime();
  return new Date(ms + days * 24 * 60 * 60 * 1000);
}

/** Get calendar absolute boundaries for a specific string date (e.g. "2026-04-04") */
export function calendarDayRangeTZ(value: string | Date | number): { start: Date; end: Date } {
  let dateStr: string;
  if (_.isString(value) && /^([0-9]{4})-([0-9]{2})-([0-9]{2})/.test(value)) {
    dateStr = value.slice(0, 10);
  } else {
    dateStr = dateKeyTZ(value);
  }

  return {
    start: new Date(`${dateStr}T00:00:00+05:30`),
    end: new Date(`${dateStr}T23:59:59.999+05:30`)
  };
}
