import test from "node:test";
import assert from "node:assert/strict";
import { backupIsDue, createBackup, parseBackup } from "./backup.js";

const sample = () => ({
  sessions: [{ date: "2026-11-08", planId: "A", startedAt: 1794132000000, updatedAt: 1794132060000,
    entries: { a1: [{ weight: "60", reps: "10", effort: "ok" }, { weight: "", reps: "" }] } }],
  bodyweight: [{ date: "2026-11-08", weight: "114" }],
});
const encode = (data) => JSON.stringify(createBackup(data, "2026-11-08T12:00:00.000Z"));

test("backup round trip preserves recorded sets, effort, dates and weigh-ins", () => {
  const result = parseBackup(encode(sample()));
  assert.deepEqual(result.sessions, sample().sessions);
  assert.deepEqual(result.bodyweight, sample().bodyweight);
});
test("empty device backup is supported for explicit restore", () => {
  assert.deepEqual(parseBackup(encode({ sessions: [], bodyweight: [] })).sessions, []);
});
test("rejects malformed JSON and unrelated JSON", () => {
  for (const text of ["{", "null", "[]", "{}", JSON.stringify(sample())]) assert.throws(() => parseBackup(text));
});
test("rejects unknown versions and missing export date", () => {
  const backup = JSON.parse(encode(sample()));
  assert.throws(() => parseBackup(JSON.stringify({ ...backup, version: 2 })), /version/);
  assert.throws(() => parseBackup(JSON.stringify({ ...backup, exportedAt: null })));
});
test("rejects unsafe dates, numeric values, plans, exercises and duplicate records", () => {
  const mutations = [
    (data) => { data.sessions[0].date = "2026-02-30"; },
    (data) => { data.sessions[0].planId = "D"; },
    (data) => { data.sessions[0].entries.zz = []; },
    (data) => { data.sessions[0].entries.a1[0].weight = "NaN"; },
    (data) => { data.sessions[0].entries.a1[0].reps = -1; },
    (data) => { data.sessions[0].entries.a1[0].effort = "unknown"; },
    (data) => { data.bodyweight[0].weight = 0; },
    (data) => { data.sessions.push(data.sessions[0]); },
    (data) => { data.bodyweight.push(data.bodyweight[0]); },
  ];
  for (const mutate of mutations) { const data = sample(); mutate(data); assert.throws(() => encode(data)); }
});
test("drops cached and unrecognized fields instead of trusting imported state", () => {
  const data = sample();
  data.lastValues = { injected: true };
  data.sessions[0].extra = "ignored";
  const backup = createBackup(data);
  assert.equal(backup.data.lastValues, undefined);
  assert.equal(backup.data.sessions[0].extra, undefined);
});
test("weekly reminder handles never exported, recent, overdue and invalid dates", () => {
  const now = Date.parse("2026-11-08T12:00:00Z");
  assert.equal(backupIsDue("", now), true);
  assert.equal(backupIsDue("2026-11-07T12:00:00Z", now), false);
  assert.equal(backupIsDue("2026-11-01T12:00:00Z", now), true);
  assert.equal(backupIsDue("bad-date", now), true);
  assert.equal(backupIsDue("2027-11-08T12:00:00Z", now), true);
});
