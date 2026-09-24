import express from "express";
import attendanceController from "@controllers/attendanceController";
import { authMiddleware, requireRoles } from "@middleware/authMiddleware";

const router = express.Router();

router.post("/mark", authMiddleware, requireRoles("admin", "siteManager"), attendanceController.markAttendance);
router.get("/site/:siteId", authMiddleware, requireRoles("admin", "siteManager"), attendanceController.getSiteAttendance);
router.get("/site/:siteId/day/:date", authMiddleware, requireRoles("admin", "siteManager"), attendanceController.getAttendanceDetailsForDay);
router.get("/site/:siteId/employees/:date", authMiddleware, requireRoles("admin", "siteManager"), attendanceController.getEmployeesWithAttendance);

export default router;