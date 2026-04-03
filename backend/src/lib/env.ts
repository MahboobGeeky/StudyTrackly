import { z } from "zod";

const schema = z.object({
  PORT: z.coerce.number().optional().default(4000),
  MONGO_URI: z.string().min(1),
  JWT_SECRET: z.string().min(16),
  JWT_EXPIRES_IN: z.string().optional().default("7d"),
  CORS_ORIGIN: z.string().optional(),
  /** Omit until you add OAuth credentials — server still starts; sign-in shows a setup message. */
  GOOGLE_CLIENT_ID: z.string().optional().default(""),
  GOOGLE_CLIENT_SECRET: z.string().optional().default(""),
  GOOGLE_CALLBACK_URL: z.string().url().optional().default("http://localhost:4000/api/auth/google/callback"),
  FRONTEND_URL: z.string().url().optional().default("http://localhost:5173"),
});

const parsed = schema.parse(process.env);

function stripTrailingSlash(u: string): string {
  return u.replace(/\/$/, "");
}

/**
 * Env with trimmed secrets. `GOOGLE_CALLBACK_URL` is only trimmed — do not alter slashes:
 * it must match Google Cloud “Authorized redirect URIs” byte-for-byte.
 */
export const env = {
  ...parsed,
  GOOGLE_CLIENT_ID: parsed.GOOGLE_CLIENT_ID.trim(),
  GOOGLE_CLIENT_SECRET: parsed.GOOGLE_CLIENT_SECRET.trim(),
  GOOGLE_CALLBACK_URL: parsed.GOOGLE_CALLBACK_URL.trim(),
  FRONTEND_URL: stripTrailingSlash(parsed.FRONTEND_URL),
};

export function isGoogleOAuthConfigured(): boolean {
  return Boolean(env.GOOGLE_CLIENT_ID && env.GOOGLE_CLIENT_SECRET);
}
