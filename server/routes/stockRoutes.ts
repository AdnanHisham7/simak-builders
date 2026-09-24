import express from "express";
import stockController from "../controllers/stockController";
import { authMiddleware, requireRoles } from "@middleware/authMiddleware";

const router = express.Router();

// Stocks
router.post("/", authMiddleware, requireRoles("admin", "siteManager"), stockController.addStock);
router.get("/", authMiddleware, requireRoles("admin", "siteManager"), stockController.getStocks);
router.get("/alerts", authMiddleware, requireRoles("admin", "siteManager"), stockController.getLowStockAlerts);
router.post("/check-low-stock", authMiddleware, requireRoles("admin"), stockController.runLowStockCheck);
router.get("/by-site", authMiddleware, requireRoles("admin", "siteManager"), stockController.getStocksBySite);
router.patch("/:stockId/threshold", authMiddleware, requireRoles("admin"), stockController.updateStockThreshold);

// Stock Transfers
router.post("/transfers", authMiddleware, requireRoles("admin", "siteManager"), stockController.requestStockTransfer);
router.patch(
  "/transfers/:transferId/approve",
  authMiddleware,
  requireRoles("admin"),
  stockController.approveStockTransfer
);
router.patch(
  "/transfers/:transferId/reject",
  authMiddleware,
  requireRoles("admin"),
  stockController.rejectStockTransfer
);
router.get("/transfers", authMiddleware, requireRoles("admin", "siteManager"), stockController.getStockTransfers);

// Stock Usages
router.post("/usages", authMiddleware, requireRoles("admin", "siteManager"), stockController.logStockUsage);
router.get("/usages", authMiddleware, requireRoles("admin", "siteManager"), stockController.getStockUsages);

export default router;
