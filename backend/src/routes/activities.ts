import { Router } from "express";
import { z } from "zod";
import { prisma } from "../lib/prisma.js";

const router = Router();

router.get("/", async (_req, res, next) => {
  try {
    const list = await prisma.activityTemplate.findMany({ orderBy: { name: "asc" } });
    res.json(list);
  } catch (e) {
    next(e);
  }
});

router.post("/", async (req, res, next) => {
  try {
    const data = z.object({ name: z.string().min(1) }).parse(req.body);
    const row = await prisma.activityTemplate.create({ data: { name: data.name } });
    res.status(201).json(row);
  } catch (e) {
    next(e);
  }
});

router.delete("/:id", async (req, res, next) => {
  try {
    await prisma.activityTemplate.delete({ where: { id: req.params.id } });
    res.status(204).send();
  } catch (e) {
    next(e);
  }
});

export default router;
