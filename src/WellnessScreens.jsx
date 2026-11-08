import React, { useState } from "react";
import { CalendarDays, Check, ChevronDown, ChevronLeft, ChevronRight, ClipboardList, Dumbbell, Footprints, MessageSquare, Scale, Settings, Timer, Trash2, TrendingUp, Utensils, X } from "lucide-react";
import { ACTIVITY_LABELS, ACTIVITY_TYPES, dateObject, freshDailyLog, localDate, mealsForDate, plannedActivity, preparationTotals, shiftDate, weeklyWeightAverages } from "./wellness.js";

const shortDate = (date) => dateObject(date).toLocaleDateString("he-IL", { day: "numeric", month: "short" });
const activityIcon = (type) => type === "walk" ? <Footprints size={20} /> : type === "rope" ? <Timer size={20} /> : <Dumbbell size={20} />;

function PageTitle({ eyebrow, title, action }) {
  return <header className="well-title"><div><p>{eyebrow}</p><h1>{title}</h1></div>{action}</header>;
}

export function BottomNav({ screen, onNavigate }) {
  const active = ["workout", "session", "calendar"].includes(screen) ? "home" : screen === "bwlog" ? "progress" : screen;
  return <nav className="bottom-nav" aria-label="ניווט ראשי">{[
    ["today", "היום", CalendarDays], ["home", "אימונים", Dumbbell], ["progress", "התקדמות", TrendingUp], ["prep", "הכנות", ClipboardList],
  ].map(([id, label, Icon]) => <button key={id} aria-current={active === id ? "page" : undefined} onClick={() => onNavigate(id)}><Icon size={22} /><span>{label}</span></button>)}</nav>;
}

export function TodayScreen({ dailyLogs, settings, bodyweight, sessions, onUpdateDay, onSettings, onWeight, onWorkout }) {
  const [date, setDate] = useState(localDate());
  const [openMeal, setOpenMeal] = useState(null);
  const [status, setStatus] = useState("");
  const day = dailyLogs[date] || freshDailyLog();
  const meals = mealsForDate(date);
  const done = meals.filter((meal) => day.meals[meal.id]?.done).length;
  const latest = [...bodyweight].filter((entry) => Number(entry.weight) > 0).sort((a, b) => b.date.localeCompare(a.date))[0];
  const changeMeal = (id, changes) => onUpdateDay(date, (current) => ({ ...current, meals: { ...current.meals, [id]: { done: false, note: "", ...current.meals[id], ...changes } } }));
  const dateText = dateObject(date).toLocaleDateString("he-IL", { weekday: "long", day: "numeric", month: "long" });
  return <main className="well-page">
    <PageTitle eyebrow={dateText} title="היום שלי" action={<button className="icon-button" onClick={onSettings} aria-label="הגדרות וגיבוי"><Settings size={23} /></button>} />
    <div className="day-picker"><button className="icon-button" onClick={() => { setDate(shiftDate(date, -1)); setOpenMeal(null); setStatus(""); }} aria-label="יום קודם"><ChevronRight size={20} /></button><label>יום המעקב<input aria-label="יום המעקב" type="date" value={date} max={localDate()} onInput={(event) => { if (event.target.value && event.target.value <= localDate()) { setDate(event.target.value); setOpenMeal(null); setStatus(""); } }} /></label><button className="icon-button" disabled={date >= localDate()} onClick={() => { setDate(shiftDate(date, 1)); setOpenMeal(null); setStatus(""); }} aria-label="יום הבא"><ChevronLeft size={20} /></button></div>
    <section className="well-card meals-section" aria-labelledby="meals-title">
      <div className="section-heading"><h2 id="meals-title"><Utensils size={21} />הארוחות שלי</h2><span>{done} מתוך {meals.length} סומנו</span></div>
      {dateObject(date).getDay() === 5 && <p className="soft-note">יום שישי • התפריט מותאם לארוחה המשפחתית. שעות הארוחות גמישות.</p>}
      <div className="meal-list">{meals.map((meal) => {
        const entry = day.meals[meal.id] || { done: false, note: "" };
        const isOpen = openMeal === meal.id;
        return <article className={`meal-card ${entry.done ? "is-done" : ""} ${isOpen ? "is-open" : ""}`} key={meal.id}>
          <div className="meal-top"><button className="meal-check" aria-label={`${entry.done ? "ביטול סימון" : "סימון"} ${meal.name}`} aria-pressed={entry.done} onClick={() => { if (changeMeal(meal.id, { done: !entry.done })) setStatus(entry.done ? "הסימון בוטל" : "הארוחה סומנה ונשמרה"); }}>{entry.done && <Check size={20} />}</button><button className="meal-expand" aria-expanded={isOpen} onClick={() => setOpenMeal(isOpen ? null : meal.id)}><span><strong>{meal.name}</strong><small>{meal.summary}</small></span><span className="meal-time"><bdi>{meal.time}</bdi><ChevronDown size={15} /></span></button></div>
          {isOpen && <div className="meal-details"><ul>{meal.items.map((ingredient) => <li key={ingredient.key}><strong>{ingredient.quantity} {ingredient.unit}</strong> {ingredient.name}</li>)}</ul>{meal.note && <p>{meal.note}</p>}<label htmlFor={`note-${meal.id}`}>הערה לארוחה</label><textarea id={`note-${meal.id}`} maxLength={2000} placeholder="הוספת הערה לארוחה…" value={entry.note} onChange={(event) => changeMeal(meal.id, { note: event.target.value })} /><small>ההערה נשמרת אוטומטית ליום שנבחר.</small><button className={entry.done ? "secondary full" : "primary full"} onClick={() => { if (changeMeal(meal.id, { done: !entry.done })) setStatus(entry.done ? "הסימון בוטל" : "הארוחה סומנה ונשמרה"); }}>{entry.done ? "ביטול סימון הארוחה" : "סימון הארוחה"}</button></div>}
          {!isOpen && <button className="note-link" onClick={() => setOpenMeal(meal.id)}><MessageSquare size={13} /><span>{entry.note || "הוספת הערה / כמויות"}</span></button>}
        </article>;
      })}</div>
      <p className="quiet-text">סימון מתעד את היום. שינוי בארוחה אינו מבטל את שאר התוכנית.</p>
    </section>
    <ActivityCard key={date} date={date} day={day} onUpdateDay={onUpdateDay} onWorkout={onWorkout} canOpenWorkout={date === localDate()} />
    {sessions.some((session) => session.date === date) && <p className="soft-note">יש ביום הזה גם אימון מתועד ביומן האימונים.</p>}
    <section className="well-card weight-summary"><div><h2><Scale size={21} />משקל אחרון</h2><div className="weight-number">{latest ? <><bdi>{latest.weight}</bdi> <span>ק״ג</span></> : "טרם הוזן"}</div><p>יעד: {settings.targetWeight} ק״ג • {dateObject(settings.targetDate).toLocaleDateString("he-IL", { month: "long", year: "numeric" })}</p>{latest && <small>שקילה מ־{shortDate(latest.date)}</small>}</div><button className="secondary" onClick={onWeight}>הוספת שקילה</button></section>
    <div className="screen-status" role="status">{status}</div>
  </main>;
}

function ActivityCard({ date, day, onUpdateDay, onWorkout, canOpenWorkout }) {
  const planned = plannedActivity(date);
  const [type, setType] = useState(planned.type);
  const [minutes, setMinutes] = useState(String(planned.minutes));
  const [message, setMessage] = useState("");
  const [error, setError] = useState("");
  const record = () => {
    const duration = Number(minutes);
    if (!Number.isFinite(duration) || duration <= 0 || duration > 600) { setError("יש להזין משך בין דקה ל־600 דקות."); return; }
    const activity = { id: crypto.randomUUID(), type, minutes: duration, createdAt: Date.now() };
    if (onUpdateDay(date, (current) => ({ ...current, activities: [...current.activities, activity] }))) { setMessage("הפעילות נרשמה ונשמרה"); setError(""); }
  };
  return <section className="well-card" aria-labelledby="activity-title"><div className="section-heading"><h2 id="activity-title">הפעילות להיום</h2></div><p className="quiet-text">בתכנון: {planned.label}. אפשר לרשום יותר מפעילות אחת.</p>
    <div className="activity-types">{ACTIVITY_TYPES.map((id) => <button key={id} className={id === type ? "selected" : ""} aria-pressed={id === type} onClick={() => { setType(id); setMessage(""); }}>{activityIcon(id)}{ACTIVITY_LABELS[id]}</button>)}</div>
    <div className="activity-duration"><label htmlFor="activity-minutes">משך הפעילות<input id="activity-minutes" type="number" inputMode="decimal" min="1" max="600" value={minutes} onChange={(event) => setMinutes(event.target.value)} /><span>דקות</span></label><button className="primary" onClick={record}>רישום פעילות</button></div>
    {type === "gym" && canOpenWorkout && <button className="secondary full" onClick={onWorkout}><Dumbbell size={16} />בחירת אימון A / B / C</button>}
    {day.activities.length > 0 && <ul className="activity-log">{day.activities.map((activity) => <li key={activity.id}><span>{activityIcon(activity.type)}{ACTIVITY_LABELS[activity.type]} <bdi>{activity.minutes}</bdi> דקות</span><button className="icon-button danger" aria-label={`מחיקת פעילות ${ACTIVITY_LABELS[activity.type]}`} onClick={() => { if (window.confirm("למחוק את הפעילות שנרשמה?")) onUpdateDay(date, (current) => ({ ...current, activities: current.activities.filter((item) => item.id !== activity.id) })); }}><Trash2 size={16} /></button></li>)}</ul>}
    {message && <p role="status" className="soft-note">{message}</p>}{error && <p role="alert" className="form-error">{error}</p>}
  </section>;
}

export function ProgressScreen({ dailyLogs, settings, sessions, bodyweight, onWeight, onHistory }) {
  const averages = weeklyWeightAverages(bodyweight);
  const [from, setFrom] = useState(shiftDate(localDate(), -6));
  const to = shiftDate(from, 6);
  const dates = Array.from({ length: 7 }, (_, i) => shiftDate(from, i));
  const completed = dates.reduce((sum, date) => sum + Object.values(dailyLogs[date]?.meals || {}).filter((meal) => meal.done).length, 0);
  const activities = dates.flatMap((date) => dailyLogs[date]?.activities || []);
  return <main className="well-page"><PageTitle eyebrow="המגמה חשובה משקילה בודדת" title="ההתקדמות שלי" /><section className="well-card"><div className="section-heading"><h2>השבוע במבט אחד</h2></div><label className="field-label">מתאריך<input type="date" value={from} max={localDate()} onInput={(event) => { if (event.target.value && event.target.value <= localDate()) setFrom(event.target.value); }} /></label><p className="quiet-text">{shortDate(from)} – {shortDate(to)}</p><div className="summary-grid"><div><strong>{completed}</strong><span>ארוחות שסומנו</span></div><div><strong>{sessions.filter((session) => session.date >= from && session.date <= to).length}</strong><span>אימונים ביומן</span></div><div><strong>{activities.reduce((sum, activity) => sum + activity.minutes, 0)}</strong><span>דקות פעילות שנרשמו</span></div></div><p className="quiet-text">דקות הפעילות מבוססות על הרישום הידני; זמן האימון ביומן אינו נוסף אליהן אוטומטית.</p><button className="secondary full" onClick={onHistory}>להיסטוריית האימונים</button></section>
    <section className="well-card"><div className="section-heading"><h2><Scale size={20} />ממוצעי משקל שבועיים</h2><button className="text-button" onClick={onWeight}>הוספת שקילה</button></div><p className="quiet-text">יעד: {settings.targetWeight} ק״ג עד {shortDate(settings.targetDate)} {dateObject(settings.targetDate).getFullYear()}. הממוצע מחושב מהשקילות שנרשמו בכל שבוע, ראשון עד שבת.</p>{averages.length ? <div className="table-scroll"><table><thead><tr><th>שבוע שמתחיל</th><th>שקילות</th><th>ממוצע בק״ג</th></tr></thead><tbody>{averages.map((week) => <tr key={week.week}><td>{shortDate(week.week)}</td><td>{week.count}</td><td><bdi>{week.average.toFixed(1)}</bdi></td></tr>)}</tbody></table></div> : <p className="empty-note">הוסיפו שקילה כדי להתחיל לראות מגמה.</p>}</section>
    <section className="well-card"><h2>יומן הימים</h2>{dates.filter((date) => dailyLogs[date]).length ? dates.filter((date) => dailyLogs[date]).map((date) => <details className="day-history" key={date}><summary>{shortDate(date)} • {Object.values(dailyLogs[date].meals).filter((meal) => meal.done).length} ארוחות סומנו</summary>{mealsForDate(date).map((meal) => { const entry = dailyLogs[date].meals[meal.id]; return entry && (entry.done || entry.note) ? <p key={meal.id}><strong>{meal.name}</strong>: {entry.done ? "סומנה" : "לא סומנה"}{entry.note && <span className="saved-note">{entry.note}</span>}</p> : null; })}{dailyLogs[date].activities.map((activity) => <p key={activity.id}>{ACTIVITY_LABELS[activity.type]} • {activity.minutes} דקות</p>)}</details>) : <p className="empty-note">לא נרשמו עדיין ארוחות או פעילויות בטווח הזה.</p>}</section>
  </main>;
}

export function PrepScreen() {
  const [start, setStart] = useState(localDate());
  const [days, setDays] = useState(3);
  const totals = preparationTotals(start, days);
  const [checked, setChecked] = useState({});
  return <main className="well-page"><PageTitle eyebrow="שתי הכנות בשבוע, פחות החלטות ביום" title="מכינים מראש" /><section className="well-card"><div className="prep-controls"><label className="field-label">מתאריך<input type="date" value={start} onInput={(event) => { if (event.target.value) setStart(event.target.value); setChecked({}); }} /></label><label className="field-label">לכמה ימים?<select value={days} onChange={(event) => { setDays(Number(event.target.value)); setChecked({}); }}>{[1, 2, 3, 4, 5, 6].map((n) => <option key={n} value={n}>{n} ימים</option>)}</select></label></div><p className="soft-note">העוף והאורז בכמויות שלהלן נשקלים אחרי הבישול. שיבולת השועל יבשה; הפירות ללא חלקים שלא נאכלים.</p><ul className="prep-list">{totals.items.map((ingredient) => <li key={ingredient.key}><label><input type="checkbox" checked={!!checked[ingredient.key]} onChange={(event) => setChecked((prev) => ({ ...prev, [ingredient.key]: event.target.checked }))} /><span>{ingredient.name}</span><strong>{ingredient.quantity} {ingredient.unit}</strong></label></li>)}</ul><p className="quiet-text">סימוני הרשימה זמניים להכנה הנוכחית.</p>{totals.regularDays > 0 && <p>בנוסף: {totals.regularDays} מנות עוגיות, כל אחת בכ־180 קלוריות לפי התווית.</p>}{totals.fridays > 0 && <p className="soft-note">הטווח כולל יום שישי: הכמויות מותאמות לצהריים הקטנים. הארוחה המשפחתית והקינוח אינם כלולים ברשימת הקניות.</p>}<p className="quiet-text">חלקו לקופסאות. מנות שלא ייאכלו בימים הקרובים יש להקפיא, ולהפשיר במקרר.</p></section></main>;
}

export function SettingsScreen({ settings, onSave, onBack, children }) {
  const [weight, setWeight] = useState(String(settings.targetWeight));
  const [date, setDate] = useState(settings.targetDate);
  const [message, setMessage] = useState("");
  const [error, setError] = useState("");
  const save = (event) => { event.preventDefault(); const target = Number(weight); if (!Number.isFinite(target) || target <= 0 || target > 1000 || !/^\d{4}-\d{2}-\d{2}$/.test(date) || Number.isNaN(dateObject(date).getTime())) { setError("יש להזין משקל יעד ותאריך תקינים."); return; } if (onSave({ targetWeight: target, targetDate: date })) { setMessage("היעד נשמר במכשיר"); setError(""); } };
  return <main className="well-page"><PageTitle eyebrow="העדפות ושמירת הנתונים" title="הגדרות וגיבוי" action={<button className="icon-button" onClick={onBack} aria-label="חזרה להיום"><X size={21} /></button>} /><section className="well-card"><h2>היעד שלי</h2><form onSubmit={save}><div className="prep-controls"><label className="field-label">משקל יעד בק״ג<input type="number" min="1" max="1000" step="0.1" value={weight} onChange={(event) => setWeight(event.target.value)} /></label><label className="field-label">תאריך יעד<input type="date" value={date} onInput={(event) => setDate(event.target.value)} /></label></div><button className="primary full" type="submit">שמירת היעד</button>{message && <p role="status">{message}</p>}{error && <p role="alert" className="form-error">{error}</p>}</form></section>{children}<p className="quiet-text">הנתונים נשמרים בדפדפן במכשיר הזה. העתקת גיבוי ושמירתו בדרייב נעשות ידנית.</p></main>;
}
