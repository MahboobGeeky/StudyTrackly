import mongoose, { Schema } from "mongoose";

const userSchema = new Schema(
  {
    name: { type: String, required: true, trim: true },
    email: { type: String, required: true, unique: true, lowercase: true, trim: true },
    passwordHash: { type: String, required: false },
    googleId: { type: String, sparse: true, unique: true, trim: true },
    timerVolume: { type: Number, required: true, default: 0.45 },
    smartTimerRingtone: {
      type: String,
      required: true,
      default: "soft_chime",
    },
    smartTimerRingtoneRepeat: { type: Number, required: true, default: 1 },
    trialEnd: { type: Date, required: false, default: null },
    academicLevel: { type: String, required: false, default: null },
  },
  { timestamps: true }
);

export const User =
  mongoose.models.User || mongoose.model("User", userSchema);
