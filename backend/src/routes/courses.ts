import { Router } from "express";
import { z } from "zod";
import type { AuthedRequest } from "../middleware/auth.js";
import { mapDocs, withId } from "../lib/serialize.js";
import { Course } from "../models/Course.js";
import {
  cacheGet,
  cacheKey,
  cacheSet,
  invalidateCoursesCache,
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
    const authed = req as AuthedRequest;
    const termId = req.query.termId as string | undefined;

    const key = cacheKey(authed.userId!, "courses", termId ?? "all");
    const cached = await cacheGet<unknown[]>(key);
    if (cached) return res.json(cached);

    const query: Record<string, unknown> = { userId: authed.userId };
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
    const authed = req as AuthedRequest;
    const data = body.parse(req.body);
    const course = await Course.create({
      userId: authed.userId,
      termId: data.termId,
      name: data.name,
      color: data.color ?? "blue",
    });

    await Promise.all([
      invalidateCoursesCache(authed.userId!),
      invalidateStatsCache(authed.userId!),
    ]);

    res.status(201).json(withId(course.toObject()));
  } catch (e) {
    next(e);
  }
});

router.patch("/:id", async (req, res, next) => {
  try {
    const authed = req as AuthedRequest;
    const data = body.omit({ termId: true }).partial().parse(req.body);
    const course = await Course.findOneAndUpdate(
      { _id: req.params.id, userId: authed.userId },
      data,
      { new: true }
    ).lean();
    if (!course) return res.status(404).json({ error: "Course not found" });

    await Promise.all([
      invalidateCoursesCache(authed.userId!),
      invalidateStatsCache(authed.userId!),
    ]);

    res.json(withId(course));
  } catch (e) {
    next(e);
  }
});

router.delete("/:id", async (req, res, next) => {
  try {
    const authed = req as AuthedRequest;
    await Course.deleteOne({ _id: req.params.id, userId: authed.userId });

    await Promise.all([
      invalidateCoursesCache(authed.userId!),
      invalidateStatsCache(authed.userId!),
    ]);

    res.status(204).send();
  } catch (e) {
    next(e);
  }
});

export default router;
