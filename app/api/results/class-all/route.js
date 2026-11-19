import { connectDB } from "@/lib/db";
import { requireUser } from "@/lib/guard";
import { Result } from "@/lib/models";
import { handle, json, bad } from "@/lib/http";
import { classStudents, rankRows } from "@/lib/merit";
import { summarize } from "@/lib/grades";

// একটি শ্রেণির (ও বছরের) সবগুলো পরীক্ষার ফল একসাথে এক তালিকায়: প্রতি পরীক্ষায় মোট/গ্রেড, সব পরীক্ষার গড় শতকরা ও সামগ্রিক মেধাক্রম
export const GET = handle(async (req) => {
  const user = await requireUser("results.read");
  const sp = new URL(req.url).searchParams, year = Number(sp.get("year"));
  if (!Number.isFinite(year)) throw bad("বছর দিন");
  await connectDB();
  const students = await classStudents(user, sp.get("class") || "", sp.get("section") || "");
  const rows = await Result.find({ student: { $in: students.map((s) => s._id) }, year }).select("student exam marks full subject createdAt").sort({ createdAt: 1 }).lean();
  const exams = []; for (const r of rows) if (!exams.includes(r.exam)) exams.push(r.exam);
  const by = new Map(); for (const r of rows) { const k = `${r.student}|${r.exam}`; (by.get(k) || by.set(k, []).get(k)).push(r); }
  const items = students.map((s) => {
    const per = exams.map((e) => { const rs = by.get(`${s._id}|${e}`); if (!rs) return null; const sm = summarize(rs); return { total: sm.total, full: sm.full, percent: Math.round(sm.percent * 10) / 10, gpa: Math.round(sm.gpa * 100) / 100, letter: sm.letter, passed: sm.passed }; });
    const got = per.filter(Boolean), avg = got.length ? got.reduce((t, p) => t + p.percent, 0) / got.length : 0;
    return { _id: s._id, name: s.name, studentId: s.studentId, roll: s.roll, section: s.section, per, total: got.reduce((t, p) => t + p.total, 0), avgPercent: Math.round(avg * 10) / 10, passed: got.length > 0 && got.every((p) => p.passed), gpa: got.length ? Math.round((got.reduce((t, p) => t + p.gpa, 0) / got.length) * 100) / 100 : 0, count: got.length };
  }).filter((s) => s.count > 0);
  // সামগ্রিক মেধাক্রম: সব পরীক্ষায় উত্তীর্ণরা আগে, তারপর গড় শতকরা
  const ranked = rankRows(items.map((i) => ({ ...i, total: i.avgPercent, gpa: i.avgPercent })));
  return json({ exams, items: ranked });
});
