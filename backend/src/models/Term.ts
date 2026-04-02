import mongoose, { Schema, Types } from "mongoose";

export type TermDoc = {
  userId: Types.ObjectId;
  name: string;
  startDate: Date;
  endDate: Date;
  studyGoalHours: number;
  dailyGoalMinutes: number;
  examCount: number;
  goldMedals: number;
  silverMedals: number;
  bronzeMedals: number;
  isActive: boolean;
  createdAt: Date;
  updatedAt: Date;
};

const termSchema = new Schema<TermDoc>(
  {
    userId: { type: Schema.Types.ObjectId, required: true, index: true, ref: "User" },
    name: { type: String, required: true, trim: true },
    startDate: { type: Date, required: true },
    endDate: { type: Date, required: true },
    studyGoalHours: { type: Number, required: true, default: 600 },
    dailyGoalMinutes: { type: Number, required: true, default: 720 },
    examCount: { type: Number, required: true, default: 0 },
    goldMedals: { type: Number, required: true, default: 0 },
    silverMedals: { type: Number, required: true, default: 0 },
    bronzeMedals: { type: Number, required: true, default: 0 },
    isActive: { type: Boolean, required: true, default: true, index: true },
  },
  { timestamps: true }
);

termSchema.index({ userId: 1, startDate: -1 });

export const Term =
  (mongoose.models.Term as mongoose.Model<TermDoc>) ||
  mongoose.model<TermDoc>("Term", termSchema);

