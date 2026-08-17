import express from "express";
import expenseRequestController from "../controllers/expenseRequestController";
import { authMiddleware } from "@middleware/authMiddleware";

const router = express.Router();

router.get(
  "/pending-count",
  authMiddleware,
  expenseRequestController.getPendingExpenseRequestCount,
);
router.post("/", authMiddleware, expenseRequestController.createExpenseRequest);
router.get("/mine", authMiddleware, expenseRequestController.getMyExpenseRequests);
router.get("/", authMiddleware, expenseRequestController.getAllExpenseRequests);
router.patch(
  "/:expenseRequestId/approve",
  authMiddleware,
  expenseRequestController.approveExpenseRequest,
);
router.patch(
  "/:expenseRequestId/reject",
  authMiddleware,
  expenseRequestController.rejectExpenseRequest,
);

export default router;