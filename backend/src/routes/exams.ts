import { Router } from "express";
import { z } from "zod";
import { prisma } from "../lib/prisma.js";

const router = Router();

const body = z.object({
  termId: z.string(),
  name: z.string().min(1),
  date: z.string().datetime(),
});

router.get("/", async (req, res, next) => {
  try {
    const termId = req.query.termId as string | undefined;
    const exams = await prisma.exam.findMany({
      where: termId ? { termId } : undefined,
      orderBy: { date: "asc" },
    });
    res.json(exams);
  } catch (e) {
    next(e);
  }
});

router.post("/", async (req, res, next) => {
  try {
    const data = body.parse(req.body);
    const exam = await prisma.exam.create({
      data: {
        termId: data.termId,
        name: data.name,
        date: new Date(data.date),
      },
    });
    await prisma.term.update({
      where: { id: data.termId },
      data: { examCount: { increment: 1 } },
    });
    res.status(201).json(exam);
  } catch (e) {
    next(e);
  }
});

router.patch("/:id", async (req, res, next) => {
  try {
    const data = body.partial().omit({ termId: true }).parse(req.body);
    const exam = await prisma.exam.update({
      where: { id: req.params.id },
      data: {
        ...(data.name && { name: data.name }),
        ...(data.date && { date: new Date(data.date) }),
      },
    });
    res.json(exam);
  } catch (e) {
    next(e);
  }
});

router.delete("/:id", async (req, res, next) => {
  try {
    const exam = await prisma.exam.findUnique({ where: { id: req.params.id } });
    if (exam) {
      await prisma.exam.delete({ where: { id: req.params.id } });
      await prisma.term.update({
        where: { id: exam.termId },
        data: { examCount: { decrement: 1 } },
      });
    }
    res.status(204).send();
  } catch (e) {
    next(e);
  }
});

export default router;
