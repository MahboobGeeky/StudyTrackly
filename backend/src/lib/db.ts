import mongoose from "mongoose";
import { env } from "./env.js";

let connected = false;

export async function connectDb() {
  if (connected) return;
  mongoose.set("strictQuery", true);
  await mongoose.connect(env.MONGO_URI);
  connected = true;
  console.log("Connected to MongoDB");
}

