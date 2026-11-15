import mongoose from "mongoose";
import Quest, { type IQuest } from "../models/Quest.js";
import User from "../models/User.js";
import { normalizeCourse } from "../utils/courseUtils.js";


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

export async function searchQuests(subject: unknown = "", title: unknown = "") {
  const filters: Record<string, RegExp> = {};
  for (const [field, value] of [["subject", subject], ["title", title]] as const) {
    if (typeof value !== "string") {
      throw new QuestError(400, `${field} must be a string.`);
    }
    const text = value.trim();
    if (!text) continue;

    // Treat search text literally, including characters like +, ( and .
    const escaped = text.replace(/[.*+?^${}()|[\]\\]/g, "\\$&");
    filters[field] = new RegExp(field === "subject" ? `^${escaped}$` : escaped, "i");
  }

  return Quest.find(filters).sort({ day: 1, startTime: 1, _id: 1 }).limit(30);
}

export async function getPartialMatches(userId: string) {
  const user = await User.findById(userId);
  if (!user) throw new QuestError(404, "User not found.");

  const { courses = [], availability = [] } = user.profile ?? {};
  if (!courses.length || !availability.length) return [];

  const courseCodes = new Set(courses.map(normalizeCourse));
  const matches: IQuest[] = [];
  const quests = Quest.find({
    status: "open",
    author: { $ne: userId },
    members: { $ne: userId },
    joinRequests: { $ne: userId },
    $expr: { $lt: [{ $size: "$members" }, "$maxMember"] },
  }).sort({ day: 1, startTime: 1, _id: 1 }).cursor();

  // Read one quest at a time and stop after 30 matches.
  for await (const quest of quests) {
    if (!courseCodes.has(normalizeCourse(quest.subject))) continue;

    // Quest dates are stored at UTC midnight as calendar dates.
    const fitsAvailability = availability.some(slot =>
      slot.dayOfWeek === quest.day.getUTCDay() &&
      quest.startTime >= slot.startMinute &&
      quest.endTime <= slot.endMinute
    );
    if (fitsAvailability) matches.push(quest);
    if (matches.length === 30) break;
  }
  return matches;
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
