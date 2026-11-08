export const PLANS = {
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


const fullBody = (prefix) => [
  { id: prefix + "1", name: "לחיצת רגליים", sets: 2, target: "8–12 חזרות", mode: "weight", howTo: "טווח תנועה נוח, ברכיים בכיוון כפות הרגליים. בשבועיים הראשונים משאירים כשלוש חזרות אפשריות בסיום הסט." },
  { id: prefix + "2", name: "כפיפת ברכיים במכונה", sets: 2, target: "8–12 חזרות", mode: "weight", howTo: "כוונו את המכונה למידות הגוף. בצעו כיפוף ויישור בשליטה, ללא תנופה." },
  { id: prefix + "3", name: "לחיצת חזה", sets: 2, target: "8–12 חזרות", mode: "weight", howTo: "במכונה או עם משקולות, בטווח נוח. הורדה בשליטה ודחיפה ללא עצירת נשימה ממושכת." },
  { id: prefix + "4", name: "חתירה בישיבה", sets: 2, target: "8–12 חזרות", mode: "weight", howTo: "גו יציב, משיכה אל מרכז הגוף וחזרה איטית. הימנעו מתנופה בגב." },
  { id: prefix + "5", name: "משיכה עליונה", sets: 2, target: "8–12 חזרות", mode: "weight", howTo: "משכו לכיוון החזה העליון עם מרפקים כלפי מטה. החזירו את הידית בשליטה." },
  { id: prefix + "6", name: "פלאנק", sets: 2, target: "20–40 שניות", mode: "time", howTo: "שמרו על נשימה ועל גב במנח נוח. עצרו לפני שהטכניקה מתפרקת; אפשר להתחיל בגרסה על הברכיים." },
];
PLANS.D = { id: "D", subtitle: "אימון גוף מלא • שני", exercises: fullBody("d") };
PLANS.E = { id: "E", subtitle: "אימון גוף מלא • רביעי", exercises: fullBody("e") };
export const ACTIVE_PLANS = ["D", "E"];
