import assert from "node:assert/strict";
import test from "node:test";
import mongoose from "mongoose";
import type { Response } from "express";
import Quest from "../models/Quest.js";
import { createQuest, QuestError, type CreateQuestInput } from "../services/questService.js";
import { createQuestController } from "../controllers/questController.js";
import type { AuthenticatedRequest } from "../middleware/authMiddleware.js";

const authorId = new mongoose.Types.ObjectId().toString();
const input: CreateQuestInput = {
  title: "Study group", subject: "COP4331", location: "Library",
  day: new Date("2026-11-16T00:00:00Z"),
  startTime: 600, endTime: 660, maxMember: 2,
};

test("creation rejects overlaps with authored or joined quests without saving", async t => {
  t.mock.method(Quest, "exists", async (...args: unknown[]) => {
    assert.deepEqual(args[0], {
      day: input.day,
      startTime: { $lt: input.endTime },
      endTime: { $gt: input.startTime },
      $or: [{ author: authorId }, { members: authorId }],
    });
    return { _id: new mongoose.Types.ObjectId() };
  });
  const create = t.mock.method(Quest, "create", async () => null);

  await assert.rejects(createQuest(input, authorId),
    (error: unknown) => error instanceof QuestError && error.statusCode === 409);
  assert.equal(create.mock.callCount(), 0);
});

test("creation saves an open quest when the author has no schedule conflict", async t => {
  t.mock.method(Quest, "exists", async () => null);
  const saved = new Quest({ ...input, author: authorId });
  const create = t.mock.method(Quest, "create", async () => saved);

  assert.equal(await createQuest(input, authorId), saved);
  assert.deepEqual(create.mock.calls[0]?.arguments[0], {
    ...input, description: undefined, author: authorId, members: [], status: "open",
  });
});

test("the creation endpoint returns HTTP 409 for a schedule conflict", async t => {
  t.mock.method(Quest, "exists", async () => ({ _id: new mongoose.Types.ObjectId() }));
  const create = t.mock.method(Quest, "create", async () => null);
  let statusCode = 0;
  let responseBody: unknown;
  const res = {
    status(code: number) { statusCode = code; return this; },
    json(body: unknown) { responseBody = body; },
  } as Response;
  const req = {
    userId: authorId,
    body: { ...input, day: "11/16/2026", startTime: "10:00 AM", endTime: "11:00 AM" },
  } as AuthenticatedRequest;

  await createQuestController(req, res);
  assert.equal(statusCode, 409);
  assert.deepEqual(responseBody, { message: "This quest conflicts with another quest in your schedule." });
  assert.equal(create.mock.callCount(), 0);
});
