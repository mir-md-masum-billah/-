import { withTx } from "@/lib/db";
import { requireUser } from "@/lib/guard";
import { Invoice, Payment, LedgerEntry } from "@/lib/models";
import { handle, ok, bad, isId, HttpError } from "@/lib/http";
import { netPaidMap, lockInvoice, round2 } from "@/lib/finance";
import { audit } from "@/lib/audit";

// ভুল পেমেন্ট মোছা হয় না — বাতিল (কারণ সহ), লেজার এন্ট্রিও একসাথে বাতিল হয়
export const POST = handle(async (req, { params }) => {
  const user = await requireUser("fees.manage");
  const { id } = await params;
  const { reason } = await req.json().catch(() => ({}));
  if (!reason || String(reason).trim().length < 3) throw bad("বাতিলের কারণ লিখুন");
  if (!isId(id)) throw new HttpError(404, "পেমেন্ট পাওয়া যায়নি");
  await withTx(async (session) => {
    const p = await Payment.findById(id).session(session);
    if (!p) throw new HttpError(404, "পেমেন্ট পাওয়া যায়নি");
    if (p.voided) throw new HttpError(409, "এই পেমেন্ট আগেই বাতিল হয়েছে");
    await lockInvoice(p.invoice, session);
    if (p.type === "payment") {
      const net = (await netPaidMap([p.invoice], session))[String(p.invoice)] || 0;
      if (round2(net - p.amount) < 0) throw bad("এই পেমেন্টের পর রিফান্ড আছে — আগে রিফান্ড বাতিল করুন");
    }
    const now = new Date();
    p.set({ voided: true, voidedAt: now, voidReason: String(reason).trim().slice(0, 200), voidedByName: user.name });
    await p.save({ session });
    await LedgerEntry.updateOne({ sourceKey: `payment:${p._id}` }, { $set: { voided: true, voidedAt: now, voidReason: p.voidReason } }, { session });
    await audit(user, "void", "payment", p._id, { receiptNo: p.receiptNo, amount: p.amount, reason: p.voidReason }, session);
  });
  return ok();
});
