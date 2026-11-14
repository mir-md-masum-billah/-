import { connectDB } from "@/lib/db";
import { requireUser } from "@/lib/guard";
import { Student, User, Attendance, StaffAttendance } from "@/lib/models";
import { handle, json, bad, HttpError } from "@/lib/http";
import { isDate, monthRange } from "@/lib/dates";
import { visibleScopes, inScope, scopeFilter } from "@/lib/assign";

const pct = (p, l, a) => (p + l + a ? Math.round(((p + l) / (p + l + a)) * 1000) / 10 : null); // ছুটি/হলিডে/অচিহ্নিত হারে ধরা হয় না

// ?type=student&class=&section=&month=YYYY-MM | year=YYYY   ·   ?type=staff&month=   ·   ?type=absent&date=&class=
export const GET = handle(async (req) => {
  const sp = new URL(req.url).searchParams;
  const type = sp.get("type") || "student";
  const user = await requireUser(type === "staff" ? "staffattendance.read" : "attendance.read");
  await connectDB();
  const year = sp.get("year"), month = sp.get("month");
  let range;
  if (year && /^\d{4}$/.test(year)) range = [`${year}-01-01`, `${year}-12-31`];
  else if (month && /^\d{4}-(0[1-9]|1[0-2])$/.test(month)) range = monthRange(month);
  else if (type !== "absent") throw bad("মাস (YYYY-MM) বা বছর (YYYY) দিন");

  if (type === "staff") {
    const [people, rows, dates] = await Promise.all([
      User.find({ active: true }).sort({ name: 1 }).select("name userId designation").lean(),
      StaffAttendance.aggregate([{ $match: { date: { $gte: range[0], $lte: range[1] } } }, { $group: { _id: { u: "$user", s: "$status" }, n: { $sum: 1 } } }]),
      StaffAttendance.distinct("date", { date: { $gte: range[0], $lte: range[1] } }),
    ]);
    const out = people.map((p) => { const c = { present: 0, absent: 0, late: 0, leave: 0, holiday: 0 }; rows.filter((r) => String(r._id.u) === String(p._id)).forEach((r) => (c[r._id.s] = r.n)); const marked = Object.values(c).reduce((a, b) => a + b, 0); return { person: p, ...c, unmarked: dates.length - marked, pct: pct(c.present, c.late, c.absent) }; });
    return json({ range, days: dates.length, rows: out });
  }

  const cls = sp.get("class"), section = sp.get("section");
  const sc = await visibleScopes(user);
  if (type === "absent") {
    const date = sp.get("date");
    if (!isDate(date)) throw bad("তারিখ সঠিক নয়");
    const q = { date, status: "absent" }; if (cls) q.class = cls;
    const sf = scopeFilter(sc);
    const ids = await Student.find({ ...(cls ? { class: cls } : {}), ...sf }).distinct("_id");
    q.student = { $in: ids };
    const items = await Attendance.find(q).populate("student", "name studentId class section roll phone guardianPhone").lean();
    return json({ date, total: items.length, items: items.map((i) => ({ _id: i._id, student: i.student })) });
  }
  if (!cls) throw bad("শ্রেণি দিন");
  const sf = section ? { section } : {};
  if (sc !== null && !inScope(sc, cls, section || "") && !(sc.some((s) => s.class === cls))) throw new HttpError(403, "এই শ্রেণির রিপোর্ট দেখার অনুমতি নেই");
  const students = await Student.find({ class: cls, active: true, archived: { $ne: true }, ...sf, ...(sc ? scopeFilter(sc) : {}) }).sort({ section: 1, roll: 1 }).select("name studentId roll section").lean();
  const ids = students.map((s) => s._id);
  const match = { student: { $in: ids }, date: { $gte: range[0], $lte: range[1] } };
  const [rows, classDates, monthly] = await Promise.all([
    Attendance.aggregate([{ $match: match }, { $group: { _id: { s: "$student", t: "$status" }, n: { $sum: 1 } } }]),
    Attendance.distinct("date", { class: cls, date: { $gte: range[0], $lte: range[1] } }),
    year ? Attendance.aggregate([{ $match: match }, { $group: { _id: { s: "$student", m: { $substr: ["$date", 5, 2] }, t: "$status" }, n: { $sum: 1 } } }]) : [],
  ]);
  const out = students.map((s) => {
    const c = { present: 0, absent: 0, late: 0, leave: 0, holiday: 0 };
    rows.filter((r) => String(r._id.s) === String(s._id)).forEach((r) => (c[r._id.t] = r.n));
    const marked = Object.values(c).reduce((a, b) => a + b, 0);
    const row = { student: s, ...c, unmarked: Math.max(0, classDates.length - marked), pct: pct(c.present, c.late, c.absent) };
    if (year) row.months = Array.from({ length: 12 }, (_, i) => { const m = String(i + 1).padStart(2, "0"); const g = (t) => monthly.find((x) => String(x._id.s) === String(s._id) && x._id.m === m && x._id.t === t)?.n || 0; return pct(g("present"), g("late"), g("absent")); });
    return row;
  });
  return json({ range, days: classDates.length, rows: out });
});
