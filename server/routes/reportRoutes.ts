import express from "express";
import reportController from "../controllers/reportController";
import { authMiddleware } from "@middleware/authMiddleware";

const router = express.Router();

// Stocks
router.get("/stock-transactions", reportController.getStockTransactions);
// router.get("/stock-transactions-aggregate", reportController.getStockTransactionsAggregate);
router.get("/stock-inventory", reportController.getStockInventory);
// router.get("/stock-inventory-aggregate", reportController.getStockInventoryAggregate);
router.get("/vendors", reportController.getVendorsReport);
// router.get("/vendors-aggregate", reportController.getVendorsAggregate);
router.get("/clients", reportController.getClientsReport);
// router.get("/clients-aggregate", reportController.getClientsAggregate);
router.get("/vendor-purchases", reportController.getVendorPurchases);

export default router;
