import mongoose from "mongoose";
import { connectDB } from "@/lib/db";
import { requireUser } from "@/lib/guard";
import { Invoice, Student, FEE_CATEGORIES } from "@/lib/models";
import { handle, json, ok, bad, isId, num, esc } from "@/lib/http";
import { nextNo, obligation } from "@/lib/finance";
import { isDate } from "@/lib/dates";
import { audit } from "@/lib/audit";

const PAID = { $lookup: { from: "payments", let: { id: "$_id" }, pipeline: [
  { $match: { $expr: { $eq: ["$invoice", "$$id"] }, voided: { $ne: true } } },
  { $group: { _id: null, net: { $sum: { $cond: [{ $eq: ["$type", "refund"] }, { $multiply: ["$amount", -1] }, "$amount"] } } } }], as: "p" } };

export const GET = handle(async (req) => {
  await requireUser("fees.read");
  await connectDB();
  const sp = new URL(req.url).searchParams;
  const m = { status: sp.get("status") || "open" };
  if (sp.get("category")) m.category = sp.get("category");
  if (sp.get("year")) m.year = Number(sp.get("year"));
  if (sp.get("month")) m.month = Number(sp.get("month"));
  if (sp.get("student") && isId(sp.get("student"))) m.student = new mongoose.Types.ObjectId(sp.get("student"));
  const sm = {};
  if (sp.get("class")) sm["s.class"] = sp.get("class");
  const q = (sp.get("q") || "").trim().slice(0, 60);
  if (q) sm.$or = [{ "s.name": { $regex: esc(q), $options: "i" } }, { "s.studentId": { $regex: esc(q), $options: "i" } }, { invoiceNo: { $regex: esc(q), $options: "i" } }];
  const limit = Math.min(Math.max(parseInt(sp.get("limit")) || 20, 1), 500), page = Math.max(parseInt(sp.get("page")) || 1, 1);
  const pipe = [
    { $match: m }, PAID,
    { $addFields: { obligation: { $max: [0, { $subtract: [{ $add: ["$amount", "$fine"] }, "$discount"] }] }, paid: { $ifNull: [{ $first: "$p.net" }, 0] } } },
    { $addFields: { due: { $subtract: ["$obligation", "$paid"] } } },
    { $lookup: { from: "students", localField: "student", foreignField: "_id", as: "s" } }, { $unwind: "$s" },
    ...(Object.keys(sm).length ? [{ $match: sm }] : []),
    ...(sp.get("outstanding") === "true" ? [{ $match: { due: { $gt: 0.005 } } }] : []),
  ];
  const [r] = await Invoice.aggregate([...pipe, { $sort: { year: -1, month: -1, "s.class": 1, "s.roll": 1 } },
    { $facet: { items: [{ $skip: (page - 1) * limit }, { $limit: limit }, { $project: { p: 0, "s.password": 0 } }], meta: [{ $group: { _id: null, total: { $sum: 1 }, due: { $sum: { $max: ["$due", 0] } }, paid: { $sum: "$paid" }, obligation: { $sum: "$obligation" } } }] } }]);
  const meta = r.meta[0] || { total: 0, due: 0, paid: 0, obligation: 0 };
  const items = r.items.map(({ s, ...i }) => ({ ...i, student: { _id: s._id, name: s.name, studentId: s.studentId, class: s.class, roll: s.roll } }));
  return json({ items, total: meta.total, page, pages: Math.max(1, Math.ceil(meta.total / limit)), totals: { due: meta.due, paid: meta.paid, obligation: meta.obligation } });
});

export const POST = handle(async (req) => {
  const user = await requireUser("fees.manage");
  await connectDB();
  const b = await req.json();
  if (!isId(String(b.student))) throw bad("শিক্ষার্থী বাছাই করুন");
  const s = await Student.findOne({ _id: b.student, active: true, archived: { $ne: true } }).select("_id").lean();
  if (!s) throw bad("শিক্ষার্থী পাওয়া যায়নি বা সক্রিয় নয়");
  if (!FEE_CATEGORIES[b.category]) throw bad("ফি-এর ধরন সঠিক নয়");
  const period = b.period || "";
  if (period && !/^\d{4}-(0[1-9]|1[0-2])$/.test(period)) throw bad("মাস সঠিক নয়");
  if (b.category === "tuition" && !period) throw bad("মাসিক বেতনের জন্য মাস দিন");
  const title = (b.title || (b.category === "tuition" ? FEE_CATEGORIES.tuition : FEE_CATEGORIES[b.category])).trim();
  const amount = num(b.amount, "টাকা", { min: 0.01 }), discount = num(b.discount, "ডিসকাউন্ট", { req: false }) ?? 0, fine = num(b.fine, "জরিমানা", { req: false }) ?? 0;
  if (discount > amount + fine) throw bad("ডিসকাউন্ট মোট টাকার বেশি হতে পারে না");
  if (b.dueDate && !isDate(b.dueDate)) throw bad("শেষ তারিখ সঠিক নয়");
  const doc = await Invoice.create({ invoiceNo: await nextNo("INV"), student: b.student, category: b.category, title, period, year: period ? +period.slice(0, 4) : undefined, month: period ? +period.slice(5) : undefined, amount, discount, fine, discountReason: b.discountReason, dueDate: b.dueDate, note: b.note });
  await audit(user, "create", "invoice", doc._id, { invoiceNo: doc.invoiceNo, amount, student: b.student });
  return ok({ id: doc._id, invoiceNo: doc.invoiceNo });
});
