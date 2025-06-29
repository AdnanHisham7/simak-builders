import { Router } from "express";
import employeeController from "@controllers/employeeController";
import { authMiddleware } from "@middleware/authMiddleware";

const router = Router();

router.get("/", employeeController.getEmployees);
router.get("/:id", employeeController.getEmployeeById);
router.post("/", authMiddleware, employeeController.createEmployee);
router.put("/:id", authMiddleware, employeeController.updateEmployee);
router.delete("/:id", authMiddleware, employeeController.deleteEmployee);
router.get("/:id/attendance", employeeController.getAttendanceByEmployee);
router.post("/calculate-salary", authMiddleware, employeeController.calculateSalary);
router.post("/mark-attendances-paid", authMiddleware, employeeController.markAttendancesPaid);

export default router;
