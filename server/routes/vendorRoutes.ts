import { Router } from "express";
import vendorController from "@controllers/vendorController";
import { authMiddleware, requireRoles } from "@middleware/authMiddleware";

const router = Router();

router.get("/", authMiddleware, requireRoles("admin", "siteManager"), vendorController.getVendors);
router.get("/:id", authMiddleware, requireRoles("admin", "siteManager"), vendorController.getVendorById);
router.get("/:id/purchases", authMiddleware, requireRoles("admin", "siteManager"), vendorController.getPurchasesByVendor);
router.post("/", authMiddleware, requireRoles("admin", "siteManager"), vendorController.createVendor);
router.put("/:id", authMiddleware, requireRoles("admin"), vendorController.updateVendor);
router.delete("/:id", authMiddleware, requireRoles("admin"), vendorController.deleteVendor);
router.patch("/:id/settle", authMiddleware, requireRoles("admin"), vendorController.settleVendorPayments);

export default router;