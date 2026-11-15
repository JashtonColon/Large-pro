
import type { Response } from "express";

import {
  createQuest,
  updateQuest,
  deleteQuest,
  QuestError,
  type CreateQuestInput,
  type UpdateQuestInput,
} from "../services/questService.js";

import type {
  AuthenticatedRequest,
} from "../middleware/authMiddleware.js";

export async function createQuestController(
  req: AuthenticatedRequest,
  res: Response
): Promise<void> {
  try {
    const {
      title,
      subject,
      location,
      description,
      day,
      startTime,
      endTime,
      maxMember,
    } = req.body ?? {};

    // Validate required text fields
    if (
      typeof title !== "string" || !title.trim() ||
      typeof subject !== "string" || !subject.trim() ||
      typeof location !== "string" || !location.trim() ||
      typeof startTime !== "string" || !startTime.trim() ||
      typeof endTime !== "string" || !endTime.trim()
    ) {
      res.status(400).json({
        message: "Please provide all required quest fields.",
      });
      return;
    }

    // Validate optional description
    if (
      description !== undefined &&
      typeof description !== "string"
    ) {
      res.status(400).json({
        message: "Description must be a string.",
      });
      return;
    }

    // Require MM/DD/YYYY format
    if (
      typeof day !== "string" ||
      !/^\d{2}\/\d{2}\/\d{4}$/.test(day)
    ) {
      res.status(400).json({
        message: "Date must be in MM/DD/YYYY format.",
      });
      return;
    }

    // Convert MM/DD/YYYY to a JavaScript Date
    const [month, date, year] = day.split("/").map(Number);

    const parsedDay = new Date(
      Date.UTC(year, month - 1, date)
    );

    // Reject invalid calendar dates
    if (
      parsedDay.getUTCFullYear() !== year ||
      parsedDay.getUTCMonth() !== month - 1 ||
      parsedDay.getUTCDate() !== date
    ) {
      res.status(400).json({
        message: "Please provide a valid calendar date.",
      });
      return;
    }

    // Validate maximum number of members
    if (
      typeof maxMember !== "number" ||
      !Number.isInteger(maxMember) ||
      maxMember < 1
    ) {
      res.status(400).json({
        message: "maxMember must be a positive whole number.",
      });
      return;
    }

    // Get the authenticated student's ID
    const authorId = req.userId;

    if (!authorId) {
      res.status(401).json({
        message: "Authentication required.",
      });
      return;
    }

    // Prepare the quest information
    const input: CreateQuestInput = {
      title: title.trim(),
      subject: subject.trim(),
      location: location.trim(),
      description: description?.trim(),
      day: parsedDay,
      startTime: startTime.trim(),
      endTime: endTime.trim(),
      maxMember,
    };

    // Create the quest in MongoDB
    const quest = await createQuest(input, authorId);

    res.status(201).json({
      message: "Quest created successfully.",
      quest,
    });

  } catch (error) {
    console.error("Failed to create quest:", error);

    res.status(500).json({
      message: "Unable to create quest right now.",
    });
  }
}


const editableFields = [
  "title",
  "subject",
  "location",
  "description",
  "day",
  "startTime",
  "endTime",
  "maxMember",
] as const;

// PATCH /api/quests/:id
export async function updateQuestController(
  req: AuthenticatedRequest,
  res: Response
): Promise<void> {
  try {
    const userId = req.userId;
    const questId = req.params.id;

    if (!userId) {
      res.status(401).json({ message: "Authentication required." });
      return;
    }

    if (typeof questId !== "string") {
      res.status(400).json({ message: "Invalid quest ID." });
      return;
    }

    const body: unknown = req.body;

    if (
      !body ||
      typeof body !== "object" ||
      Array.isArray(body)
    ) {
      res.status(400).json({
        message: "Please provide quest fields to update.",
      });
      return;
    }

    const changes = body as Record<string, unknown>;
    const keys = Object.keys(changes);

    if (
      keys.length === 0 ||
      keys.some(
        (key) => !editableFields.includes(
          key as (typeof editableFields)[number]
        )
      )
    ) {
      res.status(400).json({
        message: "Request contains no valid editable fields.",
      });
      return;
    }

    const input: UpdateQuestInput = {};

    // Validate editable text fields
    for (const field of [
      "title",
      "subject",
      "location",
      "startTime",
      "endTime",
    ] as const) {
      if (field in changes) {
        const value = changes[field];

        if (typeof value !== "string" || !value.trim()) {
          res.status(400).json({
            message: `${field} must be a non-empty string.`,
          });
          return;
        }

        input[field] = value.trim();
      }
    }

    // Validate optional description
    if ("description" in changes) {
      if (typeof changes.description !== "string") {
        res.status(400).json({
          message: "Description must be a string.",
        });
        return;
      }

      input.description = changes.description.trim();
    }

    // Validate and convert MM/DD/YYYY date
    if ("day" in changes) {
      const day = changes.day;

      if (
        typeof day !== "string" ||
        !/^\d{2}\/\d{2}\/\d{4}$/.test(day)
      ) {
        res.status(400).json({
          message: "Date must be in MM/DD/YYYY format.",
        });
        return;
      }

      const [month, date, year] = day.split("/").map(Number);
      const parsedDay = new Date(
        Date.UTC(year, month - 1, date)
      );

      if (
        parsedDay.getUTCFullYear() !== year ||
        parsedDay.getUTCMonth() !== month - 1 ||
        parsedDay.getUTCDate() !== date
      ) {
        res.status(400).json({
          message: "Please provide a valid calendar date.",
        });
        return;
      }

      input.day = parsedDay;
    }

    // Validate maximum number of members
    if ("maxMember" in changes) {
      const maxMember = changes.maxMember;

      if (
        typeof maxMember !== "number" ||
        !Number.isInteger(maxMember) ||
        maxMember < 1
      ) {
        res.status(400).json({
          message: "maxMember must be a positive whole number.",
        });
        return;
      }

      input.maxMember = maxMember;
    }

    // Save the changes
    const quest = await updateQuest(questId, userId, input);

    res.status(200).json({
      message: "Quest updated successfully.",
      quest,
    });
  } catch (error) {
    if (error instanceof QuestError) {
      res.status(error.statusCode).json({
        message: error.message,
      });
      return;
    }

    console.error("Failed to update quest:", error);
    res.status(500).json({
      message: "Unable to update quest right now.",
    });
  }
}

// DELETE /api/quests/:id
export async function deleteQuestController(
  req: AuthenticatedRequest,
  res: Response
): Promise<void> {
  try {
    const userId = req.userId;
    const questId = req.params.id;

    if (!userId) {
      res.status(401).json({ message: "Authentication required." });
      return;
    }

    if (typeof questId !== "string") {
      res.status(400).json({ message: "Invalid quest ID." });
      return;
    }

    await deleteQuest(questId, userId);

    res.status(200).json({
      message: "Quest deleted successfully.",
    });
  } catch (error) {
    if (error instanceof QuestError) {
      res.status(error.statusCode).json({
        message: error.message,
      });
      return;
    }

    console.error("Failed to delete quest:", error);
    res.status(500).json({
      message: "Unable to delete quest right now.",
    });
  }
}
