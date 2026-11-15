
import { Router } from "express";
import { authMiddleware } from "../middleware/authMiddleware.js";

import {
  createQuestController,
  updateQuestController,
  deleteQuestController,
} from "../controllers/questController.js";

const router = Router();

// Create a new quest
// POST /api/quests
router.post("/", authMiddleware, createQuestController);

// Edit an existing quest
// PATCH /api/quests/:id
router.patch("/:id", authMiddleware, updateQuestController);

// Delete an existing quest
// DELETE /api/quests/:id
router.delete("/:id", authMiddleware, deleteQuestController);

export default router;
