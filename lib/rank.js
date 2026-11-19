import { Result, Attendance } from "@/lib/models";
import { summarize } from "@/lib/grades";

// প্রমোশনের সময় নতুন রোল ঠিক করার র‍্যাংক। সব মিলিয়ে স্কোর = সারা বছরের সব পরীক্ষার গড় শতকরা × ৮০% + ওই বছরের হাজিরার হার × ২০%।
// আগে চূড়ান্ত পরীক্ষায় উত্তীর্ণরা; তারপর স্কোর, জিপিএ, চূড়ান্ত পরীক্ষার মোট নম্বর, হাজিরা, নাম — এই ক্রমে। সমান হলেও রোল সবার আলাদা হয়।
export const WEIGHTS = { result: 0.8, attendance: 0.2 };
const r2 = (v) => Math.round(v * 100) / 100;

export async function rankStudents({ students, exam, year }) {
  const ids = students.map((s) => s._id);
  const [results, att] = await Promise.all([
    Result.find({ student: { $in: ids }, year }).select("student exam subject marks full").lean(),
    Attendance.aggregate([{ $match: { student: { $in: ids }, date: { $gte: `${year}-01-01`, $lte: `${year}-12-31` } } }, { $group: { _id: { s: "$student", t: "$status" }, n: { $sum: 1 } } }]),
  ]);
  const byStu = new Map();
  for (const r of results) { const a = byStu.get(String(r.student)) || new Map(); (a.get(r.exam) || a.set(r.exam, []).get(r.exam)).push(r); byStu.set(String(r.student), a); }
  const ac = new Map();
  for (const a of att) { const k = String(a._id.s); const c = ac.get(k) || { p: 0, a: 0 }; if (a._id.t === "present" || a._id.t === "late") c.p += a.n; else if (a._id.t === "absent") c.a += a.n; ac.set(k, c); }
  const rows = students.map((s) => {
    const exams = byStu.get(String(s._id)) || new Map();
    const fin = exams.get(exam) ? summarize(exams.get(exam)) : null;
    const pcts = [...exams.values()].map((rs) => summarize(rs).percent);
    const avgPct = pcts.length ? pcts.reduce((t, v) => t + v, 0) / pcts.length : 0;
    const c = ac.get(String(s._id)), attPct = c && c.p + c.a ? (c.p / (c.p + c.a)) * 100 : null;
    const score = avgPct * WEIGHTS.result + (attPct ?? 0) * WEIGHTS.attendance;
    return { student: s, hasFinal: !!fin, passed: !!fin?.passed, finalPercent: fin ? r2(fin.percent) : null, finalTotal: fin?.total || 0, gpa: fin?.gpa || 0, examCount: pcts.length, avgPct: r2(avgPct), attPct: attPct === null ? null : r2(attPct), score: r2(score) };
  });
  rows.sort((a, b) => Number(b.passed) - Number(a.passed) || b.score - a.score || b.gpa - a.gpa || b.finalTotal - a.finalTotal || (b.attPct ?? -1) - (a.attPct ?? -1) || a.student.name.localeCompare(b.student.name, "bn"));
  return rows.map((r, i) => ({ ...r, rank: i + 1 }));
}
