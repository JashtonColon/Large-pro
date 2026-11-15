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