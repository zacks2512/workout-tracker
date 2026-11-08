import test from "node:test";
import assert from "node:assert/strict";
import { mealsForDate, preparationTotals, plannedActivity, weeklyWeightAverages, localDate, shiftDate } from "./wellness.js";
import { createBackup, parseBackup } from "./backup.js";

test("Friday switches quantities and includes a family meal instead of a regular dinner", () => {
  const friday = mealsForDate("2026-11-13");
  const regular = mealsForDate("2026-11-12");
  assert.equal(friday.find((meal) => meal.id === "lunch").items[0].quantity, 120);
  assert.equal(regular.find((meal) => meal.id === "lunch").items[0].quantity, 180);
  assert.match(friday.find((meal) => meal.id === "dinner").name, /משפחתית/);
  assert.equal(friday.find((meal) => meal.id === "dinner").items.length, 0);
  assert.equal(regular.find((meal) => meal.id === "dinner").items.find((item) => item.key === "pita").quantity, 90);
});
test("preparation crossing Friday uses cooked quantities and excludes family meal groceries", () => {
  const prep = preparationTotals("2026-11-12", 3);
  assert.equal(prep.fridays, 1);
  assert.equal(prep.regularDays, 2);
  assert.equal(prep.items.find((item) => item.key === "chicken").quantity, 480);
  assert.equal(prep.items.find((item) => item.key === "rice").quantity, 650);
  assert.equal(prep.items.find((item) => item.key === "eggs").quantity, 4);
});
test("weekly averages ignore empty weights and separate Saturday from Sunday", () => {
  assert.deepEqual(weeklyWeightAverages([
    { date: "2026-11-07", weight: "110" }, { date: "2026-11-08", weight: "112" },
    { date: "2026-11-10", weight: "114" }, { date: "2026-11-11", weight: "" },
  ]), [{ week: "2026-11-08", count: 2, average: 113 }, { week: "2026-11-01", count: 1, average: 110 }]);
});
test("local dates preserve the device calendar day and cross month boundaries", () => {
  assert.equal(localDate(new Date(2026, 10, 9, 0, 15)), "2026-11-09");
  assert.equal(shiftDate("2026-12-31", 1), "2027-01-01");
  assert.equal(plannedActivity("2026-11-09").type, "gym");
  assert.equal(plannedActivity("2026-11-11").type, "gym");
  assert.equal(plannedActivity("2026-11-10").type, "walk");
});
const data = () => ({ sessions: [{ date: "2026-11-09", planId: "D", entries: { d1: [{ weight: "20", reps: "8" }] } }], bodyweight: [],
  dailyLogs: { "2026-11-09": { meals: { lunch: { done: true, note: "הערת בדיקה" } }, activities: [{ id: "example-1", type: "rope", minutes: 5, createdAt: 1 }] } },
  settings: { targetWeight: 95, targetDate: "2027-09-01" } });
test("version 2 backup round trip preserves new training, notes, activities and settings", () => {
  const backup = createBackup(data());
  assert.equal(backup.version, 2);
  const result = parseBackup(JSON.stringify(backup));
  for (const key of ["sessions", "bodyweight", "dailyLogs", "settings"]) assert.deepEqual(result[key], data()[key]);
});
test("version 1 remains readable without nutrition or settings", () => {
  const result = parseBackup(JSON.stringify({ format: "workout-tracker-backup", version: 1, exportedAt: "2026-11-08T12:00:00Z", data: { sessions: [{ date: "2026-07-13", planId: "A", entries: { a1: [{ weight: "20", reps: "8" }] } }], bodyweight: [{ date: "2026-07-13", weight: "110" }] } }));
  assert.equal(result.sessions.length, 1);
  assert.equal(result.version, 1);
  assert.deepEqual(result.dailyLogs, {});
});
test("version 2 rejects missing wellness fields and malformed nested data", () => {
  const mutations = [
    (backup) => { delete backup.data.dailyLogs; },
    (backup) => { backup.data.dailyLogs["2026-02-30"] = { meals: {}, activities: [] }; },
    (backup) => { backup.data.dailyLogs["2026-11-09"].meals.lunch.done = "true"; },
    (backup) => { backup.data.dailyLogs["2026-11-09"].meals.lunch.note = "x".repeat(2001); },
    (backup) => { backup.data.dailyLogs["2026-11-09"].activities[0].type = "unknown"; },
    (backup) => { backup.data.dailyLogs["2026-11-09"].activities[0].minutes = 0; },
    (backup) => { backup.data.settings.targetDate = "2027-02-30"; },
    (backup) => { backup.data.settings.targetWeight = -5; },
  ];
  for (const mutate of mutations) { const backup = createBackup(data()); mutate(backup); assert.throws(() => parseBackup(JSON.stringify(backup))); }
});
