import { Router } from "express";
import userController from "@controllers/userController";
import { authMiddleware } from "@middleware/authMiddleware";

const router = Router();

router.get("/", userController.getUsersByRole);
router.post("/", authMiddleware, userController.createUser);
router.get('/me', authMiddleware, userController.getCurrentUser);

router.put("/update", authMiddleware, userController.updateUser);
router.put("/toggleStatus/:id", authMiddleware, userController.toggleStatus);
router.post("/:id/regenerate-password", authMiddleware, userController.regeneratePassword);

// Managers
router.post('/managers', authMiddleware, userController.createSiteManager);
router.put('/managers/:id', authMiddleware, userController.updateSiteManager);
router.put('/manager/:id/assign-sites', authMiddleware, userController.assignSitesToManager);

// Supervisors
router.post('/supervisors', authMiddleware, userController.createSupervisor);
router.put('/supervisors/:id', authMiddleware, userController.updateSupervisor);
router.put("/supervisor/:id/assign-sites", authMiddleware, userController.assignSitesToSupervisor);

// Architects
router.post('/architects', authMiddleware, userController.createArchitect);
router.put('/architects/:id', authMiddleware, userController.updateArchitect);
router.put('/architect/:id/assign-sites', authMiddleware, userController.assignSitesToArchitect);

// Clients
router.post('/clients', authMiddleware, userController.createClient);
router.put('/clients/:id', authMiddleware, userController.updateClient);
router.get("/clients/unassigned", authMiddleware, userController.getUnassignedClients);
router.put('/clients/:id/assign-sites', authMiddleware, userController.assignSitesToClients);

// Salaries
router.get('/salaries', authMiddleware, userController.listSalaries);
router.post('/:id/assign-salary', authMiddleware, userController.assignSalary);
router.put('/:userId/salary-assignments/:assignmentId/verify', authMiddleware, userController.verifySalaryAssignment);
router.put('/:id/fixed-salary', authMiddleware, userController.updateFixedSalary);
router.put('/:userId/salary-assignments/:assignmentId', authMiddleware, userController.updateSalaryAssignmentAmount);
router.post('/:id/assign-site-expenses', authMiddleware, userController.assignSiteExpenses);

// ✅ This should be last to avoid catching /clients or other named routes
router.get('/:id', authMiddleware, userController.getUserById);

export default router;
