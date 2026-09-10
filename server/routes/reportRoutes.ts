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
router.get("/expense-report", authMiddleware, reportController.getExpenseReport);
router.get("/client-report", authMiddleware, reportController.getClientReport);

// Comprehensive Analytical Reports
router.get("/annual-financial", authMiddleware, reportController.getAnnualFinancialReport);
router.get("/salary", authMiddleware, reportController.getSalaryPayrollReport);
router.get("/vendors-comprehensive", authMiddleware, reportController.getComprehensiveVendorsReport);
router.get("/contractors-comprehensive", authMiddleware, reportController.getComprehensiveContractorsReport);
router.get("/capital-lenders", authMiddleware, reportController.getCapitalLendersReport);

export default router;