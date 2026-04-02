import { Router } from "express";
import { z } from "zod";
import type { AuthedRequest } from "../middleware/auth.js";
import { Term } from "../models/Term.js";

const router = Router();

const termBody = z.object({
  name: z.string().min(1),
  startDate: z.string().datetime(),
  endDate: z.string().datetime(),
  studyGoalHours: z.number().int().min(1).optional(),
  dailyGoalMinutes: z.number().int().min(1).optional(),
  goldMedals: z.number().int().min(0).optional(),
  silverMedals: z.number().int().min(0).optional(),
  bronzeMedals: z.number().int().min(0).optional(),
  isActive: z.boolean().optional(),
});

router.get("/", async (_req, res, next) => {
  try {
    const req = _req as AuthedRequest;
    const terms = await Term.find({ userId: req.userId }).sort({ startDate: -1 }).lean();
    res.json(terms);
  } catch (e) {
    next(e);
  }
});

router.get("/active", async (_req, res, next) => {
  try {
    const req = _req as AuthedRequest;
    const term = await Term.findOne({ userId: req.userId, isActive: true }).lean();
    res.json(term);
  } catch (e) {
    next(e);
  }
});

router.post("/", async (req, res, next) => {
  try {
    const data = termBody.parse(req.body);
    if (data.isActive !== false) {
      await Term.updateMany({ userId: (req as AuthedRequest).userId }, { isActive: false });
    }
    const term = await Term.create({
      userId: (req as AuthedRequest).userId,
      name: data.name,
      startDate: new Date(data.startDate),
      endDate: new Date(data.endDate),
      studyGoalHours: data.studyGoalHours ?? 600,
      dailyGoalMinutes: data.dailyGoalMinutes ?? 720,
      goldMedals: data.goldMedals ?? 0,
      silverMedals: data.silverMedals ?? 0,
      bronzeMedals: data.bronzeMedals ?? 0,
      isActive: data.isActive ?? true,
      examCount: 0,
    });
    res.status(201).json(term);
  } catch (e) {
    next(e);
  }
});

router.patch("/:id", async (req, res, next) => {
  try {
    const data = termBody.partial().parse(req.body);
    if (data.isActive === true) {
      await Term.updateMany({ userId: (req as AuthedRequest).userId }, { isActive: false });
    }
    const term = await Term.findOneAndUpdate(
      { _id: req.params.id, userId: (req as AuthedRequest).userId },
      {
        ...(data.name && { name: data.name }),
        ...(data.startDate && { startDate: new Date(data.startDate) }),
        ...(data.endDate && { endDate: new Date(data.endDate) }),
        ...(data.studyGoalHours != null && { studyGoalHours: data.studyGoalHours }),
        ...(data.dailyGoalMinutes != null && { dailyGoalMinutes: data.dailyGoalMinutes }),
        ...(data.goldMedals != null && { goldMedals: data.goldMedals }),
        ...(data.silverMedals != null && { silverMedals: data.silverMedals }),
        ...(data.bronzeMedals != null && { bronzeMedals: data.bronzeMedals }),
        ...(data.isActive != null && { isActive: data.isActive }),
      },
      { new: true }
    ).lean();
    if (!term) return res.status(404).json({ error: "Term not found" });
    res.json(term);
  } catch (e) {
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
    res.json(term);
  } catch (e) {
    next(e);
  }
});

router.delete("/:id", async (req, res, next) => {
  try {
    const userId = (req as AuthedRequest).userId;
    await Term.deleteOne({ _id: req.params.id, userId });
    const remaining = await Term.countDocuments({ userId });
    if (remaining > 0) {
      const first = await Term.findOne({ userId }).sort({ startDate: -1 });
      if (first) {
        await Term.updateOne({ _id: first._id }, { isActive: true });
      }
    }
    res.status(204).send();
  } catch (e) {
    next(e);
  }
});

export default router;
