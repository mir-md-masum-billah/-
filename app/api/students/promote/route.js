import { connectDB, withTx } from "@/lib/db";
import { requireUser } from "@/lib/guard";
import { Student, StudentHistory } from "@/lib/models";
import { handle, ok, bad, isId } from "@/lib/http";
import { getSettings } from "@/lib/settings";
import { todayDhaka } from "@/lib/dates";
import { audit } from "@/lib/audit";

// শ্রেণি প্রমোশন / পাস করে বের হওয়া — ইতিহাস সহ, একসাথে সফল বা কিছুই না (ট্রানজ্যাকশন)
export const POST = handle(async (req) => {
  const user = await requireUser("students.promote");
  await connectDB();
  const b = await req.json();
  const st = await getSettings();
  const from = st.classes.find((c) => c.name === b.fromClass);
  if (!from) throw bad("বর্তমান শ্রেণি সঠিক নয়");
  const q = { class: b.fromClass, active: true, archived: { $ne: true } };
  if (b.fromSection) q.section = b.fromSection;
  if (b.fromSession) q.session = b.fromSession;
  if (Array.isArray(b.studentIds)) { if (b.studentIds.some((i) => !isId(String(i)))) throw bad("শিক্ষার্থী আইডি সঠিক নয়"); q._id = { $in: b.studentIds }; }
  const students = await Student.find(q).sort({ roll: 1 }).lean();
  if (!students.length) throw bad("কোনো সক্রিয় শিক্ষার্থী পাওয়া যায়নি");
  const date = todayDhaka();

  const result = await withTx(async (session) => {
    if (b.graduate) {
      for (const s of students) {
        await Student.updateOne({ _id: s._id }, { $set: { status: "passed", active: false, leftDate: date, leftReason: "শিক্ষা সমাপ্ত" } }, { session });
        await StudentHistory.create([{ student: s._id, type: "passed", fromClass: s.class, fromSection: s.section, fromRoll: s.roll, session: s.session, date, byName: user.name }], { session });
      }
      return { moved: students.length, graduated: true };
    }
    const to = st.classes.find((c) => c.name === b.toClass);
    if (!to) throw bad("নতুন শ্রেণি সঠিক নয়");
    const toSection = b.toSection || "";
    if (toSection && !to.sections?.includes(toSection)) throw bad("নতুন শ্রেণিতে এমন শাখা নেই");
    const newSession = b.session || st.currentSession || "";
    if (b.toClass === b.fromClass && (b.fromSection || "") === toSection && newSession === (students[0].session || "")) throw bad("একই শ্রেণি, শাখা ও সেশনে প্রমোশন অর্থহীন");
    const ids = students.map((s) => s._id);
    const taken = await Student.find({ class: b.toClass, section: toSection ? toSection : { $in: [null, ""] }, session: newSession ? newSession : { $in: [null, ""] }, archived: { $ne: true }, active: true, _id: { $nin: ids } }).sort({ roll: -1 }).limit(1).select("roll").session(session).lean();
    let roll = (taken[0]?.roll || 0);
    for (const s of students) {
      roll += 1;
      await Student.updateOne({ _id: s._id }, { $set: { class: b.toClass, section: toSection, roll, session: newSession } }, { session });
      await StudentHistory.create([{ student: s._id, type: "promotion", fromClass: s.class, fromSection: s.section, fromRoll: s.roll, toClass: b.toClass, toSection, toRoll: roll, session: newSession, date, byName: user.name }], { session });
    }
    return { moved: students.length };
  });
  await audit(user, "promote", "students", null, { from: b.fromClass, to: b.graduate ? "graduate" : b.toClass, ...result });
  return ok(result);
});
