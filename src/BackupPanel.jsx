import React, { useRef, useState } from "react";
import { BACKUP_DATE_KEY, MAX_BACKUP_BYTES, backupIsDue, createBackup, parseBackup } from "./backup.js";

export default function BackupPanel({ sessions, bodyweight, onRestore }) {
  const input = useRef(null);
  const [lastExport, setLastExport] = useState(() => {
    try { return localStorage.getItem(BACKUP_DATE_KEY) || ""; } catch { return ""; }
  });
  const [pending, setPending] = useState(null);
  const [message, setMessage] = useState("");
  const [error, setError] = useState("");
  const [reading, setReading] = useState(false);
  const hasData = sessions.length > 0 || bodyweight.length > 0;
  const dateLabel = (date) => new Date(date).toLocaleString();

  const download = () => {
    setError("");
    let url;
    try {
      const backup = createBackup({ sessions, bodyweight });
      url = URL.createObjectURL(new Blob([JSON.stringify(backup, null, 2)], { type: "application/json" }));
      const link = document.createElement("a");
      link.href = url;
      link.download = `workout-backup-${backup.exportedAt.replace(/[:.]/g, "-")}.json`;
      document.body.appendChild(link);
      link.click();
      link.remove();
      setLastExport(backup.exportedAt);
      try { localStorage.setItem(BACKUP_DATE_KEY, backup.exportedAt); } catch { /* Export still works if metadata cannot be stored. */ }
      setMessage("Backup download requested. Check that the file was saved, then keep a copy in Drive or iCloud.");
    } catch (err) { setError(err.message || "Could not create a backup. Please try again."); }
    finally { if (url) setTimeout(() => URL.revokeObjectURL(url), 60000); }
  };

  const selectFile = async (event) => {
    const file = event.target.files?.[0];
    event.target.value = "";
    if (!file) return;
    setPending(null);
    setMessage("");
    setError("");
    setReading(true);
    try {
      if (file.size > MAX_BACKUP_BYTES) throw new Error("Backup files must be smaller than 5 MB. Your current data has not changed.");
      setPending(parseBackup(await file.text()));
    } catch (err) { setError(err.message || "Could not read this file. Your current data has not changed."); }
    finally { setReading(false); }
  };

  const restore = () => {
    try {
      onRestore(pending);
      setPending(null);
      setError("");
      setMessage("Backup restored and saved on this device.");
    } catch { setError("Could not save the restored data on this device. Your current data has not changed."); }
  };

  return (
    <section className="wt-backup" aria-labelledby="backup-title">
      <h2 id="backup-title">Backup & restore</h2>
      <p>Your data is stored only in this browser. Backups include all workouts, set effort and bodyweight records. Keep the file private.</p>
      {hasData && backupIsDue(lastExport) && <p className="wt-backup-reminder">Weekly reminder: download a backup to protect your progress.</p>}
      <p>Last export: {lastExport && Number.isFinite(Date.parse(lastExport)) ? dateLabel(lastExport) : "Never"}</p>
      <div className="wt-backup-actions">
        <button type="button" onClick={download} disabled={!hasData}>Download backup</button>
        <button type="button" onClick={() => input.current?.click()} disabled={reading || !!pending}>{reading ? "Reading…" : "Restore from file"}</button>
      </div>
      <input ref={input} type="file" accept=".json,application/json" hidden onChange={selectFile} />
      {pending && (
        <div className="wt-backup-confirm">
          <strong>Replace the data on this device?</strong>
          <p>Backup from {dateLabel(pending.exportedAt)}: {pending.sessions.length} workouts and {pending.bodyweight.filter((entry) => entry.weight !== "").length} weigh-ins.</p>
          <p>Currently on this device: {sessions.length} workouts and {bodyweight.filter((entry) => entry.weight !== "").length} weigh-ins. Restore replaces these records; it does not merge them. Download a backup first if you want to keep them.</p>
          <div className="wt-backup-actions">
            <button type="button" onClick={restore}>Replace & restore</button>
            <button type="button" onClick={() => { setPending(null); setError(""); }}>Cancel</button>
          </div>
        </div>
      )}
      {message && <p role="status">{message}</p>}
      {error && <p role="alert" className="wt-backup-error">{error}</p>}
    </section>
  );
}
