import bcrypt from "bcryptjs";
import { connectDB, withTx } from "@/lib/db";
import { requireUser } from "@/lib/guard";
import { Application, Student, StudentHistory } from "@/lib/models";
import { handle, json, ok, bad, isId, HttpError, num } from "@/lib/http";
import { getSettings } from "@/lib/settings";
import { validateStudent } from "@/lib/resources";
import { nextStudentId, genPassword, nextRoll } from "@/lib/ids";
import { todayDhaka } from "@/lib/dates";
import { audit } from "@/lib/audit";

export const POST = handle(async (req, { params }) => {
  const user = await requireUser("applications.manage");
  const { id } = await params;
  if (!isId(id)) throw new HttpError(404, "আবেদন পাওয়া যায়নি");
  await connectDB();
  const b = await req.json();
  const note = String(b.note || "").trim().slice(0, 300);
  if (!b.approve) {
    if (note.length < 3) throw bad("বাতিলের কারণ লিখুন");
    const r = await Application.updateOne({ _id: id, status: "pending" }, { $set: { status: "rejected", decisionNote: note, decidedByName: user.name } });
    if (!r.matchedCount) throw new HttpError(409, "আবেদন আগেই নিষ্পত্তি হয়েছে");
    await audit(user, "reject", "application", id, { note });
    return ok();
  }
  const st = await getSettings();
  const out = await withTx(async (session) => {
    const a = await Application.findById(id).session(session);
    if (!a) throw new HttpError(404, "আবেদন পাওয়া যায়নি");
    if (a.status !== "pending") throw new HttpError(409, "আবেদন আগেই নিষ্পত্তি হয়েছে");
    const d = { name: a.name, class: a.class, section: b.section || "", session: st.currentSession || undefined, gender: a.gender, fatherName: a.fatherName, motherName: a.motherName, guardianPhone: a.phone, phone: a.phone, address: a.address, dob: a.dob, previousSchool: a.previousSchool, previousClass: a.previousClass, monthlyFee: num(b.monthlyFee, "মাসিক বেতন", { req: false }) ?? 0, admissionDate: todayDhaka() };
    d.roll = b.roll ? num(b.roll, "রোল", { min: 1, int: true }) : await nextRoll(d.class, d.section, d.session);
    await validateStudent(d, { isUpdate: false });
    d.studentId = await nextStudentId(session);
    const pw = genPassword(); d.password = await bcrypt.hash(pw, 10);
    const [stu] = await Student.create([d], { session });
    await StudentHistory.create([{ student: stu._id, type: "admission", toClass: stu.class, toSection: stu.section, toRoll: stu.roll, session: stu.session, date: stu.admissionDate, note: "অনলাইন আবেদন থেকে", byName: user.name }], { session });
    a.set({ status: "approved", student: stu._id, decidedByName: user.name, decisionNote: note }); await a.save({ session });
    return { studentId: stu.studentId, password: pw, name: stu.name };
  });
  await audit(user, "approve", "application", id, { studentId: out.studentId });
  return json({ ok: true, ...out });
});
