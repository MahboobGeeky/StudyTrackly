import { Router } from "express";
import { z } from "zod";
import { mapDocs, withId } from "../lib/serialize.js";
import { Course } from "../models/Course.js";
import { Session } from "../models/Session.js";
import {
  cacheGet,
  cacheKey,
  cacheSet,
  invalidateCoursesCache,
  invalidateSessionsCache,
  invalidateStatsCache,
} from "../lib/cache.js";

const router = Router();

/** Courses list cached for 30 s */
const COURSES_TTL = 30;

const body = z.object({
  termId: z.string(),
  name: z.string().min(1),
  color: z.string().optional(),
});

router.get("/", async (req, res, next) => {
  try {
    const termId = req.query.termId;

    const key = cacheKey(req.userId, "courses", termId ?? "all");
    const cached = await cacheGet(key);
    if (cached) return res.json(cached);

    const query = { userId: req.userId };
    if (termId) query.termId = termId;
    const courses = await Course.find(query).sort({ name: 1 }).lean();
    const result = mapDocs(courses);

    await cacheSet(key, result, COURSES_TTL);
    res.json(result);
  } catch (e) {
    next(e);
  }
});

router.post("/", async (req, res, next) => {
  try {
    const data = body.parse(req.body);
    const course = await Course.create({
      userId: req.userId,
      termId: data.termId,
      name: data.name,
      color: data.color ?? "blue",
    });

    await Promise.all([
      invalidateCoursesCache(req.userId),
      invalidateStatsCache(req.userId),
    ]);

    res.status(201).json(withId(course.toObject()));
  } catch (e) {
    next(e);
  }
});

router.patch("/:id", async (req, res, next) => {
  try {
    const data = body.omit({ termId: true }).partial().parse(req.body);
    const course = await Course.findOneAndUpdate(
      { _id: req.params.id, userId: req.userId },
      data,
      { new: true }
    ).lean();
    if (!course) return res.status(404).json({ error: "Course not found" });

    await Promise.all([
      invalidateCoursesCache(req.userId),
      invalidateStatsCache(req.userId),
    ]);

    res.json(withId(course));
  } catch (e) {
    next(e);
  }
});

router.delete("/:id", async (req, res, next) => {
  try {
    await Session.deleteMany({ userId: req.userId, courseId: req.params.id });
    await Course.deleteOne({ _id: req.params.id, userId: req.userId });

    await Promise.all([
      invalidateCoursesCache(req.userId),
      invalidateSessionsCache(req.userId),
      invalidateStatsCache(req.userId),
    ]);

    res.status(204).send();
  } catch (e) {
    next(e);
  }
});

export default router;
