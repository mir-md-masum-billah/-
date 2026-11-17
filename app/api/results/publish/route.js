import { connectDB } from "@/lib/db";
import { requireUser } from "@/lib/guard";
import { Student, Result } from "@/lib/models";
import { handle, ok, bad, num } from "@/lib/http";
import { audit } from "@/lib/audit";

// ফলাফল প্রকাশ / প্রত্যাহার (শ্রেণি-শাখা + পরীক্ষা + বছর ধরে)
export const POST = handle(async (req) => {
  const user = await requireUser("results.publish");
  const b = await req.json();
  const exam = String(b.exam || "").trim(), cls = String(b.class || "");
  if (!exam || !cls) throw bad("পরীক্ষা ও শ্রেণি বাছাই করুন");
  const year = num(b.year, "বছর", { min: 2000, max: 2100, int: true });
  await connectDB();
  const ids = await Student.find({ class: cls, archived: { $ne: true }, ...(b.section ? { section: String(b.section) } : {}) }).distinct("_id");
  const r = await Result.updateMany({ exam, year, student: { $in: ids } }, { $set: { published: b.publish !== false } });
  if (!r.matchedCount) throw bad("এই পরীক্ষার কোনো নম্বর পাওয়া যায়নি");
  await audit(user, b.publish === false ? "unpublish" : "publish", "results", null, { exam, year, class: cls, section: b.section || "", count: r.matchedCount });
  return ok({ count: r.matchedCount });
});
