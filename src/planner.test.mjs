import test from "node:test";
import assert from "node:assert/strict";
import { readFileSync } from "node:fs";
import ts from "typescript";

const code = ts.transpileModule(readFileSync(new URL("./planner.ts", import.meta.url), "utf8"), {
  compilerOptions: { target: ts.ScriptTarget.ES2020, module: ts.ModuleKind.ESNext },
}).outputText;
const {
  DEFAULT_DATES,
  exampleResponses,
  availabilityRanges,
  findMatches,
  slotsBetween,
  countSlots,
  timeLabel,
  durationError,
  durationDescription,
  parseClockTime,
} = await import(`data:text/javascript;base64,${Buffer.from(code).toString("base64")}`);
const day = DEFAULT_DATES[1];

test("recovery: three respondents do not share 90 minutes, but share 14:00–15:00", () => {
  const responses = exampleResponses(DEFAULT_DATES);
  assert.deepEqual(findMatches(responses, DEFAULT_DATES, 90, 480, 1320), []);
  assert.deepEqual(findMatches(responses, DEFAULT_DATES, 60, 480, 1320), [
    { date: day, start: 840, end: 900 },
  ]);
});

test("a match requires every respondent for every quarter-hour, not only the start", () => {
  const responses = [
    { id: "a", availability: { [day]: [56, 57, 58, 59] } },
    { id: "b", availability: { [day]: [56, 58, 59] } },
  ];
  assert.deepEqual(findMatches(responses, [day], 60, 480, 1320), []);
  assert.equal(findMatches(responses, [day], 15, 480, 1320).length, 3);
});

test("no respondents never yields an everyone-available result", () => {
  assert.deepEqual(findMatches([], DEFAULT_DATES, 90, 0, 1440), []);
});

test("date filtering and survey window bound all matches", () => {
  const responses = [{ id: "a", availability: { [day]: slotsBetween(780, 960) } }];
  assert.deepEqual(findMatches(responses, [day], 60, 840, 900), [
    { date: day, start: 840, end: 900 },
  ]);
  assert.deepEqual(findMatches(responses, [DEFAULT_DATES[0]], 60, 480, 1320), []);
});

test("longer contiguous windows return all valid 15-minute-aligned starts", () => {
  const responses = [{ id: "a", availability: { [day]: slotsBetween(840, 960) } }];
  assert.deepEqual(
    findMatches(responses, [day], 60, 480, 1320).map((m) => m.start),
    [840, 855, 870, 885, 900],
  );
});

test("selection totals ignore dates and times outside the event", () => {
  assert.equal(countSlots({ [day]: [31, 32, 33, 88], extra: [40] }, [day], 480, 1320), 2);
  assert.equal(timeLabel(1440), "24:00");
});

test("a displayed response snapshot is unaffected by later submissions", () => {
  const responses = exampleResponses(DEFAULT_DATES);
  const snapshot = structuredClone(responses);
  responses[2].availability[day] = [];
  assert.equal(findMatches(snapshot, DEFAULT_DATES, 60, 480, 1320).length, 1);
  assert.equal(findMatches(responses, DEFAULT_DATES, 60, 480, 1320).length, 0);
});

test("duration validation accepts directly entered long sessions and both boundaries", () => {
  for (const value of ["15", "45", "90", "300", "1440"]) assert.equal(durationError(value), null);
  for (const value of ["", "0", "14", "20", "44", "300.5", "1500", "-15", "abc"]) {
    assert.equal(typeof durationError(value), "string", value);
  }
  assert.equal(durationDescription(300), "300 minutes · 5 hours");
  assert.equal(durationDescription(90), "90 minutes · 1 hour 30 min");
  assert.equal(durationDescription(45), "45 minutes · 45 min");
});

test("editable clock times require actual quarter-hour times without rounding", () => {
  assert.equal(parseClockTime("08:00"), 480);
  assert.equal(parseClockTime("08:15"), 495);
  assert.equal(parseClockTime("8:30"), 510);
  assert.equal(parseClockTime("08:45"), 525);
  assert.equal(parseClockTime("22:00"), 1320);
  assert.equal(parseClockTime("24:00", true), 1440);
  for (const value of ["24:00", "08:10", "25:00", "08:60", "800", ""]) {
    assert.equal(parseClockTime(value), null, value);
  }
});

test("a full-day session is supported and longer or invalid durations never match", () => {
  const responses = [{ id: "all-day", availability: { [day]: slotsBetween(0, 1440) } }];
  assert.deepEqual(findMatches(responses, [day], 1440, 0, 1440), [
    { date: day, start: 0, end: 1440 },
  ]);
  for (const duration of [1500, NaN, 20, 0]) {
    assert.deepEqual(findMatches(responses, [day], duration, 0, 1440), []);
  }
});

test("individual availability merges consecutive quarter-hours into date ranges", () => {
  assert.deepEqual(
    availabilityRanges(
      {
        [DEFAULT_DATES[0]]: [36, 37, 38, 39, 40, 56, 57, 58, 59],
        [day]: [40, 41, 42, 43, 44, 45, 46, 47],
      },
      DEFAULT_DATES,
      480,
      1320,
    ),
    [
      {
        date: DEFAULT_DATES[0],
        ranges: [
          { start: 540, end: 615 },
          { start: 840, end: 900 },
        ],
      },
      { date: day, ranges: [{ start: 600, end: 720 }] },
    ],
  );
  assert.deepEqual(availabilityRanges({}, DEFAULT_DATES, 480, 1320), []);
});
