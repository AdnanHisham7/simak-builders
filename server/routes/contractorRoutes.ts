import { Router } from "express";
import contractorController from "@controllers/contractorController";
import { authMiddleware } from "@middleware/authMiddleware";

const router = Router();

router.post("/", authMiddleware, contractorController.createContractor);
router.get("/", authMiddleware, contractorController.getAllContractors);
router.put("/:id", authMiddleware, contractorController.updateContractor);
router.delete("/:id", authMiddleware, contractorController.deleteContractor);
router.post("/transactions", authMiddleware, contractorController.addTransaction);
router.get("/transactions", authMiddleware, contractorController.getContractorTransactions);
router.post("/assign-site", authMiddleware, contractorController.assignSiteToContractor);
router.delete("/:contractorId/sites/:siteId", authMiddleware, contractorController.unassignSiteFromContractor);

export default router;
