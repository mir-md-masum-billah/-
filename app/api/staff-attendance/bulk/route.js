import { connectDB } from "@/lib/db";
import { requireUser } from "@/lib/guard";
import { User, StaffAttendance, ATT_STATUS } from "@/lib/models";
import { handle, ok, bad, isId } from "@/lib/http";
import { isDate, isFuture } from "@/lib/dates";
import { audit } from "@/lib/audit";

export const POST = handle(async (req) => {
  const user = await requireUser("staffattendance.write");
  await connectDB();
  const { date, records } = await req.json();
  if (!isDate(date)) throw bad("তারিখ সঠিক নয়");
  if (isFuture(date)) throw bad("ভবিষ্যতের তারিখে হাজিরা নেওয়া যায় না");
  if (!Array.isArray(records) || !records.length) throw bad("কমপক্ষে একজনের হাজিরা চিহ্নিত করুন");
  if (records.length > 300) throw bad("একবারে সর্বোচ্চ ৩০০ জন");
  const seen = new Set();
  for (const r of records) {
    if (!r || !isId(String(r.user))) throw bad("স্টাফ আইডি সঠিক নয়");
    if (!ATT_STATUS.includes(r.status)) throw bad("হাজিরার ধরন সঠিক নয়");
    if (seen.has(String(r.user))) throw bad("একই ব্যক্তি একাধিকবার আছে");
    seen.add(String(r.user));
  }
  const ids = [...seen];
  if ((await User.countDocuments({ _id: { $in: ids }, active: true })) !== ids.length) throw bad("কিছু স্টাফ সক্রিয় তালিকায় নেই");
  const prev = Object.fromEntries((await StaffAttendance.find({ date, user: { $in: ids } }).select("user status").lean()).map((e) => [String(e.user), e.status]));
  const ops = []; let created = 0, corrected = 0, same = 0;
  for (const r of records) {
    const p = prev[String(r.user)];
    if (p === undefined) { created++; ops.push({ insertOne: { document: { user: r.user, date, status: r.status } } }); }
    else if (p !== r.status) { corrected++; ops.push({ updateOne: { filter: { user: r.user, date }, update: { $set: { status: r.status }, $push: { history: { status: p, byName: user.name } } } } }); }
    else same++;
  }
  if (ops.length) await StaffAttendance.bulkWrite(ops);
  await audit(user, "staff_attendance", "staff-attendance", null, { date, created, corrected, unchanged: same });
  return ok({ created, corrected, unchanged: same });
});
