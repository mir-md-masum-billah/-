import { connectDB, withTx } from "@/lib/db";
import { requireUser } from "@/lib/guard";
import { ExamNotice, Invoice, Payment, AdmitCard, PaymentSubmission } from "@/lib/models";
import { handle, json, ok, bad, isId, HttpError } from "@/lib/http";
import { validateExam } from "@/lib/exams";
import { visibleScopes, inScope } from "@/lib/assign";
import { audit } from "@/lib/audit";

async function load(id, user) {
  if (!isId(id)) throw new HttpError(404, "নোটিশ পাওয়া যায়নি");
  await connectDB();
  const e = await ExamNotice.findById(id);
  if (!e) throw new HttpError(404, "নোটিশ পাওয়া যায়নি");
  if (!inScope(await visibleScopes(user), e.class, e.section)) throw new HttpError(403, "এই শ্রেণির নোটিশে অনুমতি নেই");
  return e;
}
export const GET = handle(async (_r, { params }) => { const u = await requireUser("exams.manage"); return json(await load((await params).id, u).then((e) => e.toObject())); });

// নাম, রুটিন ও নির্দেশনা বদলানো যায়। ফি বদলাতে চাইলে নোটিশ মুছে নতুন করে দিতে হবে (ইনভয়েস ঠিক থাকার জন্য)
export const PUT = handle(async (req, { params }) => {
  const user = await requireUser("exams.manage");
  const e = await load((await params).id, user);
  const b = await req.json();
  const d = await validateExam({ ...b, targets: [{ class: e.class, section: e.section }], fee: e.fee });
  const before = { name: e.name, schedule: e.schedule.length, instructions: e.instructions };
  e.set({ name: d.name, schedule: d.schedule, instructions: d.instructions });
  await e.save();
  await audit(user, "update", "exam_notice", e._id, { name: d.name, before, after: { name: d.name, schedule: d.schedule.length } });
  return ok();
});

// পেমেন্ট হয়ে গেলে মোছা যায় না; না হলে ইনভয়েস বাতিল ও অ্যাডমিট কার্ড মুছে যায়
export const DELETE = handle(async (_r, { params }) => {
  const user = await requireUser("exams.manage");
  const e = await load((await params).id, user);
  await withTx(async (session) => {
    const invs = await Invoice.find({ examNotice: e._id }).select("_id").session(session).lean();
    const ids = invs.map((i) => i._id);
    if (ids.length && (await Payment.exists({ invoice: { $in: ids }, voided: { $ne: true } }).session(session))) throw bad("এই পরীক্ষার ফি জমা হয়েছে — মোছা যাবে না");
    if (ids.length && (await PaymentSubmission.exists({ invoice: { $in: ids }, status: "pending" }).session(session))) throw bad("এই পরীক্ষার ফির অপেক্ষমাণ পেমেন্ট আছে — আগে সেগুলো যাচাই করুন");
    await Invoice.updateMany({ examNotice: e._id }, { $set: { status: "void", voidReason: "পরীক্ষার নোটিশ বাতিল" } }, { session });
    await AdmitCard.deleteMany({ exam: e._id }, { session });
    await ExamNotice.deleteOne({ _id: e._id }, { session });
    await audit(user, "delete", "exam_notice", e._id, { name: e.name, class: e.class, section: e.section }, session);
  });
  return ok();
});
