import { connectDB } from "@/lib/db";
import { requireUser } from "@/lib/guard";
import { Student, Attendance, Result, Invoice } from "@/lib/models";
import { handle, json, bad, HttpError } from "@/lib/http";
import { visibleScopes, inScope, scopeFilter } from "@/lib/assign";
import { summarize } from "@/lib/grades";
import { todayDhaka, yearDhaka, ymDhaka } from "@/lib/dates";
import { netPaidMap, obligation, round2 } from "@/lib/finance";

const pct = (p, a) => (p + a ? Math.round((p / (p + a)) * 1000) / 10 : null); // p = উপস্থিত+দেরি, a = অনুপস্থিত

// ক্লাস ড্যাশবোর্ড: একটি শ্রেণি/শাখার সব সক্রিয় শিক্ষার্থী — হাজিরা (এ বছর/এ মাস/আজ), সর্বশেষ পরীক্ষার ফল, বকেয়া (ফি দেখার অনুমতি থাকলে)
export const GET = handle(async (req) => {
  const user = await requireUser("students.read");
  const sp = new URL(req.url).searchParams, cls = sp.get("class") || "", section = sp.get("section") || "";
  if (!cls) throw bad("শ্রেণি দিন");
  const sc = await visibleScopes(user);
  if (!inScope(sc, cls, section) && !(sc && sc.some((s) => s.class === cls))) throw new HttpError(403, "এই শ্রেণি দেখার অনুমতি নেই");
  await connectDB();
  const students = await Student.find({ class: cls, active: true, archived: { $ne: true }, ...(section ? { section } : {}), ...scopeFilter(sc) }).sort({ section: 1, roll: 1 }).select("name studentId roll section photo phone guardianPhone gender").lean();
  const ids = students.map((s) => s._id), today = todayDhaka(), year = yearDhaka(), ym = ymDhaka();
  const [attRows, todayRows, resRows] = await Promise.all([
    Attendance.aggregate([{ $match: { student: { $in: ids }, date: { $gte: `${year}-01-01`, $lte: today } } }, { $group: { _id: { s: "$student", t: "$status", m: { $substr: ["$date", 0, 7] } }, n: { $sum: 1 } } }]),
    Attendance.find({ student: { $in: ids }, date: today }).select("student status").lean(),
    Result.find({ student: { $in: ids } }).select("student exam year subject marks full createdAt").sort({ year: -1, createdAt: -1 }).lean(),
  ]);
  const att = new Map();
  for (const r of attRows) { const k = String(r._id.s); const a = att.get(k) || { y: { present: 0, absent: 0, late: 0, leave: 0 }, m: { present: 0, absent: 0, late: 0, leave: 0 } }; if (a.y[r._id.t] !== undefined) { a.y[r._id.t] += r.n; if (r._id.m === ym) a.m[r._id.t] += r.n; } att.set(k, a); }
  const tod = new Map(todayRows.map((r) => [String(r.student), r.status]));
  const latest = new Map(); // student → সর্বশেষ পরীক্ষার সারি
  for (const r of resRows) { const k = String(r.student), key = `${r.exam}|${r.year}`; const cur = latest.get(k); if (!cur) latest.set(k, { key, exam: r.exam, year: r.year, rows: [r] }); else if (cur.key === key) cur.rows.push(r); }
  let due = new Map();
  if (user.perms.includes("fees.read")) {
    const inv = await Invoice.find({ student: { $in: ids }, status: "open" }).lean();
    const map = await netPaidMap(inv.map((i) => i._id));
    for (const i of inv) due.set(String(i.student), round2((due.get(String(i.student)) || 0) + Math.max(0, obligation(i) - (map[String(i._id)] || 0))));
  } else due = null;
  const out = students.map((s) => {
    const k = String(s._id), a = att.get(k) || { y: { present: 0, absent: 0, late: 0, leave: 0 }, m: { present: 0, absent: 0, late: 0, leave: 0 } };
    const l = latest.get(k); const sm = l ? summarize(l.rows) : null;
    return { ...s, att: { year: { present: a.y.present + a.y.late, absent: a.y.absent, leave: a.y.leave, pct: pct(a.y.present + a.y.late, a.y.absent) }, month: { present: a.m.present + a.m.late, absent: a.m.absent, leave: a.m.leave, pct: pct(a.m.present + a.m.late, a.m.absent) } }, today: tod.get(k) || null,
      latest: sm ? { exam: l.exam, year: l.year, percent: Math.round(sm.percent * 10) / 10, gpa: sm.gpa, letter: sm.letter, passed: sm.passed } : null, due: due ? due.get(k) || 0 : undefined };
  });
  const withPct = out.filter((s) => s.att.year.pct !== null), withRes = out.filter((s) => s.latest);
  const summary = {
    total: out.length, todayPresent: out.filter((s) => s.today === "present" || s.today === "late").length, todayAbsent: out.filter((s) => s.today === "absent").length, todayLeave: out.filter((s) => s.today === "leave").length, todayUnmarked: out.filter((s) => !s.today).length,
    avgAttendance: withPct.length ? Math.round((withPct.reduce((t, s) => t + s.att.year.pct, 0) / withPct.length) * 10) / 10 : null, lowAttendance: withPct.filter((s) => s.att.year.pct < 75).length,
    avgPercent: withRes.length ? Math.round((withRes.reduce((t, s) => t + s.latest.percent, 0) / withRes.length) * 10) / 10 : null, failing: withRes.filter((s) => !s.latest.passed).length,
    totalDue: due ? round2(out.reduce((t, s) => t + (s.due || 0), 0)) : undefined,
  };
  return json({ students: out, summary, year });
});
