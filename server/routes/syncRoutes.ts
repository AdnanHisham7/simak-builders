import { Router } from "express";
import { authMiddleware } from "@middleware/authMiddleware";
import { pushSync, pullSync, syncStatus } from "@controllers/syncController";

const router = Router();

router.post("/push", authMiddleware, pushSync);
router.post("/pull", authMiddleware, pullSync);
router.get("/status", authMiddleware, syncStatus);

export default router;
