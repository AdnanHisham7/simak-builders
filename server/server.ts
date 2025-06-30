import dotenv from "dotenv";
require("module-alias/register");
dotenv.config();

import fs from "fs";
import path from "path";
import app from "./app";
import { connectDB } from "./config/database";

const PORT = process.env.PORT || 5000;

// ✅ Ensure uploads/ folder exists
const uploadsDir = path.resolve(__dirname, "uploads");
if (!fs.existsSync(uploadsDir)) {
  fs.mkdirSync(uploadsDir);
}

(async () => {
  try {
    await connectDB();
    app.listen(PORT, () => {
      console.log(`✅ Server running on port ${PORT}`);
    });
  } catch (err) {
    console.error("❌ Failed to start server:", err);
    process.exit(1);
  }
})();
