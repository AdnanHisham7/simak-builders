import express from "express";
import reportController from "../controllers/reportController";
import { authMiddleware, requireRoles } from "@middleware/authMiddleware";

const router = express.Router();

// Stocks
router.get("/stock-transactions", authMiddleware, requireRoles("admin", "siteManager"), reportController.getStockTransactions);
router.get("/stock-inventory", authMiddleware, requireRoles("admin", "siteManager"), reportController.getStockInventory);
router.get("/vendors", authMiddleware, requireRoles("admin", "siteManager"), reportController.getVendorsReport);
router.get("/clients", authMiddleware, requireRoles("admin"), reportController.getClientsReport);
router.get("/vendor-purchases", authMiddleware, requireRoles("admin", "siteManager"), reportController.getVendorPurchases);
router.get("/expense-report", authMiddleware, requireRoles("admin", "siteManager"), reportController.getExpenseReport);
router.get("/client-report", authMiddleware, requireRoles("admin", "siteManager", "client"), reportController.getClientReport);

// Comprehensive Analytical Reports
router.get("/annual-financial", authMiddleware, requireRoles("admin", "siteManager"), reportController.getAnnualFinancialReport);
router.get("/salary", authMiddleware, requireRoles("admin", "siteManager"), reportController.getSalaryPayrollReport);
router.get("/vendors-comprehensive", authMiddleware, requireRoles("admin", "siteManager"), reportController.getComprehensiveVendorsReport);
router.get("/contractors-comprehensive", authMiddleware, requireRoles("admin", "siteManager"), reportController.getComprehensiveContractorsReport);
router.get("/capital-lenders", authMiddleware, requireRoles("admin", "siteManager"), reportController.getCapitalLendersReport);

export default router;