import mongoose, { Schema, Types } from "mongoose";

export type CourseDoc = {
  userId: Types.ObjectId;
  termId: Types.ObjectId;
  name: string;
  color: string;
  createdAt: Date;
  updatedAt: Date;
};

const courseSchema = new Schema<CourseDoc>(
  {
    userId: { type: Schema.Types.ObjectId, required: true, index: true, ref: "User" },
    termId: { type: Schema.Types.ObjectId, required: true, index: true, ref: "Term" },
    name: { type: String, required: true, trim: true },
    color: { type: String, required: true, default: "blue" },
  },
  { timestamps: true }
);

courseSchema.index({ userId: 1, termId: 1, name: 1 }, { unique: true });

export const Course =
  (mongoose.models.Course as mongoose.Model<CourseDoc>) ||
  mongoose.model<CourseDoc>("Course", courseSchema);

