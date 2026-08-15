import { Router } from "express";
import projectController from "@controllers/projectController";
import { authMiddleware, optionalAuthMiddleware } from "@middleware/authMiddleware";
import upload from "@middleware/multer";

const router = Router();

const projectUpload = upload.fields([
  { name: "image", maxCount: 1 },
  { name: "gallery", maxCount: 10 },
]);

router.get("/", optionalAuthMiddleware, projectController.getProjects);
router.get("/site/:siteId", authMiddleware, projectController.getProjectBySite);
router.get("/:id", optionalAuthMiddleware, projectController.getProjectById);
router.post("/", authMiddleware, projectUpload, projectController.createProject);
router.put("/:id", authMiddleware, projectUpload, projectController.updateProject);
router.patch("/:id/publish", authMiddleware, projectController.setPublishStatus);
router.delete("/:id", authMiddleware, projectController.deleteProject);

export default router;
