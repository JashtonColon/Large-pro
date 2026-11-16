import assert from "node:assert/strict";
import test, { type TestContext } from "node:test";
import type { Response } from "express";
import Quest from "../models/Quest.js";
import User from "../models/User.js";
import { getPartialMatches, QuestError } from "../services/questService.js";
import { getPartialMatchesController } from "../controllers/questController.js";
import type { AuthenticatedRequest } from "../middleware/authMiddleware.js";

const userId = "507f1f77bcf86cd799439011";
const profile = {
  courses: ["COP4331"],
  availability: [{ dayOfWeek: 1, startMinute: 600, endMinute: 720 }],
};

function makeQuest(overrides = {}) {
  return new Quest({
    title: "Study group", subject: "COP4331", location: "Library",
    author: "507f1f77bcf86cd799439012",
    day: new Date("2099-11-16T00:00:00Z"),
    startTime: 600, endTime: 720, maxMember: 2,
    ...overrides,
  });
}

function mockQuests(t: TestContext, quests: ReturnType<typeof makeQuest>[]) {
  return t.mock.method(Quest, "find", () => ({
    select: async () => [],
    sort: () => ({ cursor: async function* () { yield* quests; } }),
  }));
}

test("matches course codes regardless of case or whitespace and includes exact availability boundaries", async t => {
  t.mock.method(User, "findById", async () => ({ profile }));
  const match = makeQuest({ subject: " cop 4331 " });
  mockQuests(t, [match, makeQuest({ subject: "COP3503" })]);
  assert.deepEqual(await getPartialMatches(userId), [match]);
});

test("requires the correct weekday and the entire quest to fit a single slot", async t => {
  t.mock.method(User, "findById", async () => ({ profile }));
  mockQuests(t, [
    makeQuest({ day: new Date("2099-11-17T00:00:00Z") }),
    makeQuest({ startTime: 599 }),
    makeQuest({ endTime: 721 }),
    makeQuest({ startTime: 720, endTime: 780 }),
  ]);
  assert.deepEqual(await getPartialMatches(userId), []);
});

test("checks all availability slots and supports Sunday", async t => {
  t.mock.method(User, "findById", async () => ({ profile: {
    ...profile,
    availability: [...profile.availability, { dayOfWeek: 0, startMinute: 900, endMinute: 1020 }],
  } }));
  const sunday = makeQuest({ day: new Date("2099-11-22T00:00:00Z"), startTime: 930, endTime: 1000 });
  mockQuests(t, [sunday]);
  assert.deepEqual(await getPartialMatches(userId), [sunday]);
});

test("returns at most 30 actual matches, even with nonmatching candidates first", async t => {
  t.mock.method(User, "findById", async () => ({ profile }));
  const matches = Array.from({ length: 35 }, () => makeQuest());
  mockQuests(t, [...Array.from({ length: 40 }, () => makeQuest({ subject: "MAC2311" })), ...matches]);
  assert.deepEqual(await getPartialMatches(userId), matches.slice(0, 30));
});

test("only considers open quests with room that the user has not authored, joined, or requested", async t => {
  t.mock.method(User, "findById", async () => ({ profile }));
  const find = mockQuests(t, []);
  await getPartialMatches(userId);
  assert.deepEqual(find.mock.calls.at(-1)?.arguments[0], {
    status: "open", author: { $ne: userId }, members: { $ne: userId },
    joinRequests: { $ne: userId },
    $expr: { $lt: [{ $size: "$members" }, "$maxMember"] },
  });
});

test("missing courses, availability, or profile returns an empty list without querying quests", async t => {
  const find = mockQuests(t, []);
  for (const value of [undefined, {}, { ...profile, courses: [] }, { ...profile, availability: [] }]) {
    const user = t.mock.method(User, "findById", async () => ({ profile: value }));
    assert.deepEqual(await getPartialMatches(userId), []);
    user.mock.restore();
  }
  assert.equal(find.mock.callCount(), 0);
});

test("missing user returns a 404", async t => {
  t.mock.method(User, "findById", async () => null);
  await assert.rejects(getPartialMatches(userId),
    (error: unknown) => error instanceof QuestError && error.statusCode === 404);
});

test("endpoint returns matches for the authenticated user and rejects unauthenticated requests", async t => {
  const user = t.mock.method(User, "findById", async () => ({ profile }));
  const match = makeQuest();
  mockQuests(t, [match]);
  let statusCode = 0;
  let responseBody: unknown;
  const res = {
    status(code: number) { statusCode = code; return this; },
    json(body: unknown) { responseBody = body; },
  } as Response;

  await getPartialMatchesController({ userId } as AuthenticatedRequest, res);
  assert.equal(statusCode, 200);
  const { joinRequests, ...fields } = match.toObject();
  const visibleQuest = { ...fields, requestedByMe: false }; // non-authors get a flag, not the list
  assert.deepEqual(responseBody, { matches: [visibleQuest] });
  assert.equal(user.mock.calls[0]?.arguments[0], userId);

  await getPartialMatchesController({} as AuthenticatedRequest, res);
  assert.equal(statusCode, 401);
  assert.equal(user.mock.callCount(), 1);
});
