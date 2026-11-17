import { connectDB } from "@/lib/db";
import { currentUser } from "@/lib/guard";
import { Student, Result } from "@/lib/models";
import { handle, json, isId, HttpError } from "@/lib/http";
import { visibleScopes, inScope } from "@/lib/assign";

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
  return json({ student: s, exam, year, rows: rows.map((r) => ({ subject: r.subject, marks: r.marks, full: r.full })), published: rows.every((r) => r.published !== false) });
});
