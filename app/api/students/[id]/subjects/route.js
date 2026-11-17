import { connectDB } from "@/lib/db";
import { requireUser } from "@/lib/guard";
import { Student, Subject } from "@/lib/models";
import { handle, ok, bad, isId, HttpError } from "@/lib/http";
import { audit } from "@/lib/audit";
import { visibleScopes, inScope, teacherAssignments } from "@/lib/assign";

// শিক্ষার্থীর বিষয় চালু/বন্ধ: body = { enabled: [চালু থাকা সব বিষয়ের আইডি] }
// বাধ্যতামূলক বিষয় বাদ গেলে "বন্ধ" তালিকায় (excludedSubjects), ঐচ্ছিক বিষয় চালু থাকলে optionalSubjects-এ যায়।
// অনুমতি: students.write আছে এমন ব্যক্তি, অথবা সেই শ্রেণির ক্লাস টিচার
export const PUT = handle(async (req, { params }) => {
  const user = await requireUser("students.read");
  const { id } = await params;
  if (!isId(id)) throw new HttpError(404, "শিক্ষার্থী পাওয়া যায়নি");
  await connectDB();
  const s = await Student.findById(id);
  if (!s || s.archived) throw new HttpError(404, "শিক্ষার্থী পাওয়া যায়নি");
  if (!user.perms.includes("students.write")) {
    const a = await teacherAssignments(user);
    const okClassTeacher = a !== null && a.some((x) => x.kind === "class" && x.class === s.class && (!x.section || x.section === (s.section || "")));
    if (!okClassTeacher) throw new HttpError(403, "এই শিক্ষার্থীর বিষয় বদলানোর অনুমতি নেই (শুধু ক্লাস টিচার বা অ্যাডমিন)");
  }
  if (!inScope(await visibleScopes(user), s.class, s.section)) throw new HttpError(403, "এই শিক্ষার্থীর তথ্য বদলানোর অনুমতি নেই");
  const { enabled } = await req.json();
  if (!Array.isArray(enabled) || enabled.some((x) => !isId(String(x)))) throw bad("বিষয় তালিকা সঠিক নয়");
  const all = await Subject.find({ $or: [{ classes: { $size: 0 } }, { classes: s.class }] }).lean();
  const on = new Set(enabled.map(String));
  s.optionalSubjects = all.filter((x) => x.type === "optional" && on.has(String(x._id))).map((x) => x._id);
  s.excludedSubjects = all.filter((x) => x.type !== "optional" && !on.has(String(x._id))).map((x) => x._id);
  await s.save();
  await audit(user, "subjects", "students", s._id, { on: s.optionalSubjects.length, off: s.excludedSubjects.length });
  return ok();
});
