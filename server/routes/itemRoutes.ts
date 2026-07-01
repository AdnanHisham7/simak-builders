import express from "express";
import itemController from "../controllers/itemController";
import { authMiddleware } from "@middleware/authMiddleware";

const router = express.Router();

router.get("/search", authMiddleware, itemController.searchItems);
router.get("/", authMiddleware, itemController.getItems);

export default router;