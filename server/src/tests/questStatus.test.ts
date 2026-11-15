import assert from "node:assert/strict";
import test from "node:test";
import mongoose from "mongoose";
import Quest from "../models/Quest.js";
import { getQuestStatus } from "../utils/questStatus.js";
import { refreshQuestStatuses } from "../services/questService.js";

const meeting = { day: new Date("2099-11-16T00:00:00Z"), endTime: 660, maxMember: 2 };
const beforeEnd = new Date(2099, 10, 16, 10, 59, 59);
const atEnd = new Date(2099, 10, 16, 11, 0);

for (const [name, count, now, expected] of [
  ["open before its end with space available", 1, beforeEnd, "open"],
  ["full when membership reaches capacity", 2, beforeEnd, "full"],
  ["full for legacy membership exceeding capacity", 3, beforeEnd, "full"],
  ["closed exactly at its end time", 0, atEnd, "closed"],
  ["closed rather than full once ended", 2, atEnd, "closed"],
  ["closed on the following day", 0, new Date(2099, 10, 17), "closed"],
  ["open the evening before its calendar date", 0, new Date(2099, 10, 15, 23, 59), "open"],
] as const) {
  test(`quest status is ${name}`, () => {
    assert.equal(getQuestStatus(meeting, count, now), expected);
  });
}

test("the quest schema accepts full", async () => {
  const quest = new Quest({
    ...meeting, title: "Review", subject: "COP4331", location: "Library",
    author: new mongoose.Types.ObjectId(), startTime: 600, status: "full",
  });
  await quest.validate();
});

test("status refresh writes only changed records and preserves their edit timestamps", async t => {
  const makeQuest = (day: Date, members: mongoose.Types.ObjectId[], status: string) => new Quest({
    ...meeting, day, members, status, startTime: 600,
    title: "Review", subject: "COP4331", location: "Library", author: new mongoose.Types.ObjectId(),
  });
  const member = new mongoose.Types.ObjectId();
  const ended = makeQuest(new Date("2000-01-03T00:00:00Z"), [], "open");
  const full = makeQuest(meeting.day, [member, new mongoose.Types.ObjectId()], "open");
  const reopened = makeQuest(meeting.day, [], "full");
  const unchanged = makeQuest(meeting.day, [], "open");
  t.mock.method(Quest, "find", () => ({ select: async () => [ended, full, reopened, unchanged] }));
  const write = t.mock.method(Quest, "bulkWrite", async () => ({}));

  await refreshQuestStatuses();
  const [updates, options] = write.mock.calls[0].arguments as unknown as [
    { updateOne: { filter: { _id: unknown; members: unknown[] }; update: { $set: { status: string } } } }[], unknown,
  ];
  assert.deepEqual(updates.map(update => update.updateOne.update.$set.status), ["closed", "full", "open"]);
  assert.deepEqual(updates.map(update => update.updateOne.filter._id), [ended._id, full._id, reopened._id]);
  assert.deepEqual(updates[1].updateOne.filter.members, full.members);
  assert.deepEqual(options, { timestamps: false });
});

test("status refresh does not write when all statuses are current", async t => {
  t.mock.method(Quest, "find", () => ({ select: async () => [] }));
  const write = t.mock.method(Quest, "bulkWrite", async () => ({}));
  await refreshQuestStatuses();
  assert.equal(write.mock.callCount(), 0);
});
