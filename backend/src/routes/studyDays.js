import { Router } from "express";
import { z } from "zod";
import { sessionDurationMinutes } from "../lib/time.js";
import { DayGoalOverride } from "../models/DayGoalOverride.js";
import { Session } from "../models/Session.js";
import { Term } from "../models/Term.js";
import { dateKeyTZ, startOfDayTZ, addDaysTZ } from "../lib/date-utils.js";

const router = Router();

router.get("/", async (req, res, next) => {
  try {
    const termId = req.query.termId;
    const fromQ = req.query.from;
    const toQ = req.query.to;
    if (!termId) {
      return res.status(400).json({ error: "termId required" });
    }

    const term = await Term.findOne({ _id: termId, userId: req.userId }).lean();
    if (!term) return res.status(404).json({ error: "Term not found" });

    const start = fromQ ? startOfDayTZ(fromQ) : new Date(term.startDate);
    const end = toQ ? startOfDayTZ(toQ) : new Date(term.endDate);
    const overrides = await DayGoalOverride.find({
      userId: req.userId,
      termId,
    }).lean();
    const overrideMap = new Map(overrides.map((o) => [o.dateKey, o.goalMinutes]));

    const durationByDay = new Map();
    const sessions = await Session.find({ userId: req.userId, termId }).lean();
    for (const s of sessions) {
      const key = dateKeyTZ(new Date(s.date));
      const m = sessionDurationMinutes(s.startTime, s.endTime, s.breakMinutes);
      durationByDay.set(key, (durationByDay.get(key) ?? 0) + m);
    }

    const rows = [];
    let cursor = new Date(start);
    const endT = new Date(end);
    let cumulativeGap = 0;

    while (cursor <= endT) {
      const key = dateKeyTZ(cursor);
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
      cursor = addDaysTZ(cursor, 1);
    }

    res.json({ termId, rows });
  } catch (e) {
    next(e);
  }
});

router.post("/adjust-goal", async (req, res, next) => {
  try {
    const body = z
      .object({
        termId: z.string(),
        dateKey: z.string().regex(/^\d{4}-\d{2}-\d{2}$/),
        deltaMinutes: z.number().int(),
      })
      .parse(req.body);

    const term = await Term.findOne({ _id: body.termId, userId: req.userId }).lean();
    if (!term) return res.status(404).json({ error: "Term not found" });

    const existing = await DayGoalOverride.findOne({
      userId: req.userId,
      termId: body.termId,
      dateKey: body.dateKey,
    }).lean();
    const base = term.dailyGoalMinutes;
    const prev = existing?.goalMinutes ?? base;
    const nextGoal = Math.max(10, prev + body.deltaMinutes);

    const row = await DayGoalOverride.findOneAndUpdate(
      { userId: req.userId, termId: body.termId, dateKey: body.dateKey },
      { $set: { goalMinutes: nextGoal } },
      { upsert: true, new: true }
    ).lean();
    res.json(row);
  } catch (e) {
    next(e);
  }
});

export default router;
