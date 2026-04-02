import { useEffect, useMemo, useState } from "react";
import { useOutletContext } from "react-router-dom";
import {
  Area,
  AreaChart,
  CartesianGrid,
  ResponsiveContainer,
  Tooltip,
  XAxis,
  YAxis,
} from "recharts";
import { DailyStackedChart } from "@/components/DailyStackedChart";
import { Header } from "@/components/Header";
import { TimeAnalysisCard } from "@/components/TimeAnalysisCard";
import type { AppOutletContext } from "@/layouts/outletContext";
import { api } from "@/lib/api";
import { formatMinutes } from "@/lib/format";

type RadarPoint = { name: string; hours: number };

export function DashboardPage() {
  const { stats, reload } = useOutletContext<AppOutletContext>();
  const [radar, setRadar] = useState<RadarPoint[]>([]);

  useEffect(() => {
    void api<{ weekdays: RadarPoint[] }>("/api/stats/weekday-radar").then((r) =>
      setRadar(r.weekdays)
    );
  }, [stats?.totals?.sessionCount]);

  const lineData = useMemo(
    () =>
      (stats?.courseBreakdown ?? []).map((c) => ({
        name: c.name,
        hours: Math.round((c.minutes / 60) * 10) / 10,
      })),
    [stats]
  );

  const dailyGoal = stats?.term?.dailyGoalMinutes ?? 720;
  const todayM = stats?.totals?.todayMinutes ?? 0;
  const elapsedDays = stats?.progress?.elapsedDays ?? 1;
  const dayPct = dailyGoal > 0 ? Math.min(100, (todayM / dailyGoal) * 100) : 0;

  const maxRadar = Math.max(1, ...radar.map((x) => x.hours));

  if (!stats) {
    return (
      <>
        <Header title="Dashboard" stats={null} />
        <main className="flex-1 p-6 text-center text-slate-400">Loading stats...</main>
      </>
    );
  }

  return (
    <>
      <Header title="Dashboard" stats={stats} />
      <main className="flex-1 space-y-6 overflow-auto p-6">
        <div className="grid gap-6 lg:grid-cols-3">
          <div className="space-y-4">
            <div className="grid grid-cols-3 gap-2">
              {[
                { label: "Today", m: stats?.totals?.todayMinutes ?? 0 },
                { label: "Week", m: stats?.totals?.weekMinutes ?? 0 },
                { label: "Month", m: stats?.totals?.weekMinutes ?? 0 },
              ].map((x) => (
                <div
                  key={x.label}
                  className="rounded-xl border border-slate-800 bg-slate-900/60 p-3 text-center"
                >
                  <p className="text-[0.8125rem] text-slate-500">{x.label}</p>
                  <p className="mt-1 text-[0.9375rem] font-medium">{formatMinutes(x.m)}</p>
                </div>
              ))}
            </div>

            <div className="rounded-2xl border border-slate-800 bg-slate-900/50 p-4">
              <div className="flex items-center justify-between">
                <span className="text-[0.9375rem] font-medium text-slate-200">
                  Streaks • {stats?.streak ?? 0} days
                </span>
                <span className="text-lg">🔥</span>
              </div>
              <p className="mt-2 text-[0.8125rem] text-slate-500">
                You&apos;ve studied for {stats?.streak ?? 0} days in a row. Keep going!
              </p>
            </div>

            <div className="rounded-2xl border border-slate-800 bg-slate-900/50 p-4">
              <p className="text-[0.9375rem] font-medium text-slate-200">Medals</p>
              <div className="mt-3 flex gap-4 text-[0.9375rem]">
                <span className="text-amber-300">
                  Gold {stats?.term?.goldMedals ?? 0}
                </span>
                <span className="text-slate-300">
                  Silver {stats?.term?.silverMedals ?? 0}
                </span>
                <span className="text-amber-700/90">
                  Bronze {stats?.term?.bronzeMedals ?? 0}
                </span>
              </div>
            </div>

            <div className="rounded-2xl border border-slate-800 bg-slate-900/50 p-4">
              <p className="text-[0.9375rem] font-medium">Weekday study (hours)</p>
              <div className="mt-3 space-y-2">
                {radar.map((d) => (
                  <div key={d.name} className="flex items-center gap-2 text-[0.8125rem]">
                    <span className="w-8 text-slate-500">{d.name}</span>
                    <div className="h-1.5 flex-1 overflow-hidden rounded-full bg-slate-800">
                      <div
                        className="h-full rounded-full bg-blue-500"
                        style={{ width: `${(d.hours / maxRadar) * 100}%` }}
                      />
                    </div>
                    <span className="w-8 text-right text-slate-400">{d.hours}h</span>
                  </div>
                ))}
              </div>
            </div>
          </div>

          <div className="space-y-4">
            <div className="rounded-2xl border border-slate-800 bg-slate-900/50 p-5">
              <div className="flex gap-2 text-[0.8125rem]">
                {["Day", "Week", "Month", "Total"].map((t, i) => (
                  <span
                    key={t}
                    className={
                      i === 0
                        ? "rounded-full bg-slate-800 px-2 py-1 text-white"
                        : "text-slate-500"
                    }
                  >
                    {t}
                  </span>
                ))}
              </div>
              <div className="mt-4 grid grid-cols-3 gap-2 text-center text-[0.9375rem]">
                <div>
                  <p className="text-[0.8125rem] text-slate-500">Study time</p>
                  <p className="mt-1 font-semibold">{formatMinutes(todayM)}</p>
                </div>
                <div>
                  <p className="text-[0.8125rem] text-slate-500">Goal</p>
                  <p className="mt-1 font-semibold">{formatMinutes(dailyGoal)}</p>
                </div>
                <div>
                  <p className="text-[0.8125rem] text-slate-500">Sessions</p>
                  <p className="mt-1 font-semibold">{stats?.totals?.sessionCount ?? 0}</p>
                </div>
              </div>
              <div className="mt-4 space-y-2">
                <div>
                  <div className="flex justify-between text-[0.8125rem] text-slate-500">
                    <span>Study progress</span>
                    <span>{dayPct.toFixed(1)}%</span>
                  </div>
                  <div className="mt-1 h-2 overflow-hidden rounded-full bg-slate-800">
                    <div
                      className="h-full rounded-full bg-emerald-500"
                      style={{ width: `${dayPct}%` }}
                    />
                  </div>
                </div>
                <div>
                  <div className="flex justify-between text-[0.8125rem] text-slate-500">
                    <span>Time elapsed (term)</span>
                    <span>{(stats?.progress?.timeElapsedPct ?? 0).toFixed(1)}%</span>
                  </div>
                  <div className="mt-1 h-2 overflow-hidden rounded-full bg-slate-800">
                    <div
                      className="h-full rounded-full bg-slate-200"
                      style={{
                        width: `${Math.min(100, stats?.progress?.timeElapsedPct ?? 0)}%`,
                      }}
                    />
                  </div>
                </div>
              </div>
            </div>

            <div className="rounded-2xl border border-slate-800 bg-slate-900/50 p-4">
              <div className="flex items-center justify-between">
                <p className="text-[0.9375rem] font-medium">Courses • {lineData.length}</p>
                <span className="text-[0.8125rem] text-slate-500">Chart</span>
              </div>
              <div className="mt-4 h-72">
                <ResponsiveContainer width="100%" height="100%">
                  <AreaChart data={lineData}>
                    <defs>
                      <linearGradient id="c1" x1="0" y1="0" x2="0" y2="1">
                        <stop offset="0%" stopColor="#3b82f6" stopOpacity={0.35} />
                        <stop offset="100%" stopColor="#3b82f6" stopOpacity={0} />
                      </linearGradient>
                    </defs>
                    <CartesianGrid stroke="#1e293b" vertical={false} />
                    <XAxis dataKey="name" stroke="#64748b" tick={{ fontSize: 12 }} />
                    <YAxis stroke="#64748b" tick={{ fontSize: 12 }} />
                    <Tooltip
                      contentStyle={{
                        background: "#0f172a",
                        border: "1px solid #334155",
                        borderRadius: 8,
                        fontSize: 12,
                      }}
                    />
                    <Area
                      type="monotone"
                      dataKey="hours"
                      stroke="#3b82f6"
                      fill="url(#c1)"
                      strokeWidth={2}
                    />
                  </AreaChart>
                </ResponsiveContainer>
              </div>
            </div>
          </div>

          <div className="space-y-4">
            <div className="rounded-2xl border border-slate-800 bg-slate-900/50 p-4">
              <p className="text-[0.9375rem] font-medium">
                Study days • {stats?.progress?.distinctStudyDays ?? 0}/
                {stats?.progress?.studyDaysTarget ?? 1}
              </p>
              <p className="mt-2 text-[0.8125rem] text-amber-300">Pace • Falling behind</p>
              <div className="mt-3 flex gap-1">
                {Array.from({ length: 12 }).map((_, i) => (
                  <span
                    key={i}
                    className={`h-2.5 flex-1 rounded-full ${
                      i < (stats?.progress?.distinctStudyDays ?? 0)
                        ? "bg-emerald-500"
                        : "bg-slate-800"
                    }`}
                  />
                ))}
              </div>
              <p className="mt-3 text-[0.8125rem] text-slate-500">
                Current pace:{" "}
                {formatMinutes(
                  Math.round((stats?.totals?.totalMinutes ?? 0) / elapsedDays)
                )}{" "}
                / day
              </p>
              <p className="text-[0.8125rem] text-slate-500">
                Required: {formatMinutes(dailyGoal)} / day (goal)
              </p>
            </div>

            <TimeAnalysisCard />

            <button
              type="button"
              onClick={() => void reload()}
              className="w-full rounded-lg border border-slate-700 py-2.5 text-[0.9375rem] text-slate-400 hover:bg-slate-900"
            >
              Refresh stats
            </button>
          </div>
        </div>

        <DailyStackedChart />
      </main>
    </>
  );
}
