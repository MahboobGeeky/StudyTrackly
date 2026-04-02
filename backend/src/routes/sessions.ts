import { Router } from "express";
import { z } from "zod";
import { prisma } from "../lib/prisma.js";

const router = Router();

const body = z.object({
  termId: z.string(),
  courseId: z.string(),
  date: z.string().datetime(),
  startTime: z.string().regex(/^\d{2}:\d{2}$/),
  endTime: z.string().regex(/^\d{2}:\d{2}$/),
  breakMinutes: z.number().int().min(0).optional(),
  activity: z.string().optional(),
  note: z.string().optional(),
  label: z.string().optional(),
});

router.get("/", async (req, res, next) => {
  try {
    const termId = req.query.termId as string | undefined;
    const from = req.query.from ? new Date(req.query.from as string) : undefined;
    const to = req.query.to ? new Date(req.query.to as string) : undefined;
    const sessions = await prisma.session.findMany({
      where: {
        ...(termId && { termId }),
        ...(from || to
          ? {
              date: {
                ...(from && { gte: from }),
                ...(to && { lte: to }),
              },
            }
          : {}),
      },
      include: { course: true },
      orderBy: [{ date: "desc" }, { startTime: "desc" }],
    });
    res.json(sessions);
  } catch (e) {
    next(e);
  }
});

router.post("/", async (req, res, next) => {
  try {
    const data = body.parse(req.body);
    const session = await prisma.session.create({
      data: {
        termId: data.termId,
        courseId: data.courseId,
        date: new Date(data.date),
        startTime: data.startTime,
        endTime: data.endTime,
        breakMinutes: data.breakMinutes ?? 0,
        activity: data.activity ?? "",
        note: data.note ?? "",
        label: data.label ?? "",
      },
      include: { course: true },
    });
    res.status(201).json(session);
  } catch (e) {
    next(e);
  }
});

router.patch("/:id", async (req, res, next) => {
  try {
    const data = body.partial().omit({ termId: true }).parse(req.body);
    const session = await prisma.session.update({
      where: { id: req.params.id },
      data: {
        ...(data.courseId && { courseId: data.courseId }),
        ...(data.date && { date: new Date(data.date) }),
        ...(data.startTime && { startTime: data.startTime }),
        ...(data.endTime && { endTime: data.endTime }),
        ...(data.breakMinutes != null && { breakMinutes: data.breakMinutes }),
        ...(data.activity != null && { activity: data.activity }),
        ...(data.note != null && { note: data.note }),
        ...(data.label != null && { label: data.label }),
      },
      include: { course: true },
    });
    res.json(session);
  } catch (e) {
    next(e);
  }
});

router.delete("/:id", async (req, res, next) => {
  try {
    await prisma.session.delete({ where: { id: req.params.id } });
    res.status(204).send();
  } catch (e) {
    next(e);
  }
});

export default router;
