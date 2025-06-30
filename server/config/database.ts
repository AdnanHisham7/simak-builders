import { connect } from "mongoose";
import { env } from "@config/env";

export const connectDB = async () => {
  try {
    await connect(env.MONGO_URI);
    console.log("MongoDB connected");
  } catch (error) {
    console.error("MongoDB connection error:", error);
    process.exit(1);
  }
};
