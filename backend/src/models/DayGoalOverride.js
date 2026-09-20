import mongoose, { Schema } from "mongoose";

const schema = new Schema(
  {
    userId: { type: Schema.Types.ObjectId, required: true, index: true, ref: "User" },
    termId: { type: Schema.Types.ObjectId, required: true, index: true, ref: "Term" },
    dateKey: { type: String, required: true },
    goalMinutes: { type: Number, required: true },
  },
  { timestamps: true }
);

schema.index({ userId: 1, termId: 1, dateKey: 1 }, { unique: true });

export const DayGoalOverride =
  mongoose.models.DayGoalOverride || mongoose.model("DayGoalOverride", schema);
