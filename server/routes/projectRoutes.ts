import { Router } from "express";
import projectController from "@controllers/projectController";
import { authMiddleware } from "@middleware/authMiddleware";
import upload from "@middleware/multer";

const router = Router();

router.get("/", projectController.getProjects);
router.get("/:id", projectController.getProjectById);
router.post("/", authMiddleware, upload.single("image"), projectController.createProject);
router.put("/:id", authMiddleware, upload.single("image"), projectController.updateProject);
router.delete("/:id", authMiddleware, projectController.deleteProject);

export default router;