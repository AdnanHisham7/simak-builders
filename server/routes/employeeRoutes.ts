import { Router } from "express";
import employeeController from "@controllers/employeeController";
import { authMiddleware, requireRoles } from "@middleware/authMiddleware";

const router = Router();

router.get("/", authMiddleware, requireRoles("admin", "siteManager"), employeeController.getEmployees);
router.get("/:id", authMiddleware, requireRoles("admin", "siteManager"), employeeController.getEmployeeById);
router.post("/", authMiddleware, requireRoles("admin"), employeeController.createEmployee);
router.put("/:id", authMiddleware, requireRoles("admin"), employeeController.updateEmployee);
router.delete("/:id", authMiddleware, requireRoles("admin"), employeeController.deleteEmployee);
router.get("/:id/attendance", authMiddleware, requireRoles("admin", "siteManager"), employeeController.getAttendanceByEmployee);
router.post("/calculate-salary", authMiddleware, requireRoles("admin"), employeeController.calculateSalary);
router.post("/mark-attendances-paid", authMiddleware, requireRoles("admin"), employeeController.markAttendancesPaid);

export default router;
