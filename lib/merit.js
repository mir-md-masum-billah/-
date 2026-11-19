import { Student, Result } from "@/lib/models";
import { HttpError } from "@/lib/http";
import { visibleScopes, scopeFilter } from "@/lib/assign";
import { summarize } from "@/lib/grades";

// মেধা তালিকা/সব-পরীক্ষার তালিকার ভিত্তি: শ্রেণির (ও শাখার) সক্রিয় শিক্ষার্থী + তাদের ফল। শিক্ষক শুধু নিজের নিয়োগকৃত শ্রেণি দেখে।
export async function classStudents(user, cls, section) {
  if (!cls) throw new HttpError(400, "শ্রেণি দিন");
  const sc = await visibleScopes(user);
  return Student.find({ class: cls, active: true, archived: { $ne: true }, ...(section ? { section } : {}), ...scopeFilter(sc) }).sort({ section: 1, roll: 1 }).select("name studentId roll section photo").lean();
}
// মেধাক্রম: উত্তীর্ণরা আগে, তারপর মোট নম্বর, তারপর জিপিএ; একই নম্বর ও ফল হলে একই মেধাক্রম
export function rankRows(rows) {
  const sorted = [...rows].sort((a, b) => Number(b.passed) - Number(a.passed) || b.total - a.total || b.gpa - a.gpa || a.roll - b.roll);
  return sorted.map((r, i) => { const first = sorted.findIndex((o) => o.passed === r.passed && o.total === r.total && o.gpa === r.gpa); return { ...r, position: first + 1 }; });
}
export async function meritList(user, { cls, section, exam, year }) {
  const students = await classStudents(user, cls, section);
  const rows = await Result.find({ student: { $in: students.map((s) => s._id) }, exam, year }).select("student marks full subject").lean();
  const by = new Map(); for (const r of rows) (by.get(String(r.student)) || by.set(String(r.student), []).get(String(r.student))).push(r);
  const items = students.filter((s) => by.has(String(s._id))).map((s) => { const sm = summarize(by.get(String(s._id))); return { _id: s._id, name: s.name, studentId: s.studentId, roll: s.roll, section: s.section, total: sm.total, full: sm.full, percent: Math.round(sm.percent * 10) / 10, gpa: Math.round(sm.gpa * 100) / 100, letter: sm.letter, passed: sm.passed, subjects: sm.subs.length }; });
  return { items: rankRows(items), total: students.length };
}
