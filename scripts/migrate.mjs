// পুরনো ডেটা নতুন কাঠামোয় আনা। নিরাপদ ও বারবার চালানো যায় (idempotent): npm run migrate
// পুরনো `fees` ও `accounts` কালেকশন মোছা হয় না — শুধু migratedAt চিহ্ন বসে।
import mongoose from "mongoose";
import { Student, Attendance, Invoice, Payment, LedgerEntry, Settings, User, Counter, AuditLog, Notice, Result, LoginAttempt, Session, Subject, Assignment, StudentHistory, StaffAttendance, LeaveApplication, Application } from "../lib/models.js";
import { classes as defClasses } from "../lib/school.js";

const TZ = new Intl.DateTimeFormat("en-CA", { timeZone: "Asia/Dhaka", year: "numeric", month: "2-digit", day: "2-digit" });
const day = (d) => TZ.format(d instanceof Date ? d : new Date(d));
const okDate = (s) => typeof s === "string" && /^\d{4}-\d{2}-\d{2}$/.test(s);
const METHOD = { "নগদ": "cash", "বিকাশ": "bkash", "নগদ (Nagad)": "nagad", "ব্যাংক": "bank", cash: "cash", bkash: "bkash", nagad: "nagad", bank: "bank" };
const CAT = { "শিক্ষকদের বেতন": "teacher_salary", "বিদ্যুৎ বিল": "electricity", "স্টেশনারি": "stationery", "মেরামত": "maintenance", "অনুদান": "donation", "ভর্তি ফি": "admission", "অন্যান্য": "other" };
const stats = { students: 0, attendance: 0, invoices: 0, payments: 0, ledgerFromPayments: 0, accounts: 0, skipped: [] };

await mongoose.connect(process.env.MONGODB_URI);
const db = mongoose.connection;

// ১) শিক্ষার্থী
stats.students = (await Student.collection.updateMany({ archived: { $exists: false } }, { $set: { archived: false } })).modifiedCount;
// ফেজ ৩: status ফিল্ড (সক্রিয় → active; নিষ্ক্রিয় ছিল → dropped, যাচাই করে প্রোফাইল থেকে ঠিক করুন) এবং ভর্তির ইতিহাস
stats.statusSet = (await Student.collection.updateMany({ status: { $exists: false }, active: { $ne: false } }, { $set: { status: "active" } })).modifiedCount;
const inactiveOld = await Student.collection.updateMany({ status: { $exists: false }, active: false }, { $set: { status: "dropped" } });
if (inactiveOld.modifiedCount) stats.skipped.push(`${inactiveOld.modifiedCount} জন নিষ্ক্রিয় শিক্ষার্থীর অবস্থা "ঝরে পড়া" ধরা হয়েছে — প্রোফাইল থেকে ঠিক করুন`);
stats.history = 0;
for (const st of await Student.collection.find({}).project({ class: 1, section: 1, roll: 1, session: 1, admissionDate: 1, createdAt: 1 }).toArray()) {
  if (await StudentHistory.exists({ student: st._id })) continue;
  await StudentHistory.create({ student: st._id, type: "admission", toClass: st.class, toSection: st.section, toRoll: st.roll, session: st.session, date: okDate(st.admissionDate) ? st.admissionDate : day(st.createdAt || new Date()), note: "পুরনো ডেটা থেকে স্থানান্তরিত", byName: "migration" });
  stats.history++;
}
// ২) পুরনো হাজিরায় শ্রেণি বসানো
const noClass = await Attendance.collection.find({ class: { $in: [null, ""] } }).toArray();
for (const a of noClass) { const s = await Student.collection.findOne({ _id: a.student }); if (s) { await Attendance.collection.updateOne({ _id: a._id }, { $set: { class: s.class } }); stats.attendance++; } }
// ৩) সেটিংস (শ্রেণি তালিকা পুরনো ডেটা থেকে)
if (!(await Settings.findOne({ key: "main" }))) {
  const used = await Student.distinct("class");
  const names = [...defClasses, ...used.filter((c) => !defClasses.includes(c))];
  await Settings.create({ key: "main", schoolName: "হাজী চান মিয়া স্কুল", classes: names.map((name) => ({ name, sections: [] })) });
  console.log("সেটিংস তৈরি হয়েছে");
}
for (const M of [User, Student, Attendance, Invoice, Payment, LedgerEntry, Settings, Counter, AuditLog, Notice, Result, LoginAttempt, Session, Subject, Assignment, StudentHistory, StaffAttendance, LeaveApplication, Application]) await M.syncIndexes();

async function seq(prefix, session) {
  const y = Number(TZ.format(new Date()).slice(0, 4));
  const c = await Counter.findOneAndUpdate({ _id: `${prefix}-${y}` }, { $inc: { seq: 1 } }, { upsert: true, new: true, session });
  return `${prefix}-${y}-${String(c.seq).padStart(6, "0")}`;
}
// ৪) পুরনো Fee → Invoice + (জমা থাকলে) Payment + Ledger
const fees = db.collection("fees");
for (const f of await fees.find({ migratedAt: { $exists: false } }).toArray()) {
  const lid = String(f._id);
  if (!(await Student.exists({ _id: f.student }))) { stats.skipped.push(`fee ${lid}: শিক্ষার্থী নেই`); continue; }
  await mongoose.connection.transaction(async (session) => {
    let inv = await Invoice.findOne({ legacyFeeId: lid }).session(session);
    if (!inv) {
      const period = `${f.year}-${String(f.month).padStart(2, "0")}`;
      const dup = await Invoice.findOne({ student: f.student, category: "tuition", period, title: "মাসিক বেতন" }).session(session);
      if (dup) { stats.skipped.push(`fee ${lid}: ডুপ্লিকেট মাস ${period}`); return; }
      [inv] = await Invoice.create([{ invoiceNo: await seq("INV", session), student: f.student, category: "tuition", title: "মাসিক বেতন", period, month: f.month, year: f.year, amount: f.amount, note: f.note, legacyFeeId: lid }], { session });
      stats.invoices++;
    }
    const paid = f.paid || 0; // প্রকৃত নেওয়া টাকা হারানো হয় না
    if (f.paid > f.amount) stats.skipped.push(`fee ${lid}: জমা (${f.paid}) ধার্যের (${f.amount}) বেশি — অতিরিক্ত ${f.paid - f.amount} টাকা অগ্রিম হিসেবে দেখাবে, যাচাই করুন`);
    if (paid > 0 && !(await Payment.exists({ legacyFeeId: lid }).session(session))) {
      const date = okDate(f.paidDate) ? f.paidDate : day(f.updatedAt || f.createdAt || new Date());
      const receiptNo = await seq("R", session);
      const [p] = await Payment.create([{ receiptNo, type: "payment", invoice: inv._id, student: f.student, amount: paid, method: METHOD[f.method] || "cash", date, note: "পুরনো ডেটা থেকে স্থানান্তরিত", createdByName: "migration", legacyFeeId: lid }], { session });
      await LedgerEntry.create([{ type: "income", account: p.method, category: "fee", title: `বেতন আদায় — মাসিক বেতন (${receiptNo})`, amount: paid, date, reference: receiptNo, source: "payment", sourceKey: `payment:${p._id}`, createdByName: "migration" }], { session });
      stats.payments++; stats.ledgerFromPayments++;
    }
    await fees.updateOne({ _id: f._id }, { $set: { migratedAt: new Date() } }, { session });
  });
}
// ৫) পুরনো Account → LedgerEntry (ম্যানুয়াল)
const accs = db.collection("accounts");
for (const a of await accs.find({ migratedAt: { $exists: false } }).toArray()) {
  const key = `account:${a._id}`;
  if (!(await LedgerEntry.exists({ sourceKey: key })) && a.amount > 0) {
    await LedgerEntry.create({ type: a.type, account: "cash", category: CAT[a.category] || "other", title: a.title, amount: a.amount, date: okDate(a.date) ? a.date : day(a.createdAt || new Date()), note: a.note, source: "manual", sourceKey: key, createdByName: "migration" });
    stats.accounts++;
  } else if (!(a.amount > 0)) stats.skipped.push(`account ${a._id}: অবৈধ টাকা`);
  await accs.updateOne({ _id: a._id }, { $set: { migratedAt: new Date() } });
}
console.log("মাইগ্রেশন সম্পন্ন:", JSON.stringify(stats, null, 2));
await mongoose.disconnect();
