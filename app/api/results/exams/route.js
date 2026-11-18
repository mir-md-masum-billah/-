import { connectDB } from "@/lib/db";
import { requireUser } from "@/lib/guard";
import { ExamNotice, Result, ResultPublication, Student } from "@/lib/models";
import { handle, json, bad } from "@/lib/http";
import { yearDhaka } from "@/lib/dates";

// ফলাফল দেওয়ার জন্য পরীক্ষা/সেমিস্টারের তালিকা — শ্রেণির পরীক্ষার নোটিশ থেকে আসে (সরানো নোটিশও, কারণ পরীক্ষার পরেই ফল দেওয়া হয়)।
// আগে থেকে নম্বর দেওয়া পুরনো পরীক্ষাও (নোটিশ ছাড়া) তালিকায় থাকে। প্রতিটির সাথে বছর ও প্রকাশের অবস্থা জানায়।
export const GET = handle(async (req) => {
  await requireUser("results.read");
  const cls = new URL(req.url).searchParams.get("class") || "";
  if (!cls) throw bad("শ্রেণি বাছাই করুন");
  await connectDB();
  const notices = await ExamNotice.find({ class: cls, status: "published" }).select("name schedule session createdAt").sort({ createdAt: -1 }).lean();
  const map = new Map();
  for (const n of notices) {
    const last = (n.schedule || []).map((r) => r.date).sort().pop();
    const year = last ? Number(last.slice(0, 4)) : Number(String(n.session || "").slice(0, 4)) || yearDhaka();
    const k = `${n.name}|${year}`; if (!map.has(k)) map.set(k, { name: n.name, year, source: "notice" });
  }
  const ids = await Student.find({ class: cls }).distinct("_id");
  const old = await Result.aggregate([{ $match: { student: { $in: ids } } }, { $group: { _id: { exam: "$exam", year: "$year" } } }]);
  for (const o of old) { const k = `${o._id.exam}|${o._id.year}`; if (!map.has(k)) map.set(k, { name: o._id.exam, year: o._id.year, source: "legacy" }); }
  const pubs = await ResultPublication.find({ class: cls }).select("exam year section").lean();
  const items = [...map.values()].map((e) => ({ ...e, finalSections: pubs.filter((p) => p.exam === e.name && p.year === e.year).map((p) => p.section || "") }));
  items.sort((a, b) => b.year - a.year || a.name.localeCompare(b.name, "bn"));
  return json({ items });
});
