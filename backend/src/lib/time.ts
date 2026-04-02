/** Parse "HH:mm" to minutes from midnight */
export function parseTimeToMinutes(t: string): number {
  const [h, m] = t.split(":").map(Number);
  if (Number.isNaN(h) || Number.isNaN(m)) return 0;
  return h * 60 + m;
}

export function sessionDurationMinutes(
  startTime: string,
  endTime: string,
  breakMinutes: number
): number {
  const start = parseTimeToMinutes(startTime);
  const end = parseTimeToMinutes(endTime);
  let diff = end - start;
  if (diff < 0) diff += 24 * 60;
  return Math.max(0, diff - breakMinutes);
}

export function formatMinutes(m: number): { hours: number; minutes: number; label: string } {
  const hours = Math.floor(m / 60);
  const minutes = m % 60;
  const label =
    hours > 0 ? `${hours}h ${minutes > 0 ? `${minutes}m` : ""}`.trim() : `${minutes}m`;
  return { hours, minutes, label };
}
