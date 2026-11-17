import { RoutineSlot, User } from "@/lib/models";
import { bad, isId } from "@/lib/http";
import { TEACHING_ROLES } from "@/lib/rbac";
import { getSettings } from "@/lib/settings";

import { DAYS } from "@/lib/routine-days";
export { DAYS };
const tm = /^([01]\d|2[0-3]):[0-5]\d$/;

export async function validateSlot(d, existing) {
  const teacher = d.teacher ?? existing?.teacher, cls = d.class ?? existing?.class, section = d.section ?? existing?.section ?? "";
  const subject = String(d.subject ?? existing?.subject ?? "").trim(), day = Number(d.day ?? existing?.day), start = d.startTime ?? existing?.startTime, end = d.endTime ?? existing?.endTime;
  if (!isId(String(teacher))) throw bad("শিক্ষক বাছাই করুন");
  const u = await User.findById(teacher).select("role active").lean();
  if (!u || !u.active || !TEACHING_ROLES.includes(u.role)) throw bad("শুধু সক্রিয় শিক্ষক, প্রধান শিক্ষক বা অ্যাডমিনকে রুটিনে দেওয়া যায় — সাধারণ স্টাফ নয়");
  const c = (await getSettings(true)).classes.find((x) => x.name === cls);
  if (!c) throw bad("শ্রেণি সেটিংসে নেই");
  if (section && !c.sections?.includes(section)) throw bad("এই শ্রেণিতে এমন শাখা নেই");
  if (!subject) throw bad("বিষয় বাছাই করুন");
  if (!Number.isInteger(day) || day < 0 || day > 6) throw bad("সপ্তাহের দিন সঠিক নয়");
  if (!tm.test(start || "") || !tm.test(end || "")) throw bad("ক্লাসের সময় দিন");
  if (end <= start) throw bad("শেষের সময় শুরুর পরে হতে হবে");
  const base = { day, startTime: { $lt: end }, endTime: { $gt: start } };
  if (existing) base._id = { $ne: existing._id };
  const t = await RoutineSlot.findOne({ ...base, teacher }).lean();
  if (t) throw bad(`এই শিক্ষকের ${DAYS[day]} ${t.startTime}–${t.endTime} সময়ে আগেই ${t.class} শ্রেণির ক্লাস আছে`);
  const k = await RoutineSlot.findOne({ ...base, class: cls, ...(section ? { section: { $in: ["", section] } } : {}) }).lean();
  if (k) throw bad(`${cls} শ্রেণির ${DAYS[day]} ${k.startTime}–${k.endTime} সময়ে আগেই অন্য ক্লাস আছে`);
  return { teacher, class: cls, section, subject, day, startTime: start, endTime: end };
}
