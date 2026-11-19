import { connectDB } from "@/lib/db";
import { requireUser, assertPromote } from "@/lib/guard";
import { Student } from "@/lib/models";
import { handle, json, bad } from "@/lib/http";
import { rankStudents, WEIGHTS } from "@/lib/rank";
import { isFinal } from "@/lib/results";

// প্রমোশনের আগে র‍্যাংক দেখা (শিক্ষক/অনুমোদনকারী যাচাই করে তারপর প্রমোশন দেন): ?class=&section=&exam=&year=
export const GET = handle(async (req) => {
  const user = await requireUser();
  const sp = new URL(req.url).searchParams, cls = sp.get("class") || "", section = sp.get("section") || "", exam = sp.get("exam") || "", year = Number(sp.get("year"));
  assertPromote(user, cls, section);
  if (!cls || !exam || !Number.isFinite(year)) throw bad("শ্রেণি, পরীক্ষা ও বছর দিন");
  await connectDB();
  const students = await Student.find({ class: cls, active: true, archived: { $ne: true }, ...(section ? { section } : {}) }).select("name studentId roll section photo").lean();
  if (!students.length) throw bad("কোনো সক্রিয় শিক্ষার্থী পাওয়া যায়নি");
  const secs = [...new Set(students.map((s) => s.section || ""))];
  const finals = await Promise.all(secs.map((sc) => isFinal(exam, year, cls, sc)));
  const ranked = await rankStudents({ students, exam, year });
  return json({ items: ranked.map((r) => ({ _id: r.student._id, name: r.student.name, studentId: r.student.studentId, roll: r.student.roll, section: r.student.section, hasFinal: r.hasFinal, passed: r.passed, finalPercent: r.finalPercent, gpa: r.gpa, avgPct: r.avgPct, examCount: r.examCount, attPct: r.attPct, score: r.score, rank: r.rank })), finalized: finals.every(Boolean), weights: WEIGHTS });
});
