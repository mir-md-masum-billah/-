import { connectDB, withTx } from "@/lib/db";
import { requireUser } from "@/lib/guard";
import { Invoice, Payment, LedgerEntry, PAY_METHODS } from "@/lib/models";
import { handle, json, ok, bad, num, isId, HttpError } from "@/lib/http";
import { netPaidMap, obligation, lockInvoice, nextNo, round2 } from "@/lib/finance";
import { isDate, isFuture, todayDhaka } from "@/lib/dates";
import { audit } from "@/lib/audit";
import { ensureAdmitCard } from "@/lib/pay";

export const GET = handle(async (req) => {
  await requireUser("fees.read");
  await connectDB();
  const sp = new URL(req.url).searchParams;
  const f = {};
  for (const k of ["student", "invoice"]) if (sp.get(k) && isId(sp.get(k))) f[k] = sp.get(k);
  if (PAY_METHODS.includes(sp.get("method"))) f.method = sp.get("method");
  if (["payment", "refund"].includes(sp.get("type"))) f.type = sp.get("type");
  if (["online", "office"].includes(sp.get("channel"))) f.channel = sp.get("channel") === "office" ? { $ne: "online" } : "online";
  if (sp.get("voided") !== "true") f.voided = { $ne: true };
  const from = sp.get("from"), to = sp.get("to");
  if (isDate(from) || isDate(to)) f.date = { ...(isDate(from) && { $gte: from }), ...(isDate(to) && { $lte: to }) };
  const limit = Math.min(Math.max(parseInt(sp.get("limit")) || 20, 1), 500), page = Math.max(parseInt(sp.get("page")) || 1, 1);
  const [total, items] = await Promise.all([Payment.countDocuments(f), Payment.find(f).sort({ date: -1, createdAt: -1 }).skip((page - 1) * limit).limit(limit).populate("student", "name studentId class roll").populate("invoice", "invoiceNo title period").lean()]);
  return json({ items, total, page, pages: Math.max(1, Math.ceil(total / limit)) });
});

// পেমেন্ট/রিফান্ড: লেনদেন + লেজার এন্ট্রি একসাথে (ট্রানজ্যাকশনে)। আগের পেমেন্ট কখনও ওভাররাইট হয় না
export const POST = handle(async (req) => {
  const b = await req.json();
  const type = b.type === "refund" ? "refund" : "payment";
  const user = await requireUser(type === "refund" ? "fees.manage" : "fees.collect");
  if (!isId(String(b.invoice))) throw bad("ইনভয়েস বাছাই করুন");
  if (!PAY_METHODS.includes(b.method)) throw bad("পেমেন্ট পদ্ধতি সঠিক নয়");
  const amount = round2(num(b.amount, "টাকা", { min: 0.01 }));
  const date = b.date || todayDhaka();
  if (!isDate(date) || isFuture(date)) throw bad("তারিখ সঠিক নয়");
  if (type === "refund" && (!b.note || String(b.note).trim().length < 3)) throw bad("রিফান্ডের কারণ লিখুন");

  const out = await withTx(async (session) => {
    const inv = await Invoice.findById(b.invoice).session(session);
    if (!inv || inv.status === "void") throw new HttpError(404, "ইনভয়েস পাওয়া যায়নি");
    await lockInvoice(inv._id, session); // সমান্তরাল পেমেন্ট হলে একটি আবার চেষ্টা করে, ফলে বেশি জমা হয় না
    const net = (await netPaidMap([inv._id], session))[String(inv._id)] || 0;
    const due = round2(obligation(inv) - net);
    if (type === "payment" && amount > due + 0.001) throw bad(`বকেয়া মাত্র ${due} টাকা — এর বেশি নেওয়া যাবে না`);
    if (type === "refund" && amount > net + 0.001) throw bad(`ফেরতযোগ্য জমা মাত্র ${net} টাকা`);
    const receiptNo = await nextNo(type === "refund" ? "RF" : "R", session);
    const [pay] = await Payment.create([{ receiptNo, type, invoice: inv._id, student: inv.student, amount, method: b.method, date, reference: b.reference, note: b.note, channel: "office", createdBy: user.id, createdByName: user.name }], { session });
    await LedgerEntry.create([{ type: type === "refund" ? "expense" : "income", account: b.method, category: type === "refund" ? "refund" : "fee", title: `${type === "refund" ? "ফেরত" : "বেতন/ফি আদায়"} — ${inv.title} (${receiptNo})`, amount, date, reference: receiptNo, source: type, sourceKey: `payment:${pay._id}`, createdByName: user.name }], { session });
    await audit(user, type, "payment", pay._id, { receiptNo, amount, invoice: inv.invoiceNo, method: b.method }, session);
    if (type === "payment" && inv.examNotice && round2(due - amount) <= 0.001) await ensureAdmitCard(session, inv);
    return { id: pay._id, receiptNo, due: round2(due - (type === "payment" ? amount : -amount)) };
  });
  return ok(out);
});
