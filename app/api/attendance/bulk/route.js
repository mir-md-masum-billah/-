import { connectDB } from "@/lib/db";
import { requireUser } from "@/lib/guard";
import { Attendance, Student, ATT_STATUS } from "@/lib/models";
import { handle, ok, bad, isId } from "@/lib/http";
import { isDate, isFuture } from "@/lib/dates";
import { getSettings } from "@/lib/settings";
import { audit } from "@/lib/audit";
import { assertAttendanceAccess } from "@/lib/assign";

// body: { date, class, section?, records: [{ student, status }] } — "অচিহ্নিত" কখনও জমা হয় না
export const POST = handle(async (req) => {
  const user = await requireUser("attendance.write");
  await connectDB();
  const { date, class: cls, section, records } = await req.json();
  if (!isDate(date)) throw bad("তারিখ সঠিক নয়");
  if (isFuture(date)) throw bad("ভবিষ্যতের তারিখে হাজিরা নেওয়া যায় না");
  const st = await getSettings();
  if (!st.classes.some((c) => c.name === cls)) throw bad("শ্রেণি সঠিক নয়");
  if (!Array.isArray(records) || records.length === 0) throw bad("কমপক্ষে একজনের হাজিরা চিহ্নিত করুন");
  if (records.length > 500) throw bad("একবারে সর্বোচ্চ ৫০০ জন");

  const seen = new Set();
  for (const r of records) {
    if (!r || !isId(String(r.student))) throw bad("শিক্ষার্থী আইডি সঠিক নয়");
    if (!ATT_STATUS.includes(r.status)) throw bad("হাজিরার ধরন সঠিক নয়");
    if (seen.has(String(r.student))) throw bad("একই শিক্ষার্থী একাধিকবার আছে");
    seen.add(String(r.student));
  }
  const ids = [...seen];
  const q = { _id: { $in: ids }, class: cls, active: true, archived: { $ne: true } };
  if (section) q.section = section;
  const found = await Student.find(q).select("_id section").lean();
  if (found.length !== ids.length) throw bad("কিছু শিক্ষার্থী এই শ্রেণির সক্রিয় তালিকায় নেই");
  await assertAttendanceAccess(user, cls, found); // শিক্ষক শুধু নিজের ক্লাসের

  const existing = await Attendance.find({ date, student: { $in: ids } }).select("student status").lean();
  const prev = Object.fromEntries(existing.map((e) => [String(e.student), e.status]));
  const ops = []; let created = 0, corrected = 0, same = 0;
  for (const r of records) {
    const p = prev[String(r.student)];
    if (p === undefined) { created++; ops.push({ insertOne: { document: { student: r.student, class: cls, date, status: r.status, markedBy: user.id } } }); }
    else if (p !== r.status) { corrected++; ops.push({ updateOne: { filter: { student: r.student, date }, update: { $set: { status: r.status, class: cls, markedBy: user.id }, $push: { history: { status: p, by: user.id, byName: user.name } } } } }); }
    else same++;
  }
  if (ops.length) await Attendance.bulkWrite(ops, { ordered: true });
  await audit(user, "attendance", "attendance", null, { date, class: cls, created, corrected, unchanged: same });
  return ok({ created, corrected, unchanged: same });
});
