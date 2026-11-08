export const BACKUP_FORMAT = "workout-tracker-backup";
export const BACKUP_VERSION = 1;
export const MAX_BACKUP_BYTES = 5 * 1024 * 1024;
export const BACKUP_DATE_KEY = "workout-last-backup";

const object = (value) => value !== null && typeof value === "object" && !Array.isArray(value);
const validDate = (value) => typeof value === "string" && /^\d{4}-\d{2}-\d{2}$/.test(value) &&
  Number.isFinite(Date.parse(value)) && new Date(value).toISOString().slice(0, 10) === value;
const number = (value, max = 10000) => (typeof value === "string" || typeof value === "number") &&
  String(value).trim() !== "" && Number.isFinite(Number(value)) && Number(value) >= 0 && Number(value) <= max;
const invalid = () => { throw new Error("This file is not a valid Workout Tracker backup. Your current data has not changed."); };

// Copy only supported fields; never merge untrusted JSON into application state.
export function validateData(data) {
  if (!object(data) || !Array.isArray(data.sessions) || !Array.isArray(data.bodyweight)) invalid();
  const sessionKeys = new Set();
  const sessions = data.sessions.map((session) => {
    if (!object(session) || !validDate(session.date) || !["A", "B", "C"].includes(session.planId) || !object(session.entries)) invalid();
    const key = `${session.date}:${session.planId}`;
    if (sessionKeys.has(key)) invalid();
    sessionKeys.add(key);
    const entries = {};
    for (const [id, sets] of Object.entries(session.entries)) {
      if (!new RegExp(`^${session.planId.toLowerCase()}[1-7]$`).test(id) || !Array.isArray(sets) || sets.length > 20) invalid();
      entries[id] = sets.map((set) => {
        if (!object(set) || !(set.weight === "" || number(set.weight)) || !(set.reps === "" || number(set.reps))) invalid();
        if (set.effort != null && !["easy", "ok", "fail"].includes(set.effort)) invalid();
        return { weight: String(set.weight), reps: String(set.reps), ...(set.effort ? { effort: set.effort } : {}) };
      });
    }
    const result = { date: session.date, planId: session.planId, entries };
    for (const field of ["startedAt", "updatedAt"]) {
      if (session[field] != null) {
        if (typeof session[field] !== "number" || !Number.isFinite(session[field]) || session[field] < 0) invalid();
        result[field] = session[field];
      }
    }
    return result;
  });
  const dates = new Set();
  const bodyweight = data.bodyweight.map((entry) => {
    if (!object(entry) || !validDate(entry.date) || dates.has(entry.date) ||
      !(entry.weight === "" || (number(entry.weight, 1000) && Number(entry.weight) > 0))) invalid();
    dates.add(entry.date);
    return { date: entry.date, weight: String(entry.weight) };
  });
  return { sessions, bodyweight };
}

export function createBackup(data, exportedAt = new Date().toISOString()) {
  return { format: BACKUP_FORMAT, version: BACKUP_VERSION, exportedAt, data: validateData(data) };
}

export function parseBackup(text) {
  let backup;
  try { backup = JSON.parse(text); } catch { invalid(); }
  if (!object(backup) || backup.format !== BACKUP_FORMAT) invalid();
  if (backup.version !== BACKUP_VERSION) throw new Error("This backup version is not supported. Your current data has not changed.");
  if (typeof backup.exportedAt !== "string" || !Number.isFinite(Date.parse(backup.exportedAt))) invalid();
  return { ...validateData(backup.data), exportedAt: backup.exportedAt };
}

export function backupIsDue(lastExport, now = Date.now()) {
  const timestamp = Date.parse(lastExport);
  return !Number.isFinite(timestamp) || timestamp > now || now - timestamp >= 7 * 24 * 60 * 60 * 1000;
}
