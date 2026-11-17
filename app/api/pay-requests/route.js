import { connectDB } from "@/lib/db";
import { currentUser } from "@/lib/guard";
import { Invoice, PaymentSubmission, Student } from "@/lib/models";
import { handle, json, ok, bad, num, isId, HttpError, esc } from "@/lib/http";
import { netPaidMap, obligation, round2 } from "@/lib/finance";
import { isDate, isFuture, todayDhaka } from "@/lib/dates";
import { audit } from "@/lib/audit";
import { activeMethods } from "@/lib/pay";
import { visibleScopes, scopeFilter } from "@/lib/assign";

export const GET = handle(async (req) => {
  const u = await currentUser();
  if (!u) throw new HttpError(401, "আবার লগইন করুন");
  await connectDB();
  const sp = new URL(req.url).searchParams;
  const f = {};
  if (u.role === "student") f.student = u.id;
  else {
    if (!u.perms.includes("payments.review")) throw new HttpError(403, "এই কাজের অনুমতি নেই");
    const sc = scopeFilter(await visibleScopes(u));
    if (Object.keys(sc).length) f.student = { $in: await Student.find(sc).distinct("_id") };
  }
  if (["pending", "approved", "rejected"].includes(sp.get("status"))) f.status = sp.get("status");
  const q = (sp.get("q") || "").trim().slice(0, 40);
  if (q) f.$or = [{ trxId: { $regex: esc(q), $options: "i" } }, { senderNumber: { $regex: esc(q) } }];
  const limit = Math.min(Math.max(parseInt(sp.get("limit")) || 20, 1), 200), page = Math.max(parseInt(sp.get("page")) || 1, 1);
  const [total, items, pending] = await Promise.all([
    PaymentSubmission.countDocuments(f),
    PaymentSubmission.find(f).sort({ createdAt: -1 }).skip((page - 1) * limit).limit(limit).populate("student", "name studentId class section roll").populate("invoice", "invoiceNo title period category").populate("payment", "receiptNo").lean(),
    u.role === "student" ? 0 : PaymentSubmission.countDocuments({ ...f, status: "pending" }),
  ]);
  return json({ items, total, pending, page, pages: Math.max(1, Math.ceil(total / limit)) });
});

// শুধু শিক্ষার্থী নিজের নামে জমা দিতে পারে। জমা দিলেই "Paid" হয় না — Approve লাগে
export const POST = handle(async (req) => {
  const u = await currentUser();
  if (!u || u.role !== "student") throw new HttpError(403, "শুধু শিক্ষার্থী পেমেন্ট তথ্য জমা দিতে পারে");
  await connectDB();
  const b = await req.json();
  if (!isId(String(b.invoice))) throw bad("কোন ফি পরিশোধ করছেন তা বাছাই করুন");
  const m = (await activeMethods()).find((x) => x.id === b.methodId);
  if (!m) throw bad("পেমেন্ট মাধ্যম বাছাই করুন");
  const amount = round2(num(b.amount, "টাকা", { min: 0.01 }));
  const paidDate = b.paidDate || todayDhaka();
  if (!isDate(paidDate) || isFuture(paidDate)) throw bad("পেমেন্টের তারিখ সঠিক নয়");
  const phone = (v, l) => { const s = String(v || "").replace(/[\s-]/g, ""); if (!/^[+0-9A-Za-z]{4,30}$/.test(s)) throw bad(`${l} সঠিক নয়`); return s; };
  const senderNumber = phone(b.senderNumber, "যে নম্বর/অ্যাকাউন্ট থেকে পাঠিয়েছেন"), receiverNumber = phone(b.receiverNumber || m.accountNumber, "যে নম্বরে পাঠিয়েছেন");
  const trxId = String(b.trxId || "").trim().toUpperCase();
  if (!/^[A-Z0-9._-]{4,40}$/.test(trxId)) throw bad("ট্রানজেকশন আইডি সঠিক নয় (৪–৪০ অক্ষর, ইংরেজি/সংখ্যা)");
  const inv = await Invoice.findOne({ _id: b.invoice, student: u.id, status: "open" }).lean();
  if (!inv) throw new HttpError(404, "ইনভয়েস পাওয়া যায়নি");
  const net = (await netPaidMap([inv._id]))[String(inv._id)] || 0;
  const pend = await PaymentSubmission.aggregate([{ $match: { invoice: inv._id, status: "pending" } }, { $group: { _id: null, t: { $sum: "$amount" } } }]);
  const free = round2(obligation(inv) - net - (pend[0]?.t || 0));
  if (free <= 0.001) throw bad("এই ফি-র জন্য আগেই পেমেন্ট জমা দেওয়া আছে বা পরিশোধিত");
  if (amount > free + 0.001) throw bad(`সর্বোচ্চ ${free} টাকা জমা দেওয়া যাবে`);
  const doc = await PaymentSubmission.create({ student: u.id, invoice: inv._id, amount, method: m.kind, methodId: m.id, methodLabel: m.label, paidDate, senderNumber, receiverNumber, trxId, trxKey: `${m.kind}:${trxId}` }).catch((e) => { if (e.code === 11000) throw bad("এই ট্রানজেকশন আইডি দিয়ে আগেই তথ্য জমা দেওয়া হয়েছে"); throw e; });
  await audit(u, "submit", "pay_request", doc._id, { invoice: inv.invoiceNo, amount, method: m.label, trxId });
  return ok({ id: doc._id });
});
