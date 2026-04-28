export function formatMinutes(total: number): string {
  const h = Math.floor(total / 60);
  const m = total % 60;
  if (h <= 0) return `${m}m`;
  return m > 0 ? `${h}h ${m}m` : `${h}h`;
}

/** Signed duration (e.g. gap, cumulative share price) */
export function formatSignedMinutes(total: number): string {
  const sign = total < 0 ? "-" : "";
  const abs = Math.abs(total);
  return sign + formatMinutes(abs);
}

export function parseDurationToMinutes(hours: number, minutes: number): number {
  return hours * 60 + minutes;
}

export function sessionDurationMinutes(
  start: string,
  end: string,
  breakM: number
): number {
  const [sh, sm] = start.split(":").map(Number);
  const [eh, em] = end.split(":").map(Number);
  let diff = eh * 60 + em - (sh * 60 + sm);
  if (diff < 0) diff += 24 * 60;
  return Math.max(0, diff - breakM);
}

export function formatTime12h(timeHHMM: string): string {
  const [hStr, mStr] = timeHHMM.split(":");
  const h = parseInt(hStr, 10);
  const m = parseInt(mStr, 10);
  const ampm = h >= 12 ? "PM" : "AM";
  const h12 = h % 12 || 12;
  return `${h12}:${String(m).padStart(2, "0")} ${ampm}`;
}
