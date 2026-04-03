import { useCallback, useEffect, useMemo, useRef, useState } from "react";
import { useOutletContext } from "react-router-dom";
import {
  Bar,
  BarChart,
  CartesianGrid,
  ResponsiveContainer,
  Tooltip,
  XAxis,
  YAxis,
} from "recharts";
import { format } from "date-fns";
import { Header } from "@/components/Header";
import type { AppOutletContext } from "@/layouts/outletContext";
import { api } from "@/lib/api";
import { formatMinutes, formatSignedMinutes, sessionDurationMinutes } from "@/lib/format";
import type { SessionRow, StudyDayRow, Term } from "@/types";

function todayKey() {
  const d = new Date();
  const y = d.getFullYear();
  const m = String(d.getMonth() + 1).padStart(2, "0");
  const day = String(d.getDate()).padStart(2, "0");
  return `${y}-${m}-${day}`;
}

export function CalendarPage() {
  const { stats } = useOutletContext<AppOutletContext>();
  const [term, setTerm] = useState<Term | null>(null);
  const [sessions, setSessions] = useState<SessionRow[]>([]);
  const [selected, setSelected] = useState<string | null>(null);
  const [studyRows, setStudyRows] = useState<StudyDayRow[]>([]);
  const todayRowRef = useRef<HTMLTableRowElement | null>(null);

  const load = useCallback(async () => {
    const t = await api<Term | null>("/api/terms/active");
    setTerm(t);
    if (!t) return;
    const [ss, sd] = await Promise.all([
      api<SessionRow[]>(`/api/sessions?termId=${t.id}`),
      api<{ rows: StudyDayRow[] }>(`/api/study-days?termId=${t.id}`),
    ]);
    setSessions(ss);
    setStudyRows(sd.rows);
  }, []);

  useEffect(() => {
    void load();
  }, [load]);

  useEffect(() => {
    if (sessions.length && !selected) setSelected(sessions[0].id);
  }, [sessions, selected]);

  const bars = useMemo(() => {
    const map = new Map<string, number>();
    for (const s of sessions) {
      const key = format(new Date(s.date), "yyyy-MM-dd");
      const m = sessionDurationMinutes(s.startTime, s.endTime, s.breakMinutes);
      map.set(key, (map.get(key) ?? 0) + m);
    }
    return [...map.entries()]
      .sort(([a], [b]) => a.localeCompare(b))
      .slice(-14)
      .map(([label, minutes]) => ({
        label,
        hours: Math.round((minutes / 60) * 10) / 10,
      }));
  }, [sessions]);

  const sel = sessions.find((s) => s.id === selected);
  const dayKey = sel ? format(new Date(sel.date), "yyyy-MM-dd") : null;
  const daySessions = sessions.filter(
    (s) => dayKey && format(new Date(s.date), "yyyy-MM-dd") === dayKey
  );

  const tKey = todayKey();

  const goToday = () => {
    todayRowRef.current?.scrollIntoView({ behavior: "smooth", block: "center" });
  };

  async function adjustGoal(dateKey: string, delta: number) {
    if (!term) return;
    await api("/api/study-days/adjust-goal", {
      method: "POST",
      body: JSON.stringify({ termId: term.id, dateKey, deltaMinutes: delta }),
    });
    await load();
  }

  const studyDaysLabel = `${stats?.progress?.distinctStudyDays ?? 0}/${stats?.progress?.studyDaysTarget ?? 50}`;

  return (
    <>
      <Header title="Calendar" stats={stats} />
      <main className="flex min-h-0 flex-1 flex-col overflow-auto p-6">
        <div className="grid gap-6 xl:grid-cols-[1fr_minmax(260px,320px)] xl:items-start">
          <div className="min-w-0 space-y-4">
            <div className="flex flex-wrap items-center justify-between gap-2">
              <div className="flex flex-wrap gap-2 text-[0.8125rem]">
                {["Days", "Weeks", "Months"].map((t, i) => (
                  <span
                    key={t}
                    className={
                      i === 0
                        ? "rounded-full bg-slate-800 px-3 py-1.5 text-white"
                        : "text-slate-500"
                    }
                  >
                    {t}
                  </span>
                ))}
              </div>
            </div>

            <div className="rounded-2xl border border-slate-800 bg-slate-900/50 p-4">
              <p className="text-[0.9375rem] font-medium">Study time (recent days)</p>
              <div className="mt-4 h-64">
                <ResponsiveContainer width="100%" height="100%">
                  <BarChart data={bars}>
                    <CartesianGrid stroke="#1e293b" vertical={false} />
                    <XAxis dataKey="label" stroke="#64748b" tick={{ fontSize: 11 }} />
                    <YAxis stroke="#64748b" tick={{ fontSize: 11 }} />
                    <Tooltip
                      contentStyle={{
                        background: "#0f172a",
                        border: "1px solid #334155",
                        borderRadius: 8,
                        fontSize: 12,
                      }}
                    />
                    <Bar dataKey="hours" fill="#3b82f6" radius={[4, 4, 0, 0]} />
                  </BarChart>
                </ResponsiveContainer>
              </div>
            </div>
          </div>

          <aside className="flex w-full flex-col gap-4 xl:max-w-sm xl:justify-self-end">
            <div className="rounded-2xl border border-slate-800 bg-slate-900/50 p-4">
              <p className="text-[0.8125rem] text-slate-500">
                {sel
                  ? `${format(new Date(sel.date), "dd/MM/yy")} • ${format(new Date(sel.date), "EEEE")}`
                  : "Select a row"}
              </p>
              <p className="mt-2 text-[0.9375rem] font-medium text-slate-100">
                Sessions • {daySessions.length}
              </p>
              <ul className="mt-3 space-y-3">
                {daySessions.map((s) => {
                  const mins = sessionDurationMinutes(
                    s.startTime,
                    s.endTime,
                    s.breakMinutes
                  );
                  return (
                    <li
                      key={s.id}
                      className="rounded-lg border border-slate-800 bg-slate-950/60 p-3 text-[0.8125rem]"
                      onClick={() => setSelected(s.id)}
                    >
                      <div className="flex items-center justify-between gap-2">
                        <span className="text-xs text-orange-300">{s.course.name}</span>
                        <span className="text-xs text-slate-500">
                          {s.startTime} – {s.endTime}
                        </span>
                      </div>
                      <p className="mt-1 text-slate-400">{formatMinutes(mins)}</p>
                      {s.note && <p className="mt-1 text-xs text-slate-500">{s.note}</p>}
                    </li>
                  );
                })}
              </ul>
            </div>
            <div className="rounded-2xl border border-slate-800 bg-slate-900/50 p-4">
              <p className="text-[0.9375rem] font-medium">Badges • 1</p>
              <p className="mt-2 text-[0.8125rem] text-slate-400">
                You&apos;ve maintained a streak of {stats?.streak ?? 0} days!
              </p>
            </div>
          </aside>

          <div className="col-span-full min-w-0 overflow-hidden rounded-2xl border border-slate-800 bg-slate-900/40">
            <div className="flex flex-wrap items-center justify-between gap-2 border-b border-slate-800 px-4 py-3">
              <p className="text-[0.9375rem] font-semibold text-slate-100">
                Study days • {studyDaysLabel}
              </p>
              <button
                type="button"
                onClick={goToday}
                className="text-[0.8125rem] font-medium text-blue-400 hover:underline"
              >
                Go to today
              </button>
            </div>
            <div className="overflow-x-auto">
              <table className="w-full min-w-[960px] text-left text-[0.9375rem]">
                <thead className="sticky top-0 z-10 border-b border-slate-800 bg-slate-950/95 text-[0.7rem] font-semibold uppercase tracking-wide text-slate-500">
                  <tr>
                    <th className="px-3 py-2.5">
                      <input type="checkbox" disabled className="rounded border-slate-600" />
                    </th>
                    <th className="px-3 py-2.5">Badges</th>
                    <th className="px-3 py-2.5">Date ↑</th>
                    <th className="px-3 py-2.5">Duration</th>
                    <th className="px-3 py-2.5">Goal</th>
                    <th className="px-3 py-2.5">Gap to goal</th>
                    <th className="px-3 py-2.5">Share price</th>
                    <th className="px-3 py-2.5">Progress</th>
                  </tr>
                </thead>
                <tbody>
                  {studyRows.map((row) => {
                    const isToday = row.dateKey === tKey;
                    const d = new Date(row.dateKey + "T12:00:00");
                    const showTrophy = row.progressPct >= 100;
                    const showFire = isToday && (stats?.streak ?? 0) > 0;
                    return (
                      <tr
                        key={row.dateKey}
                        ref={isToday ? todayRowRef : undefined}
                        className={`border-b border-slate-800/80 ${
                          isToday ? "bg-sky-950/40" : "hover:bg-slate-900/50"
                        }`}
                      >
                        <td className="px-3 py-2.5">
                          <input type="checkbox" className="rounded border-slate-600" />
                        </td>
                        <td className="px-3 py-2.5 text-lg">
                          {showTrophy || showFire ? (
                            <>
                              {showTrophy ? "🏆" : null}
                              {showFire ? <span className="ml-0.5">🔥</span> : null}
                            </>
                          ) : (
                            <span className="text-slate-600">—</span>
                          )}
                        </td>
                        <td className="px-3 py-2.5">
                          <span className="inline-block rounded-full bg-slate-800 px-2.5 py-1 text-sky-300">
                            {format(d, "dd/MM/yy")}
                          </span>
                        </td>
                        <td className="px-3 py-2.5 font-semibold text-slate-100">
                          {formatMinutes(row.durationMinutes)}
                        </td>
                        <td className="px-3 py-2.5">
                          <div className="group relative inline-flex min-w-[7rem] items-center justify-center gap-1">
                            <span className="text-slate-300">
                              {formatMinutes(row.goalMinutes)}
                            </span>
                            <div className="pointer-events-none absolute -top-6 left-1/2 z-20 flex -translate-x-1/2 gap-1 opacity-0 transition group-hover:pointer-events-auto group-hover:opacity-100">
                              <button
                                type="button"
                                className="pointer-events-auto rounded-md border border-slate-600 bg-slate-800 px-2 py-0.5 text-xs hover:bg-slate-700"
                                onClick={() => void adjustGoal(row.dateKey, -10)}
                                aria-label="Decrease goal 10 minutes"
                              >
                                −
                              </button>
                              <button
                                type="button"
                                className="pointer-events-auto rounded-md border border-slate-600 bg-slate-800 px-2 py-0.5 text-xs hover:bg-slate-700"
                                onClick={() => void adjustGoal(row.dateKey, 10)}
                                aria-label="Increase goal 10 minutes"
                              >
                                +
                              </button>
                            </div>
                          </div>
                        </td>
                        <td className="px-3 py-2.5">
                          <span
                            className={`inline-block rounded-full px-2 py-0.5 text-[0.8125rem] font-medium ${
                              row.gapMinutes < 0
                                ? "bg-red-500/15 text-red-300"
                                : row.gapMinutes > 0
                                  ? "bg-emerald-500/15 text-emerald-300"
                                  : "bg-slate-700/40 text-slate-300"
                            }`}
                          >
                            {formatSignedMinutes(row.gapMinutes)}
                          </span>
                        </td>
                        <td className="px-3 py-2.5 text-slate-300">
                          {formatSignedMinutes(row.sharePriceMinutes)}
                        </td>
                        <td className="px-3 py-2.5">
                          <div className="flex items-center gap-2">
                            <div className="h-2 flex-1 max-w-[120px] overflow-hidden rounded-full bg-slate-800">
                              <div
                                className="h-full rounded-full bg-emerald-500"
                                style={{ width: `${Math.min(100, row.progressPct)}%` }}
                              />
                            </div>
                            <span className="w-10 text-right font-semibold text-slate-100">
                              {Math.round(row.progressPct)}%
                            </span>
                          </div>
                        </td>
                      </tr>
                    );
                  })}
                </tbody>
              </table>
            </div>
          </div>
        </div>
      </main>
    </>
  );
}
