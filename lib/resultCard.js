import { Student, Result, Attendance } from "@/lib/models";
import { HttpError, isId } from "@/lib/http";
import { visibleScopes, inScope } from "@/lib/assign";
import { summarize } from "@/lib/grades";
import { isFinal } from "@/lib/results";
import { todayDhaka } from "@/lib/dates";

// রেজাল্ট কার্ডের তথ্য জোগাড়ের অংশ — একটি কার্ড (/api/results/card) ও একসাথে অনেক কার্ড (/api/results/cards) দুই জায়গাতেই ব্যবহার হয়
// শিক্ষার্থী শুধু নিজের ও শুধু প্রকাশিত ফল পায়; স্টাফের results.read ও শ্রেণির অনুমতি লাগে।
export async function cardStudent(u, sidRaw) {
  const sid = u.role === "student" ? u.id : sidRaw;
  if (!isId(String(sid))) throw new HttpError(400, "তথ্য সঠিক নয়");
  const s = await Student.findById(sid).select("-password").lean();
  if (!s) throw new HttpError(404, "শিক্ষার্থী পাওয়া যায়নি");
  if (u.role !== "student") {
    if (!u.perms.includes("results.read")) throw new HttpError(403, "অনুমতি নেই");
    if (!inScope(await visibleScopes(u), s.class, s.section)) throw new HttpError(403, "এই শিক্ষার্থীর ফল দেখার অনুমতি নেই");
  }
  return s;
}

// ওই শিক্ষাবর্ষে (১ জানুয়ারি – ৩১ ডিসেম্বর, আজ পর্যন্ত) শিক্ষার্থীর হাজিরার সারাংশ
export async function yearAttendance(studentId, year) {
  const today = todayDhaka(), from = `${year}-01-01`, end = `${year}-12-31`, to = end < today ? end : today;
  const rows = to < from ? [] : await Attendance.aggregate([{ $match: { student: studentId, date: { $gte: from, $lte: to } } }, { $group: { _id: "$status", n: { $sum: 1 } } }]);
  const c = Object.fromEntries(rows.map((r) => [r._id, r.n]));
  const present = c.present || 0, late = c.late || 0, absent = c.absent || 0, leave = c.leave || 0, holiday = c.holiday || 0;
  const counted = present + late + absent; // ছুটি/হলিডে হারে ধরা হয় না (সিস্টেমের বাকি জায়গার মতোই)
  const r1 = (v) => Math.round(v * 10) / 10;
  return { from, to, present: present + late, late, absent, leave, holiday, recorded: counted + leave, presentPct: counted ? r1(((present + late) / counted) * 100) : null, absentPct: counted ? r1((absent / counted) * 100) : null };
}

export async function buildCard(u, s, exam, year) {
  const studentView = u.role === "student";
  const pubFilter = studentView ? { published: { $ne: false } } : {};
  const rows = await Result.find({ student: s._id, exam, year, ...pubFilter }).select("subject marks full published").sort({ createdAt: 1 }).lean();
  if (!rows.length) return null;
  // মেধাক্রম: একই শ্রেণির, একই পরীক্ষা ও বছরের শিক্ষার্থীদের মোট নম্বর অনুযায়ী (উত্তীর্ণরা আগে)। শিক্ষার্থীর কার্ডে শুধু প্রকাশিত নম্বর ধরা হয়।
  let position = null, classSize = 0;
  const mates = await Student.find({ class: s.class, archived: { $ne: true } }).distinct("_id");
  const all = await Result.find({ exam, year, student: { $in: mates }, ...pubFilter }).select("student subject marks full").lean();
  const by = new Map(); for (const r of all) { const k = String(r.student); (by.get(k) || by.set(k, []).get(k)).push(r); }
  const board = [...by.entries()].map(([id, rs]) => ({ id, ...summarize(rs) })).sort((a, b) => Number(b.passed) - Number(a.passed) || b.total - a.total || b.gpa - a.gpa);
  classSize = board.length;
  const me = board.findIndex((b) => b.id === String(s._id));
  if (me >= 0) position = 1 + board.findIndex((b) => b.passed === board[me].passed && b.total === board[me].total);
  const [finalized, attendance] = await Promise.all([isFinal(exam, year, s.class, s.section || ""), yearAttendance(s._id, year)]);
  return { student: s, exam, year, rows: rows.map((r) => ({ subject: r.subject, marks: r.marks, full: r.full })), published: rows.every((r) => r.published !== false), finalized, position, classSize, attendance };
}
