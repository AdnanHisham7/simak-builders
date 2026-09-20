import express from "express";
import storyController from "@controllers/storyController";
import { authMiddleware } from "@middleware/authMiddleware";
import upload from "@middleware/multer";

const router = express.Router();

router.post("/", authMiddleware, upload.single("file"), storyController.createStory);
router.get("/", authMiddleware, storyController.getActiveStories);
router.get("/watch-later", authMiddleware, storyController.getWatchLaterStories);
router.get("/archive", authMiddleware, storyController.getStoryArchive);
router.get("/site/:siteId", authMiddleware, storyController.getSiteMedia);
router.post("/:storyId/view", authMiddleware, storyController.markStoryViewed);
router.post("/:storyId/save", authMiddleware, storyController.toggleSaveStory);
router.post("/:storyId/react", authMiddleware, storyController.reactToStory);
router.delete("/:storyId", authMiddleware, storyController.deleteStory);

export default router;
