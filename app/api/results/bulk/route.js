import { connectDB } from "@/lib/db";
import { requireUser } from "@/lib/guard";
import { Student, Result } from "@/lib/models";
import { handle, ok, bad, num, isId, str } from "@/lib/http";
import { audit } from "@/lib/audit";
import { assertResultAccess } from "@/lib/assign";
import { applicable, classSubjects } from "@/lib/subjects";

// একসাথে অনেক শিক্ষার্থীর বিষয়ভিত্তিক নম্বর সংরক্ষণ। ফাঁকা ঘর বাদ যায়। নতুন নম্বর "অপ্রকাশিত" — প্রকাশ না করা পর্যন্ত শিক্ষার্থী দেখে না।
// আগে প্রতিটি ঘরের জন্য আলাদা কুয়েরি চলত (৩০০০ ঘর = ৬০০০+ কুয়েরি); এখন একটি কুয়েরিতে সব পড়ে এবং একটি bulkWrite-এ লেখে।
export const POST = handle(async (req) => {
  const user = await requireUser("results.write");
  const b = await req.json();
  const exam = str(b.exam, 80); if (exam.length < 2) throw bad("পরীক্ষার নাম দিন");
  const cls = str(b.class, 60);
  const year = num(b.year, "বছর", { min: 2000, max: 2100, int: true });
  if (!Array.isArray(b.rows) || !b.rows.length || b.rows.length > 3000) throw bad("কোনো নম্বর দেওয়া হয়নি");
  await connectDB();
  const subjects = await classSubjects(cls);
  const ids = [...new Set(b.rows.map((r) => String(r?.student)))]; if (ids.some((i) => !isId(i))) throw bad("শিক্ষার্থী সঠিক নয়");
  const students = new Map((await Student.find({ _id: { $in: ids }, class: cls, active: true, archived: { $ne: true } }).lean()).map((s) => [String(s._id), s]));

  // ১) যাচাই — কোনো ঘরে ভুল থাকলে কিছুই সংরক্ষিত হয় না
  const wanted = new Map(); // "studentId|subject" → { s, sub, marks, full } (একই ঘর দুবার থাকলে শেষটি)
  const checked = new Set();
  for (const r of b.rows) {
    if (r.marks === "" || r.marks === null || r.marks === undefined) continue;
    const s = students.get(String(r.student)); if (!s) throw bad("শিক্ষার্থী এই শ্রেণিতে নেই");
    const sub = subjects.find((x) => x.name === r.subject); if (!sub) throw bad(`"${str(r.subject, 60)}" বিষয়টি এই শ্রেণিতে নেই`);
    if (!applicable(s, [sub]).length) throw bad(`${s.name}-এর জন্য "${sub.name}" বন্ধ করা আছে`);
    const k = `${s._id}|${sub.name}`;
    if (!checked.has(k)) { await assertResultAccess(user, s._id, sub.name); checked.add(k); }
    const full = num(r.full ?? sub.fullMarks ?? 100, "পূর্ণমান", { min: 1, max: 1000 }), marks = num(r.marks, `${s.name} — ${sub.name}: নম্বর`, { min: 0, max: 1000 });
    if (marks > full) throw bad(`${s.name} — ${sub.name}: নম্বর পূর্ণমানের (${full}) বেশি`);
    wanted.set(k, { s, sub, marks, full });
  }

  // ২) বিদ্যমান নম্বর একবারে পড়া
  const existing = await Result.find({ exam, year, student: { $in: [...new Set([...wanted.values()].map((w) => w.s._id))] } }).select("student subject marks full").lean();
  const have = new Map(existing.map((e) => [`${e.student}|${e.subject}`, e]));

  // ৩) নতুন → insert, বদলালে → ইতিহাসসহ update
  const ops = []; let saved = 0, changed = 0;
  for (const [k, w] of wanted) {
    const ex = have.get(k);
    if (!ex) { saved++; ops.push({ insertOne: { document: { student: w.s._id, exam, year, subject: w.sub.name, marks: w.marks, full: w.full, published: false } } }); }
    else if (ex.marks !== w.marks || ex.full !== w.full) {
      changed++;
      ops.push({ updateOne: { filter: { _id: ex._id }, update: { $set: { marks: w.marks, full: w.full }, $push: { history: { marks: ex.marks, full: ex.full, by: user.name, at: new Date() } } } } });
    }
  }
  if (ops.length) await Result.bulkWrite(ops, { ordered: false });
  await audit(user, "bulk", "results", null, { exam, year, class: cls, saved, changed });
  return ok({ saved, changed });
});
