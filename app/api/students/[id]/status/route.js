import { connectDB, withTx } from "@/lib/db";
import { requireUser } from "@/lib/guard";
import { Student, StudentHistory, Invoice } from "@/lib/models";
import { handle, ok, bad, isId, HttpError } from "@/lib/http";
import { isDate, todayDhaka, isFuture } from "@/lib/dates";
import { netPaidMap, obligation, round2 } from "@/lib/finance";
import { nextRoll } from "@/lib/ids";
import { rollTaken } from "@/lib/resources";
import { audit } from "@/lib/audit";

// বদলি (TC) / পাস / ঝরে পড়া / পুনরায় সক্রিয় — ইতিহাসে লেখা থাকে, বকেয়া ফি-র তথ্য ফেরত দেয়
export const POST = handle(async (req, { params }) => {
  const user = await requireUser("students.promote");
  const { id } = await params;
  if (!isId(id)) throw new HttpError(404, "শিক্ষার্থী পাওয়া যায়নি");
  await connectDB();
  const b = await req.json();
  if (!["transferred", "passed", "dropped", "reactivated"].includes(b.type)) throw bad("ধরন সঠিক নয়");
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
  await withTx(async (session) => {
    await s.save({ session });
    await StudentHistory.create([{ student: s._id, type: b.type, fromClass: s.class, fromSection: s.section, fromRoll: s.roll, session: s.session, date, note: s.leftReason, byName: user.name }], { session });
  });
  const inv = await Invoice.find({ student: s._id, status: "open" }).lean();
  const map = await netPaidMap(inv.map((i) => i._id));
  const due = round2(inv.reduce((t, i) => t + Math.max(0, obligation(i) - (map[String(i._id)] || 0)), 0));
  await audit(user, b.type, "students", s._id, { name: s.name, due });
  return ok({ due });
});
