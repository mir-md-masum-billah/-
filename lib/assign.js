import { Assignment, Student } from "@/lib/models";
import { getSettings } from "@/lib/settings";
import { HttpError } from "@/lib/http";

// শিক্ষকের নিয়োগ অনুযায়ী অ্যাক্সেস (admin/headmaster ইত্যাদির জন্য সীমা নেই)।
// Settings.restrictTeachers = false দিলে শিক্ষকও সব শ্রেণিতে কাজ করতে পারে।
async function load(user) {
  if (user.role !== "teacher") return null;
  if ((await getSettings()).restrictTeachers === false) return null;
  return Assignment.find({ teacher: user.id }).populate("subject", "name").lean();
}
export async function teacherAssignments(user) { return load(user); } // null = সীমাহীন

// শিক্ষক যে শ্রেণি-শাখাগুলো দেখতে পারে: null = সব; নইলে [{class, section}] (section "" = পুরো শ্রেণি)
export async function visibleScopes(user) {
  const a = await load(user);
  return a === null ? null : a.map((x) => ({ class: x.class, section: x.section || "" }));
}
export function scopeFilter(scopes) { // Student কুয়েরির জন্য
  if (scopes === null) return {};
  if (!scopes.length) return { _id: null };
  return { $or: scopes.map((s) => (s.section ? { class: s.class, section: s.section } : { class: s.class })) };
}
const inScope = (scopes, cls, sec) => scopes === null || scopes.some((s) => s.class === cls && (!s.section || s.section === (sec || "")));

// হাজিরা শুধু ক্লাস টিচারের (শ্রেণি/শাখা)
export async function assertAttendanceAccess(user, cls, students) {
  const a = await load(user);
  if (a === null) return;
  const mine = a.filter((x) => x.kind === "class" && x.class === cls);
  const ok = students.every((s) => mine.some((x) => !x.section || x.section === (s.section || "")));
  if (!mine.length || !ok) throw new HttpError(403, "এই শ্রেণির হাজিরা নেওয়ার জন্য আপনি ক্লাস টিচার হিসেবে নিযুক্ত নন");
}
// ফলাফল: সেই শ্রেণির বিষয়-শিক্ষক বা ক্লাস টিচার
export async function assertResultAccess(user, studentId, subjectName) {
  const a = await load(user);
  if (a === null) return;
  const s = await Student.findById(studentId).select("class section").lean();
  const ok = s && a.some((x) => x.class === s.class && (!x.section || x.section === (s.section || "")) && (x.kind === "class" || x.subject?.name === subjectName));
  if (!ok) throw new HttpError(403, "এই শ্রেণি/বিষয়ে নম্বর দেওয়ার জন্য আপনি নিযুক্ত নন");
}
export { inScope };
