import { useEffect, useMemo, useState } from "react";
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

  useEffect(() => {
    void api<{ rows: Row[]; courses: CourseLeg[]; averageHoursPerDay: number }>(
      "/api/stats/daily-stacked?days=14"
    ).then((r) => {
      setRows(r.rows);
      setCourses(r.courses);
      setAvg(r.averageHoursPerDay);
    });
  }, []);

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
      <div className="mt-4 h-80">
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
