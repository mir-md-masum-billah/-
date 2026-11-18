// অডিট লগকে সহজ ভাষায় (বাংলা/English) দেখানোর নিয়ম। সার্ভারে সংরক্ষিত action/entity/details থেকে বাক্য বানায়।
export const CATEGORIES = {
  students: { bn: "শিক্ষার্থী", en: "Students", entities: ["students"] },
  staff: { bn: "শিক্ষক ও স্টাফ", en: "Teachers & staff", entities: ["staff", "staff-attendance"] },
  fees: { bn: "বেতন, ফি ও পেমেন্ট", en: "Fees & payments", entities: ["invoice", "payment", "pay_request"] },
  accounts: { bn: "হিসাব নিকাশ", en: "Accounts", entities: ["ledger"] },
  exams: { bn: "পরীক্ষা ও ফলাফল", en: "Exams & results", entities: ["exam_notice", "results"] },
  academics: { bn: "বিষয়, রুটিন ও নিয়োগ", en: "Subjects & routine", entities: ["subjects", "sessions", "assignments", "routine"] },
  attendance: { bn: "হাজিরা ও ছুটি", en: "Attendance & leave", entities: ["attendance", "leave"] },
  notices: { bn: "নোটিশ", en: "Notices", entities: ["notices"] },
  admission: { bn: "ভর্তির আবেদন", en: "Admissions", entities: ["application", "applications"] },
  settings: { bn: "সেটিংস", en: "Settings", entities: ["settings"] },
};
const ENT = {
  students: ["শিক্ষার্থী", "student"], staff: ["স্টাফ/শিক্ষক", "staff member"], "staff-attendance": ["স্টাফ হাজিরা", "staff attendance"], invoice: ["ইনভয়েস", "invoice"], payment: ["পেমেন্ট", "payment"], pay_request: ["অনলাইন পেমেন্টের তথ্য", "online payment"], ledger: ["হিসাবের এন্ট্রি", "ledger entry"],
  exam_notice: ["পরীক্ষার নোটিশ", "exam notice"], results: ["ফলাফল", "result"], subjects: ["বিষয়", "subject"], sessions: ["শিক্ষাবর্ষ", "session"], assignments: ["শিক্ষক নিয়োগ", "assignment"], routine: ["ক্লাস রুটিন", "class routine"], attendance: ["হাজিরা", "attendance"], leave: ["ছুটির আবেদন", "leave request"], notices: ["নোটিশ", "notice"], application: ["ভর্তির আবেদন", "application"], applications: ["ভর্তির আবেদন", "application"], settings: ["সেটিংস", "settings"],
};
const ACT = {
  create: ["যোগ করেছেন", "added", "add"], update: ["পরিবর্তন করেছেন", "changed", "change"], delete: ["মুছে ফেলেছেন", "deleted", "delete"], archive: ["আর্কাইভ করেছেন", "archived", "delete"], restore: ["ফিরিয়ে এনেছেন", "restored", "add"], deactivate: ["নিষ্ক্রিয় করেছেন", "deactivated", "delete"], void: ["বাতিল করেছেন", "cancelled", "delete"],
  approve: ["অনুমোদন করেছেন", "approved", "add"], reject: ["প্রত্যাখ্যান করেছেন", "rejected", "delete"], submit: ["জমা দিয়েছেন", "submitted", "add"], payment: ["টাকা গ্রহণ করেছেন", "received a payment", "add"], refund: ["টাকা ফেরত দিয়েছেন", "refunded", "delete"],
  generate: ["ফি তৈরি করেছেন", "generated fees", "add"], promote: ["প্রমোশন দিয়েছেন", "promoted", "change"], renumber: ["রোল পুনর্বিন্যাস করেছেন", "renumbered rolls", "change"], import: ["আমদানি করেছেন", "imported", "add"], sync: ["নতুনদের ফি/কার্ড যোগ করেছেন", "synced new students", "add"],
  attendance: ["হাজিরা নিয়েছেন", "marked attendance", "change"], staff_attendance: ["স্টাফ হাজিরা নিয়েছেন", "marked staff attendance", "change"], apply: ["আবেদন করেছেন", "applied", "add"], cancel: ["আবেদন বাতিল করেছেন", "cancelled the request", "delete"], subjects: ["ঐচ্ছিক বিষয় বদলেছেন", "changed optional subjects", "change"], add_document: ["কাগজপত্র যোগ করেছেন", "added a document", "add"], remove_document: ["কাগজপত্র মুছেছেন", "removed a document", "delete"],
};
export const ACTION_FILTERS = [["create", "যোগ", "Added"], ["update", "পরিবর্তন", "Changed"], ["delete", "মোছা/আর্কাইভ", "Deleted"], ["void", "বাতিল", "Cancelled"], ["approve", "অনুমোদন", "Approved"], ["reject", "প্রত্যাখ্যান", "Rejected"], ["submit", "জমা", "Submitted"], ["payment", "টাকা গ্রহণ", "Received"]];
const FIELD = {
  name: ["নাম", "Name"], class: ["শ্রেণি", "Class"], section: ["শাখা", "Section"], roll: ["রোল", "Roll"], session: ["শিক্ষাবর্ষ", "Session"], phone: ["মোবাইল", "Mobile"], address: ["ঠিকানা", "Address"], fatherName: ["পিতার নাম", "Father"], motherName: ["মাতার নাম", "Mother"], guardianName: ["অভিভাবক", "Guardian"], guardianPhone: ["অভিভাবকের মোবাইল", "Guardian mobile"], dob: ["জন্মতারিখ", "Birth date"], gender: ["লিঙ্গ", "Gender"], photo: ["ছবি", "Photo"], monthlyFee: ["মাসিক বেতন", "Monthly fee"], active: ["সক্রিয়", "Active"], password: ["পাসওয়ার্ড", "Password"], studentId: ["আইডি", "ID"], role: ["রোল (পদ)", "Role"], salary: ["বেতন", "Salary"], title: ["শিরোনাম", "Title"], body: ["বিবরণ", "Body"], marks: ["নম্বর", "Marks"], full: ["পূর্ণমান", "Full marks"], fullMarks: ["পূর্ণমান", "Full marks"], image: ["ছবি", "Image"], code: ["কোড", "Code"], type: ["ধরন", "Type"], classes: ["শ্রেণিসমূহ", "Classes"], subject: ["বিষয়", "Subject"], date: ["তারিখ", "Date"], userId: ["লগইন আইডি", "Login ID"], designation: ["পদবি", "Designation"], subjectName: ["বিষয়", "Subject"],
};
const D = { amount: ["টাকা", "Amount"], receiptNo: ["রসিদ", "Receipt"], invoiceNo: ["ইনভয়েস", "Invoice"], invoice: ["ইনভয়েস", "Invoice"], trxId: ["ট্রানজেকশন আইডি", "Trx ID"], method: ["মাধ্যম", "Method"], channel: ["চ্যানেল", "Channel"], reason: ["কারণ", "Reason"], fee: ["ফি", "Fee"], class: ["শ্রেণি", "Class"], section: ["শাখা", "Section"], subject: ["বিষয়", "Subject"], time: ["সময়", "Time"], title: ["শিরোনাম", "Title"], invoices: ["নতুন ইনভয়েস", "New invoices"], cards: ["প্রবেশপত্র", "Admit cards"], created: ["তৈরি", "Created"], keys: ["পরিবর্তিত অংশ", "Changed parts"] };
const DAYS = ["শনিবার", "রবিবার", "সোমবার", "মঙ্গলবার", "বুধবার", "বৃহস্পতিবার", "শুক্রবার"];
const L = (pair, lang) => (lang === "en" ? pair[1] : pair[0]);
const fmt = (v, k, lang) => {
  if (v === null || v === undefined || v === "") return lang === "en" ? "(empty)" : "(ফাঁকা)";
  if (typeof v === "boolean") return v ? (lang === "en" ? "Yes" : "হ্যাঁ") : (lang === "en" ? "No" : "না");
  if (k === "day" && DAYS[v]) return DAYS[v];
  if (k === "photo" || k === "image" || k === "logo") return lang === "en" ? "(image)" : "(ছবি)";
  if (Array.isArray(v)) return v.join(", ") || (lang === "en" ? "(empty)" : "(ফাঁকা)");
  if (typeof v === "object") return JSON.stringify(v).slice(0, 80);
  return String(v);
};
export function categoryOf(entity) { return Object.entries(CATEGORIES).find(([, c]) => c.entities.includes(entity))?.[0] || "other"; }
export function describe(a, lang = "bn") {
  const d = a.details || {};
  const [eb, ee] = ENT[a.entity] || [a.entity, a.entity];
  const act = ACT[a.action] || [a.action, a.action, "change"];
  const label = d.name || d.title || d.receiptNo || d.invoiceNo || "";
  const ent = lang === "en" ? ee : eb;
  const subject = label ? (lang === "en" ? `${ent} “${label}”` : `${ent} “${label}”`) : ent;
  const sentence = lang === "en" ? `${a.userName || "System"} ${act[1]} ${subject}` : `${a.userName || "সিস্টেম"} ${subject} ${act[0]}`;
  const facts = [];
  for (const k of ["amount", "receiptNo", "invoiceNo", "invoice", "trxId", "method", "fee", "class", "section", "subject", "time", "reason", "invoices", "cards"]) if (d[k] !== undefined && d[k] !== null && d[k] !== "" && !(k === "invoiceNo" && d.invoice)) facts.push(`${L(D[k], lang)}: ${k === "amount" || k === "fee" ? "৳" + d[k] : k === "reason" ? d[k] : fmt(d[k], k, lang)}`);
  if (a.entity === "routine" && d.day !== undefined) facts.push(`${lang === "en" ? "Day" : "দিন"}: ${DAYS[d.day]}`);
  if (a.entity === "settings" && d.keys) facts.push(`${L(D.keys, lang)}: ${d.keys.map((k) => (FIELD[k] ? L(FIELD[k], lang) : k)).join(", ")}`);
  // পরিবর্তনের পুরোনো → নতুন মান
  let changes = [];
  const pairs = d.diff || (d.before && d.after && !Array.isArray(d.before) ? Object.fromEntries(Object.keys(d.after).filter((k) => JSON.stringify(d.before[k]) !== JSON.stringify(d.after[k])).map((k) => [k, [d.before[k], d.after[k]]])) : null);
  if (pairs) changes = Object.entries(pairs).map(([k, [o, n]]) => ({ field: FIELD[k] ? L(FIELD[k], lang) : (D[k] ? L(D[k], lang) : k), from: k === "password" ? "••••" : fmt(o, k, lang), to: k === "password" ? "••••" : fmt(n, k, lang) }));
  return { sentence, facts, changes, kind: act[2] || "change", category: categoryOf(a.entity) };
}
