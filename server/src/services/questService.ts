import mongoose from "mongoose";
import Quest, { type IQuest } from "../models/Quest.js";
import User from "../models/User.js";
import { normalizeCourse } from "../utils/courseUtils.js";
import { getQuestStatus } from "../utils/questStatus.js";

export async function refreshQuestStatuses() {
  const now = new Date();
  const quests = await Quest.find().select("day startTime endTime members maxMember status");
  const updates = quests.flatMap(quest => {
    const status = getQuestStatus(quest, quest.members.length, now);
    return status === quest.status ? [] : [{
      updateOne: {
        filter: { _id: quest._id, ...questState(quest) },
        update: { $set: { status } },
      },
    }];
  });
  if (updates.length) await Quest.bulkWrite(updates, { timestamps: false });
}

function questState(quest: IQuest) {
  const { day, startTime, endTime, members, maxMember } = quest;
  return { day, startTime, endTime, members, maxMember };
}


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

  await checkTimeConflict(input, [authorId]);

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
    status: getQuestStatus(input, 0),
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
  quest.status = getQuestStatus(quest, quest.members.length);
  return quest;
}

export interface QuestFilterInput {
  course?: unknown;
  startTime?: unknown;
  endTime?: unknown;
}

function parseQuestFilters(input: QuestFilterInput) {
  const filters: { course?: string; startTime?: number; endTime?: number } = {};
  for (const field of ["course", "startTime", "endTime"] as const) {
    const value = input[field];
    if (value === undefined) continue;
    if (typeof value === "string" && !value.trim()) continue;

    if (field === "course") {
      if (typeof value !== "string") throw new QuestError(400, "course must be a string.");
      filters.course = normalizeCourse(value);
    } else {
      // GET query values arrive as strings; services can also receive numbers.
      const minutes = typeof value === "number" || typeof value === "string" ? Number(value) : NaN;
      if (!Number.isInteger(minutes) || minutes < 0 || minutes > 1440) {
        throw new QuestError(400, `${field} must be a whole number of minutes from 0 to 1440.`);
      }
      filters[field] = minutes;
    }
  }
  if (filters.startTime !== undefined && filters.endTime !== undefined &&
      filters.endTime <= filters.startTime) {
    throw new QuestError(400, "End time must be after start time.");
  }
  return filters;
}

function escapeRegex(text: string): string {
  return text.replace(/[.*+?^${}()|[\]\\]/g, "\\$&");
}

function buildQuestQuery(input: QuestFilterInput): mongoose.QueryFilter<IQuest> {
  const { course, startTime, endTime } = parseQuestFilters(input);
  const query: mongoose.QueryFilter<IQuest> = {
    status: { $ne: "closed" },
  };

  if (course) {
    // Match normalized course codes even when stored subjects contain spaces.
    const pattern = [...course].map(escapeRegex).join("\\s*");
    query.subject = new RegExp(`^\\s*${pattern}\\s*$`, "i");
  }
  if (startTime !== undefined) query.startTime = { $gte: startTime };
  if (endTime !== undefined) query.endTime = { $lte: endTime };

  return query;
}

export async function searchQuests(
  subject: unknown = "",
  title: unknown = "",
  filterInput: QuestFilterInput = {}
) {
  const query = buildQuestQuery(filterInput);
  const filters: Record<string, RegExp> = {};
  for (const [field, value] of [["subject", subject], ["title", title]] as const) {
    if (typeof value !== "string") {
      throw new QuestError(400, `${field} must be a string.`);
    }
    const text = value.trim();
    if (!text) continue;

    // Treat search text literally, including characters like +, ( and .
    const escaped = escapeRegex(text);
    filters[field] = new RegExp(field === "subject" ? `^${escaped}$` : escaped, "i");
  }

  // Keep subject search and course filtering as independent conditions.
  await refreshQuestStatuses();
  return Quest.find({ $and: [query, filters] }).sort({ day: 1, startTime: 1, _id: 1 }).limit(30);
}

export async function getPartialMatches(userId: string, filterInput: QuestFilterInput = {}) {
  const query = buildQuestQuery(filterInput);
  const user = await User.findById(userId);
  if (!user) throw new QuestError(404, "User not found.");

  const { courses = [], availability = [] } = user.profile ?? {};
  if (!courses.length || !availability.length) return [];

  await refreshQuestStatuses();
  const courseCodes = new Set(courses.map(normalizeCourse));
  const matches: IQuest[] = [];
  const quests = Quest.find({
    ...query,
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

async function checkTimeConflict(
  quest: Pick<IQuest, "day" | "startTime" | "endTime"> & { _id?: IQuest["_id"] },
  userIds: string[]
) {
  const conflict = await Quest.exists({
    ...(quest._id ? { _id: { $ne: quest._id } } : {}),
    day: quest.day,
    startTime: { $lt: quest.endTime },
    endTime: { $gt: quest.startTime },
    $or: [{ author: { $in: userIds } }, { members: { $in: userIds } }],
  });
  if (conflict) {
    throw new QuestError(409, "This quest conflicts with another quest in an attendee's schedule.");
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
  await checkTimeConflict(quest, [userId]);

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
    await checkTimeConflict(quest, [userId]);
  }

  // Remove the request and add the member together, checking capacity again.
  const updated = await Quest.findOneAndUpdate(
    {
      _id: questId,
      author: authorId,
      joinRequests: userId,
      ...questState(quest),
      ...(decision === "accept" ? {
        status: "open",
        members: { $eq: quest.members, $ne: userId },
        $expr: { $lt: [{ $size: "$members" }, "$maxMember"] },
      } : {}),
    },
    {
      $pull: { joinRequests: userId },
      $set: { status: getQuestStatus(quest, quest.members.length + (decision === "accept" ? 1 : 0)) },
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
  if (!quest.members.some(id => id.toString() === userId)) {
    throw new QuestError(409, "You are not a member of this quest.");
  }
  const updated = await Quest.findOneAndUpdate(
    { _id: questId, ...questState(quest) },
    {
      $pull: { members: userId },
      $set: { status: getQuestStatus(quest, quest.members.length - 1) },
    },
    { new: true }
  );
  if (!updated) throw new QuestError(409, "Quest changed. Please try again.");
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

  const schedule = {
    _id: quest._id,
    day: input.day ?? quest.day,
    startTime: input.startTime ?? quest.startTime,
    endTime: input.endTime ?? quest.endTime,
  };
  if (schedule.endTime <= schedule.startTime) {
    throw new QuestError(400, "End time must be after start time.");
  }

  if ((input.maxMember ?? quest.maxMember) < quest.members.length) {
    throw new QuestError(409, "maxMember cannot be lower than the number of existing members.");
  }

  if (input.day !== undefined || input.startTime !== undefined || input.endTime !== undefined) {
    await checkTimeConflict(schedule, [userId, ...quest.members.map(id => id.toString())]);
  }

  // Save only if the schedule, membership, and capacity we validated are still current.
  const updated = await Quest.findOneAndUpdate(
    {
      _id: questId,
      author: userId,
      ...questState(quest),
    },
    { $set: {
      ...input,
      status: getQuestStatus({ ...schedule, maxMember: input.maxMember ?? quest.maxMember }, quest.members.length),
    } },
    { new: true, runValidators: true }
  );
  if (!updated) throw new QuestError(409, "Quest changed. Please try again.");
  return updated;
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
