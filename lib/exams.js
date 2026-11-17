import { Invoice, Student, AdmitCard, ExamNotice, Subject } from "@/lib/models";
import { bad } from "@/lib/http";
import { nextNos } from "@/lib/finance";
import { getSettings } from "@/lib/settings";
import { isDate } from "@/lib/dates";

export const studentsOf = (exam, session) => Student.find({ class: exam.class, ...(exam.section ? { section: exam.section } : {}), active: true, archived: { $ne: true } }).select("_id roll class section").session(session || null).sort({ section: 1, roll: 1 });

// পরীক্ষার নোটিশ প্রকাশের পর: ফি থাকলে প্রতিটি শিক্ষার্থীর জন্য পরীক্ষা-ফি ইনভয়েস; ফি না থাকলে সরাসরি অ্যাডমিট কার্ড। বারবার চালালে শুধু বাদ পড়াগুলো তৈরি হয়।
export async function generateForExam(exam, session) {
  const students = await studentsOf(exam, session);
  let invoices = 0, cards = 0;
  if (exam.fee > 0) {
    const have = new Set((await Invoice.find({ examNotice: exam._id }).select("student").session(session || null).lean()).map((i) => String(i.student)));
    const need = students.filter((s) => !have.has(String(s._id)));
    if (need.length) {
      const nos = await nextNos("INV", need.length, session);
      const base = `${exam.name} — পরীক্ষা ফি`;
      const clash = new Set((await Invoice.find({ student: { $in: need.map((s) => s._id) }, category: "exam", title: base }).select("student").session(session || null).lean()).map((i) => String(i.student)));
      await Invoice.create(need.map((s, i) => ({ invoiceNo: nos[i], student: s._id, category: "exam", title: clash.has(String(s._id)) ? `${base} (${String(exam._id).slice(-4)})` : base, amount: exam.fee, examNotice: exam._id, note: "পরীক্ষার নোটিশ থেকে স্বয়ংক্রিয়" })), { session, ordered: true });
      invoices = need.length;
    }
  } else {
    const have = new Set((await AdmitCard.find({ exam: exam._id }).select("student").session(session || null).lean()).map((c) => String(c.student)));
    const need = students.filter((s) => !have.has(String(s._id)));
    if (need.length) {
      const nos = await nextNos("ADM", need.length, session);
      await AdmitCard.create(need.map((s, i) => ({ admitNo: nos[i], exam: exam._id, student: s._id, roll: s.roll, class: s.class, section: s.section })), { session, ordered: true });
      cards = need.length;
    }
  }
  return { invoices, cards, students: students.length };
}

// ফর্ম যাচাই: শ্রেণি/শাখা সেটিংসে আছে কি, বিষয় ওই শ্রেণির তালিকায় আছে কি, সময় ঠিক কি
export async function validateExam(d) {
  const st = await getSettings(true);
  const name = String(d.name || "").trim().slice(0, 120);
  if (name.length < 2) throw bad("পরীক্ষার নাম দিন");
  if (!Array.isArray(d.targets) || !d.targets.length || d.targets.length > 60) throw bad("কমপক্ষে একটি শ্রেণি বাছাই করুন");
  const targets = [], seen = new Set();
  for (const t of d.targets) {
    const c = st.classes.find((x) => x.name === t.class);
    if (!c) throw bad("শ্রেণি সেটিংসে নেই");
    const section = t.section || "";
    if (section && !c.sections?.includes(section)) throw bad(`${t.class} শ্রেণিতে "${section}" শাখা নেই`);
    const k = `${t.class}|${section}`; if (seen.has(k)) continue; seen.add(k); targets.push({ class: t.class, section });
  }
  if (!Array.isArray(d.schedule) || !d.schedule.length || d.schedule.length > 40) throw bad("কমপক্ষে একটি বিষয়ের রুটিন দিন");
  const subjects = await Subject.find().lean();
  const schedule = d.schedule.map((r) => {
    const subject = String(r.subject || "").trim().slice(0, 80);
    if (!subject) throw bad("প্রতিটি সারিতে বিষয় বাছাই করুন");
    if (!isDate(r.date)) throw bad(`"${subject}" — পরীক্ষার তারিখ সঠিক নয়`);
    const tm = /^([01]\d|2[0-3]):[0-5]\d$/;
    if (!tm.test(r.startTime || "") || !tm.test(r.endTime || "")) throw bad(`"${subject}" — সময় দিন`);
    if (r.endTime <= r.startTime) throw bad(`"${subject}" — শেষের সময় শুরুর পরে হতে হবে`);
    return { subject, subjectId: r.subjectId ? String(r.subjectId) : undefined, date: r.date, startTime: r.startTime, endTime: r.endTime };
  });
  for (const t of targets) {
    const list = subjects.filter((s) => !s.classes?.length || s.classes.includes(t.class));
    if (list.length) for (const r of schedule) if (!list.some((s) => s.name === r.subject)) throw bad(`"${r.subject}" বিষয়টি ${t.class} শ্রেণির তালিকায় নেই`);
  }
  const fee = Number(d.fee || 0);
  if (!Number.isFinite(fee) || fee < 0 || fee > 1e7) throw bad("পরীক্ষার ফি সঠিক নয়");
  return { name, targets, schedule, fee, instructions: String(d.instructions || "").trim().slice(0, 2000), session: d.session ? String(d.session).slice(0, 20) : st.currentSession };
}
export { ExamNotice };
