import { Router } from "express";
import { OAuth2Client } from "google-auth-library";
import jwt, { type SignOptions } from "jsonwebtoken";
import { env, isGoogleOAuthConfigured } from "../lib/env.js";
import { User } from "../models/User.js";

const router = Router();

function getOAuth2Client() {
  return new OAuth2Client(
    env.GOOGLE_CLIENT_ID,
    env.GOOGLE_CLIENT_SECRET,
    env.GOOGLE_CALLBACK_URL
  );
}

const GOOGLE_SCOPES = [
  "openid",
  "https://www.googleapis.com/auth/userinfo.email",
  "https://www.googleapis.com/auth/userinfo.profile",
];

function issueToken(userId: string) {
  const opts: SignOptions = { expiresIn: env.JWT_EXPIRES_IN as SignOptions["expiresIn"] };
  return jwt.sign({ sub: userId }, env.JWT_SECRET, opts);
}

function createOAuthState(): string {
  return jwt.sign({ typ: "oauth_state" }, env.JWT_SECRET, { expiresIn: "10m" });
}

function verifyOAuthState(state: unknown): boolean {
  if (typeof state !== "string" || !state) return false;
  try {
    const p = jwt.verify(state, env.JWT_SECRET) as { typ?: string };
    return p.typ === "oauth_state";
  } catch {
    return false;
  }
}

/** Start Google OAuth — redirect browser to Google consent screen. */
router.get("/google", (_req, res, next) => {
  try {
    const front = env.FRONTEND_URL.replace(/\/$/, "");
    if (!isGoogleOAuthConfigured()) {
      return res.redirect(302, `${front}/signin?error=oauth_not_configured`);
    }
    const oauth2Client = getOAuth2Client();
    const state = createOAuthState();
    const url = oauth2Client.generateAuthUrl({
      access_type: "online",
      scope: GOOGLE_SCOPES,
      prompt: "select_account",
      state,
      redirect_uri: env.GOOGLE_CALLBACK_URL,
    });
    res.redirect(302, url);
  } catch (e) {
    next(e);
  }
});

/** Google redirects here with ?code=&state= */
router.get("/google/callback", async (req, res, next) => {
  try {
    const front = env.FRONTEND_URL.replace(/\/$/, "");
    if (!isGoogleOAuthConfigured()) {
      return res.redirect(302, `${front}/signin?error=oauth_not_configured`);
    }
    const oauth2Client = getOAuth2Client();
    const q = req.query;
    if (q.error) {
      const errCode = String(q.error);
      const desc = typeof q.error_description === "string" ? q.error_description : "";
      if (errCode === "invalid_client" || /invalid_client/i.test(desc)) {
        return res.redirect(302, `${front}/signin?error=invalid_client`);
      }
      if (errCode === "redirect_uri_mismatch" || /redirect_uri_mismatch/i.test(desc)) {
        return res.redirect(302, `${front}/signin?error=redirect_uri_mismatch`);
      }
      return res.redirect(
        302,
        `${front}/signin?error=${encodeURIComponent(errCode)}`
      );
    }
    const code = typeof q.code === "string" ? q.code : "";
    if (!code) {
      return res.redirect(302, `${front}/signin?error=missing_code`);
    }
    if (!verifyOAuthState(q.state)) {
      return res.redirect(302, `${front}/signin?error=invalid_state`);
    }

    const { tokens } = await oauth2Client.getToken({
      code,
      redirect_uri: env.GOOGLE_CALLBACK_URL,
    });
    oauth2Client.setCredentials(tokens);
    if (!tokens.id_token) {
      return res.redirect(302, `${front}/signin?error=no_id_token`);
    }

    const ticket = await oauth2Client.verifyIdToken({
      idToken: tokens.id_token,
      audience: env.GOOGLE_CLIENT_ID,
    });
    const payload = ticket.getPayload();
    if (!payload?.email) {
      return res.redirect(302, `${front}/signin?error=no_email`);
    }

    const email = payload.email.toLowerCase();
    const googleId = payload.sub;
    const name = (payload.name || payload.email.split("@")[0]).trim();

    let user = await User.findOne({ $or: [{ googleId }, { email }] });
    if (!user) {
      user = await User.create({
        googleId,
        email,
        name,
        timerVolume: 0.45,
        smartTimerRingtone: "soft_chime",
      });
    } else {
      const updates: { googleId?: string; name?: string } = {};
      if (!user.googleId) updates.googleId = googleId;
      if (name && user.name !== name) updates.name = name;
      if (Object.keys(updates).length > 0) {
        await User.updateOne({ _id: user._id }, { $set: updates });
        user = await User.findById(user._id);
      }
    }
    if (!user) throw new Error("User missing after OAuth");

    const token = issueToken(String(user._id));
    const userJson = encodeURIComponent(
      JSON.stringify({
        id: String(user._id),
        name: user.name,
        email: user.email,
        timerVolume: user.timerVolume ?? 0.45,
        smartTimerRingtone: user.smartTimerRingtone ?? "soft_chime",
      })
    );
    res.redirect(
      302,
      `${front}/auth/callback#token=${encodeURIComponent(token)}&user=${userJson}`
    );
  } catch (e: unknown) {
    console.error("Google OAuth callback error", e);
    const front = env.FRONTEND_URL.replace(/\/$/, "");
    const blob = (() => {
      try {
        if (e && typeof e === "object" && "response" in e) {
          const r = (e as { response?: { data?: unknown } }).response?.data;
          return JSON.stringify(r ?? e);
        }
        return e instanceof Error ? e.message : String(e);
      } catch {
        return String(e);
      }
    })();
    if (/redirect_uri_mismatch/i.test(blob)) {
      return res.redirect(302, `${front}/signin?error=redirect_uri_mismatch`);
    }
    if (/invalid_client|unauthorized_client|Invalid client|Client secret/i.test(blob)) {
      return res.redirect(302, `${front}/signin?error=invalid_client`);
    }
    res.redirect(302, `${front}/signin?error=oauth_failed`);
  }
});

export default router;
