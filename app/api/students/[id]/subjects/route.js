import { connectDB } from "@/lib/db";
import { requireUser } from "@/lib/guard";
import { Student, Subject } from "@/lib/models";
import { handle, ok, bad, isId, HttpError } from "@/lib/http";
import { audit } from "@/lib/audit";

// বিষয়ভিত্তিক ভর্তি: ঐচ্ছিক বিষয় নির্বাচন (বাধ্যতামূলক বিষয় শ্রেণি থেকে আসে)
export const PUT = handle(async (req, { params }) => {
  const user = await requireUser("students.write");
  const { id } = await params;
  if (!isId(id)) throw new HttpError(404, "শিক্ষার্থী পাওয়া যায়নি");
  await connectDB();
  const s = await Student.findById(id);
  if (!s || s.archived) throw new HttpError(404, "শিক্ষার্থী পাওয়া যায়নি");
  const { subjects } = await req.json();
  if (!Array.isArray(subjects) || subjects.some((x) => !isId(String(x)))) throw bad("বিষয় তালিকা সঠিক নয়");
  const found = await Subject.find({ _id: { $in: subjects }, type: "optional" }).lean();
  if (found.length !== new Set(subjects.map(String)).size) throw bad("শুধু ঐচ্ছিক বিষয় বাছাই করা যায়");
  if (found.some((x) => x.classes?.length && !x.classes.includes(s.class))) throw bad("কিছু বিষয় এই শ্রেণিতে নেই");
  s.optionalSubjects = found.map((x) => x._id); await s.save();
  await audit(user, "subjects", "students", s._id, { count: found.length });
  return ok();
});
