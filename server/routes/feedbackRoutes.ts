import express from "express";
import feedbackController from "../controllers/feedbackController";
import { authMiddleware } from "@middleware/authMiddleware";

const router = express.Router();

router.get("/open-count", authMiddleware, feedbackController.getOpenFeedbackCount);
router.post("/", authMiddleware, feedbackController.createFeedback);
router.get("/mine", authMiddleware, feedbackController.getMyFeedback);
router.get("/", authMiddleware, feedbackController.getAllFeedback);
router.put(
  "/:feedbackId/respond",
  authMiddleware,
  feedbackController.respondToFeedback,
);

export default router;