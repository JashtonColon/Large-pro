import type { IQuest } from "../../models/Quest.js";

interface DiscoveryQuery {
  $and?: DiscoveryQuery[];
  status?: string;
  subject?: RegExp;
  title?: RegExp;
  startTime?: { $gte: number };
  endTime?: { $lte: number };
}

// Apply the discovery conditions in database mocks before their result limit.
export function matchesDiscoveryQuery(
  quest: Pick<IQuest, "status" | "subject" | "title" | "startTime" | "endTime">,
  query: DiscoveryQuery
): boolean {
  return (!query.$and || query.$and.every(condition => matchesDiscoveryQuery(quest, condition))) &&
    (query.status === undefined || quest.status === query.status) &&
    (!query.subject || query.subject.test(quest.subject)) &&
    (!query.title || query.title.test(quest.title)) &&
    (!query.startTime || quest.startTime >= query.startTime.$gte) &&
    (!query.endTime || quest.endTime <= query.endTime.$lte);
}
