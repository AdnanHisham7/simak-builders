import { Router } from "express";
import notificationController from "@controllers/notificationController";
import { authMiddleware } from "@middleware/authMiddleware";

const router = Router();

router.get("/", authMiddleware, notificationController.getNotifications);
router.put("/:notificationId/status", authMiddleware, notificationController.updateNotificationStatus);

export default router;
