import { connectDB } from "@/lib/db";
import { currentUser } from "@/lib/guard";
import { Result } from "@/lib/models";
import { handle, json, HttpError } from "@/lib/http";
import { summarize } from "@/lib/grades";
import { cardStudent, buildCard } from "@/lib/resultCard";

// একজন শিক্ষার্থীর একাধিক রেজাল্ট কার্ড একসাথে (সব পরীক্ষা / একটি বছর / একটি পরীক্ষা)।
//   ?student=ID (শিক্ষার্থী নিজে হলে লাগে না)  &year=2026  &exam=নাম  &list=1 (শুধু তালিকা: কোন কোন পরীক্ষা-বছরে ফল আছে)
export const GET = handle(async (req) => {
  const u = await currentUser();
  if (!u) throw new HttpError(401, "আবার লগইন করুন");
  const sp = new URL(req.url).searchParams;
  await connectDB();
  const s = await cardStudent(u, sp.get("student"));
  const match = { student: s._id, ...(u.role === "student" ? { published: { $ne: false } } : {}) };
  if (sp.get("year") && Number.isFinite(Number(sp.get("year")))) match.year = Number(sp.get("year"));
  if (sp.get("exam")) match.exam = sp.get("exam");
  const pairs = await Result.aggregate([{ $match: match }, { $group: { _id: { exam: "$exam", year: "$year" }, first: { $min: "$createdAt" } } }, { $sort: { "_id.year": 1, first: 1 } }, { $limit: 40 }]);
  const list = pairs.map((p) => ({ exam: p._id.exam, year: p._id.year }));
  if (sp.get("list")) { // তালিকার সাথে প্রতিটি পরীক্ষার মোট, শতকরা, জিপিএ ও গ্রেড (A+, A, A-, B ...)
    const rows = await Result.find(match).select("exam year marks full").lean();
    return json({ items: list.map((p) => { const rs = rows.filter((r) => r.exam === p.exam && r.year === p.year); const sm = summarize(rs); return { ...p, total: sm.total, full: sm.full, percent: Math.round(sm.percent * 10) / 10, gpa: Math.round(sm.gpa * 100) / 100, letter: sm.letter, passed: sm.passed }; }) });
  }
  const cards = [];
  for (const p of list) { const c = await buildCard(u, s, p.exam, p.year); if (c) cards.push(c); }
  return json({ cards });
});
