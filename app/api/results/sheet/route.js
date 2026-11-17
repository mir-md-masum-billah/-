import { connectDB } from "@/lib/db";
import { requireUser } from "@/lib/guard";
import { Student, Result } from "@/lib/models";
import { handle, json, bad } from "@/lib/http";
import { visibleScopes, scopeFilter, teacherAssignments } from "@/lib/assign";
import { applicable, classSubjects } from "@/lib/subjects";

// নম্বর এন্ট্রির গ্রিড: শ্রেণি-শাখার শিক্ষার্থী × প্রযোজ্য বিষয়; কোন বিষয়ে এই ব্যবহারকারী নম্বর দিতে পারবে তাও জানায়
export const GET = handle(async (req) => {
  const user = await requireUser("results.read");
  const sp = new URL(req.url).searchParams;
  const cls = sp.get("class"), section = sp.get("section") || "", exam = (sp.get("exam") || "").trim(), year = Number(sp.get("year"));
  if (!cls) throw bad("শ্রেণি বাছাই করুন");
  await connectDB();
  const q = { class: cls, active: true, archived: { $ne: true }, ...(section ? { section } : {}) };
  const sc = scopeFilter(await visibleScopes(user)); const and = [q]; if (Object.keys(sc).length) and.push(sc);
  const students = await Student.find({ $and: and }).sort({ section: 1, roll: 1 }).select("name studentId roll section class optionalSubjects excludedSubjects photo").lean();
  const subjects = await classSubjects(cls);
  const asg = await teacherAssignments(user); // null = সীমাহীন
  const mine = asg === null ? null : asg.filter((x) => x.class === cls && (!x.section || !section || x.section === section));
  const editable = (s) => user.perms.includes("results.write") && (mine === null || mine.some((x) => x.kind === "class" || x.subject?.name === s.name));
  const marks = {}; let total = 0, unpublished = 0;
  if (exam && Number.isFinite(year) && students.length) {
    const rs = await Result.find({ exam, year, student: { $in: students.map((s) => s._id) } }).select("student subject marks full published").lean();
    for (const r of rs) { (marks[String(r.student)] ||= {})[r.subject] = { marks: r.marks, full: r.full }; total++; if (r.published === false) unpublished++; }
  }
  return json({
    subjects: subjects.map((s) => ({ _id: s._id, name: s.name, full: s.fullMarks || 100, editable: editable(s) })),
    students: students.map((s) => ({ _id: s._id, name: s.name, studentId: s.studentId, roll: s.roll, section: s.section, subjects: applicable(s, subjects).map((x) => x.name) })),
    marks, status: { total, unpublished },
  });
});
