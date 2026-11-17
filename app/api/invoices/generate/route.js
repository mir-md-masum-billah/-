import { connectDB } from "@/lib/db";
import { requireUser } from "@/lib/guard";
import { Invoice, Student, FEE_CATEGORIES } from "@/lib/models";
import { handle, ok, bad, num, own, str } from "@/lib/http";
import { getSettings } from "@/lib/settings";
import { nextNos } from "@/lib/finance";
import { audit } from "@/lib/audit";

// শ্রেণি/সব শিক্ষার্থীর জন্য মাসিক ফি তৈরি — আগে থেকে থাকলে বাদ যায়, ডুপ্লিকেট হয় না
export const POST = handle(async (req) => {
  const user = await requireUser("fees.manage");
  await connectDB();
  const b = await req.json();
  const category = str(b.category, 30) || "tuition";
  if (!own(FEE_CATEGORIES, category)) throw bad("ফি-এর ধরন সঠিক নয়");
  const cls = str(b.class, 60);
  if (cls && !(await getSettings()).classes.some((c) => c.name === cls)) throw bad("শ্রেণি সেটিংসে নেই");
  const month = num(b.month, "মাস", { min: 1, max: 12, int: true }), year = num(b.year, "বছর", { min: 2000, max: 2100, int: true });
  const override = num(b.amount, "টাকা", { req: false, min: 0.01 });
  const period = `${year}-${String(month).padStart(2, "0")}`;
  const title = FEE_CATEGORIES[category];
  const q = { active: true, archived: { $ne: true } };
  if (cls) q.class = cls;
  const students = await Student.find(q).select("_id monthlyFee").lean();
  const have = new Set((await Invoice.find({ category, period, title, student: { $in: students.map((s) => s._id) } }).select("student").lean()).map((i) => String(i.student)));
  const todo = students.filter((s) => !have.has(String(s._id)) && (override ?? s.monthlyFee) > 0);
  const nos = todo.length ? await nextNos("INV", todo.length) : [];
  let created = todo.length;
  if (todo.length) {
    try { await Invoice.insertMany(todo.map((s, i) => ({ invoiceNo: nos[i], student: s._id, category, title, period, month, year, amount: override ?? s.monthlyFee })), { ordered: false }); }
    catch (e) { // একই সময়ে আরেকজন তৈরি করে ফেললে ডুপ্লিকেট বাদ যায়, বাকিগুলো সংরক্ষিত থাকে
      if (e?.code !== 11000 && !e?.writeErrors) throw e;
      created = e.result?.insertedCount ?? e.insertedDocs?.length ?? 0;
    }
  }
  const skippedZero = students.filter((s) => !have.has(String(s._id)) && !((override ?? s.monthlyFee) > 0)).length;
  await audit(user, "generate", "invoice", null, { period, category, class: cls || "all", created, existing: have.size, noFee: skippedZero });
  return ok({ created, alreadyExisted: have.size, skippedNoFee: skippedZero });
});
