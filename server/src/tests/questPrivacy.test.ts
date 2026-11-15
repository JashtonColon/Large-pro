import assert from "node:assert/strict";
import test from "node:test";
import mongoose from "mongoose";
import type { Response } from "express";
import Quest from "../models/Quest.js";
import User from "../models/User.js";
import {
  searchQuestsController, getPartialMatchesController, joinQuestController,
  leaveQuestController, createQuestController, updateQuestController,
  reviewQuestJoinRequestController, getQuestJoinRequestsController,
} from "../controllers/questController.js";
import type { AuthenticatedRequest } from "../middleware/authMiddleware.js";

const authorId = new mongoose.Types.ObjectId().toString();
const memberId = new mongoose.Types.ObjectId().toString();
const applicantId = new mongoose.Types.ObjectId().toString();

function makeQuest(overrides = {}) {
  return new Quest({
    title: "Study group", subject: "COP4331", location: "Library",
    author: authorId, day: new Date("2026-11-16T00:00:00Z"),
    startTime: 600, endTime: 660, maxMember: 3, joinRequests: [applicantId],
    ...overrides,
  });
}

function captureResponse() {
  const result = { status: 0, body: {} as Record<string, unknown> };
  const res = {
    status(code: number) { result.status = code; return this; },
    json(body: unknown) { result.body = JSON.parse(JSON.stringify(body)); },
  } as Response;
  return { res, result };
}

test("search shows pending requests only for the viewer's own quests", async t => {
  const own = makeQuest();
  const other = makeQuest({ author: new mongoose.Types.ObjectId(), members: [authorId] });
  t.mock.method(Quest, "find", () => ({ sort: () => ({ limit: async () => [own, other] }) }));
  const { res, result } = captureResponse();

  await searchQuestsController({ userId: authorId, query: {} } as AuthenticatedRequest, res);
  const quests = result.body.quests as Record<string, unknown>[];
  assert.equal(result.status, 200);
  assert.deepEqual(quests[0].joinRequests, [applicantId]);
  assert.equal("joinRequests" in quests[1], false);
  assert.deepEqual(other.joinRequests.map(String), [applicantId]);
});

test("partial matching does not reveal other users' pending requests", async t => {
  const quest = makeQuest();
  t.mock.method(User, "findById", async () => ({ profile: {
    courses: ["COP4331"], availability: [{ dayOfWeek: 1, startMinute: 600, endMinute: 720 }],
  } }));
  t.mock.method(Quest, "find", () => ({ sort: () => ({ cursor: async function* () { yield quest; } }) }));
  const { res, result } = captureResponse();

  await getPartialMatchesController({ userId: memberId, query: {} } as AuthenticatedRequest, res);
  const matches = result.body.matches as Record<string, unknown>[];
  assert.equal(result.status, 200);
  assert.equal(matches.length, 1);
  assert.equal("joinRequests" in matches[0], false);
  assert.deepEqual(quest.joinRequests.map(String), [applicantId]);
});

for (const action of ["join", "leave"] as const) {
  test(`${action} responses omit pending requests for non-authors`, async t => {
    const quest = makeQuest({ members: action === "leave" ? [memberId] : [] });
    const updated = makeQuest({ joinRequests: [applicantId, memberId] });
    t.mock.method(Quest, "findById", async () => quest);
    t.mock.method(Quest, "exists", async () => null);
    t.mock.method(Quest, "findOneAndUpdate", async () => updated);
    const { res, result } = captureResponse();
    const req = { userId: memberId, params: { id: quest.id } } as unknown as AuthenticatedRequest;

    await (action === "join" ? joinQuestController : leaveQuestController)(req, res);
    assert.equal(result.status, action === "join" ? 201 : 200);
    assert.equal("joinRequests" in (result.body.quest as Record<string, unknown>), false);
    assert.deepEqual(updated.joinRequests.map(String), [applicantId, memberId]);
  });
}

for (const [action, controller, body] of [
  ["create", createQuestController, {
    title: "Study group", subject: "COP4331", location: "Library",
    day: "11/16/2026", startTime: "10:00 AM", endTime: "11:00 AM", maxMember: 3,
  }],
  ["edit", updateQuestController, { title: "Changed" }],
  ["review", reviewQuestJoinRequestController, { decision: "deny" }],
] as const) {
  test(`${action} responses retain pending requests for the author`, async t => {
    const quest = makeQuest({ joinRequests: action === "create" ? [] : [applicantId, memberId] });
    const updated = makeQuest({ ...quest.toObject(), joinRequests: action === "review" ? [applicantId] : quest.joinRequests });
    t.mock.method(Quest, "create", async () => updated);
    t.mock.method(Quest, "findById", async () => quest);
    t.mock.method(Quest, "exists", async () => null);
    t.mock.method(Quest, "findOneAndUpdate", async () => updated);
    const { res, result } = captureResponse();
    const req = {
      userId: authorId, params: { id: quest.id, userId: memberId }, body,
    } as unknown as AuthenticatedRequest;

    await controller(req, res);
    assert.equal(result.status, action === "create" ? 201 : 200);
    assert.deepEqual((result.body.quest as Record<string, unknown>).joinRequests, updated.joinRequests.map(String));
  });
}

for (const viewerId of [authorId, memberId]) {
  test(`the join-request endpoint ${viewerId === authorId ? "allows the author" : "rejects another user"}`, async t => {
    const quest = makeQuest();
    t.mock.method(Quest, "findById", async () => quest);
    t.mock.method(quest, "populate", async () => quest);
    const { res, result } = captureResponse();
    const req = { userId: viewerId, params: { id: quest.id } } as unknown as AuthenticatedRequest;

    await getQuestJoinRequestsController(req, res);
    assert.equal(result.status, viewerId === authorId ? 200 : 403);
    if (viewerId === authorId) assert.deepEqual(result.body.requests, [applicantId]);
    else assert.equal("requests" in result.body, false);
  });
}
