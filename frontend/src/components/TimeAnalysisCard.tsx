import { HelpCircle } from "lucide-react";
import { useEffect, useMemo, useState } from "react";
import {
  PolarAngleAxis,
  PolarGrid,
  PolarRadiusAxis,
  Radar,
  RadarChart,
  ResponsiveContainer,
} from "recharts";
import { api } from "@/lib/api";

type Wd = { name: string; hours: number; sessions?: number };
type Bucket = { name: string; hours: number };

export function TimeAnalysisCard() {
  const [tab, setTab] = useState<"weekday" | "tod">("weekday");
  const [mode, setMode] = useState<"total" | "avg">("total");
  const [weekdays, setWeekdays] = useState<Wd[]>([]);
  const [buckets, setBuckets] = useState<Bucket[]>([]);

  useEffect(() => {
    void api<{ weekdays: Wd[] }>("/api/stats/weekday-radar").then((r) => setWeekdays(r.weekdays));
  }, []);

  useEffect(() => {
    void api<{ buckets: Bucket[] }>("/api/stats/time-buckets").then((r) => setBuckets(r.buckets));
  }, []);

  const radarData = useMemo(() => {
    if (tab === "weekday") {
      return weekdays.map((d) => {
        const sessions = d.sessions ?? 0;
        const val =
          mode === "avg"
            ? sessions > 0
              ? Math.round((d.hours / sessions) * 100) / 100
              : d.hours
            : d.hours;
        return { name: d.name, value: val };
      });
    }
    return buckets.map((b) => ({
      name: b.name,
      value: b.hours,
    }));
  }, [tab, mode, weekdays, buckets]);

  const safeRadarData = radarData.map((x) => ({
    name: String(x.name ?? ""),
    value: Number.isFinite(x.value) ? x.value : 0,
  }));

  const maxVal = Math.max(1, ...safeRadarData.map((x) => x.value));

  return (
    <div className="rounded-2xl border border-slate-800 bg-slate-900/50 p-5">
      <div className="flex items-start gap-2">
        <h3 className="text-[0.9375rem] font-semibold text-slate-100">Time analysis</h3>
        <button
          type="button"
          className="text-slate-500 hover:text-slate-300"
          aria-label="Info"
        >
          <HelpCircle className="h-4 w-4" />
        </button>
      </div>

      <div className="mt-3 inline-flex rounded-full bg-slate-800/80 p-1 text-[0.8125rem]">
        <button
          type="button"
          onClick={() => setTab("weekday")}
          className={`rounded-full px-3 py-1.5 ${
            tab === "weekday" ? "bg-white text-slate-900 shadow" : "text-slate-400"
          }`}
        >
          Weekdays
        </button>
        <button
          type="button"
          onClick={() => setTab("tod")}
          className={`rounded-full px-3 py-1.5 ${
            tab === "tod" ? "bg-white text-slate-900 shadow" : "text-slate-400"
          }`}
        >
          Time of day
        </button>
      </div>

      {tab === "weekday" && (
        <div className="mt-2 flex gap-4 text-[0.8125rem] text-slate-500">
          <label className="flex cursor-pointer items-center gap-1.5">
            <input
              type="radio"
              name="tam"
              checked={mode === "total"}
              onChange={() => setMode("total")}
            />
            Total
          </label>
          <label className="flex cursor-pointer items-center gap-1.5">
            <input
              type="radio"
              name="tam"
              checked={mode === "avg"}
              onChange={() => setMode("avg")}
            />
            Average
          </label>
        </div>
      )}

      <div className="mt-4 h-72">
        {safeRadarData.length === 0 ? (
          <div className="flex h-full items-center justify-center text-[0.8125rem] text-slate-500">
            No data yet
          </div>
        ) : (
          <ResponsiveContainer width="100%" height="100%">
            <RadarChart cx="50%" cy="50%" outerRadius="75%" data={safeRadarData}>
              <PolarGrid stroke="#334155" />
              <PolarAngleAxis dataKey="name" tick={{ fill: "#94a3b8", fontSize: 11 }} />
              <PolarRadiusAxis
                angle={90}
                domain={[0, maxVal * 1.15]}
                tick={{ fill: "#64748b", fontSize: 10 }}
              />
              <Radar
                name="hours"
                dataKey="value"
                stroke="#3b82f6"
                fill="#3b82f6"
                fillOpacity={0.35}
                strokeWidth={2}
                dot={{ r: 3 }}
              />
            </RadarChart>
          </ResponsiveContainer>
        )}
      </div>
      <p className="text-center text-[0.7rem] text-slate-600">Scale 0 – {maxVal.toFixed(1)}h</p>
    </div>
  );
}
