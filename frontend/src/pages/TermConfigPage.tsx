import { useCallback, useEffect, useState } from "react";
import { useOutletContext } from "react-router-dom";
import { Header } from "@/components/Header";
import type { AppOutletContext } from "@/layouts/outletContext";
import { api } from "@/lib/api";
import { formatMinutes } from "@/lib/format";
import type { SessionRow, Term } from "@/types";
import { format } from "date-fns";

export function TermConfigPage() {
  const { stats, reload } = useOutletContext<AppOutletContext>();
  const [terms, setTerms] = useState<
    (Term & { _count?: { sessions: number; courses: number; exams: number } })[]
  >([]);
  const [sessions, setSessions] = useState<SessionRow[]>([]);
  const [name, setName] = useState("New term");
  const [start, setStart] = useState("2026-09-01");
  const [end, setEnd] = useState("2026-12-20");
  const [goal, setGoal] = useState(600);
  const [daily, setDaily] = useState(720);
  const [gold, setGold] = useState(0);
  const [silver, setSilver] = useState(0);
  const [bronze, setBronze] = useState(0);
  const [academic, setAcademic] = useState("university");

  const load = useCallback(async () => {
    const list = await api<
      (Term & { _count?: { sessions: number; courses: number; exams: number } })[]
    >("/api/terms");
    setTerms(list);
    const active = list.find((t) => t.isActive);
    if (active) {
      const ss = await api<SessionRow[]>(`/api/sessions?termId=${active.id}`);
      setSessions(ss);
      setGold(active.goldMedals);
      setSilver(active.silverMedals);
      setBronze(active.bronzeMedals);
    }
  }, []);

  useEffect(() => {
    void load();
  }, [load]);

  const active = terms.find((t) => t.isActive);

  let totalM = 0;
  for (const s of sessions) {
    const [sh, sm] = s.startTime.split(":").map(Number);
    const [eh, em] = s.endTime.split(":").map(Number);
    let diff = eh * 60 + em - (sh * 60 + sm);
    if (diff < 0) diff += 24 * 60;
    totalM += Math.max(0, diff - s.breakMinutes);
  }
  const pct =
    active && active.studyGoalHours > 0
      ? Math.min(100, (totalM / 60 / active.studyGoalHours) * 100)
      : 0;

  async function createTerm(e: React.FormEvent) {
    e.preventDefault();
    const body = {
      name,
      startDate: new Date(`${start}T00:00:00.000Z`).toISOString(),
      endDate: new Date(`${end}T23:59:59.000Z`).toISOString(),
      studyGoalHours: goal,
      dailyGoalMinutes: daily,
      isActive: true,
    };
    await api("/api/terms", { method: "POST", body: JSON.stringify(body) });
    setName("New term");
    await load();
    await reload();
  }

  async function activate(id: string) {
    await api(`/api/terms/${id}/activate`, {
      method: "POST",
      body: JSON.stringify({}),
    });
    await load();
    await reload();
  }

  async function saveMedals(e: React.FormEvent) {
    e.preventDefault();
    if (!active) return;
    await api(`/api/terms/${active.id}`, {
      method: "PATCH",
      body: JSON.stringify({
        goldMedals: gold,
        silverMedals: silver,
        bronzeMedals: bronze,
      }),
    });
    await load();
    await reload();
  }

  return (
    <>
      <Header title="Term Configuration" stats={stats} />
      <main className="flex-1 space-y-8 overflow-auto p-6">
        <section className="grid gap-8 rounded-3xl border border-slate-800 bg-slate-900/40 p-8 lg:grid-cols-2">
          <div>
            <h2 className="text-lg font-semibold">Term management</h2>
            <p className="mt-1 text-sm text-slate-500">
              Create new terms or switch the active term.
            </p>
            <form onSubmit={createTerm} className="mt-4 space-y-3">
              <input
                className="w-full rounded-lg border border-slate-700 bg-slate-950 px-3 py-2 text-sm"
                value={name}
                onChange={(e) => setName(e.target.value)}
              />
              <div className="grid grid-cols-2 gap-2">
                <div>
                  <label className="text-xs text-slate-500">Start</label>
                  <input
                    type="date"
                    className="mt-1 w-full rounded-lg border border-slate-700 bg-slate-950 px-2 py-2 text-sm"
                    value={start}
                    onChange={(e) => setStart(e.target.value)}
                  />
                </div>
                <div>
                  <label className="text-xs text-slate-500">End</label>
                  <input
                    type="date"
                    className="mt-1 w-full rounded-lg border border-slate-700 bg-slate-950 px-2 py-2 text-sm"
                    value={end}
                    onChange={(e) => setEnd(e.target.value)}
                  />
                </div>
              </div>
              <div className="grid grid-cols-2 gap-2">
                <div>
                  <label className="text-xs text-slate-500">Goal (hours)</label>
                  <input
                    type="number"
                    className="mt-1 w-full rounded-lg border border-slate-700 bg-slate-950 px-2 py-2 text-sm"
                    value={goal}
                    onChange={(e) => setGoal(Number(e.target.value))}
                  />
                </div>
                <div>
                  <label className="text-xs text-slate-500">Daily goal (min)</label>
                  <input
                    type="number"
                    className="mt-1 w-full rounded-lg border border-slate-700 bg-slate-950 px-2 py-2 text-sm"
                    value={daily}
                    onChange={(e) => setDaily(Number(e.target.value))}
                  />
                </div>
              </div>
              <button
                type="submit"
                className="rounded-full border border-slate-600 bg-slate-800 px-4 py-2 text-sm hover:bg-slate-700"
              >
                + Create new term …
              </button>
            </form>
          </div>

          <div>
            {active ? (
              <div className="rounded-2xl border border-blue-500/50 bg-slate-950/60 p-5">
                <div className="flex items-start justify-between gap-2">
                  <div>
                    <p className="text-sm font-medium text-blue-300">Active term</p>
                    <h3 className="mt-1 text-lg font-semibold">{active.name}</h3>
                    <p className="text-xs text-slate-500">
                      {format(new Date(active.startDate), "dd/MM/yy")} –{" "}
                      {format(new Date(active.endDate), "dd/MM/yy")}
                    </p>
                  </div>
                </div>
                <p className="mt-3 text-sm text-slate-400">
                  {active._count?.courses ?? 0} courses · {active.examCount} exams
                </p>
                <div className="mt-4 grid grid-cols-3 gap-2 text-center text-sm">
                  <div>
                    <p className="text-xs text-slate-500">Study</p>
                    <p>{formatMinutes(totalM)}</p>
                  </div>
                  <div>
                    <p className="text-xs text-slate-500">Goal</p>
                    <p>{active.studyGoalHours}h</p>
                  </div>
                  <div>
                    <p className="text-xs text-slate-500">Sessions</p>
                    <p>{sessions.length}</p>
                  </div>
                </div>
                <div className="mt-3 h-1.5 overflow-hidden rounded-full bg-slate-800">
                  <div
                    className="h-full rounded-full bg-emerald-500"
                    style={{ width: `${pct}%` }}
                  />
                </div>
                <form onSubmit={saveMedals} className="mt-4 flex flex-wrap items-end gap-3">
                  <div>
                    <label className="text-xs text-slate-500">Gold</label>
                    <input
                      type="number"
                      className="mt-1 w-20 rounded border border-slate-700 bg-slate-950 px-2 py-1 text-sm"
                      value={gold}
                      onChange={(e) => setGold(Number(e.target.value))}
                    />
                  </div>
                  <div>
                    <label className="text-xs text-slate-500">Silver</label>
                    <input
                      type="number"
                      className="mt-1 w-20 rounded border border-slate-700 bg-slate-950 px-2 py-1 text-sm"
                      value={silver}
                      onChange={(e) => setSilver(Number(e.target.value))}
                    />
                  </div>
                  <div>
                    <label className="text-xs text-slate-500">Bronze</label>
                    <input
                      type="number"
                      className="mt-1 w-20 rounded border border-slate-700 bg-slate-950 px-2 py-1 text-sm"
                      value={bronze}
                      onChange={(e) => setBronze(Number(e.target.value))}
                    />
                  </div>
                  <button type="submit" className="rounded-lg bg-slate-700 px-3 py-2 text-sm">
                    Save medals
                  </button>
                </form>
              </div>
            ) : (
              <p className="text-sm text-slate-500">No active term.</p>
            )}
          </div>
        </section>

        <section className="rounded-3xl border border-slate-800 bg-slate-900/40 p-8">
          <h2 className="text-lg font-semibold">Calendar feed</h2>
          <p className="mt-1 text-sm text-slate-500">
            Subscribe to sessions in your calendar app (ICS URL placeholder).
          </p>
          <div className="mt-4 flex flex-wrap items-center gap-3">
            <span className="text-sm">{active?.name ?? "—"}</span>
            <button
              type="button"
              className="rounded-lg border border-slate-600 bg-slate-800 px-4 py-2 text-sm"
              onClick={() =>
                alert("In a full deployment, this would generate a calendar URL for the active term.")
              }
            >
              Generate link
            </button>
          </div>
          <p className="mt-4 max-w-xl text-xs text-slate-500">
            What&apos;s this? Export your sessions to Google Calendar, Apple Calendar, or any app that
            supports webcal/ICS subscriptions.
          </p>
        </section>

        <section className="rounded-3xl border border-slate-800 bg-slate-900/40 p-8">
          <h2 className="text-lg font-semibold">Academic status</h2>
          <p className="mt-1 text-sm text-slate-500">Pick your current education level.</p>
          <div className="mt-4 flex flex-wrap gap-3">
            {[
              { id: "highschool", label: "High school", icon: "🏫" },
              { id: "university", label: "University", icon: "🎓" },
              { id: "self", label: "Self-study", icon: "📚" },
            ].map((o) => (
              <button
                key={o.id}
                type="button"
                onClick={() => setAcademic(o.id)}
                className={`rounded-xl border px-4 py-3 text-left text-sm transition ${
                  academic === o.id
                    ? "border-blue-500 bg-blue-500/10"
                    : "border-slate-700 hover:border-slate-600"
                }`}
              >
                <span className="text-2xl">{o.icon}</span>
                <p className="mt-1 font-medium">{o.label}</p>
              </button>
            ))}
          </div>
          <p className="mt-3 text-xs text-slate-600">
            Selection is saved with your profile on the Settings page.
          </p>
        </section>

        <section>
          <h2 className="text-lg font-semibold">All terms</h2>
          <ul className="mt-3 space-y-2">
            {terms.map((t) => (
              <li
                key={t.id}
                className="flex flex-wrap items-center justify-between gap-2 rounded-lg border border-slate-800 bg-slate-900/50 px-4 py-3"
              >
                <span className={t.isActive ? "font-medium text-blue-300" : ""}>
                  {t.name} {t.isActive ? "(active)" : ""}
                </span>
                {!t.isActive && (
                  <button
                    type="button"
                    onClick={() => void activate(t.id)}
                    className="text-sm text-blue-400 hover:underline"
                  >
                    Activate
                  </button>
                )}
              </li>
            ))}
          </ul>
        </section>
      </main>
    </>
  );
}
