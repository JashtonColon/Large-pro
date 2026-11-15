
import type { Response } from "express";

import {
  createQuest,
  updateQuest,
  deleteQuest,
  requestToJoinQuest,
  getQuestJoinRequests,
  reviewQuestJoinRequest,
  leaveQuest,
  getPartialMatches,
  searchQuests,
  QuestError,
  type CreateQuestInput,
  type UpdateQuestInput,
} from "../services/questService.js";

import type {
  AuthenticatedRequest,
} from "../middleware/authMiddleware.js";

import { timeToMinutes } from "../utils/timeUtils.js";
import type { IQuest } from "../models/Quest.js";
import { getQuestStatus } from "../utils/questStatus.js";

// Only the author sees who asked to join. Everyone else gets a single
// requestedByMe flag so the apps can show "Requested" on their own request.
function toQuestResponse(quest: IQuest, viewerId: string) {
  const { joinRequests, ...fields } = quest.toObject();
  fields.status = getQuestStatus(quest, quest.members.length);
  if (quest.author.toString() === viewerId) return { ...fields, joinRequests };
  const requestedByMe = quest.joinRequests.some(id => id.toString() === viewerId);
  return { ...fields, requestedByMe };
}

function getQuestRequest(req: AuthenticatedRequest) {
  if (!req.userId) throw new QuestError(401, "Authentication required.");
  if (typeof req.params.id !== "string") {
    throw new QuestError(400, "Invalid quest ID.");
  }
  return { questId: req.params.id, userId: req.userId };
}

function handleQuestError(
  res: Response,
  error: unknown,
  message = "Unable to update or retrieve quest membership right now."
) {
  if (error instanceof QuestError) {
    res.status(error.statusCode).json({ message: error.message });
    return;
  }
  console.error("Quest error:", error);
  res.status(500).json({ message });
}

export async function searchQuestsController(req: AuthenticatedRequest, res: Response): Promise<void> {
  try {
    const userId = req.userId;
    if (!userId) throw new QuestError(401, "Authentication required.");
    const quests = await searchQuests(req.query.subject, req.query.title, req.query);
    res.status(200).json({ quests: quests.map(quest => toQuestResponse(quest, userId)) });
  } catch (error) {
    handleQuestError(res, error, "Unable to search quests right now.");
  }
}

export async function getPartialMatchesController(req: AuthenticatedRequest, res: Response): Promise<void> {
  try {
    const userId = req.userId;
    if (!userId) throw new QuestError(401, "Authentication required.");
    const matches = await getPartialMatches(userId, req.query);
    res.status(200).json({ matches: matches.map(quest => toQuestResponse(quest, userId)) });
  } catch (error) {
    handleQuestError(res, error, "Unable to retrieve quest matches right now.");
  }
}

export async function joinQuestController(req: AuthenticatedRequest, res: Response): Promise<void> {
  try {
    const { questId, userId } = getQuestRequest(req);
    const quest = await requestToJoinQuest(questId, userId);
    res.status(201).json({
      message: "Join request sent to the quest author.",
      quest: toQuestResponse(quest, userId),
    });
  } catch (error) {
    handleQuestError(res, error);
  }
}

export async function getQuestJoinRequestsController(req: AuthenticatedRequest, res: Response): Promise<void> {
  try {
    const { questId, userId } = getQuestRequest(req);
    const requests = await getQuestJoinRequests(questId, userId);
    res.status(200).json({ requests });
  } catch (error) {
    handleQuestError(res, error);
  }
}

export async function reviewQuestJoinRequestController(req: AuthenticatedRequest, res: Response): Promise<void> {
  try {
    const { questId, userId } = getQuestRequest(req);
    if (typeof req.params.userId !== "string") {
      throw new QuestError(400, "Invalid quest or user ID.");
    }
    const decision = req.body?.decision;
    if (decision !== "accept" && decision !== "deny") {
      res.status(400).json({ message: "Decision must be accept or deny." });
      return;
    }
    const quest = await reviewQuestJoinRequest(questId, userId, req.params.userId, decision);
    res.status(200).json({
      message: decision === "accept" ? "Join request accepted." : "Join request denied.",
      quest: toQuestResponse(quest, userId),
    });
  } catch (error) {
    handleQuestError(res, error);
  }
}

export async function leaveQuestController(req: AuthenticatedRequest, res: Response): Promise<void> {
  try {
    const { questId, userId } = getQuestRequest(req);
    const quest = await leaveQuest(questId, userId);
    res.status(200).json({ message: "You have left the quest.", quest: toQuestResponse(quest, userId) });
  } catch (error) {
    handleQuestError(res, error);
  }
}

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

  // Convert start and end times to minutes since midnight
  let startMinutes: number;
  let endMinutes: number;

  try {
    startMinutes = timeToMinutes(startTime);
    endMinutes = timeToMinutes(endTime);
  } catch {
    res.status(400).json({
      message: "Start and end times must use HH:MM AM/PM format.",
    });
    return;
  }

  // Ensure the end time is after the start time
  if (endMinutes <= startMinutes) {
    res.status(400).json({
      message: "End time must be after start time.",
    });
    return;
  }

    const input: CreateQuestInput = {
      title: title.trim(),
      subject: subject.trim(),
      location: location.trim(),
      description: description?.trim(),
      day: parsedDay,
      startTime: startMinutes,
      endTime: endMinutes,
      maxMember,
    };

    // Create the quest in MongoDB
    const quest = await createQuest(input, authorId);

    res.status(201).json({
      message: "Quest created successfully.",
      quest: toQuestResponse(quest, authorId),
    });

  } catch (error) {
    handleQuestError(res, error, "Unable to create quest right now.");
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
    const { questId, userId } = getQuestRequest(req);

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

    // Validate and convert start/end times
    for (const field of ["startTime", "endTime"] as const) {
      if (field in changes) {
        const value = changes[field];

        if (typeof value !== "string") {
          res.status(400).json({
            message: `${field} must be a time string.`,
          });
          return;
        }

        try {
          input[field] = timeToMinutes(value);
        } catch {
          res.status(400).json({
            message: `${field} must use HH:MM AM/PM format.`,
          });
          return;
        }
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
      quest: toQuestResponse(quest, userId),
    });
  } catch (error) {
    handleQuestError(res, error, "Unable to update quest right now.");
  }
}

// DELETE /api/quests/:id
export async function deleteQuestController(
  req: AuthenticatedRequest,
  res: Response
): Promise<void> {
  try {
    const { questId, userId } = getQuestRequest(req);

    await deleteQuest(questId, userId);

    res.status(200).json({
      message: "Quest deleted successfully.",
    });
  } catch (error) {
    handleQuestError(res, error, "Unable to delete quest right now.");
  }
}
