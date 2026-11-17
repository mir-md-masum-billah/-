import { withTx, connectDB } from "@/lib/db";
import { requireUser } from "@/lib/guard";
import { ExamNotice } from "@/lib/models";
import { handle, ok, isId, HttpError } from "@/lib/http";
import { generateForExam } from "@/lib/exams";
import { visibleScopes, inScope } from "@/lib/assign";
import { audit } from "@/lib/audit";

// নোটিশ প্রকাশের পরে ভর্তি হওয়া শিক্ষার্থীদের জন্য বাদ পড়া ফি/কার্ড তৈরি
export const POST = handle(async (_r, { params }) => {
  const user = await requireUser("exams.manage");
  const { id } = await params;
  if (!isId(id)) throw new HttpError(404, "নোটিশ পাওয়া যায়নি");
  await connectDB();
  const e = await ExamNotice.findById(id);
  if (!e) throw new HttpError(404, "নোটিশ পাওয়া যায়নি");
  if (!inScope(await visibleScopes(user), e.class, e.section)) throw new HttpError(403, "অনুমতি নেই");
  const r = await withTx(async (session) => { const g = await generateForExam(e, session); await audit(user, "sync", "exam_notice", e._id, { name: e.name, ...g }, session); return g; });
  return ok(r);
});
