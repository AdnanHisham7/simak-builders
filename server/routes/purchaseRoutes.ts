import express from 'express';
import purchaseController from '../controllers/purchaseController';
import { authMiddleware } from '@middleware/authMiddleware';
import upload from '@middleware/multer';

const router = express.Router();

// Purchases
router.post('/', authMiddleware, upload.single("billUpload"), purchaseController.addPurchase);
router.patch('/:purchaseId/verify', authMiddleware, purchaseController.verifyPurchase);
router.get('/', authMiddleware, purchaseController.getPurchases);
router.get("/by-site", purchaseController.getPurchasesBySite);
router.get("/site/:siteId", purchaseController.getPurchasesBySiteForReport);
router.delete("/:purchaseId/billUpload", authMiddleware, purchaseController.deleteBillUpload);

export default router;