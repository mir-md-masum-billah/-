import { connectDB } from "@/lib/db";
import { requireUser } from "@/lib/guard";
import { Student, User, Attendance, Invoice, LedgerEntry, Notice } from "@/lib/models";
import { handle, json } from "@/lib/http";
import { todayDhaka, ymDhaka } from "@/lib/dates";
import { round2 } from "@/lib/finance";

// সব সংখ্যা সরাসরি ডেটাবেজ থেকে (বাংলাদেশ সময় অনুযায়ী আজ/এ মাস)
export const GET = handle(async () => {
  const u = await requireUser();
  if (u.role === "student" || u.role === "parent") return json({ error: "অনুমতি নেই" }, 403);
  await connectDB();
  const today = todayDhaka(), ym = ymDhaka();
  const out = {};
  const live = { voided: { $ne: true } };
  const tasks = [];

  if (u.perms.includes("students.read")) tasks.push((async () => {
    const [total, active, newAdm] = await Promise.all([Student.countDocuments({ archived: { $ne: true } }), Student.countDocuments({ active: true, archived: { $ne: true } }), Student.countDocuments({ archived: { $ne: true }, admissionDate: { $regex: `^${ym}` } })]);
    Object.assign(out, { students: total, activeStudents: active, newAdmissions: newAdm });
  })());
  if (u.perms.includes("staff.read")) tasks.push((async () => {
    const [teachers, staff] = await Promise.all([User.countDocuments({ active: true, role: "teacher" }), User.countDocuments({ active: true, role: { $ne: "teacher" } })]);
    Object.assign(out, { teachers, employees: staff });
  })());
  if (u.perms.includes("attendance.read")) tasks.push((async () => {
    const rows = await Attendance.aggregate([{ $match: { date: today } }, { $group: { _id: "$status", n: { $sum: 1 } } }]);
    const c = Object.fromEntries(rows.map((r) => [r._id, r.n]));
    const counted = (c.present || 0) + (c.late || 0) + (c.absent || 0); // ছুটি/হলিডে হারে ধরা হয় না
    Object.assign(out, { present: (c.present || 0) + (c.late || 0), absent: c.absent || 0, leave: c.leave || 0, attendancePct: counted ? Math.round((((c.present || 0) + (c.late || 0)) / counted) * 100) : null, attendanceMarked: rows.reduce((s, r) => s + r.n, 0) });
  })());
  if (u.perms.includes("fees.read")) tasks.push((async () => {
    const [due] = await Invoice.aggregate([{ $match: { status: "open" } }, { $lookup: { from: "payments", let: { id: "$_id" }, pipeline: [{ $match: { $expr: { $eq: ["$invoice", "$$id"] }, voided: { $ne: true } } }, { $group: { _id: null, net: { $sum: { $cond: [{ $eq: ["$type", "refund"] }, { $multiply: ["$amount", -1] }, "$amount"] } } } }], as: "p" } },
      { $project: { due: { $subtract: [{ $max: [0, { $subtract: [{ $add: ["$amount", "$fine"] }, "$discount"] }] }, { $ifNull: [{ $first: "$p.net" }, 0] }] } } }, { $match: { due: { $gt: 0.005 } } }, { $group: { _id: null, total: { $sum: "$due" } } }]);
    out.outstanding = round2(due?.total || 0);
  })());
  if (u.perms.includes("accounts.read")) tasks.push((async () => {
    const [m, fee, bal, recent, salary] = await Promise.all([
      LedgerEntry.aggregate([{ $match: { ...live, date: { $regex: `^${ym}` } } }, { $group: { _id: "$type", n: { $sum: "$amount" } } }]),
      LedgerEntry.aggregate([{ $match: { ...live, date: { $regex: `^${ym}` }, category: { $in: ["fee", "refund"] } } }, { $group: { _id: "$category", n: { $sum: "$amount" } } }]),
      LedgerEntry.aggregate([{ $match: live }, { $group: { _id: { a: "$account", t: "$type" }, n: { $sum: "$amount" } } }]),
      LedgerEntry.find(live).sort({ date: -1, createdAt: -1 }).limit(8).select("type title amount date category").lean(),
      LedgerEntry.aggregate([{ $match: { ...live, date: { $regex: `^${ym}` }, category: { $in: ["teacher_salary", "staff_salary"] } } }, { $group: { _id: null, n: { $sum: "$amount" } } }]),
    ]);
    const g = (rows, k) => rows.find((r) => r._id === k)?.n || 0;
    const { getSettings } = await import("@/lib/settings");
    const st = await getSettings();
    const acct = (a) => round2((st.openingBalances?.[a] || 0) + (bal.find((r) => r._id.a === a && r._id.t === "income")?.n || 0) - (bal.find((r) => r._id.a === a && r._id.t === "expense")?.n || 0));
    Object.assign(out, { monthIncome: round2(g(m, "income")), monthExpense: round2(g(m, "expense")), feeCollected: round2(g(fee, "fee") - g(fee, "refund")), cashBalance: acct("cash"), bankBalance: acct("bank"), mobileBalance: round2(acct("bkash") + acct("nagad") + acct("rocket")), salaryExpense: round2(salary[0]?.n || 0), recent });
  })());
  tasks.push((async () => { out.notices = await Notice.find().sort({ date: -1, createdAt: -1 }).limit(4).select("title date").lean(); })());
  await Promise.all(tasks);
  return json(out);
});
