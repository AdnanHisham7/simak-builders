import express from 'express';
import purchaseController from '../controllers/purchaseController';
import { authMiddleware, requireRoles } from '@middleware/authMiddleware';
import upload from '@middleware/multer';

const router = express.Router();

// Purchases
router.post('/', authMiddleware, requireRoles("admin", "siteManager"), upload.single("billUpload"), purchaseController.addPurchase);
router.patch('/:purchaseId/verify', authMiddleware, requireRoles("admin"), purchaseController.verifyPurchase);
router.patch('/:purchaseId/items/:itemIndex', authMiddleware, requireRoles("admin", "siteManager"), purchaseController.updatePurchaseItem);
router.delete('/:purchaseId', authMiddleware, requireRoles("admin"), purchaseController.deletePurchase);
router.get('/', authMiddleware, requireRoles("admin", "siteManager"), purchaseController.getPurchases);
router.get("/by-site", authMiddleware, requireRoles("admin", "siteManager", "client", "architect"), purchaseController.getPurchasesBySite);
router.get("/site/:siteId", authMiddleware, requireRoles("admin", "siteManager", "client", "architect"), purchaseController.getPurchasesBySiteForReport);
router.get("/:purchaseId", authMiddleware, purchaseController.getPurchaseById);
router.delete("/:purchaseId/billUpload", authMiddleware, requireRoles("admin", "siteManager"), purchaseController.deleteBillUpload);

export default router;