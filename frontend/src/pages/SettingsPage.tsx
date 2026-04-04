import { useEffect, useState } from "react";
import { useOutletContext } from "react-router-dom";
import { Header } from "@/components/Header";
import type { AppOutletContext } from "@/layouts/outletContext";
import { api } from "@/lib/api";
import type { SmartTimerRingtone, UserSettings } from "@/types";

export function SettingsPage() {
  const { stats, reload } = useOutletContext<AppOutletContext>();
  const [s, setS] = useState<UserSettings | null>(null);
  const [email, setEmail] = useState("");
  const [displayName, setDisplayName] = useState("");
  const [trial, setTrial] = useState("");
  const [academic, setAcademic] = useState("");
  const [timerVolume, setTimerVolume] = useState(0.45);
  const [smartTimerRingtone, setSmartTimerRingtone] = useState<SmartTimerRingtone>(
    "soft_chime"
  );

  useEffect(() => {
    void api<UserSettings>("/api/settings").then((u) => {
      setS(u);
      setEmail(u.email);
      setDisplayName(u.displayName);
      setTrial(u.trialEnd ? u.trialEnd.slice(0, 10) : "");
      setAcademic(u.academicLevel ?? "");
      setTimerVolume(u.timerVolume ?? 0.45);
      setSmartTimerRingtone((u.smartTimerRingtone ?? "soft_chime") as SmartTimerRingtone);
    });
  }, []);

  async function save(e: React.FormEvent) {
    e.preventDefault();
    const trialEnd = trial ? new Date(`${trial}T23:59:59.000Z`).toISOString() : null;
    const cleanDisplayName = displayName.trim();
    const cleanEmail = email.trim();
    try {
      const updated = await api<UserSettings>("/api/settings", {
        method: "PATCH",
        body: JSON.stringify({
          email: cleanEmail,
          ...(cleanDisplayName ? { displayName: cleanDisplayName } : {}),
          trialEnd,
          academicLevel: academic ? academic : null,
          timerVolume,
          smartTimerRingtone,
        }),
      });
      setS(updated);
      setTimerVolume(updated.timerVolume ?? 0.45);
      setSmartTimerRingtone((updated.smartTimerRingtone ?? "soft_chime") as SmartTimerRingtone);
      await reload();
      alert("Saved.");
    } catch (err) {
      const msg = err instanceof Error ? err.message : String(err);
      alert(`Save failed: ${msg}`);
    }
  }

  return (
    <>
      <Header title="Settings" stats={stats} />
      <main className="flex-1 overflow-auto p-6">
        <form
          onSubmit={save}
          className="max-w-lg space-y-4 rounded-2xl border border-slate-800 bg-slate-900/50 p-6"
        >
          <h2 className="text-lg font-semibold">Profile</h2>
          <div>
            <label className="text-xs text-slate-500">Display name</label>
            <input
              className="mt-1 w-full rounded-lg border border-slate-700 bg-slate-950 px-3 py-2 text-sm"
              value={displayName}
              onChange={(e) => setDisplayName(e.target.value)}
            />
          </div>
          <div>
            <label className="text-xs text-slate-500">Email</label>
            <input
              type="email"
              className="mt-1 w-full rounded-lg border border-slate-700 bg-slate-950 px-3 py-2 text-sm"
              value={email}
              onChange={(e) => setEmail(e.target.value)}
            />
          </div>
          <div>
            <label className="text-xs text-slate-500">Trial end (date)</label>
            <input
              type="date"
              className="mt-1 w-full rounded-lg border border-slate-700 bg-slate-950 px-3 py-2 text-sm"
              value={trial}
              onChange={(e) => setTrial(e.target.value)}
            />
          </div>
          <div>
            <label className="text-xs text-slate-500">
              SmartTimer chime volume ({Math.round(timerVolume * 100)}%)
            </label>
            <input
              type="range"
              min={0}
              max={1}
              step={0.05}
              className="mt-2 w-full accent-blue-500"
              value={timerVolume}
              onChange={(e) => setTimerVolume(Number(e.target.value))}
            />
          </div>
          <div>
            <label className="text-xs text-slate-500">SmartTimer ringtone</label>
            <select
              className="mt-2 w-full rounded-lg border border-slate-700 bg-slate-950 px-3 py-2 text-sm text-slate-200 outline-none"
              value={smartTimerRingtone}
              onChange={(e) =>
                setSmartTimerRingtone(e.target.value as SmartTimerRingtone)
              }
            >
              <option value="soft_chime">Soft Chime (gentle)</option>
              <option value="classic_bell">Classic Bell</option>
              <option value="triple_ping">Triple Ping</option>
              <option value="alert_beep">Alert Beep (louder)</option>
            </select>
          </div>
          <div>
            <label className="text-xs text-slate-500">Academic level</label>
            <input
              className="mt-1 w-full rounded-lg border border-slate-700 bg-slate-950 px-3 py-2 text-sm"
              value={academic}
              onChange={(e) => setAcademic(e.target.value)}
              placeholder="e.g. university"
            />
          </div>
          {s && (
            <p className="text-xs text-slate-600">Settings id: {s.id} (local SQLite via API)</p>
          )}
          <button
            type="submit"
            className="rounded-lg bg-blue-600 px-4 py-2 text-sm font-medium text-white hover:bg-blue-500"
          >
            Save
          </button>
        </form>
      </main>
    </>
  );
}
