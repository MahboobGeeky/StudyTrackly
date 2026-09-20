import { Router } from "express";
import { z } from "zod";
import { User } from "../models/User.js";

const router = Router();

const smartTimerRingtoneValues = [
  "soft_chime",
  "classic_bell",
  "triple_ping",
  "alert_beep",
  "long_chime",
  "digital_alarm",
  "zen_gong",
];

const body = z.object({
  // Accept both legacy `name` and frontend `displayName`.
  name: z.string().min(1).optional(),
  displayName: z.string().min(1).optional(),
  email: z.string().email().optional(),
  trialEnd: z.string().datetime().nullable().optional(),
  academicLevel: z.string().min(1).nullable().optional(),
  timerVolume: z.number().min(0).max(1).optional(),
  smartTimerRingtone: z.enum(smartTimerRingtoneValues).optional(),
  smartTimerRingtoneRepeat: z.number().min(1).max(5).optional(),
});

router.get("/", async (req, res, next) => {
  try {
    const user = await User.findById(req.userId).lean();
    if (!user) return res.status(404).json({ error: "User not found" });
    res.json({
      id: String(user._id),
      name: user.name,
      displayName: user.name,
      email: user.email,
      timerVolume: user.timerVolume ?? 0.45,
      smartTimerRingtone: user.smartTimerRingtone ?? "soft_chime",
      smartTimerRingtoneRepeat: user.smartTimerRingtoneRepeat ?? 1,
      trialEnd: user.trialEnd ? user.trialEnd.toISOString() : null,
      academicLevel: user.academicLevel ?? null,
    });
  } catch (e) {
    next(e);
  }
});

router.patch("/", async (req, res, next) => {
  try {
    const data = body.parse(req.body);
    const user = await User.findByIdAndUpdate(
      req.userId,
      {
        ...(data.name && { name: data.name }),
        ...(data.displayName && { name: data.displayName }),
        ...(data.email && { email: data.email.toLowerCase() }),
        ...(data.timerVolume !== undefined && { timerVolume: data.timerVolume }),
        ...(data.smartTimerRingtone !== undefined && {
          smartTimerRingtone: data.smartTimerRingtone,
        }),
        ...(data.smartTimerRingtoneRepeat !== undefined && {
          smartTimerRingtoneRepeat: data.smartTimerRingtoneRepeat,
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
      smartTimerRingtoneRepeat: user.smartTimerRingtoneRepeat ?? 1,
      trialEnd: user.trialEnd ? user.trialEnd.toISOString() : null,
      academicLevel: user.academicLevel ?? null,
    });
  } catch (e) {
    next(e);
  }
});

export default router;
