import { ZodError } from "zod";

export function errorHandler(err, _req, res, _next) {
  if (err instanceof ZodError) {
    const message = err.issues.map((issue) => issue.message).join("; ") || "Invalid request";
    return res.status(400).json({ error: message });
  }
  console.error(err);
  const message = err instanceof Error ? err.message : "Server error";
  res.status(500).json({ error: message });
}
