import mongoose, { Schema } from "mongoose";

export type UserDoc = {
  name: string;
  email: string;
  passwordHash: string;
  timerVolume: number;
  createdAt: Date;
  updatedAt: Date;
};

const userSchema = new Schema<UserDoc>(
  {
    name: { type: String, required: true, trim: true },
    email: { type: String, required: true, unique: true, lowercase: true, trim: true },
    passwordHash: { type: String, required: true },
    timerVolume: { type: Number, required: true, default: 0.45 },
  },
  { timestamps: true }
);

export const User =
  (mongoose.models.User as mongoose.Model<UserDoc>) ||
  mongoose.model<UserDoc>("User", userSchema);

