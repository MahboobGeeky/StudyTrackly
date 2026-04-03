import { useCallback, useEffect, useMemo, useState } from "react";
import { useOutletContext, useSearchParams } from "react-router-dom";
import { Header } from "@/components/Header";
import type { AppOutletContext } from "@/layouts/outletContext";
import { api } from "@/lib/api";
import { coursePillClass } from "@/lib/courseColors";
import { formatMinutes, sessionDurationMinutes } from "@/lib/format";
import type { Course, SessionRow, Term } from "@/types";
import { format } from "date-fns";

export function SessionsPage() {
  const { stats, reload } = useOutletContext<AppOutletContext>();
  const [params] = useSearchParams();
  const [term, setTerm] = useState<Term | null>(null);
  const [courses, setCourses] = useState<Course[]>([]);
  const [sessions, setSessions] = useState<SessionRow[]>([]);
  const [date, setDate] = useState(format(new Date(), "yyyy-MM-dd"));
  const [start, setStart] = useState("09:00");
  const [end, setEnd] = useState("11:00");
  const [brk, setBrk] = useState(10);
  const [courseId, setCourseId] = useState("");
  const [activity, setActivity] = useState("");
  const [note, setNote] = useState("");
  const [msg, setMsg] = useState("");

  const load = useCallback(async () => {
    const t = await api<Term | null>("/api/terms/active");
    setTerm(t);
    if (!t) return;
    const [cs, ss] = await Promise.all([
      api<Course[]>(`/api/courses?termId=${t.id}`),
      api<SessionRow[]>(`/api/sessions?termId=${t.id}`),
    ]);
    setCourses(cs);
    setSessions(ss);
    const fromQuery = params.get("courseId") ?? "";
    setCourseId((prev) => prev || fromQuery || cs[0]?.id || "");
  }, [params]);

  useEffect(() => {
    void load();
  }, [load]);

  const durationLabel = useMemo(
    () => formatMinutes(sessionDurationMinutes(start, end, brk)),
    [start, end, brk]
  );

  async function createSession(e: React.FormEvent) {
    e.preventDefault();
    if (!term || !courseId) {
      setMsg("Create a term and courses first (Term Config).");
      return;
    }
    try {
      setMsg("");
      const iso = new Date(`${date}T12:00:00.000Z`).toISOString();
      await api<SessionRow>("/api/sessions", {
        method: "POST",
        body: JSON.stringify({
          termId: term.id,
          courseId,
          date: iso,
          startTime: start,
          endTime: end,
          breakMinutes: brk,
          activity,
          note,
        }),
      });
      setActivity("");
      setNote("");
      await load();
      await reload();
    } catch (err) {
      setMsg(err instanceof Error ? err.message : "Failed to create session.");
    }
  }

  async function remove(id: string) {
    await api(`/api/sessions/${id}`, { method: "DELETE" });
    await load();
    await reload();
  }

  return (
    <>
      <Header title="Sessions" stats={stats} />
      <main className="flex flex-1 flex-col gap-6 overflow-auto p-6 lg:flex-row">
        <form
          onSubmit={createSession}
          className="w-full shrink-0 space-y-4 rounded-2xl border border-slate-800 bg-slate-900/50 p-5 lg:max-w-sm"
        >
          <h2 className="text-lg font-semibold">Create new session</h2>
          {msg && <p className="text-sm text-amber-400">{msg}</p>}
          <div>
            <label className="text-xs text-slate-500">Date</label>
            <input
              type="date"
              className="mt-1 w-full rounded-lg border border-slate-700 bg-slate-950 px-3 py-2 text-sm"
              value={date}
              onChange={(e) => setDate(e.target.value)}
            />
          </div>
          <div className="grid grid-cols-3 gap-2">
            <div>
              <label className="text-xs text-slate-500">Start</label>
              <input
                className="mt-1 w-full rounded-lg border border-slate-700 bg-slate-950 px-2 py-2 text-sm"
                value={start}
                onChange={(e) => setStart(e.target.value)}
              />
            </div>
            <div>
              <label className="text-xs text-slate-500">End</label>
              <input
                className="mt-1 w-full rounded-lg border border-slate-700 bg-slate-950 px-2 py-2 text-sm"
                value={end}
                onChange={(e) => setEnd(e.target.value)}
              />
            </div>
            <div>
              <label className="text-xs text-slate-500">Break (m)</label>
              <input
                type="number"
                min={0}
                className="mt-1 w-full rounded-lg border border-slate-700 bg-slate-950 px-2 py-2 text-sm"
                value={brk}
                onChange={(e) => setBrk(Number(e.target.value))}
              />
            </div>
          </div>
          <div>
            <label className="text-xs text-slate-500">Duration</label>
            <div className="mt-1 rounded-lg border border-slate-800 bg-slate-950 px-3 py-2 text-sm text-slate-300">
              {durationLabel}
            </div>
          </div>
          <div>
            <label className="text-xs text-slate-500">Course</label>
            <select
              className="mt-1 w-full rounded-lg border border-slate-700 bg-slate-950 px-3 py-2 text-sm"
              value={courseId}
              onChange={(e) => setCourseId(e.target.value)}
            >
              {courses.map((c) => (
                <option key={c.id} value={c.id}>
                  {c.name}
                </option>
              ))}
            </select>
          </div>
          <div>
            <label className="text-xs text-slate-500">Activity</label>
            <input
              className="mt-1 w-full rounded-lg border border-slate-700 bg-slate-950 px-3 py-2 text-sm"
              placeholder="e.g. Memorize"
              value={activity}
              onChange={(e) => setActivity(e.target.value)}
            />
          </div>
          <div>
            <label className="text-xs text-slate-500">Note</label>
            <textarea
              className="mt-1 min-h-[80px] w-full rounded-lg border border-slate-700 bg-slate-950 px-3 py-2 text-sm"
              placeholder="e.g. Review lecture 1"
              value={note}
              onChange={(e) => setNote(e.target.value)}
            />
          </div>
          <button
            type="submit"
            className="w-full rounded-lg bg-emerald-600 py-2.5 text-sm font-medium text-white hover:bg-emerald-500"
          >
            Create
          </button>
        </form>

        <div className="min-w-0 flex-1 overflow-auto rounded-2xl border border-slate-800 bg-slate-900/40">
          <div className="flex flex-wrap items-center justify-between gap-2 border-b border-slate-800 px-4 py-3">
            <p className="text-sm font-medium">
              Sessions · {sessions.length}
            </p>
            <span className="rounded-full bg-emerald-500/15 px-2 py-0.5 text-xs text-emerald-300">
              Table
            </span>
          </div>
          <div className="overflow-x-auto">
            <table className="w-full min-w-[800px] text-left text-sm">
              <thead className="border-b border-slate-800 text-xs uppercase text-slate-500">
                <tr>
                  <th className="px-3 py-2">Date</th>
                  <th className="px-3 py-2">Time</th>
                  <th className="px-3 py-2">Duration</th>
                  <th className="px-3 py-2">Course</th>
                  <th className="px-3 py-2">Activity</th>
                  <th className="px-3 py-2">Note</th>
                  <th className="px-3 py-2" />
                </tr>
              </thead>
              <tbody>
                {sessions.map((s) => {
                  const mins = sessionDurationMinutes(
                    s.startTime,
                    s.endTime,
                    s.breakMinutes
                  );
                  return (
                    <tr key={s.id} className="border-b border-slate-800/80">
                      <td className="whitespace-nowrap px-3 py-2 text-sky-300">
                        {format(new Date(s.date), "dd/MM/yy")}
                      </td>
                      <td className="whitespace-nowrap px-3 py-2 text-slate-300">
                        {s.startTime} – {s.endTime}
                      </td>
                      <td className="px-3 py-2">{formatMinutes(mins)}</td>
                      <td className="px-3 py-2">
                        <span
                          className={`inline-block rounded-full border px-2 py-0.5 text-xs ${coursePillClass(s.course.color)}`}
                        >
                          {s.course.name}
                        </span>
                      </td>
                      <td className="max-w-[120px] truncate px-3 py-2 text-slate-400">
                        {s.activity}
                      </td>
                      <td className="max-w-[200px] truncate px-3 py-2 text-slate-500">
                        {s.note}
                      </td>
                      <td className="px-3 py-2">
                        <button
                          type="button"
                          onClick={() => void remove(s.id)}
                          className="text-xs text-red-400 hover:underline"
                        >
                          Delete
                        </button>
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
