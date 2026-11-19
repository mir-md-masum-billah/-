import { connectDB } from "@/lib/db";
import { requireUser } from "@/lib/guard";
import { Application, PaymentSubmission, LeaveApplication, Student } from "@/lib/models";
import { handle, json } from "@/lib/http";
import { visibleScopes, scopeFilter } from "@/lib/assign";

// মেনুর পাশে নোটিফিকেশনের মতো সংখ্যা: কোন জায়গায় কতটি অনুরোধ/পেন্ডিং আছে (শুধু যার যে অনুমতি আছে সেগুলো)
export const GET = handle(async () => {
  const u = await requireUser();
  if (u.role === "student" || u.role === "parent") return json({});
  await connectDB();
  const out = {}, tasks = [];
  if (u.perms.includes("applications.manage")) tasks.push(Application.countDocuments({ status: "pending" }).then((c) => { out["/admin/applications"] = c; }));
  if (u.perms.includes("payments.review")) tasks.push((async () => {
    const sc = scopeFilter(await visibleScopes(u)); const f = { status: "pending" };
    if (Object.keys(sc).length) f.student = { $in: await Student.find(sc).distinct("_id") };
    out["/admin/pay-requests"] = await PaymentSubmission.countDocuments(f);
  })());
  if (u.perms.includes("leave.approve")) tasks.push(LeaveApplication.countDocuments({ status: "pending" }).then((c) => { out["/admin/leave"] = c; }));
  await Promise.all(tasks);
  return json(out);
});
