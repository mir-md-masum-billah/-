import { connectDB } from "@/lib/db";
import { requireUser } from "@/lib/guard";
import { ExamNotice, AdmitCard, Student } from "@/lib/models";
import { handle, json, isId, HttpError } from "@/lib/http";
import { admitEligible } from "@/lib/pay";
import { visibleScopes, inScope } from "@/lib/assign";

export const GET = handle(async (_r, { params }) => {
  const user = await requireUser("exams.manage");
  const { id } = await params;
  if (!isId(id)) throw new HttpError(404, "নোটিশ পাওয়া যায়নি");
  await connectDB();
  const e = await ExamNotice.findById(id).lean();
  if (!e) throw new HttpError(404, "নোটিশ পাওয়া যায়নি");
  if (!inScope(await visibleScopes(user), e.class, e.section)) throw new HttpError(403, "অনুমতি নেই");
  const cards = await AdmitCard.find({ exam: e._id }).populate("student", "name studentId roll section").sort({ section: 1, roll: 1 }).lean();
  const items = [];
  for (const c of cards) items.push({ ...c, eligible: await admitEligible(c, e) });
  const total = await Student.countDocuments({ class: e.class, ...(e.section ? { section: e.section } : {}), active: true, archived: { $ne: true } });
  return json({ items, students: total });
});
