import mongoose, { Schema, Types } from "mongoose";

export type SessionDoc = {
  userId: Types.ObjectId;
  termId: Types.ObjectId;
  courseId: Types.ObjectId;
  date: Date;
  startTime: string;
  endTime: string;
  breakMinutes: number;
  activity: string;
  note: string;
  label: string;
  createdAt: Date;
  updatedAt: Date;
};

const sessionSchema = new Schema<SessionDoc>(
  {
    userId: { type: Schema.Types.ObjectId, required: true, index: true, ref: "User" },
    termId: { type: Schema.Types.ObjectId, required: true, index: true, ref: "Term" },
    courseId: { type: Schema.Types.ObjectId, required: true, index: true, ref: "Course" },
    date: { type: Date, required: true, index: true },
    startTime: { type: String, required: true },
    endTime: { type: String, required: true },
    breakMinutes: { type: Number, required: true, default: 0 },
    // Optional text fields; defaults keep old seed-compatible behaviour.
    activity: { type: String, required: false, default: "" },
    note: { type: String, required: false, default: "" },
    label: { type: String, required: false, default: "" },
  },
  { timestamps: true }
);

sessionSchema.index({ userId: 1, termId: 1, date: -1 });

export const Session =
  (mongoose.models.Session as mongoose.Model<SessionDoc>) ||
  mongoose.model<SessionDoc>("Session", sessionSchema);

