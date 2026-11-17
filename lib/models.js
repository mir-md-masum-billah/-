import mongoose from "mongoose";
const { Schema, models, model } = mongoose;
const ref = (name, required = true) => ({ type: Schema.Types.ObjectId, ref: name, required });
const DATE = { type: String, match: [/^\d{4}-\d{2}-\d{2}$/, "তারিখের ফরম্যাট সঠিক নয়"] };

export const FEE_CATEGORIES = { admission: "ভর্তি ফি", tuition: "মাসিক বেতন", exam: "পরীক্ষা ফি", registration: "রেজিস্ট্রেশন ফি", session: "সেশন ফি", library: "লাইব্রেরি ফি", transport: "পরিবহন ফি", other: "অন্যান্য", fine: "জরিমানা" };
export const PAY_METHODS = ["cash", "bkash", "nagad", "rocket", "bank", "other"];
export const ATT_STATUS = ["present", "absent", "late", "leave", "holiday"]; // "অচিহ্নিত" = কোনো রেকর্ড না থাকা

// স্টাফ (লগইন সহ)
const User = models.User || model("User", new Schema({
  userId: { type: String, required: true, unique: true, trim: true },
  password: { type: String, required: true, select: false },
  name: { type: String, required: true, trim: true },
  role: { type: String, enum: ["superadmin", "admin", "headmaster", "accountant", "teacher", "staff"], default: "teacher" },
  phone: String, subject: String, designation: String, department: String, joiningDate: DATE,
  salary: { type: Number, min: 0 }, photo: String,
  active: { type: Boolean, default: true },
}, { timestamps: true }));

const Student = models.Student || model("Student", new Schema({
  studentId: { type: String, required: true, unique: true, trim: true },
  password: { type: String, required: true, select: false },
  name: { type: String, required: true, trim: true },
  class: { type: String, required: true },
  section: String,
  roll: { type: Number, required: true, min: 1 },
  session: String,
  gender: { type: String, enum: ["male", "female", "other", null, ""] },
  fatherName: String, motherName: String, guardianName: String, guardianPhone: String,
  phone: String, address: String, birthRegNo: String, dob: DATE, admissionDate: DATE, photo: String,
  monthlyFee: { type: Number, default: 0, min: 0 },
  otherPhones: [String], previousSchool: String, previousClass: String,
  documents: [{ name: String, url: String, at: { type: Date, default: Date.now } }],
  optionalSubjects: [{ type: Schema.Types.ObjectId, ref: "Subject" }],
  excludedSubjects: [{ type: Schema.Types.ObjectId, ref: "Subject" }], // বাধ্যতামূলক বিষয় যা এই শিক্ষার্থীর জন্য বন্ধ (যেমন: অন্য ধর্মের বই)
  status: { type: String, enum: ["active", "transferred", "passed", "dropped"], default: "active" },
  leftDate: DATE, leftReason: String,
  active: { type: Boolean, default: true },
  archived: { type: Boolean, default: false }, // মুছে ফেলার বদলে আর্কাইভ — ইতিহাস অক্ষুণ্ণ থাকে
  archivedAt: Date,
}, { timestamps: true }));

const attSchema = new Schema({
  student: ref("Student"),
  class: { type: String, required: true },
  date: { ...DATE, required: true },
  status: { type: String, enum: ATT_STATUS, required: true },
  markedBy: Schema.Types.ObjectId,
  history: [{ status: String, by: Schema.Types.ObjectId, byName: String, at: { type: Date, default: Date.now } }], // সংশোধনের ইতিহাস
}, { timestamps: true });
attSchema.index({ student: 1, date: 1 }, { unique: true });
attSchema.index({ class: 1, date: 1 });
const Attendance = models.Attendance || model("Attendance", attSchema);

// ইনভয়েস = শিক্ষার্থীর ফি-এর দায়। পেমেন্ট আলাদা লেনদেন; ব্যালেন্স সবসময় হিসাব করে বের করা হয়
const invSchema = new Schema({
  invoiceNo: { type: String, required: true, unique: true },
  student: ref("Student"),
  category: { type: String, enum: Object.keys(FEE_CATEGORIES), required: true },
  title: { type: String, required: true, trim: true },
  period: { type: String, default: "" }, // মাসিক হলে "YYYY-MM"
  month: Number, year: Number,
  amount: { type: Number, required: true, min: 0 },
  discount: { type: Number, default: 0, min: 0 }, // ডিসকাউন্ট/স্কলারশিপ/মওকুফ
  discountReason: String,
  fine: { type: Number, default: 0, min: 0 },
  dueDate: DATE, note: String,
  status: { type: String, enum: ["open", "void"], default: "open" },
  voidReason: String,
  rev: { type: Number, default: 0 }, // একই ইনভয়েসে সমান্তরাল পেমেন্ট ঠেকানোর লক
  examNotice: { type: Schema.Types.ObjectId, ref: "ExamNotice" },
  legacyFeeId: { type: String, index: true, sparse: true },
}, { timestamps: true });
invSchema.index({ student: 1, category: 1, period: 1, title: 1 }, { unique: true });
invSchema.index({ year: 1, month: 1 });
const Invoice = models.Invoice || model("Invoice", invSchema);

const paySchema = new Schema({
  receiptNo: { type: String, required: true, unique: true },
  type: { type: String, enum: ["payment", "refund"], default: "payment" },
  invoice: ref("Invoice"), student: ref("Student"),
  amount: { type: Number, required: true, min: 0.01 },
  method: { type: String, enum: PAY_METHODS, required: true },
  date: { ...DATE, required: true },
  reference: String, note: String,
  channel: { type: String, enum: ["online", "office"] }, // online = শিক্ষার্থীর জমা দেওয়া ও অনুমোদিত; office = ক্যাশ/অফিসে নেওয়া (পুরনো রেকর্ডে ফাঁকা = office)
  methodLabel: String, trxId: String, senderNumber: String, receiverNumber: String, submission: Schema.Types.ObjectId,
  createdBy: Schema.Types.ObjectId, createdByName: String,
  voided: { type: Boolean, default: false }, voidedAt: Date, voidReason: String, voidedByName: String,
  legacyFeeId: { type: String, index: true, sparse: true },
}, { timestamps: true });
paySchema.index({ invoice: 1 });
paySchema.index({ student: 1, date: -1 });
paySchema.index({ date: -1 });
const Payment = models.Payment || model("Payment", paySchema);

// ক্যাশবুক/লেজার: প্রতিটি আয়-ব্যয়ের একটি এন্ট্রি। বেতনের পেমেন্ট থেকে স্বয়ংক্রিয়ভাবে তৈরি হয় (sourceKey দিয়ে ডুপ্লিকেট অসম্ভব)
const ledSchema = new Schema({
  type: { type: String, enum: ["income", "expense"], required: true },
  account: { type: String, enum: PAY_METHODS, default: "cash" },
  category: { type: String, required: true },
  title: { type: String, required: true, trim: true },
  amount: { type: Number, required: true, min: 0.01 },
  date: { ...DATE, required: true },
  reference: String, note: String,
  source: { type: String, enum: ["manual", "payment", "refund"], default: "manual" },
  sourceKey: { type: String, unique: true, sparse: true },
  dedupeKey: { type: String, unique: true, sparse: true },
  createdByName: String,
  voided: { type: Boolean, default: false }, voidReason: String, voidedAt: Date,
}, { timestamps: true });
ledSchema.index({ date: -1 });
ledSchema.index({ type: 1, date: 1 });
const LedgerEntry = models.LedgerEntry || model("LedgerEntry", ledSchema);

const Result = models.Result || model("Result", new Schema({
  student: ref("Student"),
  exam: { type: String, required: true, trim: true },
  year: { type: Number, required: true },
  subject: { type: String, required: true, trim: true },
  marks: { type: Number, required: true, min: 0 },
  full: { type: Number, default: 100, min: 1 },
  published: { type: Boolean, default: false }, // ফাঁকা (পুরনো রেকর্ড) = প্রকাশিত; নতুন নম্বর প্রকাশ না করা পর্যন্ত শিক্ষার্থী দেখে না
  history: [{ marks: Number, full: Number, by: String, at: { type: Date, default: Date.now } }],
}, { timestamps: true }));

const Notice = models.Notice || model("Notice", new Schema({
  title: { type: String, required: true, trim: true },
  body: String, fileUrl: String, date: DATE,
}, { timestamps: true }));

const Session = models.AcademicSession || model("AcademicSession", new Schema({
  name: { type: String, required: true, unique: true, trim: true }, startDate: { ...DATE, required: true }, endDate: { ...DATE, required: true }, current: { type: Boolean, default: false },
}, { timestamps: true }));
const Subject = models.Subject || model("Subject", new Schema({
  name: { type: String, required: true, trim: true }, code: { type: String, trim: true },
  type: { type: String, enum: ["compulsory", "optional"], default: "compulsory" },
  classes: [String], fullMarks: { type: Number, default: 100, min: 1 }, image: String,
}, { timestamps: true }));
const asg = new Schema({
  teacher: ref("User"), kind: { type: String, enum: ["class", "subject"], required: true },
  class: { type: String, required: true }, section: { type: String, default: "" },
  subject: { type: Schema.Types.ObjectId, ref: "Subject" },
}, { timestamps: true });
asg.index({ teacher: 1, kind: 1, class: 1, section: 1, subject: 1 }, { unique: true });
const Assignment = models.Assignment || model("Assignment", asg);
const historySchema = new Schema({
  student: ref("Student"),
  type: { type: String, enum: ["admission", "promotion", "class_change", "transferred", "passed", "dropped", "reactivated"], required: true },
  fromClass: String, fromSection: String, fromRoll: Number, toClass: String, toSection: String, toRoll: Number,
  session: String, date: DATE, note: String, byName: String,
}, { timestamps: true });
historySchema.index({ student: 1, createdAt: -1 });
const StudentHistory = models.StudentHistory || model("StudentHistory", historySchema);
const sa = new Schema({
  user: ref("User"), date: { ...DATE, required: true }, status: { type: String, enum: ATT_STATUS, required: true }, note: String,
  history: [{ status: String, byName: String, at: { type: Date, default: Date.now } }],
}, { timestamps: true });
sa.index({ user: 1, date: 1 }, { unique: true });
const StaffAttendance = models.StaffAttendance || model("StaffAttendance", sa);
const LeaveApplication = models.LeaveApplication || model("LeaveApplication", new Schema({
  kind: { type: String, enum: ["staff", "student"], required: true },
  user: { type: Schema.Types.ObjectId, ref: "User" }, student: { type: Schema.Types.ObjectId, ref: "Student" },
  from: { ...DATE, required: true }, to: { ...DATE, required: true }, reason: { type: String, required: true, trim: true },
  status: { type: String, enum: ["pending", "approved", "rejected", "cancelled"], default: "pending" },
  decidedByName: String, decidedAt: Date, decisionNote: String,
}, { timestamps: true }));
const Application = models.Application || model("Application", new Schema({
  name: { type: String, required: true, trim: true }, class: { type: String, required: true }, gender: String, dob: DATE,
  fatherName: { type: String, required: true, trim: true }, motherName: String, phone: { type: String, required: true }, address: String,
  previousSchool: String, previousClass: String,
  status: { type: String, enum: ["pending", "approved", "rejected"], default: "pending" },
  student: { type: Schema.Types.ObjectId, ref: "Student" }, decidedByName: String, decisionNote: String,
}, { timestamps: true }));

// শিক্ষার্থীর অনলাইন পেমেন্টের তথ্য — অ্যাডমিন/অনুমোদিত ব্যক্তি Approve করার আগে এটি "Paid" নয়
const subSchema = new Schema({
  student: ref("Student"), invoice: ref("Invoice"),
  amount: { type: Number, required: true, min: 0.01 },
  method: { type: String, enum: PAY_METHODS, required: true }, methodId: String, methodLabel: String,
  paidDate: { ...DATE, required: true },
  senderNumber: { type: String, required: true, trim: true }, receiverNumber: { type: String, required: true, trim: true },
  trxId: { type: String, required: true, trim: true }, trxKey: { type: String, required: true },
  status: { type: String, enum: ["pending", "approved", "rejected"], default: "pending" },
  decidedBy: Schema.Types.ObjectId, decidedByName: String, decidedAt: Date, decisionNote: String,
  payment: { type: Schema.Types.ObjectId, ref: "Payment" },
}, { timestamps: true });
subSchema.index({ trxKey: 1 }, { unique: true, partialFilterExpression: { status: { $in: ["pending", "approved"] } } }); // একই ট্রানজেকশন আইডি দুইবার গণ্য হবে না
subSchema.index({ status: 1, createdAt: -1 });
subSchema.index({ student: 1, createdAt: -1 });
const PaymentSubmission = models.PaymentSubmission || model("PaymentSubmission", subSchema);

const examSchema = new Schema({
  name: { type: String, required: true, trim: true },
  class: { type: String, required: true }, section: { type: String, default: "" }, // section ফাঁকা = সব শাখা
  session: String,
  schedule: [{ subject: { type: String, required: true }, subjectId: String, date: { ...DATE, required: true }, startTime: { type: String, match: /^\d{2}:\d{2}$/ }, endTime: { type: String, match: /^\d{2}:\d{2}$/ } }],
  fee: { type: Number, default: 0, min: 0 }, instructions: String,
  status: { type: String, enum: ["published", "draft"], default: "published" },
  createdByName: String, batch: String,
}, { timestamps: true });
examSchema.index({ class: 1, section: 1, createdAt: -1 });
const ExamNotice = models.ExamNotice || model("ExamNotice", examSchema);

const admSchema = new Schema({
  admitNo: { type: String, required: true, unique: true },
  exam: ref("ExamNotice"), student: ref("Student"), invoice: { type: Schema.Types.ObjectId, ref: "Invoice" },
  roll: Number, class: String, section: String,
}, { timestamps: true });
admSchema.index({ exam: 1, student: 1 }, { unique: true });
const AdmitCard = models.AdmitCard || model("AdmitCard", admSchema);

const rtSchema = new Schema({
  teacher: ref("User"), class: { type: String, required: true }, section: { type: String, default: "" },
  subject: { type: String, required: true, trim: true }, day: { type: Number, min: 0, max: 6, required: true }, // 0 = শনিবার … 6 = শুক্রবার
  startTime: { type: String, required: true, match: /^\d{2}:\d{2}$/ }, endTime: { type: String, required: true, match: /^\d{2}:\d{2}$/ },
}, { timestamps: true });
rtSchema.index({ teacher: 1, day: 1 }); rtSchema.index({ class: 1, section: 1, day: 1 });
const RoutineSlot = models.RoutineSlot || model("RoutineSlot", rtSchema);

const Counter = models.Counter || model("Counter", new Schema({ _id: String, seq: { type: Number, default: 0 } }));
const auditSchema = new Schema({
  user: Schema.Types.ObjectId, userName: String, role: String,
  action: String, entity: String, entityId: String, details: Schema.Types.Mixed,
}, { timestamps: { createdAt: true, updatedAt: false } });
auditSchema.index({ createdAt: -1 });
const AuditLog = models.AuditLog || model("AuditLog", auditSchema);

const Settings = models.Settings || model("Settings", new Schema({
  key: { type: String, default: "main", unique: true },
  schoolName: String, schoolNameEn: String, taglineEn: String, logo: String, address: String, phone: String, email: String, about: String, tagline: String,
  currentSession: String, restrictTeachers: { type: Boolean, default: true }, permsKnown: [String],
  classes: [{ name: String, sections: [String] }],
  videos: [{ title: String, url: String }], contacts: [{ name: String, role: String, phone: String }],
  openingBalances: { cash: { type: Number, default: 0 }, bkash: { type: Number, default: 0 }, nagad: { type: Number, default: 0 }, rocket: { type: Number, default: 0 }, bank: { type: Number, default: 0 }, other: { type: Number, default: 0 } },
  paymentMethods: [{ id: String, kind: { type: String, enum: ["bkash", "nagad", "rocket", "bank", "other"] }, label: String, accountNumber: String, accountType: String, accountName: String, instructions: String, active: { type: Boolean, default: true } }],
  rolePermissions: Schema.Types.Mixed,
}, { timestamps: true }));

const LoginAttempt = models.LoginAttempt || model("LoginAttempt", new Schema({
  key: { type: String, unique: true }, count: { type: Number, default: 0 }, lockedUntil: Date, expireAt: { type: Date, index: { expires: 0 } },
}));

export { PaymentSubmission, ExamNotice, AdmitCard, RoutineSlot, Session, Subject, Assignment, StudentHistory, StaffAttendance, LeaveApplication, Application, User, Student, Attendance, Invoice, Payment, LedgerEntry, Result, Notice, Counter, AuditLog, Settings, LoginAttempt };
