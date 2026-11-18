import { connectDB } from "@/lib/db";
import { currentUser } from "@/lib/guard";
import { Student, Result } from "@/lib/models";
import { handle, json, isId, HttpError } from "@/lib/http";
import { visibleScopes, inScope } from "@/lib/assign";
import { summarize } from "@/lib/grades";
import { isFinal } from "@/lib/results";

// রেজাল্ট কার্ডের তথ্য। শিক্ষার্থী শুধু নিজের ও শুধু প্রকাশিত ফল পায়; স্টাফের results.read ও শ্রেণির অনুমতি লাগে।
export const GET = handle(async (req) => {
  const u = await currentUser();
  if (!u) throw new HttpError(401, "আবার লগইন করুন");
  const sp = new URL(req.url).searchParams, exam = sp.get("exam") || "", year = Number(sp.get("year"));
  const sid = u.role === "student" ? u.id : sp.get("student");
  if (!isId(String(sid)) || !exam || !Number.isFinite(year)) throw new HttpError(400, "তথ্য সঠিক নয়");
  await connectDB();
  const s = await Student.findById(sid).select("-password").lean();
  if (!s) throw new HttpError(404, "শিক্ষার্থী পাওয়া যায়নি");
  if (u.role !== "student") {
    if (!u.perms.includes("results.read")) throw new HttpError(403, "অনুমতি নেই");
    if (!inScope(await visibleScopes(u), s.class, s.section)) throw new HttpError(403, "এই শিক্ষার্থীর ফল দেখার অনুমতি নেই");
  }
  const rows = await Result.find({ student: sid, exam, year, ...(u.role === "student" ? { published: { $ne: false } } : {}) }).select("subject marks full published").sort({ createdAt: 1 }).lean();
  if (!rows.length) throw new HttpError(404, "ফলাফল পাওয়া যায়নি বা এখনো প্রকাশিত হয়নি");
  // মেধাক্রম: একই শ্রেণির, একই পরীক্ষা ও বছরের শিক্ষার্থীদের মোট নম্বর অনুযায়ী (উত্তীর্ণরা আগে)। শিক্ষার্থীর কার্ডে শুধু প্রকাশিত নম্বর ধরা হয়।
  let position = null, classSize = 0;
  const mates = await Student.find({ class: s.class, archived: { $ne: true } }).distinct("_id");
  const all = await Result.find({ exam, year, student: { $in: mates }, ...(u.role === "student" ? { published: { $ne: false } } : {}) }).select("student subject marks full").lean();
  const by = new Map(); for (const r of all) { const k = String(r.student); (by.get(k) || by.set(k, []).get(k)).push(r); }
  const board = [...by.entries()].map(([id, rs]) => ({ id, ...summarize(rs) })).sort((a, b) => Number(b.passed) - Number(a.passed) || b.total - a.total || b.gpa - a.gpa);
  classSize = board.length;
  const me = board.findIndex((b) => b.id === String(s._id));
  if (me >= 0) { position = 1 + board.findIndex((b) => b.passed === board[me].passed && b.total === board[me].total); }
  const finalized = await isFinal(exam, year, s.class, s.section || "");
  return json({ student: s, exam, year, rows: rows.map((r) => ({ subject: r.subject, marks: r.marks, full: r.full })), published: rows.every((r) => r.published !== false), finalized, position, classSize });
});
