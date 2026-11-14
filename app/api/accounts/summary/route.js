import { connectDB } from "@/lib/db";
import { requireUser } from "@/lib/guard";
import { LedgerEntry, Invoice } from "@/lib/models";
import { handle, json, bad } from "@/lib/http";
import { isDate, ymDhaka, todayDhaka, lastMonths } from "@/lib/dates";
import { getSettings } from "@/lib/settings";
import { round2 } from "@/lib/finance";

const ACC = ["cash", "bkash", "nagad", "bank"];
export const GET = handle(async (req) => {
  await requireUser("accounts.read");
  await connectDB();
  const sp = new URL(req.url).searchParams;
  const from = sp.get("from") || ymDhaka() + "-01", to = sp.get("to") || todayDhaka();
  if (!isDate(from) || !isDate(to) || from > to) throw bad("তারিখের পরিসর সঠিক নয়");
  const st = await getSettings();
  const live = { voided: { $ne: true } };
  const sumBy = (match, by) => LedgerEntry.aggregate([{ $match: { ...live, ...match } }, { $group: { _id: by, total: { $sum: "$amount" } } }]);
  const [before, inRange, byCat, monthly, due] = await Promise.all([
    LedgerEntry.aggregate([{ $match: { ...live, date: { $lt: from } } }, { $group: { _id: { a: "$account", t: "$type" }, total: { $sum: "$amount" } } }]),
    LedgerEntry.aggregate([{ $match: { ...live, date: { $gte: from, $lte: to } } }, { $group: { _id: { a: "$account", t: "$type" }, total: { $sum: "$amount" } } }]),
    sumBy({ date: { $gte: from, $lte: to } }, { t: "$type", c: "$category" }),
    LedgerEntry.aggregate([{ $match: { ...live, date: { $gte: lastMonths(12)[0] + "-01" } } }, { $group: { _id: { m: { $substr: ["$date", 0, 7] }, t: "$type" }, total: { $sum: "$amount" } } }]),
    Invoice.aggregate([{ $match: { status: "open" } }, { $lookup: { from: "payments", let: { id: "$_id" }, pipeline: [{ $match: { $expr: { $eq: ["$invoice", "$$id"] }, voided: { $ne: true } } }, { $group: { _id: null, net: { $sum: { $cond: [{ $eq: ["$type", "refund"] }, { $multiply: ["$amount", -1] }, "$amount"] } } } }], as: "p" } },
      { $project: { due: { $subtract: [{ $max: [0, { $subtract: [{ $add: ["$amount", "$fine"] }, "$discount"] }] }, { $ifNull: [{ $first: "$p.net" }, 0] }] } } }, { $match: { due: { $gt: 0.005 } } }, { $group: { _id: null, total: { $sum: "$due" }, count: { $sum: 1 } } }]),
  ]);
  const tally = (rows) => { const o = {}; ACC.forEach((a) => (o[a] = { income: 0, expense: 0 })); rows.forEach((r) => (o[r._id.a][r._id.t] += r.total)); return o; };
  const b = tally(before), r = tally(inRange);
  const opening = {}, closing = {}; let income = 0, expense = 0;
  ACC.forEach((a) => {
    opening[a] = round2((st.openingBalances?.[a] || 0) + b[a].income - b[a].expense);
    closing[a] = round2(opening[a] + r[a].income - r[a].expense);
    income += r[a].income; expense += r[a].expense;
  });
  const months = lastMonths(12);
  const series = months.map((m) => ({ m, income: monthly.find((x) => x._id.m === m && x._id.t === "income")?.total || 0, expense: monthly.find((x) => x._id.m === m && x._id.t === "expense")?.total || 0 }));
  const sum = (o) => round2(Object.values(o).reduce((s, v) => s + v, 0));
  return json({ range: { from, to }, opening, closing, openingTotal: sum(opening), closingTotal: sum(closing), income: round2(income), expense: round2(expense),
    byCategory: byCat.map((x) => ({ type: x._id.t, category: x._id.c, total: round2(x.total) })), monthly: series, outstanding: { total: round2(due[0]?.total || 0), invoices: due[0]?.count || 0 } });
});
