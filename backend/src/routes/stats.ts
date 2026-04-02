import { Router } from "express";
import type { AuthedRequest } from "../middleware/auth.js";
import { sessionDurationMinutes } from "../lib/time.js";
import { Course } from "../models/Course.js";
import { Session } from "../models/Session.js";
import { Term } from "../models/Term.js";

const router = Router();

function startOfDay(d: Date) {
  const x = new Date(d);
  x.setHours(0, 0, 0, 0);
  return x;
}

function endOfDay(d: Date) {
  const x = new Date(d);
  x.setHours(23, 59, 59, 999);
  return x;
}

function addDays(d: Date, n: number) {
  const x = new Date(d);
  x.setDate(x.getDate() + n);
  return x;
}

/** @internal exported for tests */
export function computeStreak(sessionDates: Date[], today: Date): number {
  const days = new Set(
    sessionDates.map((d) => startOfDay(d).getTime())
  );
  let streak = 0;
  let cursor = startOfDay(today);
  while (days.has(cursor.getTime())) {
    streak += 1;
    cursor = addDays(cursor, -1);
  }
  return streak;
}

router.get("/dashboard", async (_req, res, next) => {
  try {
    const req = _req as AuthedRequest;
    const term = await Term.findOne({ userId: req.userId, isActive: true }).lean();
    if (!term) {
      return res.json({ term: null });
    }

    const now = new Date();
    const todayStart = startOfDay(now);
    const todayEnd = endOfDay(now);
    const weekStart = addDays(todayStart, -6);

    let totalMinutes = 0;
    let todayMinutes = 0;
    let weekMinutes = 0;
    let todaySessionCount = 0;
    const courseMinutes: Record<string, { name: string; color: string; minutes: number }> = {};

    const sessions = await Session.find({ userId: req.userId, termId: term._id }).lean();
    const courseIds = [...new Set(sessions.map((s) => String(s.courseId)))];
    const courses = await Course.find({ userId: req.userId, _id: { $in: courseIds } }).lean();
    const courseMap = new Map(courses.map((c) => [String(c._id), c]));

    for (const s of sessions) {
      const m = sessionDurationMinutes(s.startTime, s.endTime, s.breakMinutes);
      totalMinutes += m;
      const d = startOfDay(s.date).getTime();
      if (d === todayStart.getTime()) todayMinutes += m;
      if (d === todayStart.getTime()) todaySessionCount += 1;
      if (s.date >= weekStart && s.date <= todayEnd) weekMinutes += m;
      const cid = String(s.courseId);
      if (!courseMinutes[cid]) {
        const c = courseMap.get(cid);
        courseMinutes[cid] = {
          name: c?.name ?? "Course",
          color: c?.color ?? "blue",
          minutes: 0,
        };
      }
      courseMinutes[cid].minutes += m;
    }

    const termStart = startOfDay(term.startDate);
    const termEnd = endOfDay(term.endDate);
    const totalTermDays = Math.max(
      1,
      Math.ceil((termEnd.getTime() - termStart.getTime()) / (24 * 60 * 60 * 1000)) + 1
    );
    const elapsedDays = Math.min(
      totalTermDays,
      Math.max(0, Math.floor((now.getTime() - termStart.getTime()) / (24 * 60 * 60 * 1000)) + 1)
    );

    const studyProgressPct =
      term.studyGoalHours > 0
        ? Math.min(100, (totalMinutes / 60 / term.studyGoalHours) * 100)
        : 0;
    const timeElapsedPct = (elapsedDays / totalTermDays) * 100;

    const sessionDates = sessions.map((s) => s.date);
    const streak = computeStreak(sessionDates, now);

    const studyDaysTarget = Math.max(1, Math.round(totalTermDays * 0.7));
    const distinctStudyDays = new Set(
      sessions.map((s) => startOfDay(s.date).getTime())
    ).size;

    res.json({
      term: {
        id: String(term._id),
        name: term.name,
        startDate: term.startDate,
        endDate: term.endDate,
        studyGoalHours: term.studyGoalHours,
        dailyGoalMinutes: term.dailyGoalMinutes,
        goldMedals: term.goldMedals,
        silverMedals: term.silverMedals,
        bronzeMedals: term.bronzeMedals,
        examCount: term.examCount,
      },
      totals: {
        totalMinutes,
        todayMinutes,
        weekMinutes,
        sessionCount: sessions.length,
        todaySessionCount,
      },
      progress: {
        studyProgressPct,
        timeElapsedPct,
        elapsedDays,
        totalTermDays,
        distinctStudyDays,
        studyDaysTarget,
      },
      courseBreakdown: Object.values(courseMinutes),
      streak,
    });
  } catch (e) {
    next(e);
  }
});

router.get("/calendar-line", async (req, res, next) => {
  try {
    const authed = req as AuthedRequest;
    const term = await Term.findOne({ userId: authed.userId, isActive: true }).lean();
    if (!term) return res.json({ points: [] });

    const year = req.query.year ? Number(req.query.year) : new Date().getFullYear();
    const month = req.query.month != null ? Number(req.query.month) : new Date().getMonth();

    const monthStart = new Date(year, month, 1);
    const monthEnd = new Date(year, month + 1, 0, 23, 59, 59, 999);

    const byDay: Record<string, number> = {};
    const sessions = await Session.find({ userId: authed.userId, termId: term._id }).lean();
    for (const s of sessions) {
      const dt = new Date(s.date);
      if (dt < monthStart || dt > monthEnd) continue;
      const key = startOfDay(s.date).toISOString();
      const m = sessionDurationMinutes(s.startTime, s.endTime, s.breakMinutes);
      byDay[key] = (byDay[key] ?? 0) + m;
    }

    const points = Object.entries(byDay).map(([iso, minutes]) => ({
      date: iso,
      hours: Math.round((minutes / 60) * 10) / 10,
    }));

    res.json({ points: points.sort((a, b) => a.date.localeCompare(b.date)) });
  } catch (e) {
    next(e);
  }
});

router.get("/weekday-radar", async (_req, res, next) => {
  try {
    const req = _req as AuthedRequest;
    const term = await Term.findOne({ userId: req.userId, isActive: true }).lean();
    if (!term) {
      return res.json({
        weekdays: ["Sun", "Mon", "Tue", "Wed", "Thu", "Fri", "Sat"].map((name) => ({
          name,
          hours: 0,
        })),
      });
    }

    const totals = [0, 0, 0, 0, 0, 0, 0];
    const counts = [0, 0, 0, 0, 0, 0, 0];
    const sessions = await Session.find({ userId: req.userId, termId: term._id }).lean();
    for (const s of sessions) {
      const m = sessionDurationMinutes(s.startTime, s.endTime, s.breakMinutes);
      const wd = s.date.getDay();
      totals[wd] += m;
      counts[wd] += 1;
    }

    const names = ["Sun", "Mon", "Tue", "Wed", "Thu", "Fri", "Sat"];
    const weekdays = names.map((name, i) => ({
      name,
      hours: Math.round((totals[i] / 60) * 10) / 10,
      sessions: counts[i],
    }));

    res.json({ weekdays });
  } catch (e) {
    next(e);
  }
});

router.get("/study-bars", async (req, res, next) => {
  try {
    const mode = (req.query.mode as string) === "months" ? "months" : "weeks";
    const authed = req as AuthedRequest;
    const term = await Term.findOne({ userId: authed.userId, isActive: true }).lean();
    if (!term) return res.json({ bars: [] });

    const byLabel: Record<string, number> = {};
    const now = new Date();

    const sessions = await Session.find({ userId: authed.userId, termId: term._id }).lean();
    for (const s of sessions) {
      const m = sessionDurationMinutes(s.startTime, s.endTime, s.breakMinutes);
      let key: string;
      if (mode === "months") {
        key = `${s.date.getFullYear()}-${String(s.date.getMonth() + 1).padStart(2, "0")}`;
      } else {
        const ws = startOfDay(s.date);
        const day = ws.getDay();
        const diff = ws.getDate() - day + (day === 0 ? -6 : 1);
        const weekStart = new Date(ws);
        weekStart.setDate(diff);
        key = weekStart.toISOString().slice(0, 10);
      }
      byLabel[key] = (byLabel[key] ?? 0) + m;
    }

    const bars = Object.entries(byLabel)
      .map(([label, minutes]) => ({
        label,
        hours: Math.round((minutes / 60) * 10) / 10,
      }))
      .sort((a, b) => a.label.localeCompare(b.label))
      .slice(-12);

    res.json({ bars, generatedAt: now.toISOString() });
  } catch (e) {
    next(e);
  }
});

function dateKeyFromDate(d: Date): string {
  const y = d.getFullYear();
  const m = String(d.getMonth() + 1).padStart(2, "0");
  const day = String(d.getDate()).padStart(2, "0");
  return `${y}-${m}-${day}`;
}

router.get("/daily-stacked", async (req, res, next) => {
  try {
    const authed = req as AuthedRequest;
    const days = Math.min(60, Math.max(1, Number(req.query.days) || 14));
    const term = await Term.findOne({ userId: authed.userId, isActive: true }).lean();
    if (!term) return res.json({ rows: [], courses: [], averageHoursPerDay: 0 });

    const end = new Date();
    const start = new Date(end);
    start.setDate(start.getDate() - (days - 1));

    const byDayCourse = new Map<string, Map<string, number>>();
    const courseNames = new Map<string, string>();
    const courseColors = new Map<string, string>();

    const courseRecords = await Course.find({ userId: authed.userId, termId: term._id }).lean();
    for (const c of courseRecords) {
      courseNames.set(String(c._id), c.name);
      courseColors.set(String(c._id), c.color);
    }

    const sessions = await Session.find({ userId: authed.userId, termId: term._id }).lean();
    for (const s of sessions) {
      const d = new Date(s.date);
      if (d < start || d > end) continue;
      const dk = dateKeyFromDate(d);
      const m = sessionDurationMinutes(s.startTime, s.endTime, s.breakMinutes);
      if (!byDayCourse.has(dk)) byDayCourse.set(dk, new Map());
      const inner = byDayCourse.get(dk)!;
      const cid = String(s.courseId);
      inner.set(cid, (inner.get(cid) ?? 0) + m);
    }

    const dayKeys: string[] = [];
    const cur = new Date(start);
    while (cur <= end) {
      dayKeys.push(dateKeyFromDate(cur));
      cur.setDate(cur.getDate() + 1);
    }

    const courseIds = [...courseNames.keys()];
    const rows = dayKeys.map((dk) => {
      const row: Record<string, string | number> = {
        dateKey: dk,
        label: dk.slice(5),
      };
      let total = 0;
      const inner = byDayCourse.get(dk);
      for (const cid of courseIds) {
        const mins = inner?.get(cid) ?? 0;
        const h = Math.round((mins / 60) * 100) / 100;
        row[`c_${cid}`] = h;
        total += mins;
      }
      row.totalHours = Math.round((total / 60) * 100) / 100;
      return row;
    });

    const courses = courseIds.map((id) => ({
      id,
      name: courseNames.get(id)!,
      color: courseColors.get(id)!,
      dataKey: `c_${id}`,
    }));

    const totalMins = rows.reduce((acc, r) => {
      let m = 0;
      for (const cid of courseIds) {
        m += ((r[`c_${cid}`] as number) ?? 0) * 60;
      }
      return acc + m;
    }, 0);
    const avgPerDay = rows.length > 0 ? totalMins / rows.length / 60 : 0;

    res.json({
      rows,
      courses,
      averageHoursPerDay: Math.round(avgPerDay * 100) / 100,
    });
  } catch (e) {
    next(e);
  }
});

router.get("/time-buckets", async (_req, res, next) => {
  try {
    const req = _req as AuthedRequest;
    const term = await Term.findOne({ userId: req.userId, isActive: true }).lean();
    if (!term) {
      return res.json({
        buckets: [
          { name: "Night", hours: 0 },
          { name: "Morning", hours: 0 },
          { name: "Afternoon", hours: 0 },
          { name: "Evening", hours: 0 },
        ],
      });
    }

    const totals = [0, 0, 0, 0];
    const sessions = await Session.find({ userId: req.userId, termId: term._id }).lean();
    for (const s of sessions) {
      const m = sessionDurationMinutes(s.startTime, s.endTime, s.breakMinutes);
      const [hh] = s.startTime.split(":").map(Number);
      let idx = 0;
      if (hh >= 6 && hh < 12) idx = 1;
      else if (hh >= 12 && hh < 18) idx = 2;
      else if (hh >= 18) idx = 3;
      else idx = 0;
      totals[idx] += m;
    }

    const names = ["Night", "Morning", "Afternoon", "Evening"];
    const buckets = names.map((name, i) => ({
      name,
      hours: Math.round((totals[i] / 60) * 10) / 10,
    }));

    res.json({ buckets });
  } catch (e) {
    next(e);
  }
});

export default router;
