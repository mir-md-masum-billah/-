import mongoose from "mongoose";
import { Invoice, Payment, Counter } from "@/lib/models";
import { yearDhaka } from "@/lib/dates";

export const obligation = (i) => Math.max(0, (i.amount || 0) + (i.fine || 0) - (i.discount || 0));
export const round2 = (n) => Math.round((n + Number.EPSILON) * 100) / 100;

// ইনভয়েস ধরে নিট জমা = পেমেন্ট − রিফান্ড (বাতিল বাদে)
export async function netPaidMap(invoiceIds, session = null) {
  const rows = await Payment.aggregate([
    { $match: { invoice: { $in: invoiceIds.map((i) => new mongoose.Types.ObjectId(String(i))) }, voided: { $ne: true } } },
    { $group: { _id: "$invoice", net: { $sum: { $cond: [{ $eq: ["$type", "refund"] }, { $multiply: ["$amount", -1] }, "$amount"] } } } },
  ]).session(session);
  const m = {}; rows.forEach((r) => (m[String(r._id)] = round2(r.net)));
  return m;
}
export function withBalance(inv, netPaid = 0) {
  const ob = obligation(inv);
  return { ...inv, obligation: ob, paid: netPaid, due: round2(ob - netPaid) }; // due < 0 = অগ্রিম
}
export async function nextNo(prefix, session = null) {
  const y = yearDhaka();
  const c = await Counter.findOneAndUpdate({ _id: `${prefix}-${y}` }, { $inc: { seq: 1 } }, { upsert: true, new: true, session });
  return `${prefix}-${y}-${String(c.seq).padStart(6, "0")}`;
}
export const lockInvoice = (id, session) => Invoice.updateOne({ _id: id }, { $inc: { rev: 1 } }, { session });

export async function nextNos(prefix, n, session = null) {
  const y = yearDhaka();
  const c = await Counter.findOneAndUpdate({ _id: `${prefix}-${y}` }, { $inc: { seq: n } }, { upsert: true, new: true, session });
  return Array.from({ length: n }, (_, i) => `${prefix}-${y}-${String(c.seq - n + 1 + i).padStart(6, "0")}`);
}
export const accountOf = (method) => method; // cash | bkash | nagad | bank
