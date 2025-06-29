import { Router } from "express";
import vendorController from "@controllers/vendorController";
import { authMiddleware } from "@middleware/authMiddleware";

const router = Router();

router.get("/", vendorController.getVendors);
router.get("/:id", vendorController.getVendorById);
router.get("/:id/purchases", vendorController.getPurchasesByVendor);
router.post("/", authMiddleware, vendorController.createVendor);
router.put("/:id", authMiddleware, vendorController.updateVendor);
router.delete("/:id", authMiddleware, vendorController.deleteVendor);
router.patch("/:id/settle", authMiddleware, vendorController.settleVendorPayments);

export default router;