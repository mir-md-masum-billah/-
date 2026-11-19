import { connectDB } from "@/lib/db";
import { requireUser } from "@/lib/guard";
import { Student, StudentHistory } from "@/lib/models";
import { handle, ok, bad, isId, HttpError } from "@/lib/http";
import { rollTaken } from "@/lib/resources";
import { nextRoll } from "@/lib/ids";
import { todayDhaka } from "@/lib/dates";
import { audit } from "@/lib/audit";

// আর্কাইভ করা শিক্ষার্থী ফিরিয়ে আনা (Unarchive): আবার সক্রিয় ও লগইন চালু। আগের রোল অন্য কেউ নিয়ে থাকলে নতুন শেষ রোল বসে।
export const POST = handle(async (_req, { params }) => {
  const user = await requireUser("students.write");
  const { id } = await params;
  if (!isId(id)) throw new HttpError(404, "শিক্ষার্থী পাওয়া যায়নি");
  await connectDB();
  const s = await Student.findById(id);
  if (!s) throw new HttpError(404, "শিক্ষার্থী পাওয়া যায়নি");
  if (!s.archived) throw bad("এই শিক্ষার্থী আর্কাইভ করা নেই");
  const oldRoll = s.roll;
  if (!s.roll || (await rollTaken({ cls: s.class, sec: s.section, session: s.session, roll: s.roll, exceptId: s._id }))) s.roll = await nextRoll(s.class, s.section, s.session);
  s.set({ archived: false, active: true, archivedAt: undefined, status: "active", leftAt: undefined, leftReason: undefined });
  await s.save();
  await StudentHistory.create({ student: s._id, type: "reactivated", toClass: s.class, toSection: s.section, toRoll: s.roll, fromRoll: oldRoll, session: s.session, date: todayDhaka(), note: "আর্কাইভ থেকে ফিরিয়ে আনা হয়েছে", byName: user.name });
  await audit(user, "unarchive", "students", s._id, { name: s.name, roll: s.roll });
  return ok({ roll: s.roll });
});
