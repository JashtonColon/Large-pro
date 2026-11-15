import mongoose from "mongoose";
import Quest, { type IQuest } from "../models/Quest.js";


export interface CreateQuestInput {
  title: string;
  subject: string;
  location: string;
  description?: string;
  day: Date;
  startTime: number;
  endTime: number;
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
  startTime?: number;
  endTime?: number;
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

async function findQuest(questId: string) {
  if (!mongoose.isValidObjectId(questId)) {
    throw new QuestError(400, "Invalid quest ID.");
  }
  const quest = await Quest.findById(questId);
  if (!quest) throw new QuestError(404, "Quest not found.");
  return quest;
}

function requireAuthor(quest: IQuest, userId: string) {
  if (quest.author.toString() !== userId) {
    throw new QuestError(403, "Only the quest author can manage join requests.");
  }
}

async function checkTimeConflict(quest: IQuest, userId: string) {
  const conflict = await Quest.exists({
    _id: { $ne: quest._id },
    day: quest.day,
    startTime: { $lt: quest.endTime },
    endTime: { $gt: quest.startTime },
    $or: [{ author: userId }, { members: userId }],
  });
  if (conflict) {
    throw new QuestError(409, "This quest conflicts with another quest in your schedule.");
  }
}

function requireOpenQuest(quest: IQuest) {
  if (quest.status !== "open" || quest.members.length >= quest.maxMember) {
    throw new QuestError(409, "This quest is closed or full.");
  }
}

export async function requestToJoinQuest(questId: string, userId: string) {
  const quest = await findQuest(questId);
  if (quest.author.toString() === userId) {
    throw new QuestError(409, "You cannot join your own quest.");
  }
  if (quest.members.some(id => id.toString() === userId)) {
    throw new QuestError(409, "You are already a member of this quest.");
  }
  if (quest.joinRequests.some(id => id.toString() === userId)) {
    throw new QuestError(409, "You already have a pending join request.");
  }
  requireOpenQuest(quest);
  await checkTimeConflict(quest, userId);

  const updated = await Quest.findOneAndUpdate(
    {
      _id: questId,
      status: "open",
      members: { $ne: userId },
      joinRequests: { $ne: userId },
      $expr: { $lt: [{ $size: "$members" }, "$maxMember"] },
    },
    { $addToSet: { joinRequests: userId } },
    { new: true }
  );
  if (!updated) throw new QuestError(409, "Quest changed. Please try again.");
  return updated;
}

export async function getQuestJoinRequests(questId: string, authorId: string) {
  const quest = await findQuest(questId);
  requireAuthor(quest, authorId);
  await quest.populate("joinRequests", "firstName lastName");
  return quest.joinRequests;
}

export async function reviewQuestJoinRequest(
  questId: string,
  authorId: string,
  userId: string,
  decision: "accept" | "deny"
) {
  if (!mongoose.isValidObjectId(userId)) {
    throw new QuestError(400, "Invalid user ID.");
  }
  const quest = await findQuest(questId);
  requireAuthor(quest, authorId);
  if (!quest.joinRequests.some(id => id.toString() === userId)) {
    throw new QuestError(404, "Join request not found.");
  }

  if (decision === "accept") {
    requireOpenQuest(quest);
    await checkTimeConflict(quest, userId);
  }

  // Remove the request and add the member together, checking capacity again.
  const updated = await Quest.findOneAndUpdate(
    {
      _id: questId,
      author: authorId,
      joinRequests: userId,
      ...(decision === "accept" ? {
        status: "open",
        members: { $ne: userId },
        $expr: { $lt: [{ $size: "$members" }, "$maxMember"] },
      } : {}),
    },
    {
      $pull: { joinRequests: userId },
      ...(decision === "accept" ? { $addToSet: { members: userId } } : {}),
    },
    { new: true }
  );
  if (!updated) throw new QuestError(409, "Quest or join request changed. Please try again.");
  return updated;
}

export async function leaveQuest(questId: string, userId: string) {
  const quest = await findQuest(questId);
  if (quest.author.toString() === userId) {
    throw new QuestError(403, "The author cannot leave their own quest.");
  }
  const updated = await Quest.findOneAndUpdate(
    { _id: questId, members: userId },
    { $pull: { members: userId } },
    { new: true }
  );
  if (!updated) throw new QuestError(409, "You are not a member of this quest.");
  return updated;
}

// Edit an existing quest
export async function updateQuest(
  questId: string,
  userId: string,
  input: UpdateQuestInput
) {
  const quest = await findQuest(questId);

  // Only the author can edit the quest
  if (quest.author.toString() !== userId) {
    throw new QuestError(403, "You cannot edit another user's quest.");
  }

  
  // Update only the fields provided
  Object.assign(quest, input);

  // Ensure the quest ends after it starts
  if (quest.endTime <= quest.startTime) {
    throw new QuestError(
      400,
      "End time must be after start time."
    );
  }

  // Save the updated quest
  await quest.save();


  return quest;
}

// Delete an existing quest
export async function deleteQuest(
  questId: string,
  userId: string
) {
  const quest = await findQuest(questId);

  // Only the author can delete the quest
  if (quest.author.toString() !== userId) {
    throw new QuestError(403, "You cannot delete another user's quest.");
  }

  // Remove the quest from MongoDB
  await quest.deleteOne();

  return;
}
