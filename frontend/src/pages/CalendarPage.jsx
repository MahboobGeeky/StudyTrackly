import { useCallback, useEffect, useRef, useState } from "react";
import { useOutletContext } from "react-router-dom";
import { format } from "date-fns";
import { Header } from "@/components/Header";
import { api } from "@/lib/api";
import { formatMinutes, formatSignedMinutes } from "@/lib/format";

function todayKey() {
  const d = new Date();
  const y = d.getFullYear();
  const m = String(d.getMonth() + 1).padStart(2, "0");
  const day = String(d.getDate()).padStart(2, "0");
  return `${y}-${m}-${day}`;
}

export function CalendarPage() {
  const { stats } = useOutletContext();
  const [term, setTerm] = useState(null);
  const [studyRows, setStudyRows] = useState([]);
  const todayRowRef = useRef(null);

  const load = useCallback(async () => {
    const t = await api("/api/terms/active");
    setTerm(t);
    if (!t) return;
    const sd = await api(`/api/study-days?termId=${t.id}`);
    setStudyRows(sd.rows);
  }, []);

  useEffect(() => { void load(); }, [load]);

  const tKey = todayKey();
  const goToday = () => todayRowRef.current?.scrollIntoView({ behavior: "smooth", block: "center" });

  async function adjustGoal(dateKey, delta) {
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
        <div className="min-w-0 overflow-hidden rounded-2xl border border-slate-800 bg-slate-900/40">
          <div className="flex flex-wrap items-center justify-between gap-2 border-b border-slate-800 px-4 py-3">
            <p className="text-[0.9375rem] font-semibold text-slate-100">Study days • {studyDaysLabel}</p>
            <button type="button" onClick={goToday} className="text-[0.8125rem] font-medium text-blue-400 hover:underline">
              Go to today
            </button>
          </div>
          <div className="overflow-x-auto">
            <table className="w-full min-w-240 text-left text-[0.9375rem]">
              <thead className="sticky top-0 z-10 border-b border-slate-800 bg-slate-950/95 text-[0.7rem] font-semibold uppercase tracking-wide text-slate-500">
                <tr>
                  <th className="px-3 py-2.5"><input type="checkbox" disabled className="rounded border-slate-600" /></th>
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
                    <tr key={row.dateKey} ref={isToday ? todayRowRef : undefined}
                      className={`border-b border-slate-800/80 ${isToday ? "bg-sky-950/40" : "hover:bg-slate-900/50"}`}>
                      <td className="px-3 py-2.5"><input type="checkbox" className="rounded border-slate-600" /></td>
                      <td className="px-3 py-2.5 text-lg">
                        {showTrophy || showFire ? (
                          <>{showTrophy ? "🏆" : null}{showFire ? <span className="ml-0.5">🔥</span> : null}</>
                        ) : (
                          <span className="text-slate-600">—</span>
                        )}
                      </td>
                      <td className="px-3 py-2.5">
                        <span className="inline-block rounded-full bg-slate-800 px-2.5 py-1 text-sky-300">
                          {format(d, "dd/MM/yy")}
                        </span>
                      </td>
                      <td className="px-3 py-2.5 font-semibold text-slate-100">{formatMinutes(row.durationMinutes)}</td>
                      <td className="px-3 py-2.5">
                        <div className="group relative inline-flex min-w-28 items-center justify-center gap-1">
                          <span className="text-slate-300">{formatMinutes(row.goalMinutes)}</span>
                          <div className="pointer-events-none absolute -top-6 left-1/2 z-20 flex -translate-x-1/2 gap-1 opacity-0 transition group-hover:pointer-events-auto group-hover:opacity-100">
                            <button type="button" className="pointer-events-auto rounded-md border border-slate-600 bg-slate-800 px-2 py-0.5 text-xs hover:bg-slate-700" onClick={() => void adjustGoal(row.dateKey, -10)} aria-label="Decrease goal 10 minutes">−</button>
                            <button type="button" className="pointer-events-auto rounded-md border border-slate-600 bg-slate-800 px-2 py-0.5 text-xs hover:bg-slate-700" onClick={() => void adjustGoal(row.dateKey, 10)} aria-label="Increase goal 10 minutes">+</button>
                          </div>
                        </div>
                      </td>
                      <td className="px-3 py-2.5">
                        <span className={`inline-block rounded-full px-2 py-0.5 text-[0.8125rem] font-medium ${row.gapMinutes < 0 ? "bg-red-500/15 text-red-300" : row.gapMinutes > 0 ? "bg-emerald-500/15 text-emerald-300" : "bg-slate-700/40 text-slate-300"}`}>
                          {formatSignedMinutes(row.gapMinutes)}
                        </span>
                      </td>
                      <td className="px-3 py-2.5 text-slate-300">{formatSignedMinutes(row.sharePriceMinutes)}</td>
                      <td className="px-3 py-2.5">
                        <div className="flex items-center gap-2">
                          <div className="h-2 flex-1 max-w-30 overflow-hidden rounded-full bg-slate-800">
                            <div className="h-full rounded-full bg-emerald-500" style={{ width: `${Math.min(100, row.progressPct)}%` }} />
                          </div>
                          <span className="w-10 text-right font-semibold text-slate-100">{Math.round(row.progressPct)}%</span>
                        </div>
                      </td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          </div>
        </div>
      </main>
    </>
  );
}
