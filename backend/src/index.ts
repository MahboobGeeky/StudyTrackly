import cors from "cors";
import express from "express";
import { errorHandler } from "./middleware/errorHandler.js";
import activitiesRouter from "./routes/activities.js";
import coursesRouter from "./routes/courses.js";
import dataRoomRouter from "./routes/dataRoom.js";
import examsRouter from "./routes/exams.js";
import sessionsRouter from "./routes/sessions.js";
import settingsRouter from "./routes/settings.js";
import statsRouter from "./routes/stats.js";
import studyDaysRouter from "./routes/studyDays.js";
import termsRouter from "./routes/terms.js";

const app = express();
const PORT = Number(process.env.PORT) || 4000;

app.use(cors({ origin: true }));
app.use(express.json());

app.get("/api/health", (_req, res) => {
  res.json({ ok: true });
});

app.use("/api/terms", termsRouter);
app.use("/api/courses", coursesRouter);
app.use("/api/sessions", sessionsRouter);
app.use("/api/exams", examsRouter);
app.use("/api/data-room", dataRoomRouter);
app.use("/api/settings", settingsRouter);
app.use("/api/activities", activitiesRouter);
app.use("/api/stats", statsRouter);
app.use("/api/study-days", studyDaysRouter);

app.use(errorHandler);

app.listen(PORT, () => {
  console.log(`API listening on http://localhost:${PORT}`);
});
