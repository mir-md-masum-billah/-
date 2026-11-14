import { connectDB } from "@/lib/db";
import { requireUser } from "@/lib/guard";
import { StaffAttendance } from "@/lib/models";
import { handle, json, isId } from "@/lib/http";
import { isDate } from "@/lib/dates";

export const GET = handle(async (req) => {
  await requireUser("staffattendance.read");
  await connectDB();
  const sp = new URL(req.url).searchParams;
  const f = {};
  if (sp.get("user") && isId(sp.get("user"))) f.user = sp.get("user");
  const d = sp.get("date"), from = sp.get("from"), to = sp.get("to");
  if (isDate(d)) f.date = d; else if (isDate(from) || isDate(to)) f.date = { ...(isDate(from) && { $gte: from }), ...(isDate(to) && { $lte: to }) };
  const limit = Math.min(parseInt(sp.get("limit")) || 100, 1000), page = Math.max(parseInt(sp.get("page")) || 1, 1);
  const [total, items] = await Promise.all([StaffAttendance.countDocuments(f), StaffAttendance.find(f).sort({ date: -1 }).skip((page - 1) * limit).limit(limit).populate("user", "name userId designation").lean()]);
  return json({ items, total, page, pages: Math.max(1, Math.ceil(total / limit)) });
});
