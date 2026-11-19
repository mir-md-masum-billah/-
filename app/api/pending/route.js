import { connectDB } from "@/lib/db";
import { requireUser } from "@/lib/guard";
import { Application, PaymentSubmission, LeaveApplication, Student, Invoice, Attendance, Assignment, PaymentSubmission as PS } from "@/lib/models";
import { handle, json } from "@/lib/http";
import { visibleScopes, scopeFilter } from "@/lib/assign";
import { netPaidMap, obligation } from "@/lib/finance";
import { todayDhaka } from "@/lib/dates";
import { memo } from "@/lib/memo";

// সবার জন্য নোটিফিকেশনের মতো সংখ্যা — কোন বাটনে কতটি পেন্ডিং/বকেয়া/করণীয়:
//   শিক্ষার্থী: fee = বকেয়া ইনভয়েস, lv = নিজের অপেক্ষমাণ ছুটি, exam = অপেক্ষমাণ পরীক্ষার ফি
//   অ্যাডমিন/প্রধান শিক্ষক: ভর্তির আবেদন, পেমেন্ট যাচাই, ছুটি অনুমোদন, বকেয়া ফি (মেয়াদোত্তীর্ণ)
//   শিক্ষক: আজ হাজিরা বাকি (ক্লাস টিচারের শ্রেণি), নিজের অপেক্ষমাণ ছুটি
export const GET = handle(async () => {
  const u = await requireUser();
  await connectDB();
  const out = {};
  if (u.role === "student") {
    const inv = await Invoice.find({ student: u.id, status: "open" }).select("amount fine discount category").lean();
    const map = await netPaidMap(inv.map((i) => i._id));
    const due = inv.filter((i) => obligation(i) - (map[String(i._id)] || 0) > 0.005);
    out.fee = due.length; out.exam = due.filter((i) => i.category === "exam").length;
    out.lv = await LeaveApplication.countDocuments({ student: u.id, status: "pending" });
    return json(out);
  }
  if (u.role === "parent") return json({});
  const tasks = [];
  if (u.perms.includes("applications.manage")) tasks.push(Application.countDocuments({ status: "pending" }).then((c) => { out["/admin/applications"] = c; }));
  if (u.perms.includes("payments.review")) tasks.push((async () => {
    const sc = scopeFilter(await visibleScopes(u)); const f = { status: "pending" };
    if (Object.keys(sc).length) f.student = { $in: await Student.find(sc).distinct("_id") };
    out["/admin/pay-requests"] = await PS.countDocuments(f);
  })());
  if (u.perms.includes("leave.approve")) tasks.push(LeaveApplication.countDocuments({ status: "pending" }).then((c) => { out["/admin/leave"] = c; }));
  else tasks.push(LeaveApplication.countDocuments({ user: u.id, status: "pending" }).then((c) => { out["/admin/leave"] = c; }));
  if (u.perms.includes("fees.read")) tasks.push(memo("overdue", 120000, async () => {
    const inv = await Invoice.find({ status: "open", dueDate: { $lt: todayDhaka() } }).select("amount fine discount student").limit(5000).lean();
    const map = await netPaidMap(inv.map((i) => i._id));
    return new Set(inv.filter((i) => obligation(i) - (map[String(i._id)] || 0) > 0.005).map((i) => String(i.student))).size; // বকেয়া আছে এমন শিক্ষার্থী
  }).then((c) => { out["/admin/fees"] = c; }));
  if (u.perms.includes("attendance.write") && u.role === "teacher") tasks.push((async () => {
    const mine = await Assignment.find({ teacher: u.id, kind: "class" }).select("class section").lean();
    let missing = 0; const today = todayDhaka();
    for (const a of mine) {
      const ids = await Student.find({ class: a.class, active: true, archived: { $ne: true }, ...(a.section ? { section: a.section } : {}) }).distinct("_id");
      if (ids.length && !(await Attendance.exists({ student: { $in: ids }, date: today }))) missing++;
    }
    out["/admin/attendance"] = missing;
  })());
  await Promise.all(tasks);
  return json(out);
});
