import express from "express";
import stockController from "../controllers/stockController";
import { authMiddleware } from "@middleware/authMiddleware";

const router = express.Router();

// Stocks
router.post("/", authMiddleware, stockController.addStock);
router.get("/", stockController.getStocks);
router.get("/by-site", stockController.getStocksBySite);

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
router.get("/transfers", stockController.getStockTransfers);

// Stock Usages
router.post("/usages", authMiddleware, stockController.logStockUsage);
router.get("/usages", stockController.getStockUsages);

export default router;
