import { Router } from "express";
import { z } from "zod";
import type { AuthedRequest } from "../middleware/auth.js";
import { sessionDurationMinutes } from "../lib/time.js";
import { DayGoalOverride } from "../models/DayGoalOverride.js";
import { Session } from "../models/Session.js";
import { Term } from "../models/Term.js";

const router = Router();

function dateKeyFromDate(d: Date): string {
  const y = d.getFullYear();
  const m = String(d.getMonth() + 1).padStart(2, "0");
  const day = String(d.getDate()).padStart(2, "0");
  return `${y}-${m}-${day}`;
}

function parseKey(key: string): Date {
  const [y, m, d] = key.split("-").map(Number);
  return new Date(y, m - 1, d, 12, 0, 0, 0);
}

router.get("/", async (req, res, next) => {
  try {
    const authed = req as AuthedRequest;
    const termId = req.query.termId as string | undefined;
    const fromQ = req.query.from as string | undefined;
    const toQ = req.query.to as string | undefined;
    if (!termId) {
      return res.status(400).json({ error: "termId required" });
    }

    const term = await Term.findOne({ _id: termId, userId: authed.userId }).lean();
    if (!term) return res.status(404).json({ error: "Term not found" });

    const start = fromQ ? parseKey(fromQ) : new Date(term.startDate);
    const end = toQ ? parseKey(toQ) : new Date(term.endDate);
    const overrides = await DayGoalOverride.find({
      userId: authed.userId,
      termId,
    }).lean();
    const overrideMap = new Map(overrides.map((o) => [o.dateKey, o.goalMinutes]));

    const durationByDay = new Map<string, number>();
    const sessions = await Session.find({ userId: authed.userId, termId }).lean();
    for (const s of sessions) {
      const key = dateKeyFromDate(new Date(s.date));
      const m = sessionDurationMinutes(s.startTime, s.endTime, s.breakMinutes);
      durationByDay.set(key, (durationByDay.get(key) ?? 0) + m);
    }

    const rows: {
      dateKey: string;
      durationMinutes: number;
      goalMinutes: number;
      gapMinutes: number;
      sharePriceMinutes: number;
      progressPct: number;
    }[] = [];

    let cursor = new Date(start);
    const endT = new Date(end);
    let cumulativeGap = 0;

    while (cursor <= endT) {
      const key = dateKeyFromDate(cursor);
      const duration = durationByDay.get(key) ?? 0;
      const goal = overrideMap.get(key) ?? term.dailyGoalMinutes;
      const gap = duration - goal;
      cumulativeGap += gap;
      const progressPct = goal > 0 ? Math.min(100, (duration / goal) * 100) : 0;
      rows.push({
        dateKey: key,
        durationMinutes: duration,
        goalMinutes: goal,
        gapMinutes: gap,
        sharePriceMinutes: cumulativeGap,
        progressPct,
      });
      cursor.setDate(cursor.getDate() + 1);
    }

    res.json({ termId, rows });
  } catch (e) {
    next(e);
  }
});

router.post("/adjust-goal", async (req, res, next) => {
  try {
    const authed = req as AuthedRequest;
    const body = z
      .object({
        termId: z.string(),
        dateKey: z.string().regex(/^\d{4}-\d{2}-\d{2}$/),
        deltaMinutes: z.number().int(),
      })
      .parse(req.body);

    const term = await Term.findOne({ _id: body.termId, userId: authed.userId }).lean();
    if (!term) return res.status(404).json({ error: "Term not found" });

    const existing = await DayGoalOverride.findOne({
      userId: authed.userId,
      termId: body.termId,
      dateKey: body.dateKey,
    }).lean();
    const base = term.dailyGoalMinutes;
    const prev = existing?.goalMinutes ?? base;
    const nextGoal = Math.max(10, prev + body.deltaMinutes);

    const row = await DayGoalOverride.findOneAndUpdate(
      { userId: authed.userId, termId: body.termId, dateKey: body.dateKey },
      { $set: { goalMinutes: nextGoal } },
      { upsert: true, new: true }
    ).lean();
    res.json(row);
  } catch (e) {
    next(e);
  }
});

export default router;
