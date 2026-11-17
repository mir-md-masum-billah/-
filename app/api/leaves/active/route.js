import { connectDB } from "@/lib/db";
import { requireUser } from "@/lib/guard";
import { LeaveApplication, Student } from "@/lib/models";
import { handle, json, bad } from "@/lib/http";
import { isDate } from "@/lib/dates";
import { visibleScopes, scopeFilter } from "@/lib/assign";

// ওই তারিখে অনুমোদিত ছুটিতে থাকাদের আইডি (হাজিরার পাতায় আগে থেকে "ছুটি" দেখাতে)
export const GET = handle(async (req) => {
  const sp = new URL(req.url).searchParams;
  const kind = sp.get("kind") === "staff" ? "staff" : "student", date = sp.get("date");
  const user = await requireUser(kind === "staff" ? "staffattendance.read" : "attendance.read");
  if (!isDate(date)) throw bad("তারিখ সঠিক নয়");
  await connectDB();
  const f = { kind, status: "approved", from: { $lte: date }, to: { $gte: date } };
  if (kind === "student") { // শিক্ষক শুধু নিজের নিয়োগকৃত শ্রেণির ছুটি দেখে
    const cls = String(sp.get("class") || "");
    const q = { ...(cls ? { class: cls } : {}), ...scopeFilter(await visibleScopes(user)) };
    if (Object.keys(q).length) f.student = { $in: await Student.find(q).distinct("_id") };
  }
  const l = await LeaveApplication.find(f).select("user student").lean();
  return json({ ids: l.map((x) => String(kind === "staff" ? x.user : x.student)) });
});
