import { connectDB } from "@/lib/db";
import { currentUser } from "@/lib/guard";
import { User, Assignment, RoutineSlot, StaffAttendance, LeaveApplication, AuditLog, Attendance, Result } from "@/lib/models";
import { handle, json, isId, HttpError } from "@/lib/http";
import { todayDhaka, yearDhaka, ymDhaka } from "@/lib/dates";

// শিক্ষক/স্টাফের পূর্ণ প্রোফাইল: তথ্য, বেতন, নিয়োগ (ক্লাস টিচার/বিষয়), সাপ্তাহিক রুটিন, হাজিরা, ছুটি ও কার্যকলাপ।
// নিজের প্রোফাইল সবাই দেখে; অন্যের জন্য staff.read লাগে। বেতন শুধু নিজে বা staff.read/staff.write ধারী দেখে।
export const GET = handle(async (_req, { params }) => {
  const u = await currentUser();
  if (!u || u.role === "student" || u.role === "parent") throw new HttpError(401, "আবার লগইন করুন");
  const { id } = await params;
  if (!isId(id)) throw new HttpError(404, "পাওয়া যায়নি");
  const self = id === u.id;
  if (!self && !u.perms.includes("staff.read")) throw new HttpError(403, "অনুমতি নেই");
  await connectDB();
  const t = await User.findById(id).select("-password").lean();
  if (!t) throw new HttpError(404, "পাওয়া যায়নি");
  const year = yearDhaka(), ym = ymDhaka(), today = todayDhaka();
  const [asg, slots, att, records, leaves, acts] = await Promise.all([
    Assignment.find({ teacher: id }).populate("subject", "name").sort({ class: 1, kind: 1 }).lean(),
    RoutineSlot.find({ teacher: id }).sort({ day: 1, startTime: 1 }).lean(),
    StaffAttendance.aggregate([{ $match: { user: t._id, date: { $gte: `${year}-01-01`, $lte: today } } }, { $group: { _id: { s: "$status", m: { $substr: ["$date", 0, 7] } }, n: { $sum: 1 } } }]),
    StaffAttendance.find({ user: id, date: { $gte: `${year}-01-01`, $lte: today } }).select("date status").sort({ date: -1 }).limit(400).lean(),
    LeaveApplication.find({ user: id, kind: "staff" }).sort({ createdAt: -1 }).limit(10).lean(),
    AuditLog.find({ user: id }).sort({ createdAt: -1 }).limit(25).lean(),
  ]);
  const sum = (m) => { const o = { present: 0, absent: 0, late: 0, leave: 0, holiday: 0 }; for (const r of att) if (!m || r._id.m === m) if (o[r._id.s] !== undefined) o[r._id.s] += r.n; return o; };
  const yr = sum(), mo = sum(ym);
  const pct = (o) => (o.present + o.late + o.absent ? Math.round(((o.present + o.late) / (o.present + o.late + o.absent)) * 1000) / 10 : null);
  // কার্যকলাপের সারাংশ (এ বছর): কত বার হাজিরা নিয়েছেন, কত নম্বর এন্ট্রি
  const [attTaken, marks] = await Promise.all([
    AuditLog.countDocuments({ user: id, entity: /attendance/i, createdAt: { $gte: new Date(`${year}-01-01`) } }),
    AuditLog.countDocuments({ user: id, entity: /result/i, createdAt: { $gte: new Date(`${year}-01-01`) } }),
  ]);
  const canSalary = self || u.perms.includes("staff.read") || u.perms.includes("staff.write");
  if (!canSalary) delete t.salary;
  return json({ staff: t, self, assignments: asg.map((a) => ({ kind: a.kind, class: a.class, section: a.section, subject: a.subject?.name, auto: !!a.auto })), routine: slots.map((s) => ({ day: s.day, class: s.class, section: s.section, subject: s.subject, startTime: s.startTime, endTime: s.endTime })),
    attendance: { year: { ...yr, pct: pct(yr) }, month: { ...mo, pct: pct(mo) }, records: records.map((r) => ({ date: r.date, status: r.status })) }, leaves, activity: acts.map((a) => ({ at: a.createdAt, action: a.action, entity: a.entity, name: a.details?.name })), summary: { attTaken, marks } });
});
