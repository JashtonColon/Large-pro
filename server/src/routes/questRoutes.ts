import { Router } from "express";
import { authMiddleware } from "../middleware/authMiddleware.js";
import { createQuestController } from "../controllers/questController.js";

const router = Router();

// POST /api/quests
// Only authenticated students can create quests
router.post("/", authMiddleware, createQuestController);

export default router;
