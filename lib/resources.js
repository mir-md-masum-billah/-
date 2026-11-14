import { User, Student, Result, Notice, Session, Subject, Assignment, StudentHistory, Settings } from "@/lib/models";
import { HttpError, bad, num, isId } from "@/lib/http";
import { canAssignRole } from "@/lib/rbac";
import { getSettings, bustSettings } from "@/lib/settings";
import { isDate, todayDhaka } from "@/lib/dates";
import { nextStudentId, genPassword, nextRoll } from "@/lib/ids";
import { assertResultAccess, visibleScopes, scopeFilter } from "@/lib/assign";

const clean = (v) => (typeof v === "string" ? v.trim() : v);
export const pick = (src, keys) => Object.fromEntries(keys.filter((k) => src[k] !== undefined).map((k) => [k, clean(src[k])]));

// রোল ডুপ্লিকেট (একই শ্রেণি-শাখা-শিক্ষাবর্ষে)
export async function rollTaken({ cls, sec, session, roll, exceptId }) {
  const q = { class: cls, roll, archived: { $ne: true }, active: true, section: sec ? sec : { $in: [null, ""] }, session: session ? session : { $in: [null, ""] } };
  if (exceptId) q._id = { $ne: exceptId };
  return !!(await Student.exists(q));
}
export async function validateStudent(d, { isUpdate, existing }) {
  const st = await getSettings();
  const cls = d.class ?? existing?.class, sec = d.section ?? existing?.section;
  if (d.class !== undefined || !isUpdate) {
    const c = st.classes.find((x) => x.name === cls);
    if (!c) throw bad("শ্রেণি সেটিংসে নেই");
    if (sec && c.sections?.length && !c.sections.includes(sec)) throw bad("এই শ্রেণিতে এমন শাখা নেই");
  }
  if (d.roll !== undefined) d.roll = num(d.roll, "রোল", { min: 1, max: 9999, int: true });
  if (d.monthlyFee !== undefined) d.monthlyFee = num(d.monthlyFee, "মাসিক বেতন", { req: false }) ?? 0;
  for (const k of ["dob", "admissionDate"]) if (d[k] && !isDate(d[k])) throw bad("তারিখ সঠিক নয়");
  if (d.studentId !== undefined && !/^[A-Za-z0-9_-]{3,30}$/.test(d.studentId)) throw bad("আইডিতে শুধু ইংরেজি অক্ষর/সংখ্যা (৩–৩০টি) দিন");
  if (typeof d.otherPhones === "string") d.otherPhones = d.otherPhones.split(/[,،;]/).map((x) => x.trim()).filter(Boolean).slice(0, 5);
  if (d.gender === "") delete d.gender;
  if (!isUpdate && !d.admissionDate) d.admissionDate = todayDhaka();
  if (d.roll !== undefined || d.class !== undefined || d.section !== undefined || d.session !== undefined) {
    const roll = d.roll ?? existing?.roll;
    if (roll && (!existing || existing.active) && (await rollTaken({ cls, sec, session: d.session ?? existing?.session, roll, exceptId: existing?._id }))) throw bad("এই শ্রেণি/শাখায় এই রোল আগে থেকেই আছে");
  }
}

export const resources = {
  students: {
    model: Student, read: "students.read", write: "students.write", hash: true, archive: true,
    sort: { class: 1, section: 1, roll: 1 }, search: ["name", "studentId", "phone", "fatherName"], filters: ["class", "section", "active", "status"],
    allow: ["studentId", "password", "name", "class", "section", "roll", "session", "gender", "fatherName", "motherName", "guardianName", "guardianPhone", "phone", "otherPhones", "address", "birthRegNo", "previousSchool", "previousClass", "dob", "admissionDate", "photo", "monthlyFee", "active"],
    scope: async (user) => scopeFilter(await visibleScopes(user)),
    // ভর্তি: আইডি/পাসওয়ার্ড/রোল ফাঁকা থাকলে স্বয়ংক্রিয়
    async before(d) {
      const extra = {};
      if (!d.studentId) d.studentId = await nextStudentId();
      if (!d.password) { d.password = genPassword(); extra.generatedPassword = d.password; }
      if ((d.roll === undefined || d.roll === "" || d.roll === null) && d.class) d.roll = await nextRoll(d.class, d.section, d.session); // স্পষ্টভাবে ০ দিলে নয় — সেটা যাচাইয়ে বাতিল হয়
      extra.studentId = d.studentId;
      return extra;
    },
    validate: validateStudent,
    async afterCreate(doc, { user }) {
      await StudentHistory.create({ student: doc._id, type: "admission", toClass: doc.class, toSection: doc.section, toRoll: doc.roll, session: doc.session, date: doc.admissionDate, byName: user.name });
    },
    async afterUpdate(before, doc, { user }) {
      if (before.class !== doc.class || (before.section || "") !== (doc.section || "") || before.roll !== doc.roll)
        await StudentHistory.create({ student: doc._id, type: "class_change", fromClass: before.class, fromSection: before.section, fromRoll: before.roll, toClass: doc.class, toSection: doc.section, toRoll: doc.roll, session: doc.session, date: todayDhaka(), byName: user.name });
    },
  },
  staff: {
    model: User, read: "staff.read", write: "staff.write", hash: true, softDelete: true,
    sort: { role: 1, name: 1 }, search: ["name", "userId", "phone", "subject"], filters: ["role", "active"],
    allow: ["userId", "password", "name", "role", "phone", "subject", "designation", "department", "joiningDate", "salary", "photo", "active"],
    async validate(d, { isUpdate, existing, user }) {
      if (d.userId !== undefined && !/^[A-Za-z0-9_.-]{3,30}$/.test(d.userId)) throw bad("আইডিতে শুধু ইংরেজি অক্ষর/সংখ্যা (৩–৩০টি) দিন");
      if (existing && !canAssignRole(user.role, existing.role)) throw new HttpError(403, "এই ব্যবহারকারীকে পরিবর্তনের অনুমতি নেই");
      if (d.role !== undefined && !canAssignRole(user.role, d.role)) throw new HttpError(403, "এই রোল দেওয়ার অনুমতি নেই");
      if (existing && String(existing._id) === user.id && ((d.role && d.role !== existing.role) || d.active === false || d.active === "false")) throw bad("নিজের রোল বা স্ট্যাটাস বদলানো যাবে না");
      if (d.salary !== undefined) d.salary = num(d.salary, "বেতন", { req: false });
      if (d.joiningDate && !isDate(d.joiningDate)) throw bad("তারিখ সঠিক নয়");
    },
  },
  results: {
    model: Result, read: "results.read", write: "results.write", history: true, hardDelete: true,
    sort: { year: -1, exam: 1, subject: 1 }, populate: [{ path: "student", select: "name studentId class roll" }], search: ["exam", "subject"], filters: ["student", "exam", "year"],
    allow: ["student", "exam", "year", "subject", "marks", "full"],
    scope: async (user) => { const sc = await visibleScopes(user); if (sc === null) return {}; return { student: { $in: await Student.find(scopeFilter(sc)).distinct("_id") } }; },
    async checkDelete(existing, { user }) { await assertResultAccess(user, existing.student, existing.subject); },
    async validate(d, { isUpdate, existing, user }) {
      if (d.student !== undefined) {
        if (!isId(String(d.student))) throw bad("শিক্ষার্থী বাছাই করুন");
        const s = await Student.findById(d.student).select("active archived").lean();
        if (!s || !s.active || s.archived) throw bad("শিক্ষার্থী পাওয়া যায়নি বা সক্রিয় নয়");
      }
      await assertResultAccess(user, d.student ?? existing?.student, d.subject ?? existing?.subject);
      const full = d.full !== undefined ? num(d.full, "পূর্ণমান", { min: 1, max: 1000 }) : existing?.full ?? 100;
      if (d.full !== undefined) d.full = full;
      if (d.marks !== undefined) d.marks = num(d.marks, "প্রাপ্ত নম্বর", { min: 0, max: 1000 });
      if ((d.marks ?? existing?.marks) > full) throw bad("প্রাপ্ত নম্বর পূর্ণমানের বেশি হতে পারে না");
      if (d.year !== undefined) d.year = num(d.year, "বছর", { min: 2000, max: 2100, int: true });
      if (!isUpdate && (await Result.exists({ student: d.student, exam: d.exam, year: d.year, subject: d.subject }))) throw bad("এই বিষয়ের নম্বর আগে থেকেই আছে — এডিট করুন");
    },
  },
  notices: {
    model: Notice, read: "public", write: "notices.write", hardDelete: true,
    sort: { date: -1, createdAt: -1 }, search: ["title", "body"], filters: [],
    allow: ["title", "body", "fileUrl", "date"],
    async validate(d) { if (d.date && !isDate(d.date)) throw bad("তারিখ সঠিক নয়"); if (d.date === undefined) d.date = todayDhaka(); },
  },
  sessions: {
    model: Session, read: "students.read", write: "academics.manage", hardDelete: true,
    sort: { startDate: -1 }, search: ["name"], filters: [], allow: ["name", "startDate", "endDate", "current"],
    async validate(d, { existing }) {
      const s = d.startDate ?? existing?.startDate, e = d.endDate ?? existing?.endDate;
      if (!isDate(s) || !isDate(e) || s >= e) throw bad("শুরুর তারিখ শেষের তারিখের আগে হতে হবে");
    },
    async afterCreate(doc) { await syncCurrent(doc); }, async afterUpdate(_b, doc) { await syncCurrent(doc); },
    async checkDelete(existing) { if (await Student.exists({ session: existing.name })) throw bad("এই সেশনে শিক্ষার্থী আছে — মোছা যাবে না"); },
  },
  subjects: {
    model: Subject, read: "students.read", write: "academics.manage", hardDelete: true,
    sort: { name: 1 }, search: ["name", "code"], filters: ["type"], allow: ["name", "code", "type", "classes", "fullMarks"],
    async validate(d) {
      if (typeof d.classes === "string") d.classes = d.classes.split(/[,،]/).map((x) => x.trim()).filter(Boolean);
      if (d.classes) { const names = (await getSettings()).classes.map((c) => c.name); if (d.classes.some((c) => !names.includes(c))) throw bad("কিছু শ্রেণি সেটিংসে নেই"); }
      if (d.fullMarks !== undefined) d.fullMarks = num(d.fullMarks, "পূর্ণমান", { min: 1, max: 1000 });
    },
    async checkDelete(existing) { if (await Assignment.exists({ subject: existing._id })) throw bad("এই বিষয়ে শিক্ষক নিয়োগ আছে — আগে নিয়োগ সরান"); },
  },
  assignments: {
    model: Assignment, read: "students.read", write: "academics.manage", hardDelete: true,
    sort: { class: 1, section: 1, kind: 1 }, populate: [{ path: "teacher", select: "name userId" }, { path: "subject", select: "name" }], search: ["class"], filters: ["class", "kind", "teacher"],
    allow: ["teacher", "kind", "class", "section", "subject"],
    async validate(d, { existing }) {
      const kind = d.kind ?? existing?.kind, cls = d.class ?? existing?.class, sec = d.section ?? existing?.section ?? "";
      const t = d.teacher ?? existing?.teacher;
      if (!isId(String(t))) throw bad("শিক্ষক বাছাই করুন");
      const u = await User.findById(t).select("role active").lean();
      if (!u || !u.active || u.role !== "teacher") throw bad("শুধু সক্রিয় শিক্ষককে নিয়োগ দেওয়া যায়");
      const c = (await getSettings()).classes.find((x) => x.name === cls);
      if (!c) throw bad("শ্রেণি সেটিংসে নেই");
      if (sec && !c.sections?.includes(sec)) throw bad("এই শ্রেণিতে এমন শাখা নেই");
      if (kind === "class") {
        const q = { kind: "class", class: cls, section: sec }; if (existing) q._id = { $ne: existing._id };
        if (await Assignment.exists(q)) throw bad("এই শ্রেণি/শাখার ক্লাস টিচার আগে থেকেই আছেন");
        d.subject = undefined;
      } else if (kind === "subject") {
        const sid = d.subject ?? existing?.subject;
        const sub = isId(String(sid)) && (await Subject.findById(sid).lean());
        if (!sub) throw bad("বিষয় বাছাই করুন");
        if (sub.classes?.length && !sub.classes.includes(cls)) throw bad("এই বিষয় এই শ্রেণিতে নেই");
      } else throw bad("নিয়োগের ধরন সঠিক নয়");
    },
  },
};
async function syncCurrent(doc) {
  if (!doc.current) return;
  await Session.updateMany({ _id: { $ne: doc._id } }, { $set: { current: false } });
  await Settings.updateOne({ key: "main" }, { $set: { currentSession: doc.name } }); bustSettings();
}
