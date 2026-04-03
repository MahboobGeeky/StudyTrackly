import { useEffect, useMemo, useRef, useState } from "react";
import {
  Bar,
  BarChart,
  CartesianGrid,
  Legend,
  ReferenceLine,
  ResponsiveContainer,
  Tooltip,
  XAxis,
  YAxis,
} from "recharts";
import { api } from "@/lib/api";
import { courseColorHex } from "@/lib/chartColors";

type CourseLeg = { id: string; name: string; color: string; dataKey: string };

type Row = Record<string, string | number> & { dateKey: string; label: string; totalHours: number };

export function DailyStackedChart() {
  const [rows, setRows] = useState<Row[]>([]);
  const [courses, setCourses] = useState<CourseLeg[]>([]);
  const [avg, setAvg] = useState(0);
  const scrollRef = useRef<HTMLDivElement | null>(null);

  function dateKeyFromDate(d: Date): string {
    const y = d.getFullYear();
    const m = String(d.getMonth() + 1).padStart(2, "0");
    const day = String(d.getDate()).padStart(2, "0");
    return `${y}-${m}-${day}`;
  }

  useEffect(() => {
    void api<{ rows: Row[]; courses: CourseLeg[]; averageHoursPerDay: number }>(
      "/api/stats/daily-stacked"
    ).then((r) => {
      setRows(r.rows);
      setCourses(r.courses);
      setAvg(r.averageHoursPerDay);
    });
  }, []);

  useEffect(() => {
    const el = scrollRef.current;
    if (!el) return;
    if (rows.length === 0) return;

    const categoryWidth = 56;
    const todayKey = dateKeyFromDate(new Date());
    const todayIdx = rows.findIndex((r) => r.dateKey === todayKey);
    const idx = todayIdx >= 0 ? todayIdx : rows.length - 1;

    const scrollToToday = () => {
      const el2 = scrollRef.current;
      if (!el2) return;
      const maxScroll = el2.scrollWidth - el2.clientWidth;
      const target = (idx + 1) * categoryWidth - el2.clientWidth; // today at right edge
      el2.scrollLeft = Math.min(maxScroll, Math.max(0, target));
    };

    // Initial layout pass.
    requestAnimationFrame(scrollToToday);

    window.addEventListener("resize", scrollToToday);
    return () => window.removeEventListener("resize", scrollToToday);
  }, [rows]);

  const legendItems = useMemo(
    () =>
      courses.map((c) => ({
        ...c,
        hex: courseColorHex(c.color),
      })),
    [courses]
  );

  return (
    <div className="rounded-2xl border border-slate-800 bg-slate-900/50 p-5">
      <div className="flex flex-wrap items-center justify-between gap-2">
        <h3 className="text-[0.9375rem] font-semibold text-slate-100">
          Daily study by course
        </h3>
        <span className="text-[0.8125rem] text-slate-500">
          Average: {avg.toFixed(1)}h / day
        </span>
      </div>
      <div ref={scrollRef} className="mt-4 h-80 overflow-x-auto overflow-y-hidden">
        <div
          style={{
            width: Math.max(720, rows.length * 56),
            height: "100%",
          }}
        >
          <ResponsiveContainer width="100%" height="100%">
            <BarChart data={rows}>
              <CartesianGrid stroke="#1e293b" vertical={false} />
              <XAxis dataKey="label" stroke="#64748b" tick={{ fontSize: 11 }} />
              <YAxis stroke="#64748b" tick={{ fontSize: 11 }} tickFormatter={(v) => `${v}h`} />
              <Tooltip
                contentStyle={{
                  background: "#0f172a",
                  border: "1px solid #334155",
                  borderRadius: 8,
                  fontSize: 12,
                }}
              />
              <ReferenceLine
                y={avg}
                stroke="#94a3b8"
                strokeDasharray="4 4"
                label={{ value: `Avg ${avg.toFixed(1)}h`, fill: "#94a3b8", fontSize: 11 }}
              />
              {legendItems.map((c) => (
                <Bar
                  key={c.id}
                  dataKey={c.dataKey}
                  stackId="study"
                  fill={c.hex}
                  name={c.name}
                  radius={[0, 0, 0, 0]}
                />
              ))}
              <Legend wrapperStyle={{ fontSize: 12 }} />
            </BarChart>
          </ResponsiveContainer>
        </div>
      </div>
      <div className="mt-3 flex flex-wrap gap-4 text-[0.8125rem]">
        {legendItems.map((c) => (
          <span key={c.id} className="flex items-center gap-2 text-slate-400">
            <span className="inline-block h-3 w-3 rounded-sm" style={{ background: c.hex }} />
            {c.name}
          </span>
        ))}
      </div>
    </div>
  );
}
