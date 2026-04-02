import { format } from "date-fns";
import { useOutletContext } from "react-router-dom";
import { Header } from "@/components/Header";
import type { AppOutletContext } from "@/layouts/outletContext";
import { api } from "@/lib/api";
import { formatMinutes } from "@/lib/format";
import type { SessionRow, Term } from "@/types";
import { useCallback, useEffect, useMemo, useState } from "react";

export function TermPage() {
  const { stats, reload } = useOutletContext<AppOutletContext>();
  const [term, setTerm] = useState<Term | null>(null);
  const [sessions, setSessions] = useState<SessionRow[]>([]);

  const load = useCallback(async () => {
    const t = await api<Term | null>("/api/terms/active");
    setTerm(t);
    if (!t) return;
    const ss = await api<SessionRow[]>(`/api/sessions?termId=${t.id}`);
    setSessions(ss);
  }, []);

  useEffect(() => {
    void load();
  }, [load]);

  const totalM = useMemo(() => {
    let m = 0;
    for (const s of sessions) {
      const [sh, sm] = s.startTime.split(":").map(Number);
      const [eh, em] = s.endTime.split(":").map(Number);
      let diff = eh * 60 + em - (sh * 60 + sm);
      if (diff < 0) diff += 24 * 60;
      m += Math.max(0, diff - s.breakMinutes);
    }
    return m;
  }, [sessions]);

  const goalH = term?.studyGoalHours ?? 600;
  const pct = goalH > 0 ? Math.min(100, (totalM / 60 / goalH) * 100) : 0;

  return (
    <>
      <Header title="Term" stats={stats} />
      <main className="flex-1 space-y-6 overflow-auto p-6">
        {term ? (
          <div className="rounded-2xl border border-slate-800 bg-slate-900/50 p-6">
            <h2 className="text-xl font-semibold">{term.name}</h2>
            <p className="mt-1 text-sm text-slate-500">
              {format(new Date(term.startDate), "dd/MM/yy")} –{" "}
              {format(new Date(term.endDate), "dd/MM/yy")}
            </p>
            <div className="mt-6 grid gap-4 sm:grid-cols-3">
              <div>
                <p className="text-xs text-slate-500">Study time</p>
                <p className="text-lg font-medium">{formatMinutes(totalM)}</p>
              </div>
              <div>
                <p className="text-xs text-slate-500">Goal</p>
                <p className="text-lg font-medium">{goalH}h</p>
              </div>
              <div>
                <p className="text-xs text-slate-500">Sessions</p>
                <p className="text-lg font-medium">{sessions.length}</p>
              </div>
            </div>
            <div className="mt-4">
              <div className="flex justify-between text-xs text-slate-500">
                <span>Progress</span>
                <span>{pct.toFixed(1)}%</span>
              </div>
              <div className="mt-1 h-2 overflow-hidden rounded-full bg-slate-800">
                <div
                  className="h-full rounded-full bg-emerald-500"
                  style={{ width: `${pct}%` }}
                />
              </div>
            </div>
          </div>
        ) : (
          <p className="text-slate-500">No active term. Add one in Term Configuration.</p>
        )}
        <button
          type="button"
          onClick={() => void reload()}
          className="rounded-lg border border-slate-700 px-4 py-2 text-sm text-slate-400 hover:bg-slate-900"
        >
          Refresh
        </button>
      </main>
    </>
  );
}
