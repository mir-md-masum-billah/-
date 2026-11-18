import { connectDB } from "@/lib/db";
import { requireUser } from "@/lib/guard";
import { Student, Result, ResultPublication } from "@/lib/models";
import { handle, ok, bad, num, str } from "@/lib/http";
import { audit } from "@/lib/audit";
import { isFinal } from "@/lib/results";

// ফলাফল চূড়ান্ত প্রকাশ (শ্রেণি/শাখা + পরীক্ষা + বছর ধরে) — শুধু একবার। প্রকাশের পর প্রত্যাহার বা পুনরায় প্রকাশ নেই; নম্বর সংশোধন করা যাবে।
export const POST = handle(async (req) => {
  const user = await requireUser("results.publish");
  const b = await req.json().catch(() => ({}));
  if (b.publish === false) throw bad("প্রকাশিত ফলাফল প্রত্যাহার করা যায় না — শুধু নম্বর সংশোধন করা যাবে");
  const exam = str(b.exam, 120), cls = str(b.class, 60), section = str(b.section || "", 40);
  if (!exam || !cls) throw bad("পরীক্ষা ও শ্রেণি বাছাই করুন");
  const year = num(b.year, "বছর", { min: 2000, max: 2100, int: true });
  await connectDB();
  if (await isFinal(exam, year, cls, section)) {
    await ResultPublication.updateOne({ exam, year, class: cls, section }, { $setOnInsert: { publishedByName: user.name } }, { upsert: true });
    throw bad("এই ফলাফল ইতিমধ্যে চূড়ান্তভাবে প্রকাশিত — নতুন করে প্রকাশ করা যায় না। শুধু নম্বর সংশোধন করা যাবে।");
  }
  const ids = await Student.find({ class: cls, archived: { $ne: true }, ...(section ? { section } : {}) }).distinct("_id");
  const r = await Result.updateMany({ exam, year, student: { $in: ids } }, { $set: { published: true } });
  if (!r.matchedCount) throw bad("এই পরীক্ষার কোনো নম্বর পাওয়া যায়নি");
  await ResultPublication.create({ exam, year, class: cls, section, publishedByName: user.name, count: r.matchedCount });
  await audit(user, "publish", "results", null, { exam, year, class: cls, section, count: r.matchedCount });
  return ok({ count: r.matchedCount });
});
