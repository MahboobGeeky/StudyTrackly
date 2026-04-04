import { Router } from "express";
import { z } from "zod";
import type { AuthedRequest } from "../middleware/auth.js";
import { studyGoalHoursFromDaily } from "../lib/termGoal.js";
import { withId } from "../lib/serialize.js";
import { Course } from "../models/Course.js";
import { DayGoalOverride } from "../models/DayGoalOverride.js";
import { Session } from "../models/Session.js";
import { Term } from "../models/Term.js";

const router = Router();

const termBody = z.object({
  name: z.string().min(1),
  startDate: z.string().min(1),
  endDate: z.string().min(1),
  dailyGoalMinutes: z.number().int().min(1),
  /** If omitted, computed as: inclusive days × dailyGoalMinutes / 60 */
  studyGoalHours: z.number().positive().optional(),
  goldMedals: z.number().int().min(0).optional(),
  silverMedals: z.number().int().min(0).optional(),
  bronzeMedals: z.number().int().min(0).optional(),
  isActive: z.boolean().optional(),
});

/**
 * Treat the first `YYYY-MM-DD` in each ISO string as the calendar day in UTC (same convention as
 * session `date`: stored as UTC noon / end-of-day). Avoids host timezone shifting the range.
 */
function parseTermDates(startRaw: string, endRaw: string) {
  const startDate = utcDateFromPickerIso(startRaw, "start");
  const endDate = utcDateFromPickerIso(endRaw, "end");
  if (Number.isNaN(startDate.getTime()) || Number.isNaN(endDate.getTime())) {
    throw new Error("Invalid start or end date");
  }
  const sDay = Date.UTC(
    startDate.getUTCFullYear(),
    startDate.getUTCMonth(),
    startDate.getUTCDate()
  );
  const eDay = Date.UTC(endDate.getUTCFullYear(), endDate.getUTCMonth(), endDate.getUTCDate());
  if (eDay < sDay) {
    throw new Error("End date must be on or after start date");
  }
  return { startDate, endDate };
}

function utcDateFromPickerIso(raw: string, which: "start" | "end"): Date {
  const trimmed = raw.trim();
  const m = /^(\d{4})-(\d{2})-(\d{2})/.exec(trimmed);
  if (m) {
    const y = Number(m[1]);
    const mo = Number(m[2]);
    const d = Number(m[3]);
    if (which === "start") {
      return new Date(Date.UTC(y, mo - 1, d, 12, 0, 0, 0));
    }
    return new Date(Date.UTC(y, mo - 1, d, 23, 59, 59, 999));
  }
  const fallback = new Date(trimmed);
  if (Number.isNaN(fallback.getTime())) {
    throw new Error("Invalid start or end date");
  }
  if (which === "start") {
    return new Date(
      Date.UTC(
        fallback.getUTCFullYear(),
        fallback.getUTCMonth(),
        fallback.getUTCDate(),
        12,
        0,
        0,
        0
      )
    );
  }
  return new Date(
    Date.UTC(
      fallback.getUTCFullYear(),
      fallback.getUTCMonth(),
      fallback.getUTCDate(),
      23,
      59,
      59,
      999
    )
  );
}

router.get("/", async (_req, res, next) => {
  try {
    const req = _req as AuthedRequest;
    const terms = await Term.find({ userId: req.userId }).sort({ startDate: -1 }).lean();
    res.json(terms.map((t) => withId(t)));
  } catch (e) {
    next(e);
  }
});

router.get("/active", async (_req, res, next) => {
  try {
    const req = _req as AuthedRequest;
    const term = await Term.findOne({ userId: req.userId, isActive: true }).lean();
    res.json(term ? withId(term) : null);
  } catch (e) {
    next(e);
  }
});

router.post("/", async (req, res, next) => {
  try {
    const data = termBody.parse(req.body);
    const { startDate, endDate } = parseTermDates(data.startDate, data.endDate);
    const studyGoalHours =
      data.studyGoalHours ?? studyGoalHoursFromDaily(startDate, endDate, data.dailyGoalMinutes);

    if (data.isActive !== false) {
      await Term.updateMany({ userId: (req as AuthedRequest).userId }, { isActive: false });
    }
    const term = await Term.create({
      userId: (req as AuthedRequest).userId,
      name: data.name,
      startDate,
      endDate,
      studyGoalHours,
      dailyGoalMinutes: data.dailyGoalMinutes,
      goldMedals: data.goldMedals ?? 0,
      silverMedals: data.silverMedals ?? 0,
      bronzeMedals: data.bronzeMedals ?? 0,
      isActive: data.isActive ?? true,
      examCount: 0,
    });
    res.status(201).json(withId(term.toObject()));
  } catch (e) {
    if (e instanceof Error && e.message.includes("date")) {
      return res.status(400).json({ error: e.message });
    }
    next(e);
  }
});

router.patch("/:id", async (req, res, next) => {
  try {
    const data = termBody.partial().parse(req.body);
    const userId = (req as AuthedRequest).userId;

    const existing = await Term.findOne({ _id: req.params.id, userId }).lean();
    if (!existing) return res.status(404).json({ error: "Term not found" });

    let startDate = existing.startDate;
    let endDate = existing.endDate;
    let dailyGoalMinutes = existing.dailyGoalMinutes;

    if (data.startDate != null || data.endDate != null) {
      const s = data.startDate ?? existing.startDate.toISOString();
      const e = data.endDate ?? existing.endDate.toISOString();
      const parsed = parseTermDates(s, e);
      startDate = parsed.startDate;
      endDate = parsed.endDate;
    }
    if (data.dailyGoalMinutes != null) dailyGoalMinutes = data.dailyGoalMinutes;

    const datesOrDailyChanged =
      data.startDate != null || data.endDate != null || data.dailyGoalMinutes != null;
    let studyGoalHours = existing.studyGoalHours;
    if (data.studyGoalHours != null) {
      studyGoalHours = data.studyGoalHours;
    } else if (datesOrDailyChanged) {
      studyGoalHours = studyGoalHoursFromDaily(startDate, endDate, dailyGoalMinutes);
    }

    if (data.isActive === true) {
      await Term.updateMany({ userId }, { isActive: false });
    }

    const term = await Term.findOneAndUpdate(
      { _id: req.params.id, userId },
      {
        ...(data.name && { name: data.name }),
        ...(data.startDate != null || data.endDate != null ? { startDate, endDate } : {}),
        ...(data.dailyGoalMinutes != null && { dailyGoalMinutes: data.dailyGoalMinutes }),
        studyGoalHours,
        ...(data.goldMedals != null && { goldMedals: data.goldMedals }),
        ...(data.silverMedals != null && { silverMedals: data.silverMedals }),
        ...(data.bronzeMedals != null && { bronzeMedals: data.bronzeMedals }),
        ...(data.isActive != null && { isActive: data.isActive }),
      },
      { new: true }
    ).lean();
    if (!term) return res.status(404).json({ error: "Term not found" });
    res.json(withId(term));
  } catch (e) {
    if (e instanceof Error && e.message.includes("date")) {
      return res.status(400).json({ error: e.message });
    }
    next(e);
  }
});

router.post("/:id/activate", async (req, res, next) => {
  try {
    const userId = (req as AuthedRequest).userId;
    await Term.updateMany({ userId }, { isActive: false });
    const term = await Term.findOneAndUpdate(
      { _id: req.params.id, userId },
      { isActive: true },
      { new: true }
    ).lean();
    if (!term) return res.status(404).json({ error: "Term not found" });
    res.json(withId(term));
  } catch (e) {
    next(e);
  }
});

router.delete("/:id", async (req, res, next) => {
  try {
    const userId = (req as AuthedRequest).userId;
    const term = await Term.findOne({ _id: req.params.id, userId }).lean();
    if (!term) return res.status(404).json({ error: "Term not found" });

    await Promise.all([
      Session.deleteMany({ userId, termId: term._id }),
      Course.deleteMany({ userId, termId: term._id }),
      DayGoalOverride.deleteMany({ userId, termId: term._id }),
      Term.deleteOne({ _id: term._id, userId }),
    ]);

    const hasActiveTerm = await Term.exists({ userId, isActive: true });
    if (!hasActiveTerm) {
      const fallback = await Term.findOne({ userId }).sort({ startDate: -1 }).lean();
      if (fallback) {
        await Term.updateOne({ _id: fallback._id }, { isActive: true });
      }
    }
    res.status(204).send();
  } catch (e) {
    next(e);
  }
});

export default router;
