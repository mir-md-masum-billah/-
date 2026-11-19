import { connectDB, withTx } from "@/lib/db";
import { requireUser } from "@/lib/guard";
import { Student, StudentHistory, Invoice } from "@/lib/models";
import { handle, ok, bad, isId, HttpError } from "@/lib/http";
import { isDate, todayDhaka, isFuture } from "@/lib/dates";
import { netPaidMap, obligation, round2 } from "@/lib/finance";
import { nextRoll } from "@/lib/ids";
import { rollTaken } from "@/lib/resources";
import { audit } from "@/lib/audit";

// বদলি (TC) / বহিষ্কার / পাস / ঝরে পড়া / পুনরায় সক্রিয় — ইতিহাসে লেখা থাকে, বকেয়া ফি-র তথ্য ফেরত দেয়
// কেউ চলে গেলে (বদলি/বহিষ্কার/পাস/ঝরে পড়া) তার পরের রোলগুলো এক ধাপ করে এগিয়ে আসে: ৩ চলে গেলে ৪ হয় ৩, ৫ হয় ৪, ৬ হয় ৫ …
export const POST = handle(async (req, { params }) => {
  const user = await requireUser("students.promote");
  const { id } = await params;
  if (!isId(id)) throw new HttpError(404, "শিক্ষার্থী পাওয়া যায়নি");
  await connectDB();
  const b = await req.json();
  if (!["transferred", "expelled", "passed", "dropped", "reactivated"].includes(b.type)) throw bad("ধরন সঠিক নয়");
  const date = b.date || todayDhaka();
  if (!isDate(date) || isFuture(date)) throw bad("তারিখ সঠিক নয়");
  const s = await Student.findById(id);
  if (!s || s.archived) throw new HttpError(404, "শিক্ষার্থী পাওয়া যায়নি");
  if (b.type === "reactivated") {
    if (s.active) throw bad("শিক্ষার্থী আগে থেকেই সক্রিয়");
    let roll = s.roll;
    if (await rollTaken({ cls: s.class, sec: s.section, session: s.session, roll, exceptId: s._id })) roll = await nextRoll(s.class, s.section, s.session);
    s.set({ active: true, status: "active", roll, leftDate: undefined, leftReason: undefined });
  } else {
    if (!s.active) throw bad("শিক্ষার্থী আগে থেকেই নিষ্ক্রিয়");
    const reason = String(b.reason || "").trim().slice(0, 300);
    if (b.type !== "passed" && reason.length < 3) throw bad("কারণ লিখুন");
    s.set({ active: false, status: b.type, leftDate: date, leftReason: [reason, b.toSchool && `নতুন স্কুল: ${String(b.toSchool).slice(0, 100)}`].filter(Boolean).join(" · ") });
  }
  let shifted = 0;
  await withTx(async (session) => {
    await s.save({ session });
    await StudentHistory.create([{ student: s._id, type: b.type, fromClass: s.class, fromSection: s.section, fromRoll: s.roll, session: s.session, date, note: s.leftReason, byName: user.name }], { session });
    if (b.type !== "reactivated") {
      const later = await Student.find({ class: s.class, active: true, archived: { $ne: true }, section: s.section ? s.section : { $in: [null, ""] }, session: s.session ? s.session : { $in: [null, ""] }, roll: { $gt: s.roll }, _id: { $ne: s._id } }).sort({ roll: 1 }).select("roll class section session").session(session).lean();
      if (later.length) {
        await Student.bulkWrite(later.map((o) => ({ updateOne: { filter: { _id: o._id }, update: { $set: { roll: o.roll - 1 } } } })), { session });
        await StudentHistory.insertMany(later.map((o) => ({ student: o._id, type: "class_change", fromClass: o.class, fromSection: o.section, fromRoll: o.roll, toClass: o.class, toSection: o.section, toRoll: o.roll - 1, session: o.session, date, note: "রোল এক ধাপ এগিয়েছে (সহপাঠী চলে যাওয়ায়)", byName: user.name })), { session });
      }
      shifted = later.length;
    }
  });
  const inv = await Invoice.find({ student: s._id, status: "open" }).lean();
  const map = await netPaidMap(inv.map((i) => i._id));
  const due = round2(inv.reduce((t, i) => t + Math.max(0, obligation(i) - (map[String(i._id)] || 0)), 0));
  await audit(user, b.type, "students", s._id, { name: s.name, due, shifted });
  return ok({ due, shifted });
});
