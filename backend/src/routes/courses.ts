import { Router } from "express";
import { z } from "zod";
import { prisma } from "../lib/prisma.js";

const router = Router();

const body = z.object({
  termId: z.string(),
  name: z.string().min(1),
  color: z.string().optional(),
});

router.get("/", async (req, res, next) => {
  try {
    const termId = req.query.termId as string | undefined;
    const courses = await prisma.course.findMany({
      where: termId ? { termId } : undefined,
      orderBy: { name: "asc" },
    });
    res.json(courses);
  } catch (e) {
    next(e);
  }
});

router.post("/", async (req, res, next) => {
  try {
    const data = body.parse(req.body);
    const course = await prisma.course.create({
      data: {
        termId: data.termId,
        name: data.name,
        color: data.color ?? "blue",
      },
    });
    res.status(201).json(course);
  } catch (e) {
    next(e);
  }
});

router.patch("/:id", async (req, res, next) => {
  try {
    const data = body.omit({ termId: true }).partial().parse(req.body);
    const course = await prisma.course.update({
      where: { id: req.params.id },
      data,
    });
    res.json(course);
  } catch (e) {
    next(e);
  }
});

router.delete("/:id", async (req, res, next) => {
  try {
    await prisma.course.delete({ where: { id: req.params.id } });
    res.status(204).send();
  } catch (e) {
    next(e);
  }
});

export default router;
