export const DEFAULT_SETTINGS = { targetWeight: 100, targetDate: "2027-09-01" };
export const MEAL_IDS = ["breakfast", "lunch", "snack", "dinner", "sweet"];
export const ACTIVITY_TYPES = ["gym", "strength", "walk", "rope"];
export const ACTIVITY_LABELS = { gym: "חדר כושר", strength: "סטים כוח", walk: "הליכה", rope: "דלגית" };

export function localDate(date = new Date()) {
  return `${date.getFullYear()}-${String(date.getMonth() + 1).padStart(2, "0")}-${String(date.getDate()).padStart(2, "0")}`;
}
export const dateObject = (date) => new Date(`${date}T12:00:00`);
export function shiftDate(date, offset) {
  const next = dateObject(date);
  next.setDate(next.getDate() + offset);
  return localDate(next);
}
export const freshDailyLog = () => ({ meals: {}, activities: [] });

const item = (key, name, quantity, unit = "גרם") => ({ key, name, quantity, unit });
export function mealsForDate(date) {
  const friday = dateObject(date).getDay() === 5;
  return [
    { id: "breakfast", name: "ארוחת בוקר", time: "08:30", summary: "יוגורט חלבון, שיבולת שועל ובננה", items: [item("yogurt", "יוגורט עשיר בחלבון", 200), item("oats", "שיבולת שועל יבשה", 60), item("banana", "בננה ללא קליפה", 120)], note: "בחרו גביע עם כ־20 גרם חלבון. ערבוב קצר — בלי הכנה מראש." },
    { id: "lunch", name: "ארוחת צהריים", time: "12:00–13:00", summary: "חזה עוף, אורז וירקות", items: [item("chicken", "חזה עוף", friday ? 120 : 180), item("rice", "אורז", friday ? 150 : 250), item("vegetables", "ירקות", 250), item("oil", "שמן זית", friday ? 5 : 10)], note: "משקל העוף והאורז אחרי בישול. השמן כולל את חלקכם בשמן ההכנה." },
    { id: "snack", name: "ארוחת ביניים", time: "16:00", summary: "תפוח ושקדים", items: [item("apple", "תפוח", 180), item("almonds", "שקדים", 20)] },
    friday
      ? { id: "dinner", name: "הארוחה המשפחתית", time: "בשעה שמתאימה לכם", summary: "ארוחה גדולה, כולל קינוח", items: [], note: "תקציב תכנון משוער: כ־1,200–1,400 קלוריות לארוחה, כולל הקינוח והשתייה. שאר הארוחות נשארות מסודרות — בלי צום או פיצוי." }
      : { id: "dinner", name: "ארוחת ערב", time: "19:00–20:00", summary: "חביתה, קוטג׳, פיתה וירקות", items: [item("eggs", "ביצים", 2, "יחידות"), item("cottage", "קוטג׳ 5%", 200), item("pita", "פיתה או לחמנייה רגילה", 90), item("vegetables", "ירקות", 250), item("oil", "שמן להכנה או לסלט", 5)], note: "הפיתה או הלחמנייה בכ־250 קלוריות, לפי תווית המוצר." },
    { id: "sweet", name: friday ? "קינוח מתוכנן" : "משהו מתוק", time: friday ? "בארוחה המשפחתית" : "21:00–22:00", summary: friday ? "הקינוח נכלל בתקציב הארוחה" : "עוגיות ונס קפה", items: friday ? [] : [item("milk", "חלב לנס, ללא סוכר", 60, "מ״ל")], note: friday ? "אם אכלתם קינוח בארוחה, הוא מחליף את עוגיות הערב." : "מנת עוגיות בכ־180 קלוריות: שוקלים לפי התווית ומגישים מראש. החלב הוא כרבע כוס." },
  ];
}

export function plannedActivity(date) {
  const weekday = dateObject(date).getDay();
  if (weekday === 1 || weekday === 3) return { type: "gym", minutes: 60, label: "חדר כושר • עד שעה" };
  if ([0, 2, 5].includes(weekday)) return { type: "walk", minutes: 30, label: "הליכה • 30 דקות" };
  return { type: "walk", minutes: 30, label: "יום מנוחה • אפשר פעילות קלה לבחירתכם" };
}

export function weeklyWeightAverages(bodyweight) {
  const groups = new Map();
  for (const entry of bodyweight) {
    const weight = Number(entry.weight);
    if (!Number.isFinite(weight) || weight <= 0) continue;
    const week = shiftDate(entry.date, -dateObject(entry.date).getDay());
    const group = groups.get(week) || { week, sum: 0, count: 0 };
    group.sum += weight;
    group.count++;
    groups.set(week, group);
  }
  return [...groups.values()].sort((a, b) => b.week.localeCompare(a.week)).map(({ week, sum, count }) => ({ week, count, average: sum / count }));
}

export function preparationTotals(startDate, days) {
  const totals = new Map();
  let fridays = 0;
  for (let offset = 0; offset < days; offset++) {
    const date = shiftDate(startDate, offset);
    if (dateObject(date).getDay() === 5) fridays++;
    for (const meal of mealsForDate(date)) for (const ingredient of meal.items) {
      const current = totals.get(ingredient.key) || { ...ingredient, quantity: 0 };
      current.quantity += ingredient.quantity;
      totals.set(ingredient.key, current);
    }
  }
  return { items: [...totals.values()], fridays, regularDays: days - fridays };
}
