import React, { useState, useEffect, useCallback, useRef } from "react";
import { ChevronDown, ChevronLeft, ChevronRight, Check, ArrowLeft, Dumbbell, Clock3, History, Scale, TrendingUp, TrendingDown, ClipboardCopy, Trash2, CalendarDays, Timer } from "lucide-react";

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
      { id: "b6", name: "Dumbbell Biceps Curl", sets: 3, target: "12–15 reps", mode: "weight", howTo: "Curl the dumbbells up without swinging your elbows forward, squeeze at the top, lower under control." },
      { id: "b7", name: "Plank", sets: 3, target: "45 sec hold", mode: "time", howTo: "Hold a straight line from shoulders to heels, brace your core, keep your hips from sagging." },
    ],
  },
  C: {
    id: "C",
    subtitle: "Press & Pull Balance",
    exercises: [
      { id: "c1", name: "Flat Dumbbell Press", sets: 4, target: "8–10 reps", mode: "weight", howTo: "Press the dumbbells from chest height straight up until your arms extend, without locking out hard at the top." },
      { id: "c2", name: "Seated Dip Machine", sets: 4, target: "8–10 reps", mode: "weight", howTo: "Press down through the handles until your arms extend, lean slightly forward to keep tension on your chest." },
      { id: "c3", name: "Incline Dumbbell Curl", sets: 3, target: "10–12 reps", mode: "weight", howTo: "Seated on an incline bench, let your arms hang straight down and curl without swinging your shoulders forward." },
      { id: "c4", name: "Hammer Curl", sets: 3, target: "10–12 reps", mode: "weight", howTo: "Curl the dumbbells with palms facing each other the whole rep, keep your elbows pinned to your sides." },
      { id: "c5", name: "Chest-Supported Row", sets: 3, target: "10–12 reps", mode: "weight", howTo: "Chest braced on the pad, row the handles to your ribs, squeeze your back." },
      { id: "c6", name: "Triceps Pushdown", sets: 3, target: "12–15 reps", mode: "weight", howTo: "Keep your elbows pinned to your sides, push the bar down to full extension, control the return." },
      { id: "c7", name: "Plank", sets: 3, target: "45 sec hold", mode: "time", howTo: "Hold a straight line from shoulders to heels, brace your core, keep your hips from sagging." },
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

function exerciseTrendPoints(sessions, exId, mode, excludeDate) {
  return [...sessions]
    .filter((s) => s.date !== excludeDate)
    .sort((a, b) => (a.date < b.date ? -1 : 1))
    .map((s) => {
      const sets = (s.entries[exId] || []).filter((x) => x.weight !== "" || x.reps !== "");
      if (!sets.length) return null;
      const value = Math.max(...sets.map((x) => parseFloat(mode === "time" ? x.reps : x.weight) || 0));
      return value > 0 ? { date: s.date, value } : null;
    })
    .filter(Boolean);
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
  const [screen, setScreen] = useState("home"); // home | workout | session | calendar | bwlog
  const [plan, setPlan] = useState(null);
  const [viewingSession, setViewingSession] = useState(null);
  const [sessionReturnTo, setSessionReturnTo] = useState("home");
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

  const deleteBodyweightEntry = (date) => {
    const next = bodyweight.filter((b) => b.date !== date);
    setBodyweight(next);
    persist(lastValues, sessions, next);
  };

  const openSession = (session, returnTo = "home") => {
    setViewingSession(session);
    setSessionReturnTo(returnTo);
    setScreen("session");
  };

  const deleteSession = (session) => {
    const nextSessions = sessions.filter((s) => !(s.date === session.date && s.planId === session.planId));
    setSessions(nextSessions);
    persist(lastValues, nextSessions, bodyweight);
    setScreen(sessionReturnTo);
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
          onOpenCalendar={() => setScreen("calendar")}
          onOpenBodyweightLog={() => setScreen("bwlog")}
        />
      ) : screen === "workout" ? (
        <WorkoutScreen
          plan={plan}
          sessions={sessions}
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
      ) : screen === "calendar" ? (
        <CalendarScreen
          sessions={sessions}
          onBack={() => setScreen("home")}
          onOpenSession={(s) => openSession(s, "calendar")}
        />
      ) : screen === "bwlog" ? (
        <BodyweightLogScreen
          bodyweight={bodyweight}
          onBack={() => setScreen("home")}
          onChange={updateBodyweight}
          onDelete={deleteBodyweightEntry}
          saveState={saveState}
        />
      ) : (
        <SessionDetailScreen
          session={viewingSession}
          bodyweight={bodyweight}
          onBack={() => setScreen(sessionReturnTo)}
          onDelete={deleteSession}
          onUpdate={updateSessionEntry}
          onBodyweightChange={(value) => updateBodyweight(value, viewingSession.date)}
          saveState={saveState}
        />
      )}
    </div>
  );
}

function HomeScreen({ onPick, recentSessions, bodyweight, onExport, copyState, hasData, onOpenSession, onOpenCalendar, onOpenBodyweightLog }) {
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

      {latestBW ? (
        <div className="wt-bw-summary">
          <div className="wt-bw-summary-top">
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
          <BodyweightTrend bodyweight={bodyweight} />
          <button className="wt-cal-link wt-bw-editlink" onClick={onOpenBodyweightLog}>
            <Scale size={13} />
            Edit bodyweight log
          </button>
        </div>
      ) : (
        <button className="wt-bw-empty-cta" onClick={onOpenBodyweightLog}>
          <Scale size={16} />
          Log your bodyweight
        </button>
      )}

      {recentSessions.length > 0 && (
        <div className="wt-recent">
          <div className="wt-recent-head">
            <div className="wt-recent-head-left">
              <History size={14} strokeWidth={2.5} />
              <span>Recent sessions</span>
            </div>
            <button className="wt-cal-link" onClick={onOpenCalendar}>
              <CalendarDays size={13} />
              Full history
            </button>
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

function Sparkline({ points, unit, wrapperClassName }) {
  const [activeIdx, setActiveIdx] = useState(null);

  if (points.length < 2) return null;

  const W = 300, H = 48, PAD_X = 6, PAD_Y = 8;
  const values = points.map((p) => p.value);
  const min = Math.min(...values);
  const max = Math.max(...values);
  const range = max - min || 1;

  const coords = points.map((p, i) => ({
    ...p,
    x: PAD_X + (i / (points.length - 1)) * (W - PAD_X * 2),
    y: PAD_Y + (1 - (p.value - min) / range) * (H - PAD_Y * 2),
  }));

  const linePoints = coords.map((c) => `${c.x},${c.y}`).join(" ");
  const shown = activeIdx !== null ? coords[activeIdx] : coords[coords.length - 1];

  return (
    <div className={wrapperClassName}>
      <svg viewBox={`0 0 ${W} ${H}`} preserveAspectRatio="none" className="wt-trend-svg">
        <polyline points={linePoints} className="wt-trend-line" />
        <circle cx={shown.x} cy={shown.y} r={4} className="wt-trend-dot" />
        {coords.map((c, i) => (
          <circle key={i} cx={c.x} cy={c.y} r={12} fill="transparent" onClick={() => setActiveIdx(i)} />
        ))}
      </svg>
      <div className="wt-trend-caption">
        <strong>{shown.value}{unit}</strong> · {formatDate(shown.date)}
      </div>
    </div>
  );
}

function BodyweightTrend({ bodyweight }) {
  const points = [...bodyweight]
    .filter((b) => b.weight !== "" && !Number.isNaN(parseFloat(b.weight)))
    .sort((a, b) => (a.date < b.date ? -1 : 1))
    .slice(-30)
    .map((b) => ({ date: b.date, value: parseFloat(b.weight) }));

  return <Sparkline points={points} unit=" kg" wrapperClassName="wt-bw-trend" />;
}

function ExerciseTrend({ sessions, exId, mode }) {
  const points = exerciseTrendPoints(sessions, exId, mode, todayStr());
  return <Sparkline points={points} unit={mode === "time" ? "s" : " kg"} wrapperClassName="wt-ex-trend" />;
}

function RestTimer() {
  const [secondsLeft, setSecondsLeft] = useState(null); // null = idle
  const [done, setDone] = useState(false);
  const intervalRef = useRef(null);

  const start = (secs) => {
    clearInterval(intervalRef.current);
    setDone(false);
    setSecondsLeft(secs);
    intervalRef.current = setInterval(() => {
      setSecondsLeft((prev) => {
        if (prev === null) return null;
        if (prev <= 1) {
          clearInterval(intervalRef.current);
          if (navigator.vibrate) navigator.vibrate([300, 100, 300]);
          setDone(true);
          return 0;
        }
        return prev - 1;
      });
    }, 1000);
  };

  const reset = () => {
    clearInterval(intervalRef.current);
    setSecondsLeft(null);
    setDone(false);
  };

  useEffect(() => () => clearInterval(intervalRef.current), []);

  const fmt = (s) => `${Math.floor(s / 60)}:${String(s % 60).padStart(2, "0")}`;

  return (
    <div className={`wt-timer ${done ? "done" : ""}`}>
      {secondsLeft === null ? (
        <>
          <span className="wt-timer-label"><Timer size={14} /> Rest</span>
          {[60, 90, 120].map((s) => (
            <button key={s} className="wt-timer-preset" onClick={() => start(s)}>{fmt(s)}</button>
          ))}
        </>
      ) : (
        <button className="wt-timer-running" onClick={reset}>
          <span className="wt-timer-count">{done ? "Go!" : fmt(secondsLeft)}</span>
          <span className="wt-timer-hint">{done ? "tap to reset" : "tap to cancel"}</span>
        </button>
      )}
    </div>
  );
}

function WorkoutScreen({ plan, sessions, entries, expanded, lastValues, onToggle, onUpdate, onUseLast, setsLoggedCount, onBack, saveState, bodyweightValue, onBodyweightChange }) {
  const data = PLANS[plan];
  return (
    <div className="wt-workout wt-with-timer">
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

                  <ExerciseTrend sessions={sessions} exId={ex.id} mode={ex.mode} />

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

      <RestTimer />
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

const WEEKDAY_LABELS = ["S", "M", "T", "W", "T", "F", "S"];

function getMonthGrid(year, month) {
  const firstWeekday = new Date(year, month, 1).getDay();
  const daysInMonth = new Date(year, month + 1, 0).getDate();
  const cells = [];
  for (let i = 0; i < firstWeekday; i++) cells.push(null);
  for (let day = 1; day <= daysInMonth; day++) {
    const dateStr = `${year}-${String(month + 1).padStart(2, "0")}-${String(day).padStart(2, "0")}`;
    cells.push({ day, dateStr });
  }
  while (cells.length % 7 !== 0) cells.push(null);
  return cells;
}

function CalendarScreen({ sessions, onBack, onOpenSession }) {
  const now = new Date();
  const [view, setView] = useState({ year: now.getFullYear(), month: now.getMonth() });
  const [selectedDate, setSelectedDate] = useState(null);

  const cells = getMonthGrid(view.year, view.month);
  const monthLabel = new Date(view.year, view.month, 1).toLocaleDateString(undefined, { month: "long", year: "numeric" });
  const todayStr2 = todayStr();

  const goMonth = (delta) => {
    setSelectedDate(null);
    setView((prev) => {
      let month = prev.month + delta;
      let year = prev.year;
      if (month < 0) { month = 11; year -= 1; }
      if (month > 11) { month = 0; year += 1; }
      return { year, month };
    });
  };

  const sessionsForDate = (dateStr) => sessions.filter((s) => s.date === dateStr);
  const selectedSessions = selectedDate ? sessionsForDate(selectedDate) : [];

  return (
    <div className="wt-workout">
      <div className="wt-header">
        <button className="wt-back" onClick={onBack} aria-label="Back">
          <ArrowLeft size={20} />
        </button>
        <div className="wt-header-mid">
          <span className="wt-header-plan">Workout history</span>
        </div>
      </div>

      <div className="wt-cal">
        <div className="wt-cal-nav">
          <button className="wt-cal-nav-btn" onClick={() => goMonth(-1)} aria-label="Previous month">
            <ChevronLeft size={18} />
          </button>
          <span className="wt-cal-month">{monthLabel}</span>
          <button className="wt-cal-nav-btn" onClick={() => goMonth(1)} aria-label="Next month">
            <ChevronRight size={18} />
          </button>
        </div>

        <div className="wt-cal-weekdays">
          {WEEKDAY_LABELS.map((w, i) => (
            <span key={i}>{w}</span>
          ))}
        </div>

        <div className="wt-cal-grid">
          {cells.map((cell, i) => {
            if (!cell) return <div key={i} className="wt-cal-cell empty" />;
            const daySessions = sessionsForDate(cell.dateStr);
            const isToday = cell.dateStr === todayStr2;
            const isSelected = cell.dateStr === selectedDate;
            return (
              <button
                key={i}
                className={`wt-cal-cell ${isToday ? "today" : ""} ${isSelected ? "selected" : ""}`}
                onClick={() => setSelectedDate(cell.dateStr)}
              >
                <span className="wt-cal-daynum">{cell.day}</span>
                {daySessions.length > 0 && (
                  <span className="wt-cal-badges">
                    {daySessions.map((s) => (
                      <span key={s.planId} className="wt-cal-badge">{s.planId}</span>
                    ))}
                  </span>
                )}
              </button>
            );
          })}
        </div>
      </div>

      {selectedDate && (
        <div className="wt-recent" style={{ padding: "0 16px" }}>
          <div className="wt-recent-head">
            <div className="wt-recent-head-left">
              <History size={14} strokeWidth={2.5} />
              <span>{formatDate(selectedDate)}</span>
            </div>
          </div>
          {selectedSessions.length === 0 ? (
            <div className="wt-cal-empty-note">No workout logged this day.</div>
          ) : (
            selectedSessions.map((s) => {
              const total = PLANS[s.planId].exercises.length;
              const done = Object.values(s.entries).filter((sets) => sets.some((x) => x.weight !== "" || x.reps !== "")).length;
              return (
                <button key={s.planId} className="wt-recent-row" onClick={() => onOpenSession(s)}>
                  <span className="wt-recent-date">{formatDate(s.date)}</span>
                  <span className="wt-recent-plan">Day {s.planId}</span>
                  <span className="wt-recent-progress">{done}/{total} logged</span>
                </button>
              );
            })
          )}
        </div>
      )}
    </div>
  );
}

function BodyweightLogScreen({ bodyweight, onBack, onChange, onDelete, saveState }) {
  const [newDate, setNewDate] = useState(todayStr());
  const [newWeight, setNewWeight] = useState("");

  const sorted = [...bodyweight].filter((b) => b.weight !== "").sort((a, b) => (a.date < b.date ? 1 : -1));

  const handleAdd = () => {
    if (!newWeight) return;
    onChange(newWeight, newDate);
    setNewWeight("");
  };

  const handleDelete = (date) => {
    if (window.confirm(`Delete the bodyweight entry for ${formatDate(date)}?`)) onDelete(date);
  };

  return (
    <div className="wt-workout">
      <div className="wt-header">
        <button className="wt-back" onClick={onBack} aria-label="Back">
          <ArrowLeft size={20} />
        </button>
        <div className="wt-header-mid">
          <span className="wt-header-plan">Bodyweight log</span>
        </div>
        <span className={`wt-save-pill ${saveState}`}>
          {saveState === "saving" ? "Saving…" : saveState === "saved" ? <><Check size={12} strokeWidth={3} /> Saved</> : ""}
        </span>
      </div>

      <div className="wt-bwlog-add">
        <input
          className="wt-input"
          type="date"
          value={newDate}
          max={todayStr()}
          onChange={(e) => setNewDate(e.target.value)}
        />
        <input
          className="wt-input"
          type="number"
          inputMode="decimal"
          placeholder="kg"
          value={newWeight}
          onChange={(e) => setNewWeight(e.target.value)}
        />
        <button className="wt-bwlog-add-btn" onClick={handleAdd}>Add</button>
      </div>

      <div className="wt-bwlog-list">
        {sorted.length === 0 ? (
          <div className="wt-cal-empty-note">No bodyweight entries yet.</div>
        ) : (
          sorted.map((b) => (
            <div key={b.date} className="wt-bwlog-row">
              <span className="wt-bwlog-date">{formatDate(b.date)}</span>
              <input
                className="wt-input wt-bwlog-input"
                type="number"
                inputMode="decimal"
                value={b.weight}
                onChange={(e) => onChange(e.target.value, b.date)}
              />
              <span className="wt-bwlog-unit">kg</span>
              <button className="wt-bwlog-delete" onClick={() => handleDelete(b.date)} aria-label="Delete entry">
                <Trash2 size={14} />
              </button>
            </div>
          ))
        )}
      </div>
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
  .wt-recent-head { display: flex; align-items: center; justify-content: space-between; gap: 6px; color: ${COLORS.textDim}; font-size: 11px; font-weight: 700; letter-spacing: 0.08em; text-transform: uppercase; margin-bottom: 12px; }
  .wt-recent-head-left { display: flex; align-items: center; gap: 6px; }
  .wt-cal-link { display: flex; align-items: center; gap: 4px; background: none; border: none; color: ${COLORS.accent}; font-size: 11px; font-weight: 700; letter-spacing: 0.04em; text-transform: none; cursor: pointer; padding: 0; }
  .wt-recent-row { display: flex; align-items: center; justify-content: space-between; padding: 12px 14px; background: ${COLORS.bg2}; border-radius: 10px; margin-bottom: 8px; font-size: 13px; width: 100%; border: 1px solid transparent; font-family: inherit; color: inherit; cursor: pointer; }
  .wt-recent-row:active { border-color: ${COLORS.accentDim}; }
  .wt-recent-date { color: ${COLORS.text}; font-weight: 600; width: 56px; }
  .wt-recent-plan { color: ${COLORS.textDim}; flex: 1; text-align: center; }
  .wt-recent-progress { color: ${COLORS.accent}; font-weight: 600; }

  .wt-cal { padding: 14px 16px 0; }
  .wt-cal-nav { display: flex; align-items: center; justify-content: space-between; margin-bottom: 12px; }
  .wt-cal-nav-btn { background: ${COLORS.bg2}; border: none; color: ${COLORS.text}; width: 32px; height: 32px; border-radius: 8px; display: flex; align-items: center; justify-content: center; cursor: pointer; }
  .wt-cal-month { font-weight: 700; font-size: 14px; }
  .wt-cal-weekdays { display: grid; grid-template-columns: repeat(7, 1fr); text-align: center; font-size: 11px; color: ${COLORS.textDim}; font-weight: 700; margin-bottom: 4px; }
  .wt-cal-grid { display: grid; grid-template-columns: repeat(7, 1fr); gap: 4px; }
  .wt-cal-cell { aspect-ratio: 1; background: ${COLORS.bg2}; border: 1px solid transparent; border-radius: 8px; display: flex; flex-direction: column; align-items: center; justify-content: center; gap: 2px; cursor: pointer; color: inherit; font-family: inherit; padding: 2px; min-width: 0; }
  .wt-cal-cell.empty { background: none; cursor: default; }
  .wt-cal-cell.today { border-color: ${COLORS.accent}; }
  .wt-cal-cell.selected { background: ${COLORS.accentDim}; }
  .wt-cal-daynum { font-size: 11.5px; color: ${COLORS.text}; }
  .wt-cal-badges { display: flex; gap: 2px; flex-wrap: wrap; justify-content: center; }
  .wt-cal-badge { font-size: 8.5px; font-weight: 700; color: ${COLORS.bg}; background: ${COLORS.accent}; width: 12px; height: 12px; border-radius: 50%; display: flex; align-items: center; justify-content: center; line-height: 1; }
  .wt-cal-empty-note { font-size: 12.5px; color: ${COLORS.textDim}; font-style: italic; padding: 8px 2px; }

  .wt-bw-summary { margin-top: 24px; display: flex; flex-direction: column; gap: 10px; background: ${COLORS.bg2}; border-radius: 12px; padding: 12px 16px; border: 1px solid rgba(237,235,228,0.05); }
  .wt-bw-summary-top { display: flex; align-items: center; justify-content: space-between; }
  .wt-bw-summary-left { display: flex; align-items: center; gap: 10px; }
  .wt-bw-summary-icon { color: ${COLORS.accent}; }
  .wt-bw-summary-value { font-weight: 800; font-size: 15px; }
  .wt-bw-summary-date { font-size: 11px; color: ${COLORS.textDim}; }
  .wt-bw-delta { font-size: 12px; font-weight: 700; color: ${COLORS.textDim}; display: flex; align-items: center; gap: 3px; }
  .wt-bw-delta.up { color: #C4694F; }
  .wt-bw-delta.down { color: #6FA88A; }

  .wt-bw-trend { border-top: 1px solid rgba(237,235,228,0.06); padding-top: 10px; }
  .wt-ex-trend { margin-bottom: 12px; }
  .wt-trend-svg { width: 100%; height: 48px; display: block; cursor: pointer; }
  .wt-trend-line { fill: none; stroke: ${COLORS.textDim}; stroke-width: 2; stroke-linecap: round; stroke-linejoin: round; }
  .wt-trend-dot { fill: ${COLORS.accent}; stroke: ${COLORS.bg2}; stroke-width: 2; }
  .wt-trend-caption { font-size: 11px; color: ${COLORS.textDim}; text-align: right; margin-top: 4px; }
  .wt-trend-caption strong { color: ${COLORS.text}; font-weight: 700; }

  .wt-bw-card { margin: 4px 16px 0; background: ${COLORS.bg2}; border-radius: 14px; padding: 14px 16px; border: 1px solid rgba(237,235,228,0.05); }
  .wt-bw-head { display: flex; align-items: center; gap: 6px; font-size: 12.5px; font-weight: 700; color: ${COLORS.textDim}; text-transform: uppercase; letter-spacing: 0.06em; margin-bottom: 10px; }
  .wt-bw-input-row { display: flex; align-items: center; gap: 8px; }
  .wt-bw-unit { font-size: 12px; color: ${COLORS.textDim}; flex-shrink: 0; }

  .wt-bw-editlink { justify-content: center; border-top: 1px solid rgba(237,235,228,0.06); padding-top: 10px; width: 100%; }
  .wt-bw-empty-cta { margin-top: 24px; width: 100%; display: flex; align-items: center; justify-content: center; gap: 8px; background: ${COLORS.bg2}; border: 1px dashed rgba(237,235,228,0.15); color: ${COLORS.textDim}; font-size: 13px; font-weight: 600; padding: 16px; border-radius: 12px; cursor: pointer; }
  .wt-bw-empty-cta:active { border-color: ${COLORS.accent}; color: ${COLORS.accent}; }

  .wt-bwlog-add { display: flex; gap: 8px; padding: 14px 16px 0; }
  .wt-bwlog-add-btn { background: ${COLORS.accent}; color: ${COLORS.bg}; border: none; font-weight: 700; font-size: 13px; padding: 0 16px; border-radius: 8px; cursor: pointer; flex-shrink: 0; }
  .wt-bwlog-list { padding: 14px 16px 0; display: flex; flex-direction: column; gap: 8px; }
  .wt-bwlog-row { display: flex; align-items: center; gap: 10px; background: ${COLORS.bg2}; border-radius: 10px; padding: 10px 12px; }
  .wt-bwlog-date { font-size: 12.5px; color: ${COLORS.textDim}; width: 52px; flex-shrink: 0; }
  .wt-bwlog-input { flex: 1; }
  .wt-bwlog-unit { font-size: 12px; color: ${COLORS.textDim}; flex-shrink: 0; }
  .wt-bwlog-delete { background: none; border: none; color: #C4694F; padding: 6px; cursor: pointer; flex-shrink: 0; display: flex; align-items: center; }

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

  .wt-with-timer { padding-bottom: 104px; }
  .wt-timer { position: fixed; bottom: 14px; left: 50%; transform: translateX(-50%); width: calc(100% - 32px); max-width: 448px; background: ${COLORS.bg3}; border: 1px solid rgba(237,235,228,0.08); border-radius: 14px; padding: 10px 14px; display: flex; align-items: center; gap: 10px; z-index: 10; box-shadow: 0 8px 24px rgba(0,0,0,0.45); }
  .wt-timer.done { border-color: ${COLORS.accent}; }
  .wt-timer-label { display: flex; align-items: center; gap: 6px; font-size: 12px; font-weight: 700; color: ${COLORS.textDim}; text-transform: uppercase; letter-spacing: 0.06em; flex: 1; }
  .wt-timer-preset { background: ${COLORS.bg2}; border: 1px solid rgba(237,235,228,0.08); color: ${COLORS.text}; font-weight: 700; font-size: 13px; padding: 8px 12px; border-radius: 8px; cursor: pointer; font-family: inherit; }
  .wt-timer-preset:active { border-color: ${COLORS.accent}; color: ${COLORS.accent}; }
  .wt-timer-running { flex: 1; display: flex; align-items: center; justify-content: space-between; background: none; border: none; color: inherit; cursor: pointer; padding: 2px 4px; font-family: inherit; }
  .wt-timer-count { font-size: 22px; font-weight: 800; color: ${COLORS.accent}; font-variant-numeric: tabular-nums; }
  .wt-timer-hint { font-size: 11px; color: ${COLORS.textDim}; }

  .wt-delete-btn { margin: 20px 16px 0; width: calc(100% - 32px); display: flex; align-items: center; justify-content: center; gap: 8px; background: none; border: 1px solid rgba(196,105,79,0.3); color: #C4694F; font-size: 12.5px; font-weight: 600; padding: 12px; border-radius: 12px; cursor: pointer; }
  .wt-delete-btn:active { background: rgba(196,105,79,0.1); }

  input[type=number]::-webkit-inner-spin-button, input[type=number]::-webkit-outer-spin-button { -webkit-appearance: none; margin: 0; }
`;
