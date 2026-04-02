import { Router } from "express";
import { z } from "zod";
import { prisma } from "../lib/prisma.js";

const router = Router();

const termBody = z.object({
  name: z.string().min(1),
  startDate: z.string().datetime(),
  endDate: z.string().datetime(),
  studyGoalHours: z.number().int().min(1).optional(),
  dailyGoalMinutes: z.number().int().min(1).optional(),
  examCount: z.number().int().min(0).optional(),
  goldMedals: z.number().int().min(0).optional(),
  silverMedals: z.number().int().min(0).optional(),
  bronzeMedals: z.number().int().min(0).optional(),
  isActive: z.boolean().optional(),
});

router.get("/", async (_req, res, next) => {
  try {
    const terms = await prisma.term.findMany({
      orderBy: { startDate: "desc" },
      include: {
        _count: { select: { courses: true, sessions: true, exams: true } },
      },
    });
    res.json(terms);
  } catch (e) {
    next(e);
  }
});

router.get("/active", async (_req, res, next) => {
  try {
    const term = await prisma.term.findFirst({
      where: { isActive: true },
      include: {
        courses: true,
        _count: { select: { sessions: true, exams: true } },
      },
    });
    res.json(term);
  } catch (e) {
    next(e);
  }
});

router.post("/", async (req, res, next) => {
  try {
    const data = termBody.parse(req.body);
    if (data.isActive !== false) {
      await prisma.term.updateMany({ data: { isActive: false } });
    }
    const term = await prisma.term.create({
      data: {
        name: data.name,
        startDate: new Date(data.startDate),
        endDate: new Date(data.endDate),
        studyGoalHours: data.studyGoalHours ?? 600,
        dailyGoalMinutes: data.dailyGoalMinutes ?? 720,
        examCount: data.examCount ?? 0,
        goldMedals: data.goldMedals ?? 0,
        silverMedals: data.silverMedals ?? 0,
        bronzeMedals: data.bronzeMedals ?? 0,
        isActive: data.isActive ?? true,
      },
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
      await prisma.term.updateMany({ data: { isActive: false } });
    }
    const term = await prisma.term.update({
      where: { id: req.params.id },
      data: {
        ...(data.name && { name: data.name }),
        ...(data.startDate && { startDate: new Date(data.startDate) }),
        ...(data.endDate && { endDate: new Date(data.endDate) }),
        ...(data.studyGoalHours != null && { studyGoalHours: data.studyGoalHours }),
        ...(data.dailyGoalMinutes != null && { dailyGoalMinutes: data.dailyGoalMinutes }),
        ...(data.examCount != null && { examCount: data.examCount }),
        ...(data.goldMedals != null && { goldMedals: data.goldMedals }),
        ...(data.silverMedals != null && { silverMedals: data.silverMedals }),
        ...(data.bronzeMedals != null && { bronzeMedals: data.bronzeMedals }),
        ...(data.isActive != null && { isActive: data.isActive }),
      },
    });
    res.json(term);
  } catch (e) {
    next(e);
  }
});

router.post("/:id/activate", async (req, res, next) => {
  try {
    await prisma.term.updateMany({ data: { isActive: false } });
    const term = await prisma.term.update({
      where: { id: req.params.id },
      data: { isActive: true },
    });
    res.json(term);
  } catch (e) {
    next(e);
  }
});

router.delete("/:id", async (req, res, next) => {
  try {
    await prisma.term.delete({ where: { id: req.params.id } });
    const remaining = await prisma.term.count();
    if (remaining > 0) {
      const first = await prisma.term.findFirst({ orderBy: { startDate: "desc" } });
      if (first) await prisma.term.update({ where: { id: first.id }, data: { isActive: true } });
    }
    res.status(204).send();
  } catch (e) {
    next(e);
  }
});

export default router;
