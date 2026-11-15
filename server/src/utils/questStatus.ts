import type { IQuest } from "../models/Quest.js";

export function getQuestStatus(
  quest: Pick<IQuest, "day" | "endTime" | "maxMember">,
  memberCount: number,
  now = new Date()
): IQuest["status"] {
  // day stores a calendar date at UTC midnight; meeting times use server local time.
  const end = new Date(quest.day.getUTCFullYear(), quest.day.getUTCMonth(), quest.day.getUTCDate(), 0, quest.endTime);
  if (end <= now) return "closed";
  return memberCount >= quest.maxMember ? "full" : "open";
}

