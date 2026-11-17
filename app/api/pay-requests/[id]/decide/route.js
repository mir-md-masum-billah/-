import { withTx } from "@/lib/db";
import { requireUser } from "@/lib/guard";
import { PaymentSubmission, Student, Invoice } from "@/lib/models";
import { handle, ok, bad, isId, HttpError } from "@/lib/http";
import { recordPayment } from "@/lib/pay";
import { audit } from "@/lib/audit";
import { visibleScopes, inScope } from "@/lib/assign";

export const POST = handle(async (req, { params }) => {
  const user = await requireUser("payments.review");
  const { id } = await params;
  const { action, note } = await req.json().catch(() => ({}));
  if (!["approve", "reject"].includes(action)) throw bad("কাজ সঠিক নয়");
  if (action === "reject" && String(note || "").trim().length < 3) throw bad("প্রত্যাখ্যানের কারণ লিখুন");
  if (!isId(id)) throw new HttpError(404, "পাওয়া যায়নি");
  const out = await withTx(async (session) => {
    const sub = await PaymentSubmission.findById(id).session(session);
    if (!sub) throw new HttpError(404, "পাওয়া যায়নি");
    const stu = await Student.findById(sub.student).select("class section").lean();
    if (!inScope(await visibleScopes(user), stu?.class, stu?.section)) throw new HttpError(403, "এই শিক্ষার্থীর পেমেন্ট যাচাইয়ের অনুমতি নেই");
    // আগে স্ট্যাটাস pending → নতুন মান (একবারই; একসাথে দুজন চাপলে একজন ব্যর্থ)
    const now = new Date();
    const claimed = await PaymentSubmission.findOneAndUpdate({ _id: sub._id, status: "pending" }, { $set: { status: action === "approve" ? "approved" : "rejected", decidedBy: user.id, decidedByName: user.name, decidedAt: now, decisionNote: String(note || "").trim().slice(0, 300) } }, { new: true, session });
    if (!claimed) throw new HttpError(409, "এটি আগেই যাচাই করা হয়েছে");
    const inv = await Invoice.findById(sub.invoice).select("invoiceNo").lean().session(session);
    if (action === "approve") {
      const { pay } = await recordPayment(session, { invoiceId: sub.invoice, amount: sub.amount, method: sub.method, methodLabel: sub.methodLabel, date: sub.paidDate, reference: sub.trxId, channel: "online", trxId: sub.trxId, senderNumber: sub.senderNumber, receiverNumber: sub.receiverNumber, submission: sub._id, note: "অনলাইন পেমেন্ট (অনুমোদিত)", user });
      claimed.payment = pay._id; await claimed.save({ session });
      await audit(user, "approve", "pay_request", sub._id, { invoice: inv?.invoiceNo, amount: sub.amount, trxId: sub.trxId, receiptNo: pay.receiptNo }, session);
      return { receiptNo: pay.receiptNo, paymentId: pay._id };
    }
    await audit(user, "reject", "pay_request", sub._id, { invoice: inv?.invoiceNo, amount: sub.amount, trxId: sub.trxId, reason: claimed.decisionNote }, session);
    return {};
  });
  return ok(out);
});
