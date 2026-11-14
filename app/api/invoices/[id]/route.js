import { connectDB, withTx } from "@/lib/db";
import { requireUser } from "@/lib/guard";
import { Invoice } from "@/lib/models";
import { handle, ok, bad, num, isId, HttpError } from "@/lib/http";
import { netPaidMap, obligation, lockInvoice } from "@/lib/finance";
import { isDate } from "@/lib/dates";
import { audit } from "@/lib/audit";

async function getInv(id, session) {
  if (!isId(id)) throw new HttpError(404, "ইনভয়েস পাওয়া যায়নি");
  const inv = await Invoice.findById(id).session(session);
  if (!inv) throw new HttpError(404, "ইনভয়েস পাওয়া যায়নি");
  if (inv.status === "void") throw bad("বাতিল ইনভয়েস পরিবর্তন করা যায় না");
  return inv;
}

// ডিসকাউন্ট/মওকুফ/জরিমানা/টাকা সমন্বয় (অডিট সহ)
export const PUT = handle(async (req, { params }) => {
  const user = await requireUser("fees.manage");
  const { id } = await params;
  const b = await req.json();
  await withTx(async (session) => {
    const inv = await getInv(id, session);
    await lockInvoice(inv._id, session);
    const before = { amount: inv.amount, discount: inv.discount, fine: inv.fine, discountReason: inv.discountReason, dueDate: inv.dueDate };
    if (b.amount !== undefined) inv.amount = num(b.amount, "টাকা", { min: 0.01 });
    if (b.discount !== undefined) inv.discount = num(b.discount, "ডিসকাউন্ট");
    if (b.fine !== undefined) inv.fine = num(b.fine, "জরিমানা");
    if (b.discountReason !== undefined) inv.discountReason = String(b.discountReason).slice(0, 200);
    if (b.dueDate !== undefined) { if (b.dueDate && !isDate(b.dueDate)) throw bad("তারিখ সঠিক নয়"); inv.dueDate = b.dueDate || undefined; }
    if (b.note !== undefined) inv.note = String(b.note).slice(0, 300);
    if (inv.discount > inv.amount + inv.fine) throw bad("ডিসকাউন্ট মোট টাকার বেশি হতে পারে না");
    const paid = (await netPaidMap([inv._id], session))[String(inv._id)] || 0;
    if (obligation(inv) < paid) throw bad("এখানে ইতিমধ্যে এর চেয়ে বেশি জমা আছে — আগে রিফান্ড করুন");
    await inv.save({ session });
    await audit(user, "update", "invoice", inv._id, { before, after: { amount: inv.amount, discount: inv.discount, fine: inv.fine } }, session);
  });
  return ok();
});

// জমা থাকলে বাতিল নয়; জমা না থাকলে ইনভয়েস বাতিল (মোছা হয় না)
export const DELETE = handle(async (req, { params }) => {
  const user = await requireUser("fees.manage");
  const { id } = await params;
  const { reason } = await req.json().catch(() => ({}));
  if (!reason || String(reason).trim().length < 3) throw bad("বাতিলের কারণ লিখুন");
  await withTx(async (session) => {
    const inv = await getInv(id, session);
    await lockInvoice(inv._id, session);
    const paid = (await netPaidMap([inv._id], session))[String(inv._id)] || 0;
    if (paid !== 0) throw bad("জমা আছে — আগে পেমেন্ট বাতিল বা রিফান্ড করুন");
    inv.status = "void"; inv.voidReason = String(reason).trim().slice(0, 200);
    await inv.save({ session });
    await audit(user, "void", "invoice", inv._id, { invoiceNo: inv.invoiceNo, reason: inv.voidReason }, session);
  });
  return ok();
});
