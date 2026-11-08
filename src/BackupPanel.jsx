import React, { useRef, useState } from "react";
import { BACKUP_DATE_KEY, MAX_BACKUP_BYTES, backupIsDue, createBackup, parseBackup } from "./backup.js";

export default function BackupPanel({ sessions, bodyweight, onRestore }) {
  const input = useRef(null);
  const manualCopy = useRef(null);
  const [lastExport, setLastExport] = useState(() => {
    try { return localStorage.getItem(BACKUP_DATE_KEY) || ""; } catch { return ""; }
  });
  const [pending, setPending] = useState(null);
  const [message, setMessage] = useState("");
  const [error, setError] = useState("");
  const [reading, setReading] = useState(false);
  const [copying, setCopying] = useState(false);
  const [backupText, setBackupText] = useState("");
  const [restoreText, setRestoreText] = useState(null);
  const hasData = sessions.length > 0 || bodyweight.length > 0;
  const dateLabel = (date) => new Date(date).toLocaleString();

  const copyBackup = async () => {
    setError("");
    setMessage("");
    setBackupText("");
    setCopying(true);
    try {
      const backup = createBackup({ sessions, bodyweight });
      const text = JSON.stringify(backup, null, 2);
      try {
        if (navigator.clipboard && window.isSecureContext) {
          await navigator.clipboard.writeText(text);
        } else {
          const textarea = document.createElement("textarea");
          textarea.value = text;
          textarea.style.position = "fixed";
          textarea.style.opacity = "0";
          document.body.appendChild(textarea);
          try {
            textarea.focus();
            textarea.select();
            if (!document.execCommand?.("copy")) throw new Error("Copy unavailable");
          } finally { textarea.remove(); }
        }
      } catch {
        setBackupText(text);
        setError("Automatic copying is unavailable. Select and copy the backup text below, then paste it into your private backup file in Drive.");
        return;
      }
      setLastExport(backup.exportedAt);
      try { localStorage.setItem(BACKUP_DATE_KEY, backup.exportedAt); } catch { /* Copy still works if metadata cannot be stored. */ }
      setMessage("Backup copied. In your private backup file in Drive, replace all the old text with this text and save. Copying alone does not update Drive.");
    } catch (err) { setError(err.message || "Could not create a backup. Please try again."); }
    finally { setCopying(false); }
  };

  const reviewText = () => {
    setError("");
    setMessage("");
    try {
      if (new TextEncoder().encode(restoreText).byteLength > MAX_BACKUP_BYTES) throw new Error("Backup text must be smaller than 5 MB. Your current data has not changed.");
      setPending(parseBackup(restoreText));
    } catch (err) { setError(err.message || "Could not read this backup. Your current data has not changed."); }
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
      setRestoreText(null);
      setError("");
      setMessage("Backup restored and saved on this device.");
    } catch { setError("Could not save the restored data on this device. Your current data has not changed."); }
  };

  return (
    <section className="wt-backup" aria-labelledby="backup-title">
      <h2 id="backup-title">Backup & restore</h2>
      <p>Your data is stored only in this browser. Copy your full workout and bodyweight backup, paste it into a private text file in Drive, and save it.</p>
      {hasData && backupIsDue(lastExport) && <p className="wt-backup-reminder">Weekly reminder: copy a backup and save it in Drive.</p>}
      <p>Last copied: {lastExport && Number.isFinite(Date.parse(lastExport)) ? dateLabel(lastExport) : "Never"} (Drive save is not verified)</p>
      <div className="wt-backup-actions">
        <button type="button" onClick={copyBackup} disabled={!hasData || copying}>{copying ? "Copying…" : "Copy backup"}</button>
        <button type="button" onClick={() => { setRestoreText(""); setError(""); setMessage(""); setBackupText(""); }} disabled={reading || !!pending}>Restore backup</button>
      </div>
      {backupText && <div className="wt-backup-editor">
        <label htmlFor="manual-backup">Backup text — copy everything</label>
        <textarea id="manual-backup" ref={manualCopy} value={backupText} readOnly spellCheck={false} />
        <div className="wt-backup-actions"><button type="button" onClick={() => { manualCopy.current?.focus(); manualCopy.current?.select(); }}>Select backup text</button></div>
      </div>}
      {restoreText !== null && !pending && <div className="wt-backup-editor">
        <label htmlFor="restore-backup">Paste the complete backup text from your file</label>
        <textarea id="restore-backup" value={restoreText} onChange={(event) => setRestoreText(event.target.value)} spellCheck={false} />
        <div className="wt-backup-actions">
          <button type="button" onClick={reviewText} disabled={!restoreText.trim() || reading}>Review backup</button>
          <button type="button" onClick={() => input.current?.click()} disabled={reading}>{reading ? "Reading…" : "Choose backup file"}</button>
          <button type="button" onClick={() => { setRestoreText(null); setError(""); }}>Cancel</button>
        </div>
      </div>}
      <input ref={input} type="file" accept=".json,application/json" hidden onChange={selectFile} />
      {pending && (
        <div className="wt-backup-confirm">
          <strong>Replace the data on this device?</strong>
          <p>Backup from {dateLabel(pending.exportedAt)}: {pending.sessions.length} workouts and {pending.bodyweight.filter((entry) => entry.weight !== "").length} weigh-ins.</p>
          <p>Currently on this device: {sessions.length} workouts and {bodyweight.filter((entry) => entry.weight !== "").length} weigh-ins. Restore replaces these records; it does not merge them. Copy and save a backup first if you want to keep them.</p>
          <div className="wt-backup-actions">
            <button type="button" onClick={restore}>Replace & restore</button>
            <button type="button" onClick={() => { setPending(null); setRestoreText(null); setError(""); }}>Cancel</button>
          </div>
        </div>
      )}
      {message && <p role="status">{message}</p>}
      {error && <p role="alert" className="wt-backup-error">{error}</p>}
    </section>
  );
}
