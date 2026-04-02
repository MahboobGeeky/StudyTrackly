import { ChevronDown, Lightbulb, Pause, Play, Plus, Timer } from "lucide-react";
import { useCallback, useEffect, useRef, useState } from "react";
import { Link } from "react-router-dom";
import { playSoftChime } from "@/lib/chime";
import { api } from "@/lib/api";
import { coursePillClass } from "@/lib/courseColors";
import type { Course } from "@/types";

type Props = {
  timerVolume: number;
};

function formatHMS(totalSeconds: number) {
  const h = Math.floor(totalSeconds / 3600);
  const m = Math.floor((totalSeconds % 3600) / 60);
  const s = totalSeconds % 60;
  return `${String(h).padStart(2, "0")}:${String(m).padStart(2, "0")}:${String(s).padStart(2, "0")}`;
}

export function HeaderToolbar({ timerVolume }: Props) {
  const [courses, setCourses] = useState<Course[]>([]);

  const [timerRunning, setTimerRunning] = useState(false);
  const [timerSeconds, setTimerSeconds] = useState(0);
  const timerTick = useRef<ReturnType<typeof setInterval> | null>(null);

  const [smartOpen, setSmartOpen] = useState(false);
  const [smartRunning, setSmartRunning] = useState(false);
  const [smartRemaining, setSmartRemaining] = useState(0);
  const smartRemRef = useRef(0);
  const smartIntervalRef = useRef<ReturnType<typeof setInterval> | null>(null);
  const [customH, setCustomH] = useState(1);

  useEffect(() => {
    void api<{ id: string } | null>("/api/terms/active").then(async (t) => {
      if (!t) {
        setCourses([]);
        return;
      }
      const cs = await api<Course[]>(`/api/courses?termId=${t.id}`);
      setCourses(cs);
    });
  }, []);

  useEffect(() => {
    if (!timerRunning) {
      if (timerTick.current) clearInterval(timerTick.current);
      timerTick.current = null;
      return;
    }
    timerTick.current = setInterval(() => {
      setTimerSeconds((x) => x + 1);
    }, 1000);
    return () => {
      if (timerTick.current) clearInterval(timerTick.current);
    };
  }, [timerRunning]);

  const stopSmart = useCallback(() => {
    if (smartIntervalRef.current) clearInterval(smartIntervalRef.current);
    smartIntervalRef.current = null;
    setSmartRunning(false);
    smartRemRef.current = 0;
    setSmartRemaining(0);
  }, []);

  useEffect(() => {
    if (!smartRunning) return;
    smartIntervalRef.current = setInterval(() => {
      smartRemRef.current -= 1;
      const r = smartRemRef.current;
      setSmartRemaining(r);
      if (r <= 0) {
        if (smartIntervalRef.current) clearInterval(smartIntervalRef.current);
        smartIntervalRef.current = null;
        setSmartRunning(false);
        playSoftChime(timerVolume);
      }
    }, 1000);
    return () => {
      if (smartIntervalRef.current) clearInterval(smartIntervalRef.current);
      smartIntervalRef.current = null;
    };
  }, [smartRunning, timerVolume]);

  const startSmartCountdown = (seconds: number) => {
    stopSmart();
    smartRemRef.current = seconds;
    setSmartRemaining(seconds);
    setSmartRunning(true);
    setSmartOpen(false);
  };

  const toggleTimer = () => {
    setTimerRunning((v) => !v);
  };

  const smartLabel =
    smartRunning || smartRemaining > 0 ? formatHMS(Math.max(0, smartRemaining)) : null;

  return (
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
                  to="/sessions"
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
          onClick={toggleTimer}
          className="inline-flex items-center gap-2 rounded-full bg-blue-600 px-3.5 py-2.5 text-[0.9375rem] font-medium text-white shadow-sm hover:bg-blue-500"
        >
          {timerRunning ? (
            <Pause className="h-4 w-4" />
          ) : (
            <Play className="h-4 w-4" />
          )}
          <Timer className="h-4 w-4" />
          Timer
          <ChevronDown className="h-4 w-4 opacity-70" />
        </button>
        <span className="tabular-nums text-[0.9375rem] font-medium text-slate-200">
          {formatHMS(timerSeconds)}
        </span>
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
            <p className="text-xs text-slate-500">Countdown</p>
            <div className="mt-2 flex flex-wrap gap-2">
              {[1, 2, 3, 4].map((h) => (
                <button
                  key={h}
                  type="button"
                  className="rounded-lg bg-slate-800 px-3 py-1.5 text-sm hover:bg-slate-700"
                  onClick={() => startSmartCountdown(h * 3600)}
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
                onClick={() => startSmartCountdown(Math.max(60, Math.round(customH * 3600)))}
              >
                Start
              </button>
            </div>
          </div>
        )}
        {smartLabel && (
          <span className="ml-2 font-mono text-[0.9375rem] text-emerald-300">{smartLabel}</span>
        )}
      </div>
    </div>
  );
}
