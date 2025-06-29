import { Router } from "express";
import siteController from "@controllers/siteController";
import { authMiddleware } from "@middleware/authMiddleware";
import upload from "@middleware/multer";

const router = Router();

router.get("/", authMiddleware, siteController.getSites);
router.get("/:siteId", siteController.getSiteDetails);
router.post("/", authMiddleware, siteController.createSite);
router.put("/", siteController.updateSite);
router.put("/:siteId/phases/:phaseId/status", authMiddleware, siteController.updatePhaseStatus);
router.post("/:siteId/documents", authMiddleware, upload.single("file"), siteController.uploadDocument);
router.patch("/phases/:phaseId/approve", authMiddleware, siteController.approvePhase);
router.patch("/phases/:phaseId/reject", authMiddleware, siteController.rejectPhase);
router.get("/client/:clientId", authMiddleware, siteController.getSiteByClient);
router.get(
  "/:siteId/documents/zip", authMiddleware, siteController.downloadSiteDocumentsZip);
router.get("/:siteId/purchases/bills/zip", authMiddleware, siteController.downloadPurchaseBillsZip);
router.post("/:siteId/mark-as-completed", authMiddleware, siteController.markSiteAsCompleted);

export default router;
