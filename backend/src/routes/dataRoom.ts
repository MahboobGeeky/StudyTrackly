import { Router } from "express";
import { z } from "zod";
import { prisma } from "../lib/prisma.js";

const router = Router();

const body = z.object({
  termId: z.string(),
  name: z.string().min(1),
  url: z.string().min(1),
  note: z.string().optional(),
});

router.get("/", async (req, res, next) => {
  try {
    const termId = req.query.termId as string | undefined;
    const files = await prisma.dataRoomFile.findMany({
      where: termId ? { termId } : undefined,
      orderBy: { createdAt: "desc" },
    });
    res.json(files);
  } catch (e) {
    next(e);
  }
});

router.post("/", async (req, res, next) => {
  try {
    const data = body.parse(req.body);
    const file = await prisma.dataRoomFile.create({ data });
    res.status(201).json(file);
  } catch (e) {
    next(e);
  }
});

router.delete("/:id", async (req, res, next) => {
  try {
    await prisma.dataRoomFile.delete({ where: { id: req.params.id } });
    res.status(204).send();
  } catch (e) {
    next(e);
  }
});

export default router;
