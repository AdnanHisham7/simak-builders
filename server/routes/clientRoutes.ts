import express from 'express';
import clientController from '../controllers/clientController';
import { authMiddleware } from '@middleware/authMiddleware';

const router = express.Router();

router.get('/dashboard', authMiddleware, clientController.getClientDashboard);
router.get('/sites', authMiddleware, clientController.getClientSites);
router.post('/send-money', authMiddleware, clientController.sendMoneyToAdmin);
router.put('/transactions/:transactionId/verify', authMiddleware, clientController.verifyClientTransaction);
router.get('/transactions/:clientId', authMiddleware, clientController.getTransactionsForReport);

export default router;