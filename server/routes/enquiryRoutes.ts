import { Router } from "express";
import enquiryController from "@controllers/enquiryController";
import { authMiddleware } from "@middleware/authMiddleware";

const router = Router();

router.get("/", authMiddleware, enquiryController.getEnquiries);
router.get("/unseen-count", authMiddleware, enquiryController.getUnseenEnquiriesCount); // move above
router.get("/:id", authMiddleware, enquiryController.getEnquiryById);
router.post("/", enquiryController.createEnquiry);
router.post("/:id/seen", authMiddleware, enquiryController.markEnquiryAsSeen);

export default router;
