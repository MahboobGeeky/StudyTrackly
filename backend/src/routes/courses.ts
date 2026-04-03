import { Router } from "express";
import { z } from "zod";
import type { AuthedRequest } from "../middleware/auth.js";
import { mapDocs, withId } from "../lib/serialize.js";
import { Course } from "../models/Course.js";

const router = Router();

const body = z.object({
  termId: z.string(),
  name: z.string().min(1),
  color: z.string().optional(),
});

router.get("/", async (req, res, next) => {
  try {
    const authed = req as AuthedRequest;
    const termId = req.query.termId as string | undefined;
    const query: Record<string, unknown> = { userId: authed.userId };
    if (termId) query.termId = termId;
    const courses = await Course.find(query).sort({ name: 1 }).lean();
    res.json(mapDocs(courses));
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
    res.json(withId(course));
  } catch (e) {
    next(e);
  }
});

router.delete("/:id", async (req, res, next) => {
  try {
    const authed = req as AuthedRequest;
    await Course.deleteOne({ _id: req.params.id, userId: authed.userId });
    res.status(204).send();
  } catch (e) {
    next(e);
  }
});

export default router;
