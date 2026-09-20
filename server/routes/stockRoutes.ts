import express from "express";
import stockController from "../controllers/stockController";
import { authMiddleware } from "@middleware/authMiddleware";

const router = express.Router();

// Stocks
router.post("/", authMiddleware, stockController.addStock);
router.get("/", authMiddleware, stockController.getStocks);
router.get("/alerts", authMiddleware, stockController.getLowStockAlerts);
router.post("/check-low-stock", authMiddleware, stockController.runLowStockCheck);
router.get("/by-site", authMiddleware, stockController.getStocksBySite);
router.patch("/:stockId/threshold", authMiddleware, stockController.updateStockThreshold);

// Stock Transfers
router.post("/transfers", authMiddleware, stockController.requestStockTransfer);
router.patch(
  "/transfers/:transferId/approve",
  authMiddleware,
  stockController.approveStockTransfer
);
router.patch(
  "/transfers/:transferId/reject",
  authMiddleware,
  stockController.rejectStockTransfer
);
router.get("/transfers", authMiddleware, stockController.getStockTransfers);

// Stock Usages
router.post("/usages", authMiddleware, stockController.logStockUsage);
router.get("/usages", authMiddleware, stockController.getStockUsages);

export default router;
