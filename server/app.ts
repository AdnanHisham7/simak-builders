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
import machineryRentalRoutes from "@routes/machineryRentalRoutes";
import companyRoutes from "@routes/companyRoutes";
import contractorRoutes from "@routes/contractorRoutes";
import clientRoutes from "@routes/clientRoutes";
import reportRoutes from "@routes/reportRoutes";
import notificationRoutes from "@routes/notificationRoutes";
import enquiryRoutes from "@routes/enquiryRoutes";
import projectRoutes from "@routes/projectRoutes";
import { env } from "./config/env";
import morgan from "morgan";
import { setupCronJobs } from "@utils/cronJobs";

const app = express();

// Middleware
app.use(express.json());
app.use(cookieParser());
app.use(morgan("dev"));
app.use(
  cors({
    origin: env.FRONTEND_URL,
    credentials: true,
  })
);
app.use("/api/uploads", express.static("uploads"));

setupCronJobs();

// Routes
app.use("/api/auth", authRoutes);
app.use("/api/users", userRoutes);
app.use("/api/sites", siteRoutes);
app.use("/api/stocks", stockRoutes);
app.use("/api/purchases", purchaseRoutes);
app.use("/api/vendors", vendorRoutes);
app.use("/api/employees", employeeRoutes);
app.use("/api/attendance", attendanceRoutes);
app.use("/api/machinery-rentals", machineryRentalRoutes);
app.use("/api/company", companyRoutes);
app.use("/api/contractors", contractorRoutes);
app.use("/api/client", clientRoutes);
app.use("/api/reports", reportRoutes);
app.use("/api/notifications", notificationRoutes);
app.use("/api/enquiries", enquiryRoutes);
app.use("/api/projects", projectRoutes);

// Error Handler
app.use(errorMiddleware);

export default app;
