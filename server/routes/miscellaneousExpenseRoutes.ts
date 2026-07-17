import express from 'express';
import miscellaneousExpenseController from '../controllers/miscellaneousExpenseController';
import { authMiddleware } from '@middleware/authMiddleware';

const router = express.Router();

router.post('/', authMiddleware, miscellaneousExpenseController.addMiscellaneousExpense);
router.get("/site", miscellaneousExpenseController.getMiscellaneousExpensesBySite);
router.patch("/:expenseId/verify", authMiddleware, miscellaneousExpenseController.verifyMiscellaneousExpense);
router.patch("/:expenseId", authMiddleware, miscellaneousExpenseController.updateMiscellaneousExpense);
router.delete("/:expenseId", authMiddleware, miscellaneousExpenseController.deleteMiscellaneousExpense); // ← NEW

export default router;