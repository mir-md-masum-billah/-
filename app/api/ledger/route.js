import crypto from "crypto";
import { connectDB } from "@/lib/db";
import { requireUser } from "@/lib/guard";
import { LedgerEntry, PAY_METHODS } from "@/lib/models";
import { handle, json, ok, bad, num, esc, own } from "@/lib/http";
import { isDate, isFuture } from "@/lib/dates";
import { incomeCats, expenseCats } from "@/lib/school";
import { audit } from "@/lib/audit";

export const GET = handle(async (req) => {
  await requireUser("accounts.read");
  await connectDB();
  const sp = new URL(req.url).searchParams;
  const f = { voided: { $ne: true } };
  if (sp.get("voided") === "true") delete f.voided;
  for (const k of ["type", "account", "category", "source"]) if (sp.get(k)) f[k] = sp.get(k);
  const from = sp.get("from"), to = sp.get("to");
  if (isDate(from) || isDate(to)) f.date = { ...(isDate(from) && { $gte: from }), ...(isDate(to) && { $lte: to }) };
  const q = (sp.get("q") || "").trim().slice(0, 60);
  if (q) f.$or = [{ title: { $regex: esc(q), $options: "i" } }, { reference: { $regex: esc(q), $options: "i" } }];
  const limit = Math.min(Math.max(parseInt(sp.get("limit")) || 20, 1), 500), page = Math.max(parseInt(sp.get("page")) || 1, 1);
  const [total, items, tot] = await Promise.all([
    LedgerEntry.countDocuments(f), LedgerEntry.find(f).sort({ date: -1, createdAt: -1 }).skip((page - 1) * limit).limit(limit).lean(),
    LedgerEntry.aggregate([{ $match: { ...f, voided: { $ne: true } } }, { $group: { _id: "$type", total: { $sum: "$amount" } } }]),
  ]);
  const t = Object.fromEntries(tot.map((x) => [x._id, x.total]));
  return json({ items, total, page, pages: Math.max(1, Math.ceil(total / limit)), totals: { income: t.income || 0, expense: t.expense || 0 } });
});

// ম্যানুয়াল এন্ট্রি। বেতন আদায় এখানে হাতে তোলা যায় না — সেটা পেমেন্ট থেকে নিজে থেকে আসে
export const POST = handle(async (req) => {
  const user = await requireUser("accounts.write");
  await connectDB();
  const b = await req.json();
  if (!["income", "expense"].includes(b.type)) throw bad("আয় নাকি ব্যয় বাছাই করুন");
  const cats = b.type === "income" ? incomeCats : expenseCats;
  if (!own(cats, b.category) || b.category === "fee" || b.category === "refund") throw bad("খাত সঠিক নয় (বেতন আদায়/রিফান্ড পেমেন্ট পেজ থেকে হয়)");
  const account = String(b.account || "cash");
  if (!PAY_METHODS.includes(account)) throw bad("অ্যাকাউন্ট সঠিক নয়");
  const title = String(b.title || "").trim().slice(0, 150);
  if (title.length < 2) throw bad("বিবরণ দিন");
  const amount = num(b.amount, "টাকা", { min: 0.01 });
  if (!isDate(b.date) || isFuture(b.date)) throw bad("তারিখ সঠিক নয়");
  const reference = String(b.reference || "").trim().slice(0, 60);
  const dedupeKey = crypto.createHash("sha1").update([b.type, b.date, account, b.category, title.toLowerCase(), amount, reference].join("|")).digest("hex");
  try {
    const doc = await LedgerEntry.create({ type: b.type, account, category: b.category, title, amount, date: b.date, reference, note: b.note, dedupeKey, createdByName: user.name });
    await audit(user, "create", "ledger", doc._id, { type: b.type, amount, title });
    return ok({ id: doc._id });
  } catch (e) {
    if (e.code === 11000) throw bad("একই এন্ট্রি আগে থেকেই আছে (একই তারিখ, বিবরণ, টাকা)। আলাদা হলে 'রেফারেন্স/ভাউচার নং' দিন");
    throw e;
  }
});
