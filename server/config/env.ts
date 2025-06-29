import dotenv from "dotenv";

dotenv.config();

export const env = {
  MONGO_URI: process.env.MONGO_URI!,
  JWT_SECRET: process.env.JWT_SECRET!,
  EMAIL_USER: process.env.EMAIL_USER!,
  EMAIL_PASS: process.env.EMAIL_PASS!,
  FRONTEND_URL: process.env.FRONTEND_URL!,
  GOOGLE_CLIENT_ID: process.env.GOOGLE_CLIENT_ID!,
};
