import { Router } from "express";
import { z } from "zod";
import type { AuthedRequest } from "../middleware/auth.js";
import { User } from "../models/User.js";

const router = Router();

const smartTimerRingtoneValues = ["soft_chime", "classic_bell", "triple_ping", "alert_beep"] as const;

const body = z.object({
  // Accept both legacy `name` and frontend `displayName`.
  name: z.string().min(1).optional(),
  displayName: z.string().min(1).optional(),
  email: z.string().email().optional(),
  trialEnd: z.string().datetime().nullable().optional(),
  academicLevel: z.string().min(1).nullable().optional(),
  timerVolume: z.number().min(0).max(1).optional(),
  smartTimerRingtone: z.enum(smartTimerRingtoneValues).optional(),
});

router.get("/", async (_req, res, next) => {
  try {
    const req = _req as AuthedRequest;
    const user = await User.findById(req.userId).lean();
    if (!user) return res.status(404).json({ error: "User not found" });
    res.json({
      id: String(user._id),
      name: user.name,
      displayName: user.name,
      email: user.email,
      timerVolume: user.timerVolume ?? 0.45,
      smartTimerRingtone: user.smartTimerRingtone ?? "soft_chime",
      trialEnd: user.trialEnd ? user.trialEnd.toISOString() : null,
      academicLevel: user.academicLevel ?? null,
    });
  } catch (e) {
    next(e);
  }
});

router.patch("/", async (req, res, next) => {
  try {
    const authed = req as AuthedRequest;
    const data = body.parse(req.body);
    const user = await User.findByIdAndUpdate(
      authed.userId,
      {
        ...(data.name && { name: data.name }),
        ...(data.displayName && { name: data.displayName }),
        ...(data.email && { email: data.email.toLowerCase() }),
        ...(data.timerVolume !== undefined && { timerVolume: data.timerVolume }),
        ...(data.smartTimerRingtone !== undefined && {
          smartTimerRingtone: data.smartTimerRingtone,
        }),
        ...(data.trialEnd !== undefined && {
          trialEnd: data.trialEnd ? new Date(data.trialEnd) : null,
        }),
        ...(data.academicLevel !== undefined && {
          academicLevel: data.academicLevel,
        }),
      },
      { new: true }
    ).lean();
    if (!user) return res.status(404).json({ error: "User not found" });
    res.json({
      id: String(user._id),
      name: user.name,
      displayName: user.name,
      email: user.email,
      timerVolume: user.timerVolume ?? 0.45,
      smartTimerRingtone: user.smartTimerRingtone ?? "soft_chime",
      trialEnd: user.trialEnd ? user.trialEnd.toISOString() : null,
      academicLevel: user.academicLevel ?? null,
    });
  } catch (e) {
    next(e);
  }
});

export default router;
