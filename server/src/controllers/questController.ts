
import type { Response } from "express";

import {
  createQuest,
  type CreateQuestInput,
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
