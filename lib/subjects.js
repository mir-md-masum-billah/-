import { Subject } from "@/lib/models";
// একজন শিক্ষার্থীর জন্য প্রযোজ্য বিষয়: শ্রেণির বিষয় − বন্ধ করা বাধ্যতামূলক + বেছে নেওয়া ঐচ্ছিক
export function applicable(student, subjects) {
  const off = new Set((student.excludedSubjects || []).map(String)), opt = new Set((student.optionalSubjects || []).map((o) => String(o._id || o)));
  return subjects.filter((s) => (!s.classes?.length || s.classes.includes(student.class)) && (s.type === "optional" ? opt.has(String(s._id)) : !off.has(String(s._id))));
}
export const classSubjects = (cls) => Subject.find({ $or: [{ classes: { $size: 0 } }, { classes: cls }] }).sort({ name: 1 }).lean();
