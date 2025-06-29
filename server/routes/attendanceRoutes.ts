import express from "express";
import attendanceController from "@controllers/attendanceController";
import { authMiddleware } from "@middleware/authMiddleware";

const router = express.Router();

router.post("/mark", authMiddleware, attendanceController.markAttendance);
router.get("/site/:siteId", authMiddleware, attendanceController.getSiteAttendance);
router.get("/site/:siteId/day/:date", attendanceController.getAttendanceDetailsForDay);
router.get("/site/:siteId/employees/:date", attendanceController.getEmployeesWithAttendance);

export default router;