import assert from "node:assert/strict";
import test, { type TestContext } from "node:test";
import mongoose from "mongoose";
import type { Response } from "express";
import Quest from "../models/Quest.js";
import { updateQuest, QuestError, type UpdateQuestInput } from "../services/questService.js";
import { updateQuestController } from "../controllers/questController.js";
import type { AuthenticatedRequest } from "../middleware/authMiddleware.js";

const authorId = new mongoose.Types.ObjectId().toString();
const memberId = new mongoose.Types.ObjectId().toString();
const applicantId = new mongoose.Types.ObjectId().toString();

function makeQuest() {
  return new Quest({
    title: "Study group", subject: "COP4331", location: "Library",
    author: authorId, day: new Date("2026-11-16T00:00:00Z"),
    startTime: 600, endTime: 660, maxMember: 3,
    members: [memberId], joinRequests: [applicantId],
  });
}

function mockEdit(t: TestContext, quest: ReturnType<typeof makeQuest>, options = { conflict: false, stale: false }) {
  t.mock.method(Quest, "findById", async () => quest);
  const check = t.mock.method(Quest, "exists", async () => options.conflict
    ? { _id: new mongoose.Types.ObjectId() } : null);
  const update = t.mock.method(Quest, "findOneAndUpdate", async (...args: unknown[]) => options.stale
    ? null : new Quest({ ...quest.toObject(), ...(args[1] as { $set: UpdateQuestInput }).$set }));
  return { check, update };
}

function hasStatus(status: number) {
  return (error: unknown) => error instanceof QuestError && error.statusCode === status;
}

test("capacity cannot be reduced below existing membership", async t => {
  const quest = makeQuest();
  quest.members.push(new mongoose.Types.ObjectId());
  const { update } = mockEdit(t, quest);

  await assert.rejects(updateQuest(quest.id, authorId, { maxMember: 1 }), hasStatus(409));
  assert.equal(update.mock.callCount(), 0);
  assert.equal(quest.maxMember, 3);
});

test("capacity may equal membership without checking unchanged schedules", async t => {
  const quest = makeQuest();
  const { check } = mockEdit(t, quest);

  const result = await updateQuest(quest.id, authorId, { maxMember: 1 });
  assert.equal(result.maxMember, 1);
  assert.equal(result.members.length, 1);
  assert.equal(check.mock.callCount(), 0);
});

test("rescheduling checks authored and joined quests for the author and accepted members", async t => {
  const quest = makeQuest();
  const { check, update } = mockEdit(t, quest, { conflict: true, stale: false });

  await assert.rejects(updateQuest(quest.id, authorId, { startTime: 630, endTime: 690 }), hasStatus(409));
  assert.deepEqual(check.mock.calls[0]?.arguments[0], {
    _id: { $ne: quest._id }, day: quest.day,
    startTime: { $lt: 690 }, endTime: { $gt: 630 },
    $or: [{ author: { $in: [authorId, memberId] } }, { members: { $in: [authorId, memberId] } }],
  });
  assert.equal(update.mock.callCount(), 0);
  assert.equal(quest.startTime, 600);
  assert.equal(quest.endTime, 660);
});

test("a date-only edit uses the new day and existing time boundaries", async t => {
  const quest = makeQuest();
  const { check } = mockEdit(t, quest);
  const day = new Date("2026-11-17T00:00:00Z");

  const result = await updateQuest(quest.id, authorId, { day });
  assert.equal(result.day.getTime(), day.getTime());
  assert.deepEqual(check.mock.calls[0]?.arguments[0], {
    _id: { $ne: quest._id }, day,
    startTime: { $lt: 660 }, endTime: { $gt: 600 },
    $or: [{ author: { $in: [authorId, memberId] } }, { members: { $in: [authorId, memberId] } }],
  });
});

test("valid rescheduling preserves members and pending requests", async t => {
  const quest = makeQuest();
  mockEdit(t, quest);

  const result = await updateQuest(quest.id, authorId, { startTime: 660, endTime: 720 });
  assert.equal(result.startTime, 660);
  assert.equal(result.endTime, 720);
  assert.deepEqual(result.members.map(String), [memberId]);
  assert.deepEqual(result.joinRequests.map(String), [applicantId]);
});

test("an edit is rejected if membership or schedule changes after validation", async t => {
  const quest = makeQuest();
  const { update } = mockEdit(t, quest, { conflict: false, stale: true });

  await assert.rejects(updateQuest(quest.id, authorId, { maxMember: 1 }), hasStatus(409));
  assert.deepEqual(update.mock.calls[0]?.arguments[0], {
    _id: quest.id, author: authorId, day: quest.day,
    startTime: 600, endTime: 660, members: quest.members, maxMember: 3,
  });
});

test("a partial time edit cannot reverse the interval", async t => {
  const quest = makeQuest();
  const { update } = mockEdit(t, quest);
  await assert.rejects(updateQuest(quest.id, authorId, { startTime: 660 }), hasStatus(400));
  assert.equal(update.mock.callCount(), 0);
});

test("only the author may edit a quest", async t => {
  const quest = makeQuest();
  const { check, update } = mockEdit(t, quest);
  await assert.rejects(updateQuest(quest.id, memberId, { title: "Changed" }), hasStatus(403));
  assert.equal(check.mock.callCount(), 0);
  assert.equal(update.mock.callCount(), 0);
});

for (const [name, body] of [
  ["capacity", { maxMember: 1 }],
  ["schedule", { startTime: "10:30 AM", endTime: "11:30 AM" }],
] as const) {
  test(`the edit endpoint returns HTTP 409 for a ${name} conflict`, async t => {
    const quest = makeQuest();
    quest.members.push(new mongoose.Types.ObjectId());
    const { update } = mockEdit(t, quest, { conflict: true, stale: false });
    let statusCode = 0;
    const res = {
      status(code: number) { statusCode = code; return this; },
      json() {},
    } as Response;
    const req = { userId: authorId, params: { id: quest.id }, body } as unknown as AuthenticatedRequest;

    await updateQuestController(req, res);
    assert.equal(statusCode, 409);
    assert.equal(update.mock.callCount(), 0);
  });
}
