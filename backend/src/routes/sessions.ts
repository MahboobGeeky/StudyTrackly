import { Router } from "express";
import { z } from "zod";
import type { AuthedRequest } from "../middleware/auth.js";
import { Course } from "../models/Course.js";
import { Session } from "../models/Session.js";

const router = Router();

const timeHHMM = z
  .string()
  .regex(/^\s*\d{1,2}:\d{1,2}\s*$/, "Invalid")
  .transform((v) => v.trim())
  .transform((v) => {
    const [hRaw, mRaw] = v.split(":");
    const h = Number(hRaw);
    const m = Number(mRaw);
    if (!Number.isFinite(h) || !Number.isFinite(m)) throw new Error("Invalid");
    if (h < 0 || h > 23 || m < 0 || m > 59) throw new Error("Invalid");
    return `${String(h).padStart(2, "0")}:${String(m).padStart(2, "0")}`;
  });

const body = z.object({
  termId: z.string(),
  courseId: z.string(),
  // Accept any non-empty ISO-like string; JS Date parsing + DB indexing handle the rest.
  date: z.string().min(1),
  startTime: timeHHMM,
  endTime: timeHHMM,
  breakMinutes: z.number().int().min(0).optional(),
  activity: z.string().optional(),
  note: z.string().optional(),
  label: z.string().optional(),
});

router.get("/", async (req, res, next) => {
  try {
    const authed = req as AuthedRequest;
    const termId = req.query.termId as string | undefined;
    const from = req.query.from ? new Date(req.query.from as string) : undefined;
    const to = req.query.to ? new Date(req.query.to as string) : undefined;
    const query: Record<string, unknown> = { userId: authed.userId };
    if (termId) query.termId = termId;
    if (from || to) {
      query.date = {
        ...(from ? { $gte: from } : {}),
        ...(to ? { $lte: to } : {}),
      };
    }
    const sessions = await Session.find(query).sort({ date: -1, startTime: -1 }).lean();

    const courseIds = [...new Set(sessions.map((s) => String(s.courseId)))];
    const courses = await Course.find({ userId: authed.userId, _id: { $in: courseIds } }).lean();
    const courseMap = new Map(courses.map((c) => [String(c._id), c]));

    res.json(
      sessions.map((s) => ({
        ...s,
        id: String(s._id),
        course: courseMap.get(String(s.courseId)),
      }))
    );
  } catch (e) {
    next(e);
  }
});

router.post("/", async (req, res, next) => {
  try {
    const authed = req as AuthedRequest;
    const data = body.parse(req.body);
    const session = await Session.create({
      userId: authed.userId,
      termId: data.termId,
      courseId: data.courseId,
      date: new Date(data.date),
      startTime: data.startTime,
      endTime: data.endTime,
      breakMinutes: data.breakMinutes ?? 0,
      activity: data.activity ?? "",
      note: data.note ?? "",
      label: data.label ?? "",
    });
    const course = await Course.findOne({ _id: data.courseId, userId: authed.userId }).lean();
    res.status(201).json({ ...session.toObject(), id: String(session._id), course });
  } catch (e) {
    next(e);
  }
});

router.patch("/:id", async (req, res, next) => {
  try {
    const authed = req as AuthedRequest;
    const data = body.partial().omit({ termId: true }).parse(req.body);
    const session = await Session.findOneAndUpdate(
      { _id: req.params.id, userId: authed.userId },
      {
        ...(data.courseId && { courseId: data.courseId }),
        ...(data.date && { date: new Date(data.date) }),
        ...(data.startTime && { startTime: data.startTime }),
        ...(data.endTime && { endTime: data.endTime }),
        ...(data.breakMinutes != null && { breakMinutes: data.breakMinutes }),
        ...(data.activity != null && { activity: data.activity }),
        ...(data.note != null && { note: data.note }),
        ...(data.label != null && { label: data.label }),
      },
      { new: true }
    ).lean();
    if (!session) return res.status(404).json({ error: "Session not found" });
    const course = await Course.findOne({ _id: session.courseId, userId: authed.userId }).lean();
    res.json({ ...session, id: String(session._id), course });
  } catch (e) {
    next(e);
  }
});

router.delete("/:id", async (req, res, next) => {
  try {
    const authed = req as AuthedRequest;
    await Session.deleteOne({ _id: req.params.id, userId: authed.userId });
    res.status(204).send();
  } catch (e) {
    next(e);
  }
});

export default router;
