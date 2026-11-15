import assert from "node:assert/strict";
import test from "node:test";
import type { Response } from "express";
import Quest from "../models/Quest.js";
import { searchQuests, QuestError } from "../services/questService.js";
import { searchQuestsController } from "../controllers/questController.js";
import type { AuthenticatedRequest } from "../middleware/authMiddleware.js";

const quests = [
  { subject: "COP4331", title: "Final exam review" },
  { subject: "COP4331", title: "Project planning" },
  { subject: "COP3503", title: "Exam review" },
  { subject: "COP43310", title: "Exam review" },
  { subject: "C++", title: "Review (part 1)." },
];

test("search supports both fields, either field, and empty filters", async t => {
  t.mock.method(Quest, "find", (filters: Record<string, RegExp>) => ({
    sort: () => ({
      limit: async (maximum: number) => {
        assert.equal(maximum, 30);
        return quests.filter(quest => Object.entries(filters).every(
          ([field, pattern]) => pattern.test(quest[field as keyof typeof quest])
        )).slice(0, maximum);
      },
    }),
  }));

  assert.deepEqual(await searchQuests(" cop4331 ", " EXAM "), [quests[0]]);
  assert.deepEqual(await searchQuests("COP4331", ""), [quests[0], quests[1]]);
  assert.deepEqual(await searchQuests("", "exam"), [quests[0], quests[2], quests[3]]);
  assert.deepEqual(await searchQuests(), quests);
  assert.deepEqual(await searchQuests("  ", " \t "), quests);
  assert.deepEqual(await searchQuests("MAC2311", ""), []);
  assert.deepEqual(await searchQuests("C++", "(part 1)."), [quests[4]]);
  assert.deepEqual(await searchQuests("", ".*"), []);
});

test("database query sorts and caps results at 30", async t => {
  t.mock.method(Quest, "find", () => ({
    sort: (order: unknown) => {
      assert.deepEqual(order, { day: 1, startTime: 1, _id: 1 });
      return { limit: async (maximum: number) => Array.from({ length: 40 }, () => quests[0]).slice(0, maximum) };
    },
  }));
  assert.equal((await searchQuests()).length, 30);
});

test("search rejects arrays and objects instead of treating them as query operators", async () => {
  for (const value of [null, 42, ["COP4331"], { $ne: "" }]) {
    for (const args of [[value, ""], ["", value]]) {
      await assert.rejects(searchQuests(args[0], args[1]),
        (error: unknown) => error instanceof QuestError && error.statusCode === 400);
    }
  }
});

test("controller returns quests, validates search input, and requires authentication", async t => {
  const find = t.mock.method(Quest, "find", () => ({ sort: () => ({ limit: async () => quests }) }));
  let statusCode = 0;
  let body: unknown;
  const res = {
    status(code: number) { statusCode = code; return this; },
    json(value: unknown) { body = value; },
  } as Response;
  const req = { userId: "user", query: { subject: "COP4331", title: "exam" } } as unknown as AuthenticatedRequest;

  await searchQuestsController(req, res);
  assert.equal(statusCode, 200);
  assert.deepEqual(body, { quests });
  const filters = find.mock.calls[0]?.arguments[0] as unknown as Record<string, RegExp>;
  assert.equal(filters.subject?.test("cop4331"), true);
  assert.equal(filters.title?.test("Exam review"), true);

  await searchQuestsController({ ...req, query: { title: ["exam", "review"] } } as unknown as AuthenticatedRequest, res);
  assert.equal(statusCode, 400);
  await searchQuestsController({ query: {} } as AuthenticatedRequest, res);
  assert.equal(statusCode, 401);
  assert.equal(find.mock.callCount(), 1);
});
