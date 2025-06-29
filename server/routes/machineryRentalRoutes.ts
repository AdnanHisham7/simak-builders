import express from 'express';
import machineryRentalController from '../controllers/machineryRentalController';
import { authMiddleware } from '@middleware/authMiddleware';

const router = express.Router();

router.post('/', authMiddleware, machineryRentalController.addMachineryRental);
router.get("/site", machineryRentalController.getMachineryRentalsBySite);
router.patch("/:rentalId/verify", authMiddleware, machineryRentalController.verifyMachineryRental);

export default router;