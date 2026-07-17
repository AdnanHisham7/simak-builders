import express from "express";
import companyController from "../controllers/companyController";
import { authMiddleware } from "@middleware/authMiddleware";
import upload from "@middleware/multer";

const router = express.Router();

router.post("/initialize", companyController.initializeComapny);
router.get("/dashboard", companyController.getDashboardData);
router.get("/summary", authMiddleware, companyController.getCompanySummary);
router.post("/add-funds", authMiddleware, companyController.addCompanyFunds);
router.get(
  "/amount-to-be-received",
  authMiddleware,
  companyController.getAmountToBeReceived,
);
router.get("/activity-logs", companyController.getAllActivityLogs);
router.post(
  "/bulk-import",
  authMiddleware,
  upload.any(),
  companyController.createSiteWithBulkData
);

export default router;