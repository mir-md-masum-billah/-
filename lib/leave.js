import { Attendance, StaffAttendance, Student } from "@/lib/models";
import { eachDate, todayDhaka } from "@/lib/dates";

// অনুমোদিত ছুটি → আজ পর্যন্ত তারিখে হাজিরায় "ছুটি" বসে (উপস্থিত থাকলে বদলায় না); ভবিষ্যৎ তারিখ হাজিরা নেওয়ার সময় আগে থেকে "ছুটি" দেখায়
export async function applyLeave(leave, byName, session) {
  const today = todayDhaka();
  const dates = eachDate(leave.from, leave.to < today ? leave.to : today).filter((d) => d <= today);
  if (!dates.length) return 0;
  let n = 0;
  if (leave.kind === "student") {
    const s = await Student.findById(leave.student).select("class").session(session).lean();
    if (!s) return 0; // শিক্ষার্থী আর নেই — হাজিরায় কিছু বসানোর নেই
    for (const date of dates) {
      const ex = await Attendance.findOne({ student: leave.student, date }).session(session);
      if (!ex) { await Attendance.create([{ student: leave.student, class: s.class, date, status: "leave", history: [] }], { session }); n++; }
      else if (ex.status === "absent") { ex.history.push({ status: "absent", byName }); ex.status = "leave"; await ex.save({ session }); n++; }
    }
  } else {
    for (const date of dates) {
      const ex = await StaffAttendance.findOne({ user: leave.user, date }).session(session);
      if (!ex) { await StaffAttendance.create([{ user: leave.user, date, status: "leave" }], { session }); n++; }
      else if (ex.status === "absent") { ex.history.push({ status: "absent", byName }); ex.status = "leave"; await ex.save({ session }); n++; }
    }
  }
  return n;
}
