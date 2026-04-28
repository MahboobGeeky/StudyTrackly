import { Check, Pause, Play, X } from "lucide-react";
import { useCallback, useEffect, useRef, useState } from "react";
import { format } from "date-fns";
import { api } from "@/lib/api";
import { playSmartTimerRingtone, primeSoftChime } from "@/lib/chime";
import type { Course, SmartTimerRingtone } from "@/types";

type Mode = "countup" | "countdown";

function formatHMS(totalSeconds: number) {
  const h = Math.floor(totalSeconds / 3600);
  const m = Math.floor((totalSeconds % 3600) / 60);
  const s = totalSeconds % 60;
  return `${String(h).padStart(2, "0")}:${String(m).padStart(2, "0")}:${String(s).padStart(2, "0")}`;
}

type Props = {
  open: boolean;
  onClose: () => void;
  mode: Mode;
  countdownSeconds: number;
  timerVolume: number;
  smartTimerRingtone: SmartTimerRingtone;
  timerRingtoneRepeat: number;
  courses: Course[];
  onSessionSaved: () => void;
};

export function FullscreenTimer({
  open,
  onClose,
  mode,
  countdownSeconds,
  timerVolume,
  smartTimerRingtone,
  timerRingtoneRepeat,
  courses,
  onSessionSaved,
}: Props) {
  const [courseId, setCourseId] = useState("");
  const [running, setRunning] = useState(false);
  const [paused, setPaused] = useState(false);
  const sessionStartRef = useRef<Date | null>(null);
  const pauseStartedRef = useRef<Date | null>(null);
  const breakMsRef = useRef(0);
  const [displaySeconds, setDisplaySeconds] = useState(0);
  const [remaining, setRemaining] = useState(countdownSeconds);
  const tickRef = useRef<ReturnType<typeof setInterval> | null>(null);
  const savedRef = useRef(false);
  /** Avoid stale interval closures so alarm always uses latest saved settings. */
  const timerVolumeRef = useRef(timerVolume);
  const smartTimerRingtoneRef = useRef(smartTimerRingtone);
  const timerRingtoneRepeatRef = useRef(timerRingtoneRepeat);
  timerVolumeRef.current = timerVolume;
  smartTimerRingtoneRef.current = smartTimerRingtone;
  timerRingtoneRepeatRef.current = timerRingtoneRepeat;

  const reset = useCallback(() => {
    if (tickRef.current) clearInterval(tickRef.current);
    tickRef.current = null;
    setRunning(false);
    setPaused(false);
    sessionStartRef.current = null;
    pauseStartedRef.current = null;
    breakMsRef.current = 0;
    setDisplaySeconds(0);
    setRemaining(countdownSeconds);
    savedRef.current = false;
  }, [countdownSeconds]);

  useEffect(() => {
    if (!open) {
      reset();
      return;
    }
    setRemaining(countdownSeconds);
  }, [open, countdownSeconds, reset]);

  const finalizeSession = useCallback(
    async (fromAutoComplete: boolean) => {
      if (savedRef.current) return;
      if (!courseId) {
        if (fromAutoComplete) {
          alert("Timer finished — pick a course next time to save automatically.");
        } else {
          alert("Pick a course first.");
        }
        return;
      }
      savedRef.current = true;
      const term = await api<{ id: string } | null>("/api/terms/active");
      if (!term) {
        alert("No active term.");
        savedRef.current = false;
        return;
      }
      const now = new Date();
      const start = sessionStartRef.current ?? now;
      if (pauseStartedRef.current) {
        breakMsRef.current += Date.now() - pauseStartedRef.current.getTime();
        pauseStartedRef.current = null;
      }
      const breakMinutes = Math.round(breakMsRef.current / 60000);
      // Store a stable "date" in Mongo so local-day rollovers don’t shift it.
      // We intentionally store at 12:00:00.000Z (noon UTC) of the user's local day.
      const y = start.getFullYear();
      const m = start.getMonth();
      const day = start.getDate();
      const dateIso = new Date(Date.UTC(y, m, day, 12, 0, 0, 0)).toISOString();

      await api("/api/sessions", {
        method: "POST",
        body: JSON.stringify({
          termId: term.id,
          courseId,
          date: dateIso,
          startTime: format(start, "HH:mm"),
          endTime: format(now, "HH:mm"),
          breakMinutes,
          activity: "Timer",
          note: mode === "countdown" ? "SmartTimer" : "Timer",
          label: "",
        }),
      });
      onSessionSaved();
      reset();
      onClose();
    },
    [courseId, mode, onClose, onSessionSaved, reset]
  );

  useEffect(() => {
    if (!open || !running) {
      if (tickRef.current) clearInterval(tickRef.current);
      tickRef.current = null;
      return;
    }

    if (paused) {
      if (tickRef.current) clearInterval(tickRef.current);
      tickRef.current = null;
      return;
    }

    tickRef.current = setInterval(() => {
      if (mode === "countup") {
        if (!sessionStartRef.current) return;
        const now = Date.now();
        const gross = now - sessionStartRef.current.getTime();
        let pauseExtra = 0;
        if (pauseStartedRef.current) pauseExtra = now - pauseStartedRef.current.getTime();
        const net = gross - breakMsRef.current - pauseExtra;
        setDisplaySeconds(Math.max(0, Math.floor(net / 1000)));
      } else {
        if (!sessionStartRef.current) return;
        const now = Date.now();
        const gross = now - sessionStartRef.current.getTime();
        let pauseExtra = 0;
        if (pauseStartedRef.current) pauseExtra = now - pauseStartedRef.current.getTime();
        const net = gross - breakMsRef.current - pauseExtra;
        const elapsedSeconds = Math.floor(net / 1000);
        const newRemaining = Math.max(0, countdownSeconds - elapsedSeconds);

        if (newRemaining <= 0) {
          if (tickRef.current) clearInterval(tickRef.current);
          tickRef.current = null;
          setRunning(false);
          setRemaining(0);
          playSmartTimerRingtone(
            smartTimerRingtoneRef.current,
            timerVolumeRef.current,
            timerRingtoneRepeatRef.current
          );
          void finalizeSession(true);
        } else {
          setRemaining(newRemaining);
        }
      }
    }, 1000);

    return () => {
      if (tickRef.current) clearInterval(tickRef.current);
      tickRef.current = null;
    };
  }, [
    open,
    running,
    paused,
    mode,
    timerVolume,
    smartTimerRingtone,
    finalizeSession,
  ]);

  const togglePause = () => {
    if (!running) return;
    if (paused) {
      if (pauseStartedRef.current) {
        breakMsRef.current += Date.now() - pauseStartedRef.current.getTime();
        pauseStartedRef.current = null;
      }
      setPaused(false);
    } else {
      pauseStartedRef.current = new Date();
      setPaused(true);
    }
  };

  const startSession = () => {
    if (!courseId) {
      alert("Choose a course.");
      return;
    }

    // Prime WebAudio so the alarm can play at the end (autoplay policies).
    if (mode === "countdown") {
      void primeSoftChime(timerVolumeRef.current);
    }

    savedRef.current = false;
    sessionStartRef.current = new Date();
    breakMsRef.current = 0;
    pauseStartedRef.current = null;
    setRunning(true);
    setPaused(false);
    if (mode === "countdown") {
      setRemaining(countdownSeconds);
      setDisplaySeconds(0);
    } else {
      setDisplaySeconds(0);
    }
  };

  if (!open) return null;

  const mainDisplay =
    mode === "countdown"
      ? formatHMS(Math.max(0, remaining))
      : formatHMS(displaySeconds);

  return (
    <div className="fixed inset-0 z-[200] flex flex-col bg-gradient-to-b from-indigo-950 via-slate-950 to-black text-white">
      <div className="flex items-center justify-between px-6 py-4">
        <div className="flex items-center gap-2">
          <img src="/studytrackly-logo.svg" alt="" className="h-9 w-auto" />
          <span className="text-sm font-medium text-slate-300">StudyTrackly</span>
        </div>
        <select
          value={courseId}
          onChange={(e) => setCourseId(e.target.value)}
          className="rounded-full border border-white/20 bg-white/10 px-4 py-2 text-sm outline-none"
        >
          <option value="">Course…</option>
          {courses.map((c) => (
            <option key={c.id} value={c.id}>
              {c.name}
            </option>
          ))}
        </select>
      </div>

      <div className="flex flex-1 flex-col items-center justify-center px-6">
        <p className="mb-4 text-sm text-slate-400">
          {mode === "countdown" ? "SmartTimer" : "Timer"} · Paused time is added to break
        </p>
        <div className="font-mono text-6xl font-bold tracking-tight sm:text-7xl md:text-8xl">
          {mainDisplay}
        </div>
        {sessionStartRef.current && (
          <p className="mt-6 text-sm text-slate-500">
            {format(sessionStartRef.current, "HH:mm")} → {format(new Date(), "HH:mm")}
          </p>
        )}

        <div className="mt-10 flex flex-wrap items-center justify-center gap-4">
          {!running ? (
            <button
              type="button"
              onClick={startSession}
              className="inline-flex items-center gap-2 rounded-full bg-white px-8 py-4 text-base font-medium text-slate-900"
            >
              <Play className="h-5 w-5" />
              Start
            </button>
          ) : (
            <>
              <button
                type="button"
                onClick={togglePause}
                className="inline-flex items-center gap-2 rounded-full bg-white px-8 py-4 text-base font-medium text-slate-900"
              >
                {paused ? <Play className="h-5 w-5" /> : <Pause className="h-5 w-5" />}
                {paused ? "Resume" : "Pause"}
              </button>
              <button
                type="button"
                onClick={() => void finalizeSession(false)}
                className="inline-flex items-center gap-2 rounded-full bg-emerald-600 px-8 py-4 text-base font-medium text-white"
              >
                <Check className="h-5 w-5" />
                Save session
              </button>
            </>
          )}
        </div>
      </div>

      <div className="flex justify-end border-t border-white/10 px-6 py-4">
        <button
          type="button"
          onClick={() => {
            reset();
            onClose();
          }}
          className="rounded-full p-3 text-slate-400 hover:bg-white/10 hover:text-white"
          aria-label="Close"
        >
          <X className="h-6 w-6" />
        </button>
      </div>
    </div>
  );
}
