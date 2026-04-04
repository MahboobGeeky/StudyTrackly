import { useCallback, useEffect, useMemo, useState } from "react";
import { useOutletContext } from "react-router-dom";
import { Header } from "@/components/Header";
import type { AppOutletContext } from "@/layouts/outletContext";
import { api } from "@/lib/api";
import { formatMinutes } from "@/lib/format";
import type { SessionRow, Term } from "@/types";
function formatUtcSlash(iso: string, yearDigits: 2 | 4): string {
  const d = new Date(iso);
  if (Number.isNaN(d.getTime())) return "—";
  const dd = String(d.getUTCDate()).padStart(2, "0");
  const mm = String(d.getUTCMonth() + 1).padStart(2, "0");
  const y = d.getUTCFullYear();
  if (yearDigits === 2) return `${dd}/${mm}/${String(y).slice(-2)}`;
  return `${dd}/${mm}/${y}`;
}

function previewGoalHours(start: string, end: string, dailyMin: number): number {
  const [ys, ms, ds] = start.split("-").map(Number);
  const [ye, me, de] = end.split("-").map(Number);
  if (![ys, ms, ds, ye, me, de].every((n) => Number.isFinite(n))) return 0;
  const s = Date.UTC(ys, ms - 1, ds);
  const e = Date.UTC(ye, me - 1, de);
  if (e < s) return 0;
  const days = Math.round((e - s) / (24 * 60 * 60 * 1000)) + 1;
  return Math.round(((days * dailyMin) / 60) * 100) / 100;
}

/** ISO from API → YYYY-MM-DD for date inputs (UTC calendar day, matches backend). */
function toDateInputValue(iso: string): string {
  const d = new Date(iso);
  if (Number.isNaN(d.getTime())) return "";
  const y = d.getUTCFullYear();
  const m = String(d.getUTCMonth() + 1).padStart(2, "0");
  const day = String(d.getUTCDate()).padStart(2, "0");
  return `${y}-${m}-${day}`;
}

function utcIsoFromDateInput(dateStr: string, endOfDay: boolean): string {
  const [y, mo, d] = dateStr.split("-").map(Number);
  if (!Number.isFinite(y) || !Number.isFinite(mo) || !Number.isFinite(d)) return "";
  if (endOfDay) {
    return new Date(Date.UTC(y, mo - 1, d, 23, 59, 59, 999)).toISOString();
  }
  return new Date(Date.UTC(y, mo - 1, d, 12, 0, 0, 0)).toISOString();
}

export function TermConfigPage() {
  const { stats, reload } = useOutletContext<AppOutletContext>();
  const [terms, setTerms] = useState<
    (Term & { _count?: { sessions: number; courses: number; exams: number } })[]
  >([]);
  const [sessions, setSessions] = useState<SessionRow[]>([]);
  const [name, setName] = useState("New term");
  const [start, setStart] = useState("2026-09-01");
  const [end, setEnd] = useState("2026-12-20");
  const [daily, setDaily] = useState(720);
  const [gold, setGold] = useState(0);
  const [silver, setSilver] = useState(0);
  const [bronze, setBronze] = useState(0);
  const [academic, setAcademic] = useState("university");
  const [editingTermId, setEditingTermId] = useState<string | null>(null);
  const [editStart, setEditStart] = useState("");
  const [editEnd, setEditEnd] = useState("");
  const [editDaily, setEditDaily] = useState(720);

  const editPreviewGoalHours = useMemo(
    () => previewGoalHours(editStart, editEnd, editDaily),
    [editStart, editEnd, editDaily]
  );

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

  const computedPreviewHours = useMemo(
    () => previewGoalHours(start, end, daily),
    [start, end, daily]
  );

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
      startDate: utcIsoFromDateInput(start, false),
      endDate: utcIsoFromDateInput(end, true),
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

  async function deleteTerm(term: Term) {
    const ok = window.confirm(
      `Delete "${term.name}" permanently?\n\nThis will also delete all courses, sessions, and study-day goal overrides for this term.`
    );
    if (!ok) return;

    await api(`/api/terms/${term.id}`, { method: "DELETE" });
    if (editingTermId === term.id) {
      setEditingTermId(null);
    }
    await load();
    await reload();
  }

  function startEditDates(t: Term) {
    setEditingTermId(t.id);
    setEditStart(toDateInputValue(t.startDate));
    setEditEnd(toDateInputValue(t.endDate));
    setEditDaily(t.dailyGoalMinutes);
  }

  function cancelEditDates() {
    setEditingTermId(null);
  }

  async function saveTermDates(termId: string) {
    const startIso = utcIsoFromDateInput(editStart, false);
    const endIso = utcIsoFromDateInput(editEnd, true);
    if (!startIso || !endIso) {
      alert("Please choose valid start and end dates.");
      return;
    }
    const [ys, ms, ds] = editStart.split("-").map(Number);
    const [ye, me, de] = editEnd.split("-").map(Number);
    if (
      Date.UTC(ye, me - 1, de) < Date.UTC(ys, ms - 1, ds)
    ) {
      alert("End date must be on or after the start date.");
      return;
    }
    const dailyGoalMinutes = Math.floor(Number(editDaily));
    if (!Number.isFinite(dailyGoalMinutes) || dailyGoalMinutes < 1) {
      alert("Daily goal must be at least 1 minute.");
      return;
    }
    try {
      await api(`/api/terms/${termId}`, {
        method: "PATCH",
        body: JSON.stringify({
          startDate: startIso,
          endDate: endIso,
          dailyGoalMinutes,
        }),
      });
      setEditingTermId(null);
      await load();
      await reload();
    } catch (err) {
      alert(err instanceof Error ? err.message : "Could not update term.");
    }
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
              <div>
                <label className="text-xs text-slate-500">Daily goal (minutes)</label>
                <input
                  type="number"
                  className="mt-1 w-full rounded-lg border border-slate-700 bg-slate-950 px-2 py-2 text-sm"
                  value={daily}
                  min={1}
                  onChange={(e) => setDaily(Number(e.target.value))}
                />
                <p className="mt-2 text-xs text-slate-500">
                  Total term goal (computed):{" "}
                  <span className="font-medium text-slate-300">{computedPreviewHours}h</span> from
                  inclusive days × daily study hours.
                </p>
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
                      {formatUtcSlash(active.startDate, 2)} – {formatUtcSlash(active.endDate, 2)}
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
          <p className="mt-1 text-sm text-slate-500">
            Activate a term, edit dates and daily goal, or delete it. Deleting removes the term and
            all related courses, sessions, and calendar goal overrides.
          </p>
          <ul className="mt-3 space-y-2">
            {terms.map((t) => {
              const isEditing = editingTermId === t.id;
              return (
                <li
                  key={t.id}
                  className="flex flex-col gap-3 rounded-lg border border-slate-800 bg-slate-900/50 px-4 py-3 sm:flex-row sm:items-center sm:justify-between"
                >
                  <div className="min-w-0 flex-1">
                    <p className={`text-sm font-medium ${t.isActive ? "text-blue-300" : "text-slate-200"}`}>
                      {t.name} {t.isActive ? "(active)" : ""}
                    </p>
                    {isEditing ? (
                      <div className="mt-2 space-y-2">
                        <div className="flex flex-wrap items-end gap-2">
                          <div>
                            <label className="text-[0.65rem] uppercase tracking-wide text-slate-500">
                              Start
                            </label>
                            <input
                              type="date"
                              className="mt-0.5 block rounded-lg border border-slate-700 bg-slate-950 px-2 py-1.5 text-sm"
                              value={editStart}
                              onChange={(e) => setEditStart(e.target.value)}
                            />
                          </div>
                          <div>
                            <label className="text-[0.65rem] uppercase tracking-wide text-slate-500">
                              End
                            </label>
                            <input
                              type="date"
                              className="mt-0.5 block rounded-lg border border-slate-700 bg-slate-950 px-2 py-1.5 text-sm"
                              value={editEnd}
                              onChange={(e) => setEditEnd(e.target.value)}
                            />
                          </div>
                          <div>
                            <label className="text-[0.65rem] uppercase tracking-wide text-slate-500">
                              Daily goal (minutes)
                            </label>
                            <input
                              type="number"
                              min={1}
                              className="mt-0.5 block w-28 rounded-lg border border-slate-700 bg-slate-950 px-2 py-1.5 text-sm"
                              value={editDaily}
                              onChange={(e) => {
                                const v = e.target.valueAsNumber;
                                if (!Number.isNaN(v)) setEditDaily(v);
                              }}
                            />
                          </div>
                          <button
                            type="button"
                            className="rounded-lg bg-slate-700 px-3 py-1.5 text-sm"
                            onClick={() => void saveTermDates(t.id)}
                          >
                            Save
                          </button>
                          <button
                            type="button"
                            className="rounded-lg border border-slate-600 px-3 py-1.5 text-sm text-slate-300"
                            onClick={cancelEditDates}
                          >
                            Cancel
                          </button>
                        </div>
                        <p className="text-xs text-slate-500">
                          Total term goal (computed):{" "}
                          <span className="font-medium text-slate-300">{editPreviewGoalHours}h</span>{" "}
                          from inclusive days × daily minutes.
                        </p>
                      </div>
                    ) : (
                      <p className="mt-1 text-xs text-slate-500">
                        {formatUtcSlash(t.startDate, 4)} – {formatUtcSlash(t.endDate, 4)}
                        <span className="text-slate-600">
                          {" "}
                          · goal {t.studyGoalHours}h (from daily {t.dailyGoalMinutes} min)
                        </span>
                      </p>
                    )}
                  </div>
                  <div className="flex shrink-0 flex-wrap items-center justify-end gap-x-4 gap-y-1">
                    {!t.isActive && (
                      <button
                        type="button"
                        onClick={() => void activate(t.id)}
                        className="text-sm font-medium text-blue-400 hover:underline"
                      >
                        Activate
                      </button>
                    )}
                    {!isEditing && (
                      <button
                        type="button"
                        onClick={() => startEditDates(t)}
                        className="text-sm font-medium text-slate-300 hover:underline"
                      >
                        Edit
                      </button>
                    )}
                    <button
                      type="button"
                      onClick={() => void deleteTerm(t)}
                      className="text-sm font-medium text-red-400 hover:underline"
                    >
                      Delete
                    </button>
                  </div>
                </li>
              );
            })}
          </ul>
        </section>
      </main>
    </>
  );
}
