import { connectDB, withTx } from "@/lib/db";
import { requireUser } from "@/lib/guard";
import { Student, StudentHistory } from "@/lib/models";
import { handle, ok, bad, isId, str } from "@/lib/http";
import { getSettings } from "@/lib/settings";
import { todayDhaka } from "@/lib/dates";
import { audit } from "@/lib/audit";

// শ্রেণি প্রমোশন / পাস করে বের হওয়া — ইতিহাস সহ, একসাথে সফল বা কিছুই না (ট্রানজ্যাকশন)
export const POST = handle(async (req) => {
  const user = await requireUser("students.promote");
  await connectDB();
  const b = await req.json();
  const st = await getSettings();
  const fromClass = str(b.fromClass, 60), fromSection = str(b.fromSection, 60), fromSession = str(b.fromSession, 40), toClass = str(b.toClass, 60);
  const from = st.classes.find((c) => c.name === fromClass);
  if (!from) throw bad("বর্তমান শ্রেণি সঠিক নয়");
  const q = { class: fromClass, active: true, archived: { $ne: true } };
  if (fromSection) q.section = fromSection;
  if (fromSession) q.session = fromSession;
  if (Array.isArray(b.studentIds)) { if (b.studentIds.some((i) => !isId(String(i)))) throw bad("শিক্ষার্থী আইডি সঠিক নয়"); q._id = { $in: b.studentIds }; }
  const students = await Student.find(q).sort({ roll: 1 }).lean();
  if (!students.length) throw bad("কোনো সক্রিয় শিক্ষার্থী পাওয়া যায়নি");
  const date = todayDhaka();

  const result = await withTx(async (session) => {
    if (b.graduate) {
      await Student.updateMany({ _id: { $in: students.map((s) => s._id) } }, { $set: { status: "passed", active: false, leftDate: date, leftReason: "শিক্ষা সমাপ্ত" } }, { session });
      await StudentHistory.insertMany(students.map((s) => ({ student: s._id, type: "passed", fromClass: s.class, fromSection: s.section, fromRoll: s.roll, session: s.session, date, byName: user.name })), { session });
      return { moved: students.length, graduated: true };
    }
    const to = st.classes.find((c) => c.name === toClass);
    if (!to) throw bad("নতুন শ্রেণি সঠিক নয়");
    const toSection = str(b.toSection, 60);
    if (toSection && !to.sections?.includes(toSection)) throw bad("নতুন শ্রেণিতে এমন শাখা নেই");
    const newSession = str(b.session, 40) || st.currentSession || "";
    if (toClass === fromClass && fromSection === toSection && newSession === (students[0].session || "")) throw bad("একই শ্রেণি, শাখা ও সেশনে প্রমোশন অর্থহীন");
    const ids = students.map((s) => s._id);
    const taken = await Student.find({ class: toClass, section: toSection ? toSection : { $in: [null, ""] }, session: newSession ? newSession : { $in: [null, ""] }, archived: { $ne: true }, active: true, _id: { $nin: ids } }).sort({ roll: -1 }).limit(1).select("roll").session(session).lean();
    let roll = (taken[0]?.roll || 0);
    const plan = students.map((s) => ({ s, roll: ++roll }));
    await Student.bulkWrite(plan.map(({ s, roll }) => ({ updateOne: { filter: { _id: s._id }, update: { $set: { class: toClass, section: toSection, roll, session: newSession } } } })), { session });
    await StudentHistory.insertMany(plan.map(({ s, roll }) => ({ student: s._id, type: "promotion", fromClass: s.class, fromSection: s.section, fromRoll: s.roll, toClass, toSection, toRoll: roll, session: newSession, date, byName: user.name })), { session });
    return { moved: students.length };
  });
  await audit(user, "promote", "students", null, { from: fromClass, to: b.graduate ? "graduate" : toClass, ...result });
  return ok(result);
});
