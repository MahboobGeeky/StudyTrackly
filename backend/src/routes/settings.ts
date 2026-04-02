import { Router } from "express";
import { z } from "zod";
import type { AuthedRequest } from "../middleware/auth.js";
import { User } from "../models/User.js";

const router = Router();

const body = z.object({
  name: z.string().min(1).optional(),
  timerVolume: z.number().min(0).max(1).optional(),
});

router.get("/", async (_req, res, next) => {
  try {
    const req = _req as AuthedRequest;
    const user = await User.findById(req.userId).lean();
    if (!user) return res.status(404).json({ error: "User not found" });
    res.json({
      id: String(user._id),
      name: user.name,
      email: user.email,
      timerVolume: user.timerVolume ?? 0.45,
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
        ...(data.timerVolume !== undefined && { timerVolume: data.timerVolume }),
      },
      { new: true }
    ).lean();
    if (!user) return res.status(404).json({ error: "User not found" });
    res.json({
      id: String(user._id),
      name: user.name,
      email: user.email,
      timerVolume: user.timerVolume ?? 0.45,
    });
  } catch (e) {
    next(e);
  }
});

export default router;
