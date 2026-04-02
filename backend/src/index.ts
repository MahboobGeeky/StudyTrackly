import cors from "cors";
import "dotenv/config";
import express from "express";
import { connectDb } from "./lib/db.js";
import { env } from "./lib/env.js";
import { errorHandler } from "./middleware/errorHandler.js";
import { requireAuth } from "./middleware/auth.js";
import authRouter from "./routes/auth.js";
import coursesRouter from "./routes/courses.js";
import sessionsRouter from "./routes/sessions.js";
import settingsRouter from "./routes/settings.js";
import statsRouter from "./routes/stats.js";
import studyDaysRouter from "./routes/studyDays.js";
import termsRouter from "./routes/terms.js";

const app = express();
const PORT = env.PORT;

app.use(
  cors({
    origin: env.CORS_ORIGIN ? env.CORS_ORIGIN.split(",") : true,
    credentials: true,
  })
);
app.use(express.json());

app.get("/api/health", (_req, res) => {
  res.json({ ok: true });
});

app.use("/api/auth", authRouter);

app.use("/api/settings", requireAuth, settingsRouter);
app.use("/api/terms", requireAuth, termsRouter);
app.use("/api/courses", requireAuth, coursesRouter);
app.use("/api/sessions", requireAuth, sessionsRouter);
app.use("/api/stats", requireAuth, statsRouter);
app.use("/api/study-days", requireAuth, studyDaysRouter);

app.use(errorHandler);

connectDb()
  .then(() => {
    app.listen(PORT, () => {
      console.log(`API listening on http://localhost:${PORT}`);
    });
  })
  .catch((e) => {
    console.error("Failed to connect DB", e);
    process.exit(1);
  });
