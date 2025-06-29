import { Router } from "express";
import contractorController from "@controllers/contractorController";
import { authMiddleware } from "@middleware/authMiddleware";

const router = Router();

router.post("/", authMiddleware, contractorController.createContractor);
router.get("/", authMiddleware, contractorController.getAllContractors);
router.post("/transactions", authMiddleware, contractorController.addTransaction);
router.get("/transactions", authMiddleware, contractorController.getContractorTransactions);
router.post("/assign-site", authMiddleware, contractorController.assignSiteToContractor);

export default router;
