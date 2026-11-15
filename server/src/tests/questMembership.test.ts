import assert from "node:assert/strict";
import test from "node:test";
import mongoose from "mongoose";
import Quest from "../models/Quest.js";
import {
  requestToJoinQuest,
  getQuestJoinRequests,
  reviewQuestJoinRequest,
  leaveQuest,
  QuestError,
} from "../services/questService.js";
import { reviewQuestJoinRequestController } from "../controllers/questController.js";
import type { AuthenticatedRequest } from "../middleware/authMiddleware.js";
import type { Response } from "express";

const authorId = new mongoose.Types.ObjectId().toString();
const userId = new mongoose.Types.ObjectId().toString();
const questId = new mongoose.Types.ObjectId().toString();

function makeQuest(overrides = {}) {
  return new Quest({
    _id: questId,
    title: "Study group", subject: "COP4331", location: "Library",
    author: authorId, day: new Date("2026-11-16T00:00:00Z"),
    startTime: 600, endTime: 660, maxMember: 2,
    ...overrides,
  });
}

function hasStatus(status: number) {
  return (error: unknown) => error instanceof QuestError && error.statusCode === status;
}

test("joining creates a pending request without adding a member", async t => {
  const quest = makeQuest();
  t.mock.method(Quest, "findById", async () => quest);
  t.mock.method(Quest, "exists", async () => null);
  const update = t.mock.method(Quest, "findOneAndUpdate", async (...args: unknown[]) => {
    assert.deepEqual(args[1], { $addToSet: { joinRequests: userId } });
    return makeQuest({ joinRequests: [userId] });
  });
  const result = await requestToJoinQuest(questId, userId);
  assert.equal(result.members.length, 0);
  assert.equal(result.joinRequests[0]?.toString(), userId);
  assert.equal(update.mock.callCount(), 1);
});

test("conflicts check authored and joined quests on the same day with strict overlap", async t => {
  const quest = makeQuest();
  t.mock.method(Quest, "findById", async () => quest);
  t.mock.method(Quest, "exists", async (...args: unknown[]) => {
    assert.deepEqual(args[0], {
      _id: { $ne: quest._id }, day: quest.day,
      startTime: { $lt: 660 }, endTime: { $gt: 600 },
      $or: [{ author: { $in: [userId] } }, { members: { $in: [userId] } }],
    });
    return { _id: new mongoose.Types.ObjectId() };
  });
  const update = t.mock.method(Quest, "findOneAndUpdate", async () => null);
  await assert.rejects(requestToJoinQuest(questId, userId), hasStatus(409));
  assert.equal(update.mock.callCount(), 0);
});

test("authors, existing members, duplicate requests, closed and full quests cannot request to join", async t => {
  for (const overrides of [
    { author: userId }, { members: [userId] }, { joinRequests: [userId] },
    { status: "closed" }, { maxMember: 1, members: [authorId] },
  ]) {
    const find = t.mock.method(Quest, "findById", async () => makeQuest(overrides));
    await assert.rejects(requestToJoinQuest(questId, userId), hasStatus(409));
    find.mock.restore();
  }
});

test("only the author can view or review join requests", async t => {
  t.mock.method(Quest, "findById", async () => makeQuest({ joinRequests: [userId] }));
  await assert.rejects(getQuestJoinRequests(questId, userId), hasStatus(403));
  await assert.rejects(reviewQuestJoinRequest(questId, userId, userId, "accept"), hasStatus(403));
  await assert.rejects(reviewQuestJoinRequest(questId, userId, userId, "deny"), hasStatus(403));
});

test("author receives pending users' names", async t => {
  const quest = makeQuest({ joinRequests: [userId] });
  t.mock.method(Quest, "findById", async () => quest);
  const populate = t.mock.method(quest, "populate", async () => quest);
  const requests = await getQuestJoinRequests(questId, authorId);
  assert.equal(requests[0]?.toString(), userId);
  assert.deepEqual(populate.mock.calls[0]?.arguments, ["joinRequests", "firstName lastName"]);
});

test("approval adds membership and removes the request atomically with a capacity check", async t => {
  t.mock.method(Quest, "findById", async () => makeQuest({ joinRequests: [userId] }));
  t.mock.method(Quest, "exists", async () => null);
  t.mock.method(Quest, "findOneAndUpdate", async (...args: unknown[]) => {
    assert.deepEqual(args[0], {
      _id: questId, author: authorId, joinRequests: userId,
      status: "open", members: { $ne: userId },
      $expr: { $lt: [{ $size: "$members" }, "$maxMember"] },
    });
    assert.deepEqual(args[1], { $pull: { joinRequests: userId }, $addToSet: { members: userId } });
    return makeQuest({ members: [userId] });
  });
  const result = await reviewQuestJoinRequest(questId, authorId, userId, "accept");
  assert.equal(result.members[0]?.toString(), userId);
  assert.equal(result.joinRequests.length, 0);
});

test("approval rechecks time conflicts and leaves conflicting requests pending", async t => {
  t.mock.method(Quest, "findById", async () => makeQuest({ joinRequests: [userId] }));
  t.mock.method(Quest, "exists", async () => ({ _id: new mongoose.Types.ObjectId() }));
  const update = t.mock.method(Quest, "findOneAndUpdate", async () => null);
  await assert.rejects(reviewQuestJoinRequest(questId, authorId, userId, "accept"), hasStatus(409));
  assert.equal(update.mock.callCount(), 0);
});

test("closed or full quests cannot approve a pending request", async t => {
  for (const overrides of [{ status: "closed" }, { maxMember: 1, members: [authorId] }]) {
    const find = t.mock.method(Quest, "findById", async () => makeQuest({ joinRequests: [userId], ...overrides }));
    await assert.rejects(reviewQuestJoinRequest(questId, authorId, userId, "accept"), hasStatus(409));
    find.mock.restore();
  }
});

test("denial removes the pending request even when the quest is closed", async t => {
  t.mock.method(Quest, "findById", async () => makeQuest({ joinRequests: [userId], status: "closed" }));
  const conflict = t.mock.method(Quest, "exists", async () => null);
  t.mock.method(Quest, "findOneAndUpdate", async (...args: unknown[]) => {
    assert.deepEqual(args[1], { $pull: { joinRequests: userId } });
    return makeQuest();
  });
  const result = await reviewQuestJoinRequest(questId, authorId, userId, "deny");
  assert.equal(result.joinRequests.length, 0);
  assert.equal(result.members.length, 0);
  assert.equal(conflict.mock.callCount(), 0);
});

test("leaving removes the authenticated member", async t => {
  t.mock.method(Quest, "findById", async () => makeQuest({ members: [userId] }));
  t.mock.method(Quest, "findOneAndUpdate", async (...args: unknown[]) => {
    assert.deepEqual(args[0], { _id: questId, members: userId });
    assert.deepEqual(args[1], { $pull: { members: userId } });
    return makeQuest();
  });
  assert.equal((await leaveQuest(questId, userId)).members.length, 0);
  await assert.rejects(leaveQuest(questId, authorId), hasStatus(403));
});

test("nonmembers cannot leave and nonexistent requests cannot be reviewed", async t => {
  t.mock.method(Quest, "findById", async () => makeQuest());
  t.mock.method(Quest, "findOneAndUpdate", async () => null);
  await assert.rejects(leaveQuest(questId, userId), hasStatus(409));
  await assert.rejects(reviewQuestJoinRequest(questId, authorId, userId, "accept"), hasStatus(404));
});

test("invalid and missing quests or request users return client errors", async t => {
  await assert.rejects(requestToJoinQuest("bad-id", userId), hasStatus(400));
  await assert.rejects(reviewQuestJoinRequest(questId, authorId, "bad-id", "accept"), hasStatus(400));
  t.mock.method(Quest, "findById", async () => null);
  await assert.rejects(requestToJoinQuest(questId, userId), hasStatus(404));
  await assert.rejects(leaveQuest(questId, userId), hasStatus(404));
});

test("a concurrent quest change returns a conflict rather than reporting success", async t => {
  t.mock.method(Quest, "findById", async () => makeQuest({ joinRequests: [userId] }));
  t.mock.method(Quest, "exists", async () => null);
  t.mock.method(Quest, "findOneAndUpdate", async () => null);
  await assert.rejects(reviewQuestJoinRequest(questId, authorId, userId, "accept"), hasStatus(409));
});

test("review endpoint rejects unsupported decisions before changing membership", async () => {
  let statusCode = 0;
  const res = {
    status(code: number) { statusCode = code; return this; },
    json(body: unknown) { assert.deepEqual(body, { message: "Decision must be accept or deny." }); },
  } as Response;
  const req = { userId: authorId, params: { id: questId, userId }, body: { decision: "join" } } as unknown as AuthenticatedRequest;
  await reviewQuestJoinRequestController(req, res);
  assert.equal(statusCode, 400);
});
