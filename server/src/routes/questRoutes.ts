
import { Router } from "express";
import { authMiddleware } from "../middleware/authMiddleware.js";

import {
  createQuestController,
  updateQuestController,
  deleteQuestController,
  joinQuestController,
  getQuestJoinRequestsController,
  reviewQuestJoinRequestController,
  leaveQuestController,
  getPartialMatchesController,
  searchQuestsController,
} from "../controllers/questController.js";

const router = Router();

// Search by subject/title. Both list endpoints accept course/startTime/endTime filters.
router.get("/search", authMiddleware, searchQuestsController);

// Match the authenticated user's courses and weekly availability.
router.get("/matches", authMiddleware, getPartialMatchesController);

// Request membership, review pending requests, and leave a quest.
router.post("/:id/join", authMiddleware, joinQuestController);
router.get("/:id/join-requests", authMiddleware, getQuestJoinRequestsController);
router.patch("/:id/join-requests/:userId", authMiddleware, reviewQuestJoinRequestController);
router.post("/:id/leave", authMiddleware, leaveQuestController);

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
