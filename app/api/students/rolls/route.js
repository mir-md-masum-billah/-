import { connectDB } from "@/lib/db";
import { requireUser } from "@/lib/guard";
import { Student, StudentHistory } from "@/lib/models";
import { handle, ok, bad } from "@/lib/http";
import { todayDhaka } from "@/lib/dates";
import { audit } from "@/lib/audit";

// রোল পুনর্বিন্যাস: নাম (বর্ণানুক্রমে) বা বর্তমান রোল অনুযায়ী ১ থেকে ক্রমিক
export const POST = handle(async (req) => {
  const user = await requireUser("students.promote");
  await connectDB();
  const b = await req.json();
  if (!b.class) throw bad("শ্রেণি দিন");
  const q = { class: b.class, active: true, archived: { $ne: true }, section: b.section ? b.section : { $in: [null, ""] }, session: b.session ? b.session : { $in: [null, ""] } };
  const list = await Student.find(q).select("name roll section session class").lean();
  if (!list.length) throw bad("কোনো শিক্ষার্থী পাওয়া যায়নি");
  list.sort(b.order === "roll" ? (a, c) => a.roll - c.roll : (a, c) => a.name.localeCompare(c.name, "bn"));
  const changed = list.map((s, i) => ({ s, roll: i + 1 })).filter((x) => x.s.roll !== x.roll);
  if (changed.length) {
    await Student.bulkWrite(changed.map((x) => ({ updateOne: { filter: { _id: x.s._id }, update: { $set: { roll: x.roll } } } })));
    await StudentHistory.insertMany(changed.map((x) => ({ student: x.s._id, type: "class_change", fromClass: x.s.class, fromSection: x.s.section, fromRoll: x.s.roll, toClass: x.s.class, toSection: x.s.section, toRoll: x.roll, session: x.s.session, date: todayDhaka(), note: "রোল পুনর্বিন্যাস", byName: user.name })));
  }
  await audit(user, "renumber", "students", null, { class: b.class, section: b.section, order: b.order, changed: changed.length });
  return ok({ total: list.length, changed: changed.length });
});
