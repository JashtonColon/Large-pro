import assert from "node:assert/strict";
import test, { type TestContext } from "node:test";
import type { Response } from "express";
import Quest from "../models/Quest.js";
import User from "../models/User.js";
import { searchQuests, getPartialMatches, QuestError } from "../services/questService.js";
import { searchQuestsController, getPartialMatchesController } from "../controllers/questController.js";
import type { AuthenticatedRequest } from "../middleware/authMiddleware.js";
import { matchesDiscoveryQuery } from "./helpers/discoveryQuery.js";

const userId = "507f1f77bcf86cd799439011";
function makeQuest(subject: string, startTime: number, endTime: number, status: "open" | "closed" = "open") {
  return new Quest({
    title: "Study group", subject, startTime, endTime, status,
    location: "Library", author: "507f1f77bcf86cd799439012",
    day: new Date("2026-11-16T00:00:00Z"), maxMember: 2,
  });
}
const quests = [
  makeQuest("COP4331", 540, 600),
  makeQuest(" cop 4331 ", 600, 660),
  makeQuest("COP3503", 600, 660),
  makeQuest("COP4331", 660, 720),
];

function mockResults(t: TestContext, candidates = quests) {
  t.mock.method(User, "findById", async () => ({ profile: {
    courses: ["COP4331", "COP3503", "C++"],
    availability: [{ dayOfWeek: 1, startMinute: 480, endMinute: 1020 }],
  } }));
  t.mock.method(Quest, "find", (query: Parameters<typeof matchesDiscoveryQuery>[1]) => {
    const results = candidates.filter(quest => matchesDiscoveryQuery(quest, query));
    return { sort: () => ({
      limit: async (maximum: number) => results.slice(0, maximum),
      cursor: async function* () { yield* results; },
    }) };
  });
}

for (const source of ["search", "matches"] as const) {
  test(`${source}: filters by course, time, or both and preserves empty filters`, async t => {
    mockResults(t);
    const run = (filters = {}) => source === "search"
      ? searchQuests("", "", filters) : getPartialMatches(userId, filters);

    assert.deepEqual(await run(), quests);
    assert.deepEqual(await run({ course: " ", startTime: "", endTime: " " }), quests);
    assert.deepEqual(await run({ course: "cop 4331" }), [quests[0], quests[1], quests[3]]);
    assert.deepEqual(await run({ startTime: 600, endTime: 660 }), [quests[1], quests[2]]);
    assert.deepEqual(await run({ course: "COP4331", startTime: 600, endTime: 660 }), [quests[1]]);
    assert.deepEqual(await run({ startTime: "600", endTime: "660" }), [quests[1], quests[2]]);
    assert.deepEqual(await run({ startTime: 660 }), [quests[3]]);
    assert.deepEqual(await run({ endTime: 600 }), [quests[0]]);
    assert.deepEqual(await run({ startTime: 0, endTime: 1440 }), quests);
    assert.deepEqual(await run({ startTime: "0", endTime: "1440" }), quests);
    assert.deepEqual(await run({ endTime: 0 }), []);
    assert.deepEqual(await run({ startTime: 1440 }), []);
    assert.deepEqual(await run({ course: "MAC2311" }), []);
  });

  test(`${source}: invalid filter values and reversed ranges return 400`, async () => {
    for (const filters of [
      { course: ["COP4331"] }, { course: { $ne: "" } },
      { startTime: -1 }, { endTime: 1441 }, { startTime: 600.5 },
      { startTime: "-1" }, { endTime: "1441" }, { endTime: "660.5" },
      { startTime: NaN }, { endTime: Infinity }, { startTime: true },
      { startTime: [600] }, { endTime: {} },
      { endTime: null }, { startTime: "bad" }, { startTime: "10:00 AM" },
      { startTime: "13:00 PM" }, { endTime: "10:99 AM" },
      { startTime: 660, endTime: 600 },
      { startTime: 600, endTime: 600 },
      { startTime: "660", endTime: "600" },
      { startTime: "600", endTime: "600" },
    ]) {
      const result = source === "search"
        ? searchQuests("", "", filters) : getPartialMatches(userId, filters);
      await assert.rejects(result,
        (error: unknown) => error instanceof QuestError && error.statusCode === 400);
    }
  });

  test(`${source}: applies course and time filters before the 30-result limit`, async t => {
    const matches = Array.from({ length: 35 }, () => makeQuest("COP3503", 600, 660));
    mockResults(t, [
      ...Array.from({ length: 40 }, () => makeQuest("COP4331", 600, 660)),
      ...Array.from({ length: 40 }, () => makeQuest("COP3503", 540, 600)),
      ...matches,
    ]);
    const filters = { course: "COP3503", startTime: 600, endTime: 660 };
    const result = source === "search"
      ? await searchQuests("", "", filters) : await getPartialMatches(userId, filters);
    assert.deepEqual(result, matches.slice(0, 30));
  });

  test(`${source}: closed quests do not occupy the result limit`, async t => {
    const open = Array.from({ length: 35 }, () => makeQuest("COP4331", 600, 660));
    mockResults(t, [
      ...Array.from({ length: 40 }, () => makeQuest("COP4331", 600, 660, "closed")),
      ...open,
    ]);
    const result = source === "search" ? await searchQuests() : await getPartialMatches(userId);
    assert.deepEqual(result, open.slice(0, 30));
  });

  test(`${source}: course filters treat regex characters literally and ignore whitespace`, async t => {
    const match = makeQuest(" C + + ", 600, 660);
    mockResults(t, [makeQuest("CCC", 600, 660), match]);
    const filters = { course: "c ++" };
    const result = source === "search"
      ? await searchQuests("", "", filters) : await getPartialMatches(userId, filters);
    assert.deepEqual(result, [match]);
  });

  test(`${source}: controller passes course and time filters to the service`, async t => {
    mockResults(t);
    let statusCode = 0;
    let body: unknown;
    const res = {
      status(code: number) { statusCode = code; return this; },
      json(value: unknown) { body = value; },
    } as Response;
    const req = { userId, query: { course: "COP4331", startTime: "600", endTime: "660" } } as unknown as AuthenticatedRequest;
    const controller = source === "search" ? searchQuestsController : getPartialMatchesController;
    await controller(req, res);
    assert.equal(statusCode, 200);
    const { joinRequests, ...visibleQuest } = quests[1].toObject();
    assert.deepEqual(body, source === "search" ? { quests: [visibleQuest] } : { matches: [visibleQuest] });
  });
}

test("subject search and course filters must both match", async t => {
  mockResults(t);
  assert.deepEqual(await searchQuests("COP4331", "", { course: "COP3503" }), []);
  assert.deepEqual(await searchQuests("COP4331", "", { course: "cop 4331" }),
    [quests[0], quests[3]]);
});
