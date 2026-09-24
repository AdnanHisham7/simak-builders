import express from 'express';
import miscellaneousExpenseController from '../controllers/miscellaneousExpenseController';
import { authMiddleware, requireRoles } from '@middleware/authMiddleware';

const router = express.Router();

router.post('/', authMiddleware, requireRoles("admin", "siteManager"), miscellaneousExpenseController.addMiscellaneousExpense);
router.get("/site", authMiddleware, requireRoles("admin", "siteManager", "client", "architect"), miscellaneousExpenseController.getMiscellaneousExpensesBySite);
router.get("/suggestions", authMiddleware, requireRoles("admin", "siteManager"), miscellaneousExpenseController.getMiscellaneousExpenseSuggestions);
router.get("/:expenseId", authMiddleware, miscellaneousExpenseController.getMiscellaneousExpenseById);
router.patch("/:expenseId/verify", authMiddleware, requireRoles("admin"), miscellaneousExpenseController.verifyMiscellaneousExpense);
router.patch("/:expenseId", authMiddleware, requireRoles("admin", "siteManager"), miscellaneousExpenseController.updateMiscellaneousExpense);
router.delete("/:expenseId", authMiddleware, requireRoles("admin"), miscellaneousExpenseController.deleteMiscellaneousExpense);

export default router;