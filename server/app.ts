import express from "express";
import cors from "cors";
import cookieParser from "cookie-parser";
import { errorMiddleware } from "./middleware/errorMiddleware";
import authRoutes from "@routes/authRoutes";
import userRoutes from "@routes/userRoutes";
import siteRoutes from "@routes/siteRoutes";
import stockRoutes from "@routes/stockRoutes";
import purchaseRoutes from "@routes/purchaseRoutes";
import vendorRoutes from "@routes/vendorRoutes";
import employeeRoutes from "@routes/employeeRoutes";
import attendanceRoutes from "@routes/attendanceRoutes";
import miscellaneousExpenseRoutes from "@routes/miscellaneousExpenseRoutes";
import companyRoutes from "@routes/companyRoutes";
import contractorRoutes from "@routes/contractorRoutes";
import clientRoutes from "@routes/clientRoutes";
import reportRoutes from "@routes/reportRoutes";
import notificationRoutes from "@routes/notificationRoutes";
import enquiryRoutes from "@routes/enquiryRoutes";
import projectRoutes from "@routes/projectRoutes";
import itemRoutes from "@routes/itemRoutes";
import feedbackRoutes from "@routes/feedbackRoutes";
import expenseRequestRoutes from "@routes/expenseRequestRoutes";
import { env } from "./config/env";
import morgan from "morgan";

const app = express();

// Middleware
app.use(express.json());
app.use(cookieParser());
app.use(morgan("dev"));
const allowedOrigins = [
  "https://simakbuilders.com",
  "https://www.simakbuilders.com",
];

app.use(
  cors({
    origin: (origin, callback) => {
      if (!origin || allowedOrigins.includes(origin)) {
        callback(null, true);
      } else {
        callback(new Error(`Not allowed by CORS: ${origin}`));
      }
    },
    credentials: true,
  }),
);


// Routes
app.use("/api/auth", authRoutes);
app.use("/api/users", userRoutes);
app.use("/api/sites", siteRoutes);
app.use("/api/stocks", stockRoutes);
app.use("/api/purchases", purchaseRoutes);
app.use("/api/vendors", vendorRoutes);
app.use("/api/employees", employeeRoutes);
app.use("/api/attendance", attendanceRoutes);
app.use("/api/miscellaneous-expenses", miscellaneousExpenseRoutes);
app.use("/api/company", companyRoutes);
app.use("/api/contractors", contractorRoutes);
app.use("/api/client", clientRoutes);
app.use("/api/reports", reportRoutes);
app.use("/api/notifications", notificationRoutes);
app.use("/api/enquiries", enquiryRoutes);
app.use("/api/projects", projectRoutes);
app.use("/api/items", itemRoutes);
app.use("/api/feedback", feedbackRoutes);
app.use("/api/expense-requests", expenseRequestRoutes);

// Error Handler
app.use(errorMiddleware);

export default app;