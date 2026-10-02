import { Router } from "express";
import { OAuth2Client } from "google-auth-library";
import jwt from "jsonwebtoken";

import { env, isGoogleOAuthConfigured } from "../lib/env.js";
import { User } from "../models/User.js";

const router = Router();

function getOAuth2Client() {
  return new OAuth2Client(
    env.GOOGLE_CLIENT_ID,
    env.GOOGLE_CLIENT_SECRET,
    env.GOOGLE_CALLBACK_URL,
  );
}

const GOOGLE_SCOPES = ["openid", "email", "profile"];

// apna token via userID
function issueToken(userId) {
  return jwt.sign({ sub: userId }, env.JWT_SECRET, {
    expiresIn: env.JWT_EXPIRES_IN,
  });
}

// CSRF (Cross-Site Request Forgery), token
function createOAuthState() {
  return jwt.sign({ typ: "oauth_state" }, env.JWT_SECRET, { expiresIn: "10m" });
}

function verifyOAuthState(state) {
  if (typeof state !== "string" || !state) return false;
  try {
    const p = jwt.verify(state, env.JWT_SECRET);
    return p.typ === "oauth_state";
  } catch {
    return false;
  }
}

// Start Google OAuth - redirect browser to Google consent screen.
router.get("/google", (_req, res, next) => {
  const frontend = env.FRONTEND_URL;
  try {
    if (!isGoogleOAuthConfigured()) {
      return res.redirect(302, `${frontend}/signin?error=oauth_not_configured`);
    }
    const oauth2Client = getOAuth2Client();
    const state = createOAuthState();
    const url = oauth2Client.generateAuthUrl({
      access_type: "online", // offline
      scope: GOOGLE_SCOPES,
      prompt: "select_account",
      state,
      redirect_uri: env.GOOGLE_CALLBACK_URL,
    });
    res.redirect(302, url);
  } catch (e) {
    console.error("Google OAuth start error:", e);
    res.redirect(302, `${frontend}/signin?error=oauth_failed`);
  }
});

/** Google redirects here with ?code=&state= */
router.get("/google/callback", async (req, res) => {
  const frontend = env.FRONTEND_URL;
  try {
    if (!isGoogleOAuthConfigured()) {
      return res.redirect(302, `${frontend}/signin?error=oauth_not_configured`);
    }
    const oauth2Client = getOAuth2Client();
    const q = req.query;
    if (typeof q.error === "string" && q.error) {
      return res.redirect(
        302,
        `${frontend}/signin?error=${encodeURIComponent(q.error)}`,
      );
    }
    const code = typeof q.code === "string" ? q.code : "";

    if (!code) {
      return res.redirect(302, `${frontend}/signin?error=missing_code`);
    }
    if (!verifyOAuthState(q.state)) {
      return res.redirect(302, `${frontend}/signin?error=invalid_state`);
    }
    // access token generate
    const { tokens } = await oauth2Client.getToken({
      code,
      redirect_uri: env.GOOGLE_CALLBACK_URL,
    });
    if (!tokens.id_token) {
      return res.redirect(302, `${frontend}/signin?error=no_id_token`);
    }

    const ticket = await oauth2Client.verifyIdToken({
      idToken: tokens.id_token,
      audience: env.GOOGLE_CLIENT_ID,
    });
    const payload = ticket.getPayload();
    if (!payload?.email) {
      return res.redirect(302, `${frontend}/signin?error=no_email`);
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
      });
    } else {
      let changed = false;
      if (!user.googleId) {
        user.googleId = googleId;
        changed = true;
      }
      if (name && user.name !== name) {
        user.name = name;
        changed = true;
      }
      if (changed) await user.save();
    }

    const token = issueToken(String(user._id));
    res.redirect(
      302,
      `${frontend}/auth/callback#token=${encodeURIComponent(token)}`,
    );
  } catch (e) {
    console.error("Google OAuth callback error:", e);
    res.redirect(302, `${frontend}/signin?error=oauth_failed`);
  }
});

export default router;
