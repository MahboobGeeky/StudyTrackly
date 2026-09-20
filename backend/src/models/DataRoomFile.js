import mongoose, { Schema } from "mongoose";

const dataRoomFileSchema = new Schema(
  {
    userId: { type: Schema.Types.ObjectId, required: true, index: true, ref: "User" },
    termId: { type: Schema.Types.ObjectId, required: true, index: true, ref: "Term" },
    name: { type: String, required: true, trim: true },
    url: { type: String, required: true, trim: true },
    note: { type: String, required: false, default: "" },
  },
  { timestamps: true }
);

dataRoomFileSchema.index({ userId: 1, termId: 1, createdAt: -1 });

export const DataRoomFile =
  mongoose.models.DataRoomFile || mongoose.model("DataRoomFile", dataRoomFileSchema);
