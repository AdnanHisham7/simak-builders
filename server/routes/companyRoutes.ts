import express from "express";
import companyController from "../controllers/companyController";
import { authMiddleware, optionalAuthMiddleware, requireRoles } from "@middleware/authMiddleware";
import upload from "@middleware/multer";

const router = express.Router();

router.post("/initialize", companyController.initializeComapny);
router.get("/dashboard", authMiddleware, requireRoles("admin"), companyController.getDashboardData);
router.get("/summary", authMiddleware, requireRoles("admin"), companyController.getCompanySummary);
router.post("/add-funds", authMiddleware, requireRoles("admin"), companyController.addCompanyFunds);
router.get(
  "/amount-to-be-received",
  authMiddleware,
  requireRoles("admin"),
  companyController.getAmountToBeReceived,
);
router.get("/activity-logs", authMiddleware, requireRoles("admin"), companyController.getAllActivityLogs);
router.post(
  "/bulk-import",
  authMiddleware,
  requireRoles("admin"),
  upload.any(),
  companyController.createSiteWithBulkData
);
router.get("/profile", optionalAuthMiddleware, companyController.getCompanyProfile);
router.put(
  "/profile",
  authMiddleware,
  requireRoles("admin"),
  upload.single("logo"),
  companyController.updateCompanyProfile,
);

// Lenders and Debt Management
router.get("/lenders", authMiddleware, requireRoles("admin"), companyController.getLenders);
router.get("/lenders/:id", authMiddleware, requireRoles("admin"), companyController.getLenderById);
router.post("/lenders/settle", authMiddleware, requireRoles("admin"), companyController.settleLender);

export default router;