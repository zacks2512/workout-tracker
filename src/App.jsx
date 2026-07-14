import React, { useState, useEffect, useCallback, useRef } from "react";
import { ChevronDown, Check, ArrowLeft, Dumbbell, Clock3, History, Scale, TrendingUp, TrendingDown, ClipboardCopy, Trash2 } from "lucide-react";

const STORAGE_KEY = "workout-data";

const PLANS = {
  A: {
    id: "A",
    subtitle: "Squat Focus",
    exercises: [
      { id: "a1", name: "Barbell Back Squat", sets: 4, target: "8–10 reps", mode: "weight", howTo: "Bar racked on your upper traps, squat until thighs pass parallel, then drive up through your heels." },
      { id: "a2", name: "Flat Bench Press", sets: 4, target: "8–10 reps", mode: "weight", howTo: "Lower the bar to your chest with elbows near 45°, press back up to full lockout." },
      { id: "a3", name: "Bent-Over Barbell Row", sets: 3, target: "10–12 reps", mode: "weight", howTo: "Hinge to about 45°, pull the bar to your lower ribs, squeeze your shoulder blades together." },
      { id: "a4", name: "Seated Dumbbell Shoulder Press", sets: 3, target: "10–12 reps", mode: "weight", howTo: "Press the dumbbells from shoulder height straight overhead without arching your lower back." },
      { id: "a5", name: "Lying Leg Curl", sets: 3, target: "12–15 reps", mode: "weight", howTo: "Curl the pad toward your glutes, pause briefly, then lower it slowly." },
      { id: "a6", name: "Lateral Raise", sets: 3, target: "12–15 reps", mode: "weight", howTo: "Raise the dumbbells out to your sides to shoulder height, leading with your elbows." },
      { id: "a7", name: "Plank", sets: 3, target: "45 sec hold", mode: "time", howTo: "Hold a straight line from shoulders to heels, brace your core, keep your hips from sagging." },
    ],
  },
  B: {
    id: "B",
    subtitle: "Hinge Focus",
    exercises: [
      { id: "b1", name: "Romanian Deadlift", sets: 4, target: "8–10 reps", mode: "weight", howTo: "Push your hips back with a slight knee bend, lower the bar along your legs, feel a hamstring stretch." },
      { id: "b2", name: "Incline Dumbbell Press", sets: 4, target: "10–12 reps", mode: "weight", howTo: "On a 30–45° incline, press the dumbbells up and slightly in until your arms extend." },
      { id: "b3", name: "Lat Pulldown", sets: 3, target: "10–12 reps", mode: "weight", howTo: "Pull the bar to your upper chest, lead with your elbows, control the return." },
      { id: "b4", name: "Walking Lunges", sets: 3, target: "12 reps / leg", mode: "weight", howTo: "Step forward into a lunge, drop your back knee toward the floor, push off to the next step." },
      { id: "b5", name: "Seated Cable Row", sets: 3, target: "10–12 reps", mode: "weight", howTo: "Pull the handle to your stomach, squeeze your back, keep your torso upright." },
      { id: "b6", name: "Curl + Pushdown (superset)", sets: 3, target: "12–15 reps", mode: "weight", howTo: "Curl without swinging, then immediately push the cable down to full arm extension." },
      { id: "b7", name: "Hanging Leg Raise", sets: 3, target: "12–15 reps", mode: "weight", howTo: "Hang from the bar and raise your knees toward your chest without swinging." },
    ],
  },
  C: {
    id: "C",
    subtitle: "Press & Pull Balance",
    exercises: [
      { id: "c1", name: "Leg Press", sets: 4, target: "10–12 reps", mode: "weight", howTo: "Lower the sled until your knees reach about 90°, press through your heels to extend." },
      { id: "c2", name: "Pull-Ups", sets: 4, target: "8–10 reps", mode: "weight", howTo: "Pull your chin over the bar, lead with your chest, lower under control." },
      { id: "c3", name: "Overhead Barbell Press", sets: 3, target: "8–10 reps", mode: "weight", howTo: "Press the bar from shoulder height straight overhead, keeping your core tight." },
      { id: "c4", name: "Hip Thrust", sets: 3, target: "10–12 reps", mode: "weight", howTo: "Upper back on a bench, drive your hips up until level with your knees, squeeze your glutes at the top." },
      { id: "c5", name: "Chest-Supported Row", sets: 3, target: "10–12 reps", mode: "weight", howTo: "Chest braced on the pad, row the handles to your ribs, squeeze your back." },
      { id: "c6", name: "Standing Calf Raise", sets: 3, target: "15–20 reps", mode: "weight", howTo: "Rise onto your toes as high as possible, pause, lower your heels below the platform." },
      { id: "c7", name: "Face Pull", sets: 3, target: "15 reps", mode: "weight", howTo: "Pull the rope toward your face, elbows high, squeeze your rear shoulders." },
    ],
  },
};

const todayStr = () => new Date().toISOString().slice(0, 10);
const emptyEntries = (plan) => {
  const e = {};
  PLANS[plan].exercises.forEach((ex) => {
    e[ex.id] = Array.from({ length: ex.sets }, () => ({ weight: "", reps: "" }));
  });
  return e;
};

function loadData() {
  try {
    const raw = localStorage.getItem(STORAGE_KEY);
    if (!raw) return {};
    return JSON.parse(raw);
  } catch (e) {
    return {};
  }
}

function saveData(data) {
  localStorage.setItem(STORAGE_KEY, JSON.stringify(data));
}

function computeLastValues(sessionsList) {
  const result = {};
  [...sessionsList]
    .sort((a, b) => (a.date < b.date ? -1 : 1))
    .forEach((s) => {
      Object.entries(s.entries).forEach(([exId, sets]) => {
        const filled = [...sets].reverse().find((set) => set.weight !== "" || set.reps !== "");
        if (filled) result[exId] = { ...filled, date: s.date };
      });
    });
  return result;
}

function exerciseName(exId) {
  for (const plan of Object.values(PLANS)) {
    const ex = plan.exercises.find((e) => e.id === exId);
    if (ex) return ex.name;
  }
  return exId;
}

function buildExportText(sessions, bodyweight) {
  const rows = [["Date", "Day", "Exercise", "Set", "Weight (kg)", "Reps / Seconds"]];
  [...sessions]
    .sort((a, b) => (a.date < b.date ? -1 : 1))
    .forEach((s) => {
      Object.entries(s.entries).forEach(([exId, sets]) => {
        sets.forEach((set, idx) => {
          if (set.weight === "" && set.reps === "") return;
          rows.push([s.date, s.planId, exerciseName(exId), idx + 1, set.weight, set.reps]);
        });
      });
    });

  const bwRows = [["Date", "Bodyweight (kg)"]];
  [...bodyweight]
    .filter((b) => b.weight !== "")
    .sort((a, b) => (a.date < b.date ? -1 : 1))
    .forEach((b) => bwRows.push([b.date, b.weight]));

  const toTsv = (grid) => grid.map((r) => r.join("\t")).join("\n");
  return `${toTsv(rows)}\n\nBodyweight Log\n${toTsv(bwRows)}`;
}

async function copyToClipboard(text) {
  if (navigator.clipboard && window.isSecureContext) {
    await navigator.clipboard.writeText(text);
    return;
  }
  const textarea = document.createElement("textarea");
  textarea.value = text;
  textarea.style.position = "fixed";
  textarea.style.opacity = "0";
  document.body.appendChild(textarea);
  textarea.focus();
  textarea.select();
  document.execCommand("copy");
  document.body.removeChild(textarea);
}

export default function WorkoutTracker() {
  const [screen, setScreen] = useState("home"); // home | workout | session
  const [plan, setPlan] = useState(null);
  const [viewingSession, setViewingSession] = useState(null);
  const [entries, setEntries] = useState({});
  const [expanded, setExpanded] = useState({});
  const [lastValues, setLastValues] = useState({});
  const [sessions, setSessions] = useState([]);
  const [bodyweight, setBodyweight] = useState([]);
  const [loading, setLoading] = useState(true);
  const [saveState, setSaveState] = useState("idle"); // idle | saving | saved
  const [copyState, setCopyState] = useState("idle"); // idle | copied | error
  const saveTimer = useRef(null);
  const copyTimer = useRef(null);

  useEffect(() => {
    const data = loadData();
    setLastValues(data.lastValues || {});
    setSessions(data.sessions || []);
    setBodyweight(data.bodyweight || []);
    setLoading(false);
  }, []);

  const persist = useCallback((nextLastValues, nextSessions, nextBodyweight) => {
    setSaveState("saving");
    clearTimeout(saveTimer.current);
    saveTimer.current = setTimeout(() => {
      try {
        saveData({ lastValues: nextLastValues, sessions: nextSessions, bodyweight: nextBodyweight });
        setSaveState("saved");
      } catch (e) {
        setSaveState("idle");
      }
    }, 500);
  }, []);

  const openPlan = (planId) => {
    setPlan(planId);
    const today = todayStr();
    const existing = sessions.find((s) => s.date === today && s.planId === planId);
    setEntries(existing ? existing.entries : emptyEntries(planId));
    setExpanded({});
    setScreen("workout");
  };

  const updateSet = (exId, idx, field, value) => {
    setEntries((prev) => {
      const next = { ...prev, [exId]: prev[exId].map((s, i) => (i === idx ? { ...s, [field]: value } : s)) };
      commitSession(next);
      return next;
    });
  };

  const commitSession = (currentEntries) => {
    const today = todayStr();
    const nextLastValues = { ...lastValues };
    Object.entries(currentEntries).forEach(([exId, sets]) => {
      const filled = [...sets].reverse().find((s) => s.weight !== "" || s.reps !== "");
      if (filled) nextLastValues[exId] = { ...filled, date: today };
    });
    const idx = sessions.findIndex((s) => s.date === today && s.planId === plan);
    let nextSessions;
    const record = { date: today, planId: plan, entries: currentEntries };
    if (idx >= 0) {
      nextSessions = sessions.map((s, i) => (i === idx ? record : s));
    } else {
      nextSessions = [...sessions, record];
    }
    setLastValues(nextLastValues);
    setSessions(nextSessions);
    persist(nextLastValues, nextSessions, bodyweight);
  };

  const updateBodyweight = (value, date = todayStr()) => {
    setBodyweight((prev) => {
      const idx = prev.findIndex((b) => b.date === date);
      const next = idx >= 0 ? prev.map((b, i) => (i === idx ? { date, weight: value } : b)) : [...prev, { date, weight: value }];
      persist(lastValues, sessions, next);
      return next;
    });
  };

  const useLastValues = (exId) => {
    const last = lastValues[exId];
    if (!last) return;
    setEntries((prev) => {
      const next = { ...prev, [exId]: prev[exId].map(() => ({ weight: last.weight, reps: last.reps })) };
      commitSession(next);
      return next;
    });
  };

  const toggleExpand = (exId) => setExpanded((prev) => ({ ...prev, [exId]: !prev[exId] }));

  const openSession = (session) => {
    setViewingSession(session);
    setScreen("session");
  };

  const deleteSession = (session) => {
    const nextSessions = sessions.filter((s) => !(s.date === session.date && s.planId === session.planId));
    setSessions(nextSessions);
    persist(lastValues, nextSessions, bodyweight);
    setScreen("home");
  };

  const updateSessionEntry = (session, exId, idx, field, value) => {
    const nextSessions = sessions.map((s) => {
      if (s.date !== session.date || s.planId !== session.planId) return s;
      return {
        ...s,
        entries: {
          ...s.entries,
          [exId]: s.entries[exId].map((set, i) => (i === idx ? { ...set, [field]: value } : set)),
        },
      };
    });
    const nextLastValues = computeLastValues(nextSessions);
    setSessions(nextSessions);
    setLastValues(nextLastValues);
    persist(nextLastValues, nextSessions, bodyweight);
    setViewingSession(nextSessions.find((s) => s.date === session.date && s.planId === session.planId));
  };

  const setsLoggedCount = (exId) => (entries[exId] || []).filter((s) => s.weight !== "" || s.reps !== "").length;

  const handleExport = async () => {
    clearTimeout(copyTimer.current);
    try {
      await copyToClipboard(buildExportText(sessions, bodyweight));
      setCopyState("copied");
    } catch (e) {
      setCopyState("error");
    }
    copyTimer.current = setTimeout(() => setCopyState("idle"), 2000);
  };

  const recentSessions = [...sessions].sort((a, b) => (a.date < b.date ? 1 : -1)).slice(0, 4);
  const today = todayStr();
  const todaysBodyweight = bodyweight.find((b) => b.date === today)?.weight ?? "";

  if (loading) {
    return (
      <div style={{ background: COLORS.bg, minHeight: "100vh", display: "flex", alignItems: "center", justifyContent: "center", color: COLORS.textDim }}>
        Loading…
      </div>
    );
  }

  return (
    <div style={{ background: COLORS.bg, minHeight: "100vh", fontFamily: FONT, color: COLORS.text }}>
      <style>{CSS}</style>
      {screen === "home" ? (
        <HomeScreen
          onPick={openPlan}
          recentSessions={recentSessions}
          bodyweight={bodyweight}
          onExport={handleExport}
          copyState={copyState}
          hasData={sessions.length > 0 || bodyweight.length > 0}
          onOpenSession={openSession}
        />
      ) : screen === "workout" ? (
        <WorkoutScreen
          plan={plan}
          entries={entries}
          expanded={expanded}
          lastValues={lastValues}
          onToggle={toggleExpand}
          onUpdate={updateSet}
          onUseLast={useLastValues}
          setsLoggedCount={setsLoggedCount}
          onBack={() => setScreen("home")}
          saveState={saveState}
          bodyweightValue={todaysBodyweight}
          onBodyweightChange={updateBodyweight}
        />
      ) : (
        <SessionDetailScreen
          session={viewingSession}
          bodyweight={bodyweight}
          onBack={() => setScreen("home")}
          onDelete={deleteSession}
          onUpdate={updateSessionEntry}
          onBodyweightChange={(value) => updateBodyweight(value, viewingSession.date)}
          saveState={saveState}
        />
      )}
    </div>
  );
}

function HomeScreen({ onPick, recentSessions, bodyweight, onExport, copyState, hasData, onOpenSession }) {
  const sortedBW = [...bodyweight].filter((b) => b.weight !== "").sort((a, b) => (a.date < b.date ? 1 : -1));
  const latestBW = sortedBW[0];
  const prevBW = sortedBW[1];
  const delta = latestBW && prevBW ? (parseFloat(latestBW.weight) - parseFloat(prevBW.weight)) : null;

  return (
    <div className="wt-home">
      <div className="wt-eyebrow">Hypertrophy · 3-day full body</div>
      <h1 className="wt-title">Pick today's session</h1>
      <div className="wt-plate-row">
        {Object.values(PLANS).map((p) => (
          <button key={p.id} className="wt-plate" onClick={() => onPick(p.id)}>
            <span className="wt-plate-ring">
              <span className="wt-plate-letter">{p.id}</span>
            </span>
            <span className="wt-plate-sub">{p.subtitle}</span>
          </button>
        ))}
      </div>

      {latestBW && (
        <div className="wt-bw-summary">
          <div className="wt-bw-summary-left">
            <Scale size={16} className="wt-bw-summary-icon" />
            <div>
              <div className="wt-bw-summary-value">{latestBW.weight} kg</div>
              <div className="wt-bw-summary-date">{formatDate(latestBW.date)}</div>
            </div>
          </div>
          {delta !== null && !Number.isNaN(delta) && (
            <div className={`wt-bw-delta ${delta > 0 ? "up" : delta < 0 ? "down" : ""}`}>
              {delta > 0 ? <TrendingUp size={13} /> : delta < 0 ? <TrendingDown size={13} /> : null}
              {delta === 0 ? "no change" : `${delta > 0 ? "+" : ""}${delta.toFixed(1)} kg`}
            </div>
          )}
        </div>
      )}

      {recentSessions.length > 0 && (
        <div className="wt-recent">
          <div className="wt-recent-head">
            <History size={14} strokeWidth={2.5} />
            <span>Recent sessions</span>
          </div>
          {recentSessions.map((s) => {
            const total = PLANS[s.planId].exercises.length;
            const done = Object.values(s.entries).filter((sets) => sets.some((x) => x.weight !== "" || x.reps !== "")).length;
            return (
              <button key={s.date + s.planId} className="wt-recent-row" onClick={() => onOpenSession(s)}>
                <span className="wt-recent-date">{formatDate(s.date)}</span>
                <span className="wt-recent-plan">Day {s.planId}</span>
                <span className="wt-recent-progress">{done}/{total} logged</span>
              </button>
            );
          })}
        </div>
      )}

      {hasData && (
        <button className="wt-export" onClick={onExport}>
          <ClipboardCopy size={14} />
          {copyState === "copied" ? "Copied! Paste into Google Sheets" : copyState === "error" ? "Couldn't copy — try again" : "Copy data for Google Sheets"}
        </button>
      )}
    </div>
  );
}

function WorkoutScreen({ plan, entries, expanded, lastValues, onToggle, onUpdate, onUseLast, setsLoggedCount, onBack, saveState, bodyweightValue, onBodyweightChange }) {
  const data = PLANS[plan];
  return (
    <div className="wt-workout">
      <div className="wt-header">
        <button className="wt-back" onClick={onBack} aria-label="Back">
          <ArrowLeft size={20} />
        </button>
        <div className="wt-header-mid">
          <span className="wt-header-plan">Day {plan}</span>
          <span className="wt-header-sub">{data.subtitle}</span>
        </div>
        <span className={`wt-save-pill ${saveState}`}>
          {saveState === "saving" ? "Saving…" : saveState === "saved" ? <><Check size={12} strokeWidth={3} /> Saved</> : ""}
        </span>
      </div>

      <div className="wt-list">
        {data.exercises.map((ex) => {
          const isOpen = !!expanded[ex.id];
          const logged = setsLoggedCount(ex.id);
          const last = lastValues[ex.id];
          return (
            <div key={ex.id} className={`wt-card ${isOpen ? "open" : ""}`}>
              <button className="wt-card-head" onClick={() => onToggle(ex.id)}>
                <div className="wt-card-head-left">
                  <div className="wt-card-name">{ex.name}</div>
                  <div className="wt-card-target">
                    {ex.mode === "time" ? <Clock3 size={12} /> : <Dumbbell size={12} />}
                    {ex.sets} × {ex.target}
                  </div>
                </div>
                <div className="wt-card-head-right">
                  <div className="wt-dots">
                    {Array.from({ length: ex.sets }).map((_, i) => (
                      <span key={i} className={`wt-dot ${i < logged ? "filled" : ""}`} />
                    ))}
                  </div>
                  <ChevronDown size={18} className="wt-chevron" />
                </div>
              </button>

              {isOpen && (
                <div className="wt-card-body">
                  <p className="wt-howto">{ex.howTo}</p>

                  {last && (
                    <div className="wt-last-row">
                      <span>
                        Last: {last.weight || "—"}{ex.mode === "time" ? "s" : "kg"}
                        {ex.mode !== "time" && last.reps ? ` × ${last.reps}` : ""}
                      </span>
                      <button className="wt-use-last" onClick={() => onUseLast(ex.id)}>Use last</button>
                    </div>
                  )}

                  <div className="wt-sets">
                    {entries[ex.id]?.map((set, idx) => (
                      <div className="wt-set-row" key={idx}>
                        <span className="wt-set-label">Set {idx + 1}</span>
                        {ex.mode === "time" ? (
                          <input
                            className="wt-input"
                            type="number"
                            inputMode="numeric"
                            placeholder="sec"
                            value={set.reps}
                            onChange={(e) => onUpdate(ex.id, idx, "reps", e.target.value)}
                          />
                        ) : (
                          <>
                            <input
                              className="wt-input"
                              type="number"
                              inputMode="decimal"
                              placeholder="kg"
                              value={set.weight}
                              onChange={(e) => onUpdate(ex.id, idx, "weight", e.target.value)}
                            />
                            <span className="wt-x">×</span>
                            <input
                              className="wt-input"
                              type="number"
                              inputMode="numeric"
                              placeholder="reps"
                              value={set.reps}
                              onChange={(e) => onUpdate(ex.id, idx, "reps", e.target.value)}
                            />
                          </>
                        )}
                      </div>
                    ))}
                  </div>
                </div>
              )}
            </div>
          );
        })}
      </div>

      <div className="wt-bw-card">
        <div className="wt-bw-head">
          <Scale size={14} />
          <span>Bodyweight today</span>
        </div>
        <div className="wt-bw-input-row">
          <input
            className="wt-input"
            type="number"
            inputMode="decimal"
            placeholder="e.g. 78.5"
            value={bodyweightValue}
            onChange={(e) => onBodyweightChange(e.target.value)}
          />
          <span className="wt-bw-unit">kg</span>
        </div>
      </div>

      <div className="wt-footer-note">Entries save automatically as you type.</div>
    </div>
  );
}

function SessionDetailScreen({ session, bodyweight, onBack, onDelete, onUpdate, onBodyweightChange, saveState }) {
  const data = PLANS[session.planId];
  const bwValue = bodyweight.find((b) => b.date === session.date)?.weight ?? "";

  const handleDelete = () => {
    const ok = window.confirm(
      `Delete your Day ${session.planId} log from ${formatDate(session.date)}? This can't be undone.`
    );
    if (ok) onDelete(session);
  };

  return (
    <div className="wt-workout">
      <div className="wt-header">
        <button className="wt-back" onClick={onBack} aria-label="Back">
          <ArrowLeft size={20} />
        </button>
        <div className="wt-header-mid">
          <span className="wt-header-plan">Day {session.planId} · {formatDate(session.date)}</span>
          <span className="wt-header-sub">{data.subtitle}</span>
        </div>
        <span className={`wt-save-pill ${saveState}`}>
          {saveState === "saving" ? "Saving…" : saveState === "saved" ? <><Check size={12} strokeWidth={3} /> Saved</> : ""}
        </span>
      </div>

      <div className="wt-list">
        {data.exercises.map((ex) => {
          const sets = session.entries[ex.id] || [];
          return (
            <div key={ex.id} className="wt-card">
              <div className="wt-card-head wt-card-head-static">
                <div className="wt-card-head-left">
                  <div className="wt-card-name">{ex.name}</div>
                  <div className="wt-card-target">
                    {ex.mode === "time" ? <Clock3 size={12} /> : <Dumbbell size={12} />}
                    {ex.sets} × {ex.target}
                  </div>
                </div>
              </div>
              <div className="wt-card-body">
                <div className="wt-sets">
                  {sets.map((set, idx) => (
                    <div className="wt-set-row" key={idx}>
                      <span className="wt-set-label">Set {idx + 1}</span>
                      {ex.mode === "time" ? (
                        <input
                          className="wt-input"
                          type="number"
                          inputMode="numeric"
                          placeholder="sec"
                          value={set.reps}
                          onChange={(e) => onUpdate(session, ex.id, idx, "reps", e.target.value)}
                        />
                      ) : (
                        <>
                          <input
                            className="wt-input"
                            type="number"
                            inputMode="decimal"
                            placeholder="kg"
                            value={set.weight}
                            onChange={(e) => onUpdate(session, ex.id, idx, "weight", e.target.value)}
                          />
                          <span className="wt-x">×</span>
                          <input
                            className="wt-input"
                            type="number"
                            inputMode="numeric"
                            placeholder="reps"
                            value={set.reps}
                            onChange={(e) => onUpdate(session, ex.id, idx, "reps", e.target.value)}
                          />
                        </>
                      )}
                    </div>
                  ))}
                </div>
              </div>
            </div>
          );
        })}
      </div>

      <div className="wt-bw-card">
        <div className="wt-bw-head">
          <Scale size={14} />
          <span>Bodyweight that day</span>
        </div>
        <div className="wt-bw-input-row">
          <input
            className="wt-input"
            type="number"
            inputMode="decimal"
            placeholder="e.g. 78.5"
            value={bwValue}
            onChange={(e) => onBodyweightChange(e.target.value)}
          />
          <span className="wt-bw-unit">kg</span>
        </div>
      </div>

      <button className="wt-delete-btn" onClick={handleDelete}>
        <Trash2 size={14} />
        Delete this session
      </button>
    </div>
  );
}

function formatDate(d) {
  const date = new Date(d + "T00:00:00");
  return date.toLocaleDateString(undefined, { month: "short", day: "numeric" });
}

const COLORS = {
  bg: "#15161A",
  bg2: "#1D1F26",
  bg3: "#262933",
  text: "#EDEBE4",
  textDim: "#8B8D96",
  accent: "#D9A521",
  accentDim: "rgba(217,165,33,0.16)",
};

const FONT = "-apple-system, BlinkMacSystemFont, 'Segoe UI', Inter, Roboto, sans-serif";

const CSS = `
  * { box-sizing: border-box; }
  .wt-home { max-width: 480px; margin: 0 auto; padding: 32px 20px 48px; }
  .wt-eyebrow { color: ${COLORS.accent}; font-size: 11px; font-weight: 700; letter-spacing: 0.12em; text-transform: uppercase; margin-bottom: 8px; }
  .wt-title { font-size: 26px; font-weight: 800; letter-spacing: -0.01em; margin: 0 0 28px; color: ${COLORS.text}; }
  .wt-plate-row { display: flex; gap: 14px; justify-content: space-between; }
  .wt-plate { background: none; border: none; padding: 0; display: flex; flex-direction: column; align-items: center; gap: 10px; flex: 1; cursor: pointer; }
  .wt-plate-ring { width: 84px; height: 84px; border-radius: 50%; background: radial-gradient(circle at 32% 28%, ${COLORS.bg3}, ${COLORS.bg2} 70%); border: 3px solid ${COLORS.accentDim}; display: flex; align-items: center; justify-content: center; transition: border-color 0.15s, transform 0.15s; }
  .wt-plate:active .wt-plate-ring { transform: scale(0.96); border-color: ${COLORS.accent}; }
  .wt-plate-letter { font-size: 32px; font-weight: 800; color: ${COLORS.text}; }
  .wt-plate-sub { font-size: 12px; color: ${COLORS.textDim}; text-align: center; font-weight: 500; }
  .wt-recent { margin-top: 44px; }
  .wt-recent-head { display: flex; align-items: center; gap: 6px; color: ${COLORS.textDim}; font-size: 11px; font-weight: 700; letter-spacing: 0.08em; text-transform: uppercase; margin-bottom: 12px; }
  .wt-recent-row { display: flex; align-items: center; justify-content: space-between; padding: 12px 14px; background: ${COLORS.bg2}; border-radius: 10px; margin-bottom: 8px; font-size: 13px; width: 100%; border: 1px solid transparent; font-family: inherit; color: inherit; cursor: pointer; }
  .wt-recent-row:active { border-color: ${COLORS.accentDim}; }
  .wt-recent-date { color: ${COLORS.text}; font-weight: 600; width: 56px; }
  .wt-recent-plan { color: ${COLORS.textDim}; flex: 1; text-align: center; }
  .wt-recent-progress { color: ${COLORS.accent}; font-weight: 600; }

  .wt-bw-summary { margin-top: 24px; display: flex; align-items: center; justify-content: space-between; background: ${COLORS.bg2}; border-radius: 12px; padding: 12px 16px; border: 1px solid rgba(237,235,228,0.05); }
  .wt-bw-summary-left { display: flex; align-items: center; gap: 10px; }
  .wt-bw-summary-icon { color: ${COLORS.accent}; }
  .wt-bw-summary-value { font-weight: 800; font-size: 15px; }
  .wt-bw-summary-date { font-size: 11px; color: ${COLORS.textDim}; }
  .wt-bw-delta { font-size: 12px; font-weight: 700; color: ${COLORS.textDim}; display: flex; align-items: center; gap: 3px; }
  .wt-bw-delta.up { color: #C4694F; }
  .wt-bw-delta.down { color: #6FA88A; }

  .wt-bw-card { margin: 4px 16px 0; background: ${COLORS.bg2}; border-radius: 14px; padding: 14px 16px; border: 1px solid rgba(237,235,228,0.05); }
  .wt-bw-head { display: flex; align-items: center; gap: 6px; font-size: 12.5px; font-weight: 700; color: ${COLORS.textDim}; text-transform: uppercase; letter-spacing: 0.06em; margin-bottom: 10px; }
  .wt-bw-input-row { display: flex; align-items: center; gap: 8px; }
  .wt-bw-unit { font-size: 12px; color: ${COLORS.textDim}; flex-shrink: 0; }

  .wt-export { margin-top: 24px; width: 100%; display: flex; align-items: center; justify-content: center; gap: 8px; background: ${COLORS.bg2}; border: 1px dashed rgba(237,235,228,0.15); color: ${COLORS.textDim}; font-size: 12.5px; font-weight: 600; padding: 12px; border-radius: 12px; cursor: pointer; }
  .wt-export:active { border-color: ${COLORS.accent}; color: ${COLORS.accent}; }

  .wt-workout { max-width: 480px; margin: 0 auto; padding-bottom: 40px; }
  .wt-header { display: flex; align-items: center; gap: 12px; padding: 18px 16px; position: sticky; top: 0; background: ${COLORS.bg}; z-index: 5; border-bottom: 1px solid rgba(237,235,228,0.06); }
  .wt-back { background: ${COLORS.bg2}; border: none; color: ${COLORS.text}; width: 36px; height: 36px; border-radius: 10px; display: flex; align-items: center; justify-content: center; cursor: pointer; }
  .wt-header-mid { flex: 1; display: flex; flex-direction: column; }
  .wt-header-plan { font-weight: 800; font-size: 16px; }
  .wt-header-sub { font-size: 12px; color: ${COLORS.textDim}; }
  .wt-save-pill { font-size: 11px; color: ${COLORS.accent}; font-weight: 700; display: flex; align-items: center; gap: 3px; min-width: 56px; justify-content: flex-end; }

  .wt-list { padding: 14px 16px 0; display: flex; flex-direction: column; gap: 10px; }
  .wt-card { background: ${COLORS.bg2}; border-radius: 14px; overflow: hidden; border: 1px solid rgba(237,235,228,0.05); }
  .wt-card.open { border-color: ${COLORS.accentDim}; }
  .wt-card-head { width: 100%; background: none; border: none; padding: 14px 16px; display: flex; align-items: center; justify-content: space-between; cursor: pointer; color: inherit; text-align: left; }
  .wt-card-head-static { cursor: default; }
  .wt-card-name { font-weight: 700; font-size: 14.5px; margin-bottom: 4px; }
  .wt-card-target { font-size: 11.5px; color: ${COLORS.textDim}; display: flex; align-items: center; gap: 5px; }
  .wt-card-head-right { display: flex; align-items: center; gap: 10px; }
  .wt-dots { display: flex; gap: 4px; }
  .wt-dot { width: 6px; height: 6px; border-radius: 50%; background: rgba(237,235,228,0.15); }
  .wt-dot.filled { background: ${COLORS.accent}; }
  .wt-chevron { color: ${COLORS.textDim}; transition: transform 0.15s; }
  .wt-card.open .wt-chevron { transform: rotate(180deg); }
  .wt-card-body { padding: 0 16px 16px; }
  .wt-howto { font-size: 12.5px; color: ${COLORS.textDim}; line-height: 1.5; margin: 0 0 12px; font-style: italic; }
  .wt-last-row { display: flex; align-items: center; justify-content: space-between; font-size: 12px; color: ${COLORS.text}; background: ${COLORS.bg3}; padding: 8px 10px; border-radius: 8px; margin-bottom: 12px; }
  .wt-use-last { background: ${COLORS.accentDim}; color: ${COLORS.accent}; border: none; font-size: 11px; font-weight: 700; padding: 5px 10px; border-radius: 6px; cursor: pointer; }
  .wt-sets { display: flex; flex-direction: column; gap: 8px; }
  .wt-set-row { display: flex; align-items: center; gap: 8px; }
  .wt-set-label { font-size: 12px; color: ${COLORS.textDim}; width: 44px; flex-shrink: 0; }
  .wt-input { background: ${COLORS.bg3}; border: 1px solid rgba(237,235,228,0.08); color: ${COLORS.text}; border-radius: 8px; padding: 10px 10px; font-size: 15px; width: 100%; min-width: 0; }
  .wt-input:focus { outline: none; border-color: ${COLORS.accent}; }
  .wt-x { color: ${COLORS.textDim}; font-size: 12px; flex-shrink: 0; }
  .wt-footer-note { text-align: center; font-size: 11px; color: ${COLORS.textDim}; margin-top: 18px; }

  .wt-delete-btn { margin: 20px 16px 0; width: calc(100% - 32px); display: flex; align-items: center; justify-content: center; gap: 8px; background: none; border: 1px solid rgba(196,105,79,0.3); color: #C4694F; font-size: 12.5px; font-weight: 600; padding: 12px; border-radius: 12px; cursor: pointer; }
  .wt-delete-btn:active { background: rgba(196,105,79,0.1); }

  input[type=number]::-webkit-inner-spin-button, input[type=number]::-webkit-outer-spin-button { -webkit-appearance: none; margin: 0; }
`;
