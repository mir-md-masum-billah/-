import { connectDB } from "@/lib/db";
import { requireUser } from "@/lib/guard";
import { Attendance, Student } from "@/lib/models";
import { visibleScopes, scopeFilter } from "@/lib/assign";
import { handle, json, isId } from "@/lib/http";
import { isDate } from "@/lib/dates";

export const GET = handle(async (req) => {
  const user = await requireUser("attendance.read");
  await connectDB();
  const sp = new URL(req.url).searchParams;
  const f = {};
  if (sp.get("class")) f.class = sp.get("class");
  if (sp.get("student") && isId(sp.get("student"))) f.student = sp.get("student");
  const d = sp.get("date"), from = sp.get("from"), to = sp.get("to");
  if (d && isDate(d)) f.date = d; else if ((from && isDate(from)) || (to && isDate(to))) f.date = { ...(isDate(from) && { $gte: from }), ...(isDate(to) && { $lte: to }) };
  const sc = await visibleScopes(user); // শিক্ষক শুধু নিজের শ্রেণির হাজিরা দেখে
  if (sc !== null) f.student = f.student ? { $in: (await Student.find({ _id: f.student, ...scopeFilter(sc) }).distinct("_id")) } : { $in: await Student.find({ ...scopeFilter(sc), ...(f.class ? { class: f.class } : {}) }).distinct("_id") };
  const limit = Math.min(Math.max(parseInt(sp.get("limit")) || 100, 1), 1000), page = Math.max(parseInt(sp.get("page")) || 1, 1);
  const [total, items] = await Promise.all([Attendance.countDocuments(f), Attendance.find(f).sort({ date: -1 }).skip((page - 1) * limit).limit(limit).populate("student", "name studentId class roll").lean()]);
  return json({ items, total, page, pages: Math.max(1, Math.ceil(total / limit)) });
});
