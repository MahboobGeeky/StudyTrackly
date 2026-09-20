import mongoose, { Schema } from "mongoose";

const courseSchema = new Schema(
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
  mongoose.models.Course || mongoose.model("Course", courseSchema);
