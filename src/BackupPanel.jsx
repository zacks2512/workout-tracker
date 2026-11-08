import React, { useRef, useState } from "react";
import { BACKUP_DATE_KEY, MAX_BACKUP_BYTES, backupIsDue, createBackup, parseBackup } from "./backup.js";
import { DEFAULT_SETTINGS } from "./wellness.js";

export default function BackupPanel({ sessions, bodyweight, dailyLogs = {}, settings = DEFAULT_SETTINGS, onRestore }) {
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
  const hasData = sessions.length > 0 || bodyweight.length > 0 || Object.keys(dailyLogs).length > 0 || settings.targetWeight !== DEFAULT_SETTINGS.targetWeight || settings.targetDate !== DEFAULT_SETTINGS.targetDate;
  const dateLabel = (date) => new Date(date).toLocaleString("he-IL");

  const copyBackup = async () => {
    setError("");
    setMessage("");
    setBackupText("");
    setCopying(true);
    try {
      const backup = createBackup({ sessions, bodyweight, dailyLogs, settings });
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
        setError("העתקה אוטומטית אינה זמינה. בחרו והעתיקו את הטקסט שלהלן, והדביקו בקובץ הגיבוי הפרטי בדרייב.");
        return;
      }
      setLastExport(backup.exportedAt);
      try { localStorage.setItem(BACKUP_DATE_KEY, backup.exportedAt); } catch { /* Copy still works if metadata cannot be stored. */ }
      setMessage("הגיבוי הועתק. החליפו את כל הטקסט הישן בקובץ הפרטי בדרייב ושמרו. ההעתקה אינה מעדכנת את דרייב אוטומטית.");
    } catch (err) { setError(err.message || "לא ניתן ליצור גיבוי. נסו שוב."); }
    finally { setCopying(false); }
  };

  const reviewText = () => {
    setError("");
    setMessage("");
    try {
      if (new TextEncoder().encode(restoreText).byteLength > MAX_BACKUP_BYTES) throw new Error("טקסט הגיבוי חייב להיות קטן מ־5 מגה. הנתונים הנוכחיים לא השתנו.");
      setPending(parseBackup(restoreText));
    } catch (err) { setError(err.message || "לא ניתן לקרוא את הגיבוי. הנתונים הנוכחיים לא השתנו."); }
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
      if (file.size > MAX_BACKUP_BYTES) throw new Error("קובץ הגיבוי חייב להיות קטן מ־5 מגה. הנתונים הנוכחיים לא השתנו.");
      setPending(parseBackup(await file.text()));
    } catch (err) { setError(err.message || "לא ניתן לקרוא את הקובץ. הנתונים הנוכחיים לא השתנו."); }
    finally { setReading(false); }
  };

  const restore = () => {
    try {
      onRestore(pending);
      setPending(null);
      setRestoreText(null);
      setError("");
      setMessage("הגיבוי שוחזר ונשמר במכשיר הזה.");
    } catch { setError("שמירת השחזור במכשיר נכשלה. הנתונים הנוכחיים לא השתנו."); }
  };

  return (
    <section className="wt-backup" aria-labelledby="backup-title">
      <h2 id="backup-title">גיבוי ושחזור</h2>
      <p>הנתונים נשמרים רק בדפדפן הזה. העתיקו את הגיבוי המלא, החליפו את כל התוכן בקובץ הפרטי בדרייב ושמרו.</p>
      {hasData && backupIsDue(lastExport) && <p className="wt-backup-reminder">תזכורת שבועית: העתיקו גיבוי ושמרו אותו בדרייב.</p>}
      <p>הועתק לאחרונה: {lastExport && Number.isFinite(Date.parse(lastExport)) ? dateLabel(lastExport) : "טרם הועתק"} (אין אימות שמירה בדרייב)</p>
      <div className="wt-backup-actions">
        <button type="button" onClick={copyBackup} disabled={!hasData || copying}>{copying ? "מעתיק…" : "העתקת גיבוי"}</button>
        <button type="button" onClick={() => { setRestoreText(""); setError(""); setMessage(""); setBackupText(""); }} disabled={reading || !!pending}>שחזור גיבוי</button>
      </div>
      {backupText && <div className="wt-backup-editor">
        <label htmlFor="manual-backup">טקסט הגיבוי — יש להעתיק הכול</label>
        <textarea id="manual-backup" ref={manualCopy} value={backupText} readOnly spellCheck={false} />
        <div className="wt-backup-actions"><button type="button" onClick={() => { manualCopy.current?.focus(); manualCopy.current?.select(); }}>בחירת כל טקסט הגיבוי</button></div>
      </div>}
      {restoreText !== null && !pending && <div className="wt-backup-editor">
        <label htmlFor="restore-backup">הדביקו את כל טקסט הגיבוי מהקובץ</label>
        <textarea id="restore-backup" value={restoreText} onChange={(event) => setRestoreText(event.target.value)} spellCheck={false} />
        <div className="wt-backup-actions">
          <button type="button" onClick={reviewText} disabled={!restoreText.trim() || reading}>בדיקת הגיבוי</button>
          <button type="button" onClick={() => input.current?.click()} disabled={reading}>{reading ? "קורא…" : "בחירת קובץ גיבוי"}</button>
          <button type="button" onClick={() => { setRestoreText(null); setError(""); }}>ביטול</button>
        </div>
      </div>}
      <input ref={input} type="file" accept=".json,application/json" hidden onChange={selectFile} />
      {pending && (
        <div className="wt-backup-confirm">
          <strong>להחליף את הנתונים במכשיר הזה?</strong>
          <p>גיבוי מ־{dateLabel(pending.exportedAt)}: {pending.sessions.length} אימונים ו־{pending.bodyweight.filter((entry) => entry.weight !== "").length} שקילות.</p>
          <p>{Object.keys(pending.dailyLogs).length} ימי תזונה ופעילות. ההערות והיעד כלולים בגיבוי החדש.</p>
          {pending.version === 1 && <p className="wt-backup-error">זהו גיבוי ישן ללא תזונה ופעילות. שחזורו ימחק את יומן התזונה והפעילות הנוכחי ויאפס את היעד לברירת המחדל. העתיקו קודם גיבוי עדכני.</p>}
          <p>כעת במכשיר: {sessions.length} אימונים ו־{bodyweight.filter((entry) => entry.weight !== "").length} שקילות. השחזור מחליף את כל המידע הקיים, כולל תזונה ופעילות; הוא אינו ממזג. כדי לשמור אותו, העתיקו ושמרו גיבוי לפני ההחלפה.</p>
          <div className="wt-backup-actions">
            <button type="button" onClick={restore}>החלפה ושחזור</button>
            <button type="button" onClick={() => { setPending(null); setRestoreText(null); setError(""); }}>ביטול</button>
          </div>
        </div>
      )}
      {message && <p role="status">{message}</p>}
      {error && <p role="alert" className="wt-backup-error">{error}</p>}
    </section>
  );
}
