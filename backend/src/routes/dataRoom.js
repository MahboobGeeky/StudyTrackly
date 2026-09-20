import { Router } from "express";
import { z } from "zod";
import { mapDocs, withId } from "../lib/serialize.js";
import { DataRoomFile } from "../models/DataRoomFile.js";

const router = Router();

const body = z.object({
  termId: z.string(),
  name: z.string().min(1),
  url: z.string().min(1),
  note: z.string().optional(),
});

router.get("/", async (req, res, next) => {
  try {
    const termId = req.query.termId;
    const query = { userId: req.userId };
    if (termId) query.termId = termId;
    const files = await DataRoomFile.find(query).sort({ createdAt: -1 }).lean();
    res.json(mapDocs(files));
  } catch (e) {
    next(e);
  }
});

router.post("/", async (req, res, next) => {
  try {
    const data = body.parse(req.body);
    const file = await DataRoomFile.create({
      userId: req.userId,
      termId: data.termId,
      name: data.name,
      url: data.url,
      note: data.note ?? "",
    });
    res.status(201).json(withId(file.toObject()));
  } catch (e) {
    next(e);
  }
});

router.delete("/:id", async (req, res, next) => {
  try {
    const result = await DataRoomFile.deleteOne({
      _id: req.params.id,
      userId: req.userId,
    });
    if (result.deletedCount === 0) {
      return res.status(404).json({ error: "File not found" });
    }
    res.status(204).send();
  } catch (e) {
    next(e);
  }
});

export default router;
