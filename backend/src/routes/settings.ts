import { Router } from "express";
import { z } from "zod";
import { prisma } from "../lib/prisma.js";

const router = Router();

const body = z.object({
  email: z.string().email().optional(),
  displayName: z.string().min(1).optional(),
  trialEnd: z.string().datetime().nullable().optional(),
  academicLevel: z.string().nullable().optional(),
  timerVolume: z.number().min(0).max(1).optional(),
});

router.get("/", async (_req, res, next) => {
  try {
    let settings = await prisma.userSettings.findUnique({ where: { id: 1 } });
    if (!settings) {
      settings = await prisma.userSettings.create({
        data: {
          email: "student@example.com",
          displayName: "Student",
          trialEnd: new Date(Date.now() + 14 * 24 * 60 * 60 * 1000),
        },
      });
    }
    res.json(settings);
  } catch (e) {
    next(e);
  }
});

router.patch("/", async (req, res, next) => {
  try {
    const data = body.parse(req.body);
    const settings = await prisma.userSettings.upsert({
      where: { id: 1 },
      create: {
        email: data.email ?? "student@example.com",
        displayName: data.displayName ?? "Student",
        trialEnd: data.trialEnd ? new Date(data.trialEnd) : null,
        academicLevel: data.academicLevel ?? null,
        timerVolume: data.timerVolume ?? 0.45,
      },
      update: {
        ...(data.email && { email: data.email }),
        ...(data.displayName && { displayName: data.displayName }),
        ...(data.trialEnd !== undefined && {
          trialEnd: data.trialEnd ? new Date(data.trialEnd) : null,
        }),
        ...(data.academicLevel !== undefined && { academicLevel: data.academicLevel }),
        ...(data.timerVolume !== undefined && { timerVolume: data.timerVolume }),
      },
    });
    res.json(settings);
  } catch (e) {
    next(e);
  }
});

export default router;
