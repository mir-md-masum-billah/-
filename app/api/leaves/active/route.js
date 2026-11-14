import { connectDB } from "@/lib/db";
import { requireUser } from "@/lib/guard";
import { LeaveApplication, Student } from "@/lib/models";
import { handle, json, bad } from "@/lib/http";
import { isDate } from "@/lib/dates";

// ওই তারিখে অনুমোদিত ছুটিতে থাকাদের আইডি (হাজিরার পাতায় আগে থেকে "ছুটি" দেখাতে)
export const GET = handle(async (req) => {
  const sp = new URL(req.url).searchParams;
  const kind = sp.get("kind") === "staff" ? "staff" : "student", date = sp.get("date");
  await requireUser(kind === "staff" ? "staffattendance.read" : "attendance.read");
  if (!isDate(date)) throw bad("তারিখ সঠিক নয়");
  await connectDB();
  const f = { kind, status: "approved", from: { $lte: date }, to: { $gte: date } };
  if (kind === "student" && sp.get("class")) f.student = { $in: await Student.find({ class: sp.get("class") }).distinct("_id") };
  const l = await LeaveApplication.find(f).select("user student").lean();
  return json({ ids: l.map((x) => String(kind === "staff" ? x.user : x.student)) });
});
