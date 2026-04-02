import mongoose, { Schema, Types } from "mongoose";

export type DayGoalOverrideDoc = {
  userId: Types.ObjectId;
  termId: Types.ObjectId;
  dateKey: string;
  goalMinutes: number;
  createdAt: Date;
  updatedAt: Date;
};

const schema = new Schema<DayGoalOverrideDoc>(
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
  (mongoose.models.DayGoalOverride as mongoose.Model<DayGoalOverrideDoc>) ||
  mongoose.model<DayGoalOverrideDoc>("DayGoalOverride", schema);

