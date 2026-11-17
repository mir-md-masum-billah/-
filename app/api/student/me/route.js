import { connectDB } from "@/lib/db";
import { requireStudent } from "@/lib/guard";
import { Student, Attendance, Invoice, Payment, Result, Notice } from "@/lib/models";
import { handle, json } from "@/lib/http";
import { netPaidMap, withBalance } from "@/lib/finance";

// শিক্ষার্থী শুধু নিজের ডেটা পায় (আইডি সেশন থেকে, ক্লায়েন্ট থেকে নয়)
export const GET = handle(async () => {
  const u = await requireStudent();
  await connectDB();
  const [student, attendance, invoices, payments, results, notices] = await Promise.all([
    Student.findById(u.id).lean(),
    Attendance.find({ student: u.id }).sort({ date: -1 }).select("date status").lean(),
    Invoice.find({ student: u.id, status: "open" }).sort({ year: -1, month: -1, createdAt: -1 }).lean(),
    Payment.find({ student: u.id, voided: { $ne: true } }).sort({ date: -1, createdAt: -1 }).populate("invoice", "title period invoiceNo").lean(),
    Result.find({ student: u.id, published: { $ne: false } }).sort({ year: -1, exam: 1 }).select("-history").lean(),
    Notice.find().sort({ date: -1, createdAt: -1 }).limit(20).lean(),
  ]);
  const map = await netPaidMap(invoices.map((i) => i._id));
  delete student.password;
  return json({ student, attendance, invoices: invoices.map((i) => withBalance(i, map[String(i._id)] || 0)), payments, results, notices });
});
