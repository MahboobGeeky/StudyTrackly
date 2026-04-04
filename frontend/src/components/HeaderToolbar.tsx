import { ChevronDown, Lightbulb, Play, Plus, Timer } from "lucide-react";
import { useCallback, useEffect, useState } from "react";
import { Link } from "react-router-dom";
import { FullscreenTimer } from "@/components/FullscreenTimer";
import { api } from "@/lib/api";
import { coursePillClass } from "@/lib/courseColors";
import type { Course, SmartTimerRingtone, UserSettings } from "@/types";

type Props = {
  timerVolume: number;
  smartTimerRingtone: SmartTimerRingtone;
  onSessionSaved?: () => void | Promise<void>;
};

export function HeaderToolbar({
  timerVolume,
  smartTimerRingtone,
  onSessionSaved,
}: Props) {
  const [courses, setCourses] = useState<Course[]>([]);

  const [fsOpen, setFsOpen] = useState(false);
  const [fsMode, setFsMode] = useState<"countup" | "countdown">("countup");
  const [fsCountdown, setFsCountdown] = useState(3600);
  /** Fresh from API when overlay opens so ringtone/volume match Settings after Save. */
  const [fsTimerVolume, setFsTimerVolume] = useState(timerVolume);
  const [fsSmartRingtone, setFsSmartRingtone] = useState(smartTimerRingtone);

  const [smartOpen, setSmartOpen] = useState(false);
  const [customH, setCustomH] = useState(1);

  const loadCourses = useCallback(async () => {
    const t = await api<{ id: string } | null>("/api/terms/active");
    if (!t) {
      setCourses([]);
      return;
    }
    const cs = await api<Course[]>(`/api/courses?termId=${t.id}`);
    setCourses(cs);
  }, []);

  useEffect(() => {
    void loadCourses();
  }, [loadCourses]);

  useEffect(() => {
    setFsTimerVolume(timerVolume);
    setFsSmartRingtone(smartTimerRingtone);
  }, [timerVolume, smartTimerRingtone]);

  useEffect(() => {
    if (!fsOpen) return;
    let cancelled = false;
    void api<UserSettings>("/api/settings").then((u) => {
      if (cancelled) return;
      setFsTimerVolume(u.timerVolume ?? 0.45);
      setFsSmartRingtone((u.smartTimerRingtone ?? "soft_chime") as SmartTimerRingtone);
    });
    return () => {
      cancelled = true;
    };
  }, [fsOpen]);

  const handleSaved = async () => {
    await loadCourses();
    await onSessionSaved?.();
  };

  return (
    <>
      <div className="flex flex-wrap items-center gap-2">
        <div className="group relative">
          <button
            type="button"
            className="inline-flex items-center gap-2 rounded-full border border-slate-600 bg-zinc-900 px-3.5 py-2.5 text-[0.9375rem] font-medium text-white shadow-sm hover:bg-zinc-800"
          >
            <Plus className="h-4 w-4" />
            Session …
            <ChevronDown className="h-4 w-4 opacity-70" />
          </button>
          <div className="pointer-events-none absolute right-0 top-full z-50 mt-2 min-w-[220px] scale-95 opacity-0 transition group-hover:pointer-events-auto group-hover:scale-100 group-hover:opacity-100">
            <div className="rounded-xl border border-slate-200 bg-white p-2 shadow-xl dark:border-slate-700 dark:bg-slate-900">
              <p className="px-2 pb-1 text-[0.7rem] font-medium uppercase tracking-wide text-slate-500">
                Courses
              </p>
              <div className="flex flex-col gap-1.5">
                {courses.length === 0 && (
                  <span className="px-2 py-1 text-sm text-slate-500">No courses yet</span>
                )}
                {courses.map((c) => (
                  <Link
                    key={c.id}
                    to={`/sessions?courseId=${encodeURIComponent(c.id)}`}
                    className={`block rounded-lg border px-3 py-2 text-sm ${coursePillClass(c.color)}`}
                  >
                    {c.name}
                  </Link>
                ))}
                <Link
                  to="/courses"
                  className="mt-1 block rounded-lg px-2 py-1.5 text-center text-xs text-blue-600 hover:bg-slate-100 dark:hover:bg-slate-800"
                >
                  Manage courses →
                </Link>
              </div>
            </div>
          </div>
        </div>

        <div className="flex items-center gap-2">
          <button
            type="button"
            onClick={() => {
              setFsMode("countup");
              setFsOpen(true);
            }}
            className="inline-flex items-center gap-2 rounded-full bg-blue-600 px-3.5 py-2.5 text-[0.9375rem] font-medium text-white shadow-sm hover:bg-blue-500"
          >
            <Play className="h-4 w-4" />
            <Timer className="h-4 w-4" />
            Timer
            <ChevronDown className="h-4 w-4 opacity-70" />
          </button>
        </div>

        <div className="relative">
          <button
            type="button"
            onClick={() => setSmartOpen((o) => !o)}
            className="inline-flex items-center gap-2 rounded-full bg-emerald-600 px-3.5 py-2.5 text-[0.9375rem] font-medium text-white shadow-sm hover:bg-emerald-500"
          >
            <Lightbulb className="h-4 w-4" />
            SmartTimer
            <ChevronDown className="h-4 w-4 opacity-70" />
          </button>
          {smartOpen && (
            <div className="absolute right-0 top-full z-50 mt-2 min-w-[220px] rounded-xl border border-slate-700 bg-slate-900 p-3 shadow-xl">
              <p className="text-xs text-slate-500">Countdown (fullscreen)</p>
              <div className="mt-2 flex flex-wrap gap-2">
                {[1, 2, 3, 4].map((h) => (
                  <button
                    key={h}
                    type="button"
                    className="rounded-lg bg-slate-800 px-3 py-1.5 text-sm hover:bg-slate-700"
                    onClick={() => {
                      setFsMode("countdown");
                      setFsCountdown(h * 3600);
                      setFsOpen(true);
                      setSmartOpen(false);
                    }}
                  >
                    {h}h
                  </button>
                ))}
              </div>
              <div className="mt-3 flex items-center gap-2 border-t border-slate-800 pt-3">
                <input
                  type="number"
                  min={0.25}
                  step={0.25}
                  className="w-20 rounded border border-slate-700 bg-slate-950 px-2 py-1 text-sm"
                  value={customH}
                  onChange={(e) => setCustomH(Number(e.target.value))}
                />
                <span className="text-xs text-slate-500">hours</span>
                <button
                  type="button"
                  className="rounded-lg bg-emerald-700 px-3 py-1.5 text-sm"
                  onClick={() => {
                    setFsMode("countdown");
                    setFsCountdown(Math.max(60, Math.round(customH * 3600)));
                    setFsOpen(true);
                    setSmartOpen(false);
                  }}
                >
                  Start
                </button>
              </div>
            </div>
          )}
        </div>
      </div>

      <FullscreenTimer
        open={fsOpen}
        onClose={() => setFsOpen(false)}
        mode={fsMode}
        countdownSeconds={fsCountdown}
        timerVolume={fsTimerVolume}
        smartTimerRingtone={fsSmartRingtone}
        courses={courses}
        onSessionSaved={handleSaved}
      />
    </>
  );
}
