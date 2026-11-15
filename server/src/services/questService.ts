import mongoose from "mongoose";
import Quest from "../models/Quest.js";

export interface CreateQuestInput {
  title: string;
  subject: string;
  location: string;
  description?: string;
  day: Date;
  startTime: string;
  endTime: string;
  maxMember: number;
}

export async function createQuest(
  input: CreateQuestInput,
  authorId: string
) {
  // Check that the author ID is valid
  if (!mongoose.isValidObjectId(authorId)) {
    throw new Error("Invalid author ID");
  }

  // Create and save the quest in MongoDB
  const quest = await Quest.create({
    title: input.title,
    subject: input.subject,
    location: input.location,
    description: input.description,
    author: authorId,
    day: input.day,
    startTime: input.startTime,
    endTime: input.endTime,
    members: [],
    maxMember: input.maxMember,
    status: "open",
  });

  return quest;
}


export interface UpdateQuestInput {
  title?: string;
  subject?: string;
  location?: string;
  description?: string;
  day?: Date;
  startTime?: string;
  endTime?: string;
  maxMember?: number;
}

// Error class for quest-related errors
export class QuestError extends Error {
  constructor(
    public statusCode: number,
    message: string
  ) {
    super(message);
    this.name = "QuestError";
  }
}

// Edit an existing quest
export async function updateQuest(
  questId: string,
  userId: string,
  input: UpdateQuestInput
) {
  // Validate the quest ID
  if (!mongoose.isValidObjectId(questId)) {
    throw new QuestError(400, "Invalid quest ID.");
  }

  // Find the quest in MongoDB
  const quest = await Quest.findById(questId);

  if (!quest) {
    throw new QuestError(404, "Quest not found.");
  }

  // Only the author can edit the quest
  if (quest.author.toString() !== userId) {
    throw new QuestError(403, "You cannot edit another user's quest.");
  }

  // Update only the fields provided
  Object.assign(quest, input);

  // Save the updated quest
  await quest.save();

  return quest;
}

// Delete an existing quest
export async function deleteQuest(
  questId: string,
  userId: string
) {
  // Validate the quest ID
  if (!mongoose.isValidObjectId(questId)) {
    throw new QuestError(400, "Invalid quest ID.");
  }

  // Find the quest in MongoDB
  const quest = await Quest.findById(questId);

  if (!quest) {
    throw new QuestError(404, "Quest not found.");
  }

  // Only the author can delete the quest
  if (quest.author.toString() !== userId) {
    throw new QuestError(403, "You cannot delete another user's quest.");
  }

  // Remove the quest from MongoDB
  await quest.deleteOne();

  return;
}
