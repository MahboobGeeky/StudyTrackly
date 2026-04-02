import { Router } from "express";
import bcrypt from "bcryptjs";
import jwt, { type SignOptions } from "jsonwebtoken";
import { z } from "zod";
import { env } from "../lib/env.js";
import { User } from "../models/User.js";

const router = Router();

const signUpBody = z.object({
  name: z.string().min(1),
  email: z.string().email(),
  password: z.string().min(6),
});

const signInBody = z.object({
  email: z.string().email(),
  password: z.string().min(1),
});

function issueToken(userId: string) {
  // Put `sub` directly in the payload so middleware can read `payload.sub`.
  const opts: SignOptions = { expiresIn: env.JWT_EXPIRES_IN as SignOptions["expiresIn"] };
  return jwt.sign({ sub: userId }, env.JWT_SECRET, opts);
}

router.post("/signup", async (req, res, next) => {
  try {
    const data = signUpBody.parse(req.body);
    const email = data.email.toLowerCase();
    const existing = await User.findOne({ email }).lean();
    if (existing) return res.status(409).json({ error: "Email already in use" });

    const passwordHash = await bcrypt.hash(data.password, 10);
    const user = await User.create({
      name: data.name,
      email,
      passwordHash,
      timerVolume: 0.45,
    });

    const token = issueToken(String(user._id));
    res.status(201).json({
      token,
      user: { id: String(user._id), name: user.name, email: user.email, timerVolume: user.timerVolume },
    });
  } catch (e) {
    next(e);
  }
});

router.post("/signin", async (req, res, next) => {
  try {
    const data = signInBody.parse(req.body);
    const email = data.email.toLowerCase();
    const user = await User.findOne({ email });
    if (!user) return res.status(401).json({ error: "Invalid credentials" });
    const ok = await bcrypt.compare(data.password, user.passwordHash);
    if (!ok) return res.status(401).json({ error: "Invalid credentials" });

    const token = issueToken(String(user._id));
    res.json({
      token,
      user: { id: String(user._id), name: user.name, email: user.email, timerVolume: user.timerVolume },
    });
  } catch (e) {
    next(e);
  }
});

export default router;

