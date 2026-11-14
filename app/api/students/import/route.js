import bcrypt from "bcryptjs";
import { connectDB, withTx } from "@/lib/db";
import { requireUser } from "@/lib/guard";
import { Student, StudentHistory } from "@/lib/models";
import { handle, json, bad } from "@/lib/http";
import { resources, pick, validateStudent } from "@/lib/resources";
import { nextStudentId, genPassword, nextRoll } from "@/lib/ids";
import { audit } from "@/lib/audit";

export const maxDuration = 60;
const FIELDS = ["studentId", "name", "class", "section", "roll", "session", "gender", "fatherName", "motherName", "guardianName", "guardianPhone", "phone", "address", "birthRegNo", "dob", "admissionDate", "monthlyFee", "previousSchool", "previousClass"];

// body: { rows: [...], dryRun }. কোনো সারিতে ভুল থাকলে কিছুই সংরক্ষিত হয় না (সব-অথবা-কিছুই-না)
export const POST = handle(async (req) => {
  const user = await requireUser("students.write");
  await connectDB();
  const { rows, dryRun } = await req.json();
  if (!Array.isArray(rows) || !rows.length) throw bad("কোনো সারি নেই");
  if (rows.length > 200) throw bad("একবারে সর্বোচ্চ ২০০ জন");
  const errors = [], data = [], seenId = new Set(), seenRoll = new Set();
  for (let i = 0; i < rows.length; i++) {
    const n = i + 2; // হেডার বাদে স্প্রেডশিটের সারি নম্বর
    try {
      const d = pick(rows[i] || {}, FIELDS);
      for (const k of Object.keys(d)) if (d[k] === "") delete d[k];
      if (!d.name) throw bad("নাম নেই");
      if (!d.class) throw bad("শ্রেণি নেই");
      await validateStudent(d, { isUpdate: false });
      if (d.studentId) { if (seenId.has(d.studentId) || (await Student.exists({ studentId: d.studentId }))) throw bad("আইডি আগে থেকেই আছে"); seenId.add(d.studentId); }
      if (d.roll) { const k = `${d.class}|${d.section || ""}|${d.session || ""}|${d.roll}`; if (seenRoll.has(k)) throw bad("ফাইলে এই রোল ডুপ্লিকেট"); seenRoll.add(k); }
      data.push(d);
    } catch (e) { errors.push({ row: n, error: e.message || "ভুল" }); }
  }
  if (errors.length) return json({ ok: false, created: 0, errors }, 400);
  if (dryRun) return json({ ok: true, dryRun: true, valid: data.length });

  const credentials = [];
  await withTx(async (session) => {
    const next = {}; // শ্রেণি-শাখা-সেশন অনুযায়ী পরের রোল
    for (const d of data) {
      if (!d.studentId) d.studentId = await nextStudentId(session);
      if (!d.roll) { const k = `${d.class}|${d.section || ""}|${d.session || ""}`; next[k] = (next[k] ?? (await nextRoll(d.class, d.section, d.session))); d.roll = next[k]++; }
      const pw = genPassword(); credentials.push({ studentId: d.studentId, name: d.name, password: pw });
      d.password = await bcrypt.hash(pw, 8); // এলোমেলো পাসওয়ার্ড — কম কস্টে দ্রুত
      d.admissionDate ||= new Date().toISOString().slice(0, 10);
    }
    const docs = await Student.insertMany(data, { session });
    await StudentHistory.insertMany(docs.map((s) => ({ student: s._id, type: "admission", toClass: s.class, toSection: s.section, toRoll: s.roll, session: s.session, date: s.admissionDate, note: "বাল্ক আমদানি", byName: user.name })), { session });
  });
  await audit(user, "import", "students", null, { count: data.length });
  return json({ ok: true, created: data.length, credentials });
});
