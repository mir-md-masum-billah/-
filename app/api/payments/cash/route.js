import { withTx } from "@/lib/db";
import { requireUser } from "@/lib/guard";
import { Invoice, Student, FEE_CATEGORIES } from "@/lib/models";
import { handle, ok, bad, num, isId, HttpError } from "@/lib/http";
import { nextNo, round2 } from "@/lib/finance";
import { isDate, isFuture, todayDhaka } from "@/lib/dates";
import { recordPayment } from "@/lib/pay";
import { visibleScopes, inScope } from "@/lib/assign";
import { audit } from "@/lib/audit";

// অফিস/শিক্ষকের কাছে নগদ জমা: শিক্ষার্থী + ধরন + টাকা + তারিখ → পেমেন্ট ও ইনভয়েস সাথে সাথে (অনুমোদন লাগে না, কারণ নেয় অনুমোদিত ব্যক্তি নিজেই)
export const POST = handle(async (req) => {
  const user = await requireUser("fees.collect");
  const b = await req.json();
  if (!isId(String(b.student))) throw bad("শিক্ষার্থী বাছাই করুন");
  const amount = round2(num(b.amount, "টাকা", { min: 0.01 }));
  const date = b.date || todayDhaka();
  if (!isDate(date) || isFuture(date)) throw bad("তারিখ সঠিক নয়");
  const out = await withTx(async (session) => {
    const s = await Student.findOne({ _id: b.student, active: true, archived: { $ne: true } }).select("class section").session(session);
    if (!s) throw bad("শিক্ষার্থী পাওয়া যায়নি বা সক্রিয় নয়");
    if (!inScope(await visibleScopes(user), s.class, s.section)) throw new HttpError(403, "এই শিক্ষার্থীর ফি নেওয়ার অনুমতি নেই");
    let invId = b.invoice;
    if (invId) {
      const inv = await Invoice.findOne({ _id: invId, student: s._id }).select("_id").session(session);
      if (!inv) throw bad("ইনভয়েস পাওয়া যায়নি");
    } else {
      if (!FEE_CATEGORIES[b.category]) throw bad("পেমেন্টের ধরন বাছাই করুন");
      const period = b.period || "";
      if (period && !/^\d{4}-(0[1-9]|1[0-2])$/.test(period)) throw bad("মাস সঠিক নয়");
      if (b.category === "tuition" && !period) throw bad("মাসিক বেতনের জন্য মাস দিন");
      const invoiceNo = await nextNo("INV", session);
      const [inv] = await Invoice.create([{ invoiceNo, student: s._id, category: b.category, title: `${FEE_CATEGORIES[b.category]} (${invoiceNo})`, period, year: period ? +period.slice(0, 4) : undefined, month: period ? +period.slice(5) : undefined, amount, note: "ক্যাশে সরাসরি গ্রহণ" }], { session });
      invId = inv._id;
    }
    const { pay, inv, due } = await recordPayment(session, { invoiceId: invId, amount, method: "cash", methodLabel: "নগদ (ক্যাশ)", date, reference: b.reference, note: b.note, channel: "office", user });
    return { id: pay._id, receiptNo: pay.receiptNo, due, invoiceNo: inv.invoiceNo };
  });
  return ok(out);
});
