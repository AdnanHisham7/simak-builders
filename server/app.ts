import express from "express";
import cors from "cors";
import cookieParser from "cookie-parser";
import compression from "compression";
import helmet from "helmet";
import rateLimit from "express-rate-limit";
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

app.set("trust proxy", 1);

// Middleware
app.use(
  helmet({
    crossOriginResourcePolicy: { policy: "cross-origin" },
  }),
);
app.use(compression());
app.use(express.json());
app.use(cookieParser());
if (process.env.NODE_ENV !== "production") {
  app.use(morgan("dev"));
} else {
  app.use(morgan("combined"));
}

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

const generalApiLimiter = rateLimit({
  windowMs: 15 * 60 * 1000,
  limit: 600,
  standardHeaders: true,
  legacyHeaders: false,
  message: { message: "Too many requests. Please try again later." },
});

const authLimiter = rateLimit({
  windowMs: 15 * 60 * 1000,
  limit: 30,
  standardHeaders: true,
  legacyHeaders: false,
  message: { message: "Too many attempts. Please try again later." },
});

const publicFormLimiter = rateLimit({
  windowMs: 60 * 60 * 1000,
  limit: 20,
  standardHeaders: true,
  legacyHeaders: false,
  message: { message: "Too many submissions. Please try again later." },
});

app.use("/api", generalApiLimiter);
app.use("/api/auth", authLimiter);
app.use("/api/enquiries", publicFormLimiter);
app.use("/api/feedback", publicFormLimiter);


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