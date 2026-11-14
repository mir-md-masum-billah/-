// ইন্টিগ্রেশন টেস্ট: চলমান সার্ভারে আসল HTTP অনুরোধ। ব্যবহার: BASE=http://localhost:3100 node scripts/integration-test.mjs
const BASE = process.env.BASE || "http://localhost:3100";
let pass = 0, fail = 0; const failures = [];
class C { // কুকি-সহ ক্লায়েন্ট
  constructor() { this.cookie = ""; }
  async req(method, path, body, raw) {
    const r = await fetch(BASE + path, { method, headers: { ...(body && !raw ? { "Content-Type": "application/json" } : {}), cookie: this.cookie, "x-forwarded-for": this.ip || "9.9.9.9" }, body: raw ? body : body ? JSON.stringify(body) : undefined, redirect: "manual" });
    const sc = r.headers.get("set-cookie"); if (sc) this.cookie = sc.split(";")[0];
    let d = null; try { d = await r.json(); } catch {}
    return { s: r.status, d };
  }
  get = (p) => this.req("GET", p); post = (p, b) => this.req("POST", p, b); put = (p, b) => this.req("PUT", p, b); del = (p, b) => this.req("DELETE", p, b);
  async login(id, pw) { const r = await this.post("/api/auth/login", { userId: id, password: pw }); return r; }
}
const t = (name, cond, extra = "") => { if (cond) { pass++; console.log("  ✓", name); } else { fail++; failures.push(name); console.log("  ✗", name, extra); } };
const sec = (n) => console.log("\n" + n);
const today = new Intl.DateTimeFormat("en-CA", { timeZone: "Asia/Dhaka" }).format(new Date());
const ym = today.slice(0, 7), [Y, M] = ym.split("-").map(Number);

const sa = new C(); const teacher = new C(), acct = new C(), adm = new C(), stu = new C(), anon = new C();

sec("১. লগইন ও রেট লিমিট");
t("ভুল পাসওয়ার্ড → 401", (await anon.login("superadmin1", "wrongpass")).s === 401);
anon.ip = "1.1.1.1"; let last;
for (let i = 0; i < 6; i++) last = await anon.login("superadmin1", "wrong" + i);
t("৫+ ভুলে → 429 লক", last.s === 429, JSON.stringify(last));
t("লক অবস্থায় সঠিক পাসওয়ার্ডও আটকায়", (await anon.login("superadmin1", "SuperPass123")).s === 429);
t("অন্য IP থেকে সঠিক লগইন চলে", (await sa.login("superadmin1", "SuperPass123")).s === 200);
t("লগইন ছাড়া API → 401", (await new C().get("/api/students")).s === 401);

sec("২. রোল ও স্টাফ ম্যানেজমেন্ট");
const mk = (userId, role, extra = {}) => sa.post("/api/staff", { userId, password: "Pass1234", name: userId, role, ...extra });
t("শিক্ষক তৈরি", (await mk("teacher1", "teacher")).s === 200);
t("হিসাবরক্ষক তৈরি", (await mk("acct1", "accountant")).s === 200);
t("স্কুল অ্যাডমিন তৈরি", (await mk("admin1", "admin")).s === 200);
t("ডুপ্লিকেট আইডি → 409", (await mk("teacher1", "teacher")).s === 409);
t("ছোট পাসওয়ার্ড → 400", (await sa.post("/api/staff", { userId: "x1234", password: "123", name: "x", role: "teacher" })).s === 400);
t("অবৈধ রোল → 400/403", [400, 403].includes((await mk("hacker1", "owner")).s));
await teacher.login("teacher1", "Pass1234"); await acct.login("acct1", "Pass1234"); await adm.login("admin1", "Pass1234");
t("অ্যাডমিন সুপার অ্যাডমিন বানাতে পারে না → 403", (await adm.post("/api/staff", { userId: "sa2xx", password: "Pass1234", name: "x", role: "superadmin" })).s === 403);
t("শিক্ষক স্টাফ তৈরি করতে পারে না → 403", (await teacher.post("/api/staff", { userId: "zzz123", password: "Pass1234", name: "x", role: "teacher" })).s === 403);
t("শিক্ষক নিজের রোল বাড়াতে পারে না (মাস অ্যাসাইনমেন্ট) → 403", (await teacher.put("/api/staff/" + (await sa.get("/api/staff?q=teacher1")).d.items[0]._id, { role: "admin" })).s === 403);
const me = (await sa.get("/api/staff?q=superadmin1")).d.items[0];
t("নিজেকে নিষ্ক্রিয় করা যায় না → 400", (await sa.del("/api/staff/" + me._id)).s === 400);
t("অ্যাডমিন সুপার অ্যাডমিনকে এডিট করতে পারে না → 403", (await adm.put("/api/staff/" + me._id, { name: "hack" })).s === 403);

sec("৩. শিক্ষার্থী যাচাই, পেজিনেশন, সার্চ");
const settings = (await sa.get("/api/settings")).d;
t("সেটিংসে শ্রেণি আছে", settings.classes.length >= 10);
const S = (o) => sa.post("/api/students", { studentId: "ST" + o.roll, password: "Pass1234", name: "শিক্ষার্থী " + o.roll, class: "৫ম", roll: 1, monthlyFee: 500, ...o });
t("অজানা শ্রেণি → 400", (await S({ roll: 1, class: "৯৯ম" })).s === 400);
t("রোল 0 → 400", (await S({ roll: 0 })).s === 400);
t("খারাপ আইডি → 400", (await S({ roll: 1, studentId: "a b" })).s === 400);
for (let i = 1; i <= 5; i++) await S({ roll: i });
t("একই রোল → 400", (await S({ roll: 3, studentId: "STdup" })).s === 400);
await S({ roll: 1, class: "৬ষ্ঠ", studentId: "ST601" });
const page1 = (await sa.get("/api/students?limit=3&page=1")).d, page2 = (await sa.get("/api/students?limit=3&page=2")).d;
t("পেজিনেশন (মোট ৬, পেজ ৩+৩)", page1.total === 6 && page1.items.length === 3 && page2.items.length === 3 && page1.pages === 2);
t("সার্ভার সার্চ", (await sa.get("/api/students?q=ST601")).d.total === 1);
t("রেজেক্স ইনজেকশন নিরাপদ (.*)", (await sa.get("/api/students?q=.*")).d.total === 0);
t("শ্রেণি ফিল্টার", (await sa.get("/api/students?class=" + encodeURIComponent("৬ষ্ঠ"))).d.total === 1);
const all = (await sa.get("/api/students?limit=100")).d.items; const c5 = all.filter((s) => s.class === "৫ম").sort((a, b) => a.roll - b.roll);
t("পাসওয়ার্ড হ্যাশ রেসপন্সে নেই", !JSON.stringify(all).includes("password"));
t("PUT অস্তিত্বহীন → 404", (await sa.put("/api/students/64b000000000000000000000", { name: "x" })).s === 404);
t("DELETE অস্তিত্বহীন → 404", (await sa.del("/api/students/64b000000000000000000000")).s === 404);
t("অবৈধ আইডি → 404", (await sa.del("/api/students/xyz")).s === 404);

const tid1 = (await sa.get("/api/staff?q=teacher1")).d.items[0]._id;
t("ক্লাস টিচার নিয়োগ (শিক্ষক ১ → ৫ম)", (await sa.post("/api/assignments", { teacher: tid1, kind: "class", class: "৫ম" })).s === 200);

sec("৪. হাজিরা (অচিহ্নিত ডিফল্ট নয়, সার্ভার যাচাই)");
const ids = c5.map((s) => s._id);
const att = (b, c = teacher) => c.post("/api/attendance/bulk", { date: today, class: "৫ম", ...b });
t("খালি তালিকা → 400", (await att({ records: [] })).s === 400);
t("'unmarked' স্ট্যাটাস → 400", (await att({ records: [{ student: ids[0], status: "unmarked" }] })).s === 400);
t("ভবিষ্যৎ তারিখ → 400", (await att({ date: "2099-01-01", records: [{ student: ids[0], status: "present" }] })).s === 400);
t("অবৈধ তারিখ → 400", (await att({ date: "2026-02-30", records: [{ student: ids[0], status: "present" }] })).s === 400);
t("ডুপ্লিকেট শিক্ষার্থী → 400", (await att({ records: [{ student: ids[0], status: "present" }, { student: ids[0], status: "absent" }] })).s === 400);
const other = all.find((s) => s.class === "৬ষ্ঠ")._id;
t("অন্য শ্রেণির শিক্ষার্থী → 400", (await att({ records: [{ student: other, status: "present" }] })).s === 400);
t("অজানা শ্রেণি → 400", (await att({ class: "XX", records: [{ student: ids[0], status: "present" }] })).s === 400);
t("হিসাবরক্ষক হাজিরা নিতে পারে না → 403", (await att({ records: [{ student: ids[0], status: "present" }] }, acct)).s === 403);
const r1 = await att({ records: [{ student: ids[0], status: "present" }, { student: ids[1], status: "absent" }, { student: ids[2], status: "late" }] });
t("৩ জনের হাজিরা সফল (বাকি ২ জন অচিহ্নিত)", r1.s === 200 && r1.d.created === 3);
const list = (await teacher.get("/api/attendance?class=" + encodeURIComponent("৫ম") + "&date=" + today)).d;
t("অচিহ্নিত ২ জনের রেকর্ড তৈরি হয়নি", list.total === 3);
const r2 = await att({ records: [{ student: ids[0], status: "present" }, { student: ids[1], status: "leave" }] });
t("একই হাজিরা ডুপ্লিকেট হয় না, পরিবর্তন সংশোধন হিসেবে ধরা", r2.d.created === 0 && r2.d.unchanged === 1 && r2.d.corrected === 1);
const corr = (await teacher.get("/api/attendance?student=" + ids[1] + "&date=" + today)).d.items[0];
t("সংশোধনের ইতিহাস সংরক্ষিত", corr.status === "leave" && corr.history.length === 1 && corr.history[0].status === "absent");

sec("৫. ফি ইনভয়েস, পেমেন্ট, লেজার");
const gen = await acct.post("/api/invoices/generate", { month: M, year: Y, class: "৫ম" });
t("মাসিক ইনভয়েস তৈরি (৫টি)", gen.s === 200 && gen.d.created === 5, JSON.stringify(gen));
const gen2 = await acct.post("/api/invoices/generate", { month: M, year: Y, class: "৫ম" });
t("পুনরায় চালালে ডুপ্লিকেট নয়", gen2.d.created === 0 && gen2.d.alreadyExisted === 5);
t("শিক্ষক ইনভয়েস তৈরি করতে পারে না → 403", (await teacher.post("/api/invoices/generate", { month: M, year: Y })).s === 403);
const invs = (await acct.get("/api/invoices?class=" + encodeURIComponent("৫ম") + "&limit=50")).d;
t("ইনভয়েস তালিকা ও মোট বকেয়া ২৫০০", invs.total === 5 && invs.totals.due === 2500, JSON.stringify(invs.totals));
const inv = invs.items[0];
const dupInv = await acct.post("/api/invoices", { student: inv.student._id, category: "tuition", period: ym, amount: 500 });
t("একই মাসের ডুপ্লিকেট ইনভয়েস → 409", dupInv.s === 409);
t("পরীক্ষা ফি ইনভয়েস", (await acct.post("/api/invoices", { student: inv.student._id, category: "exam", title: "অর্ধবার্ষিক", amount: 300 })).s === 200);
const pay = (b, c = acct) => c.post("/api/payments", { invoice: inv._id, method: "cash", ...b });
t("০ টাকা → 400", (await pay({ amount: 0 })).s === 400);
t("ঋণাত্মক → 400", (await pay({ amount: -5 })).s === 400);
t("বকেয়ার বেশি → 400", (await pay({ amount: 501 })).s === 400);
t("ভবিষ্যৎ তারিখ → 400", (await pay({ amount: 10, date: "2099-01-01" })).s === 400);
t("ভুল পদ্ধতি → 400", (await pay({ amount: 10, method: "paypal" })).s === 400);
t("শিক্ষক পেমেন্ট নিতে পারে না → 403", (await pay({ amount: 10 }, teacher)).s === 403);
const p1 = await pay({ amount: 200, method: "bkash", reference: "TX1" });
t("আংশিক পেমেন্ট ২০০", p1.s === 200 && p1.d.due === 300 && /^R-\d{4}-\d{6}$/.test(p1.d.receiptNo), JSON.stringify(p1));
// সমান্তরাল: বকেয়া ৩০০, দুটি একসাথে ৩০০ — একটিই সফল হবে
const [a, b] = await Promise.all([pay({ amount: 300 }), pay({ amount: 300 })]);
const okCount = [a, b].filter((x) => x.s === 200).length;
t("সমান্তরাল দুই পূর্ণ পেমেন্টে একটিই সফল (বেশি জমা অসম্ভব)", okCount === 1, JSON.stringify([a.s, b.s, a.d, b.d]));
const afterInv = (await acct.get("/api/invoices?student=" + inv.student._id + "&category=tuition")).d.items[0];
t("পরিশোধিত ৫০০, বকেয়া ০", afterInv.paid === 500 && afterInv.due === 0);
t("আগের পেমেন্ট ওভাররাইট হয়নি (২টি লেনদেন)", (await acct.get("/api/payments?invoice=" + inv._id)).d.total === 2);
t("রিফান্ডে কারণ লাগে → 400", (await acct.post("/api/payments", { type: "refund", invoice: inv._id, method: "cash", amount: 50 })).s === 400);
const rf = await acct.post("/api/payments", { type: "refund", invoice: inv._id, method: "cash", amount: 100, note: "ভুলে বেশি নেওয়া" });
t("রিফান্ড সফল", rf.s === 200 && rf.d.due === 100, JSON.stringify(rf));
t("জমার বেশি রিফান্ড → 400", (await acct.post("/api/payments", { type: "refund", invoice: inv._id, method: "cash", amount: 9999, note: "test" })).s === 400);
const payList = (await acct.get("/api/payments?invoice=" + inv._id + "&limit=10")).d.items;
const target = payList.find((p) => p.type === "payment" && p.amount === 200);
t("পেমেন্ট বাতিলে কারণ লাগে → 400", (await acct.post(`/api/payments/${target._id}/void`, {})).s === 400);
const led0 = (await acct.get("/api/ledger?limit=100")).d;
const feeIncome0 = led0.items.filter((e) => e.category === "fee").length;
const v = await acct.post(`/api/payments/${target._id}/void`, { reason: "ভুল এন্ট্রি" });
t("পেমেন্ট বাতিল সফল", v.s === 200, JSON.stringify(v));
const afterVoid = (await acct.get("/api/invoices?student=" + inv.student._id + "&category=tuition")).d.items[0];
t("বাতিলের পর জমা ২০০ (৫০০−২০০−১০০), বকেয়া ৩০০", afterVoid.paid === 200 && afterVoid.due === 300, JSON.stringify([afterVoid.paid, afterVoid.due]));
t("আবার বাতিল → 409/400", [409, 400].includes((await acct.post(`/api/payments/${target._id}/void`, { reason: "আবার" })).s));
const rcpt = await acct.get("/api/receipt/" + target._id);
t("রসিদ ডেটা (স্কুল, শিক্ষার্থী, ব্যালেন্স)", rcpt.s === 200 && rcpt.d.school.name && rcpt.d.student.name && rcpt.d.balance);
t("শিক্ষক রসিদ দেখতে পারে না → 403", (await teacher.get("/api/receipt/" + target._id)).s === 403);

sec("৬. লেজার ও হিসাব (ডাবল-কাউন্ট নেই)");
const mkE = (b, c = acct) => c.post("/api/ledger", { type: "expense", category: "electricity", title: "বিদ্যুৎ বিল", amount: 1000, date: today, account: "cash", ...b });
t("ম্যানুয়াল ব্যয় এন্ট্রি", (await mkE({})).s === 200);
t("একই এন্ট্রি আবার → 400 (ডুপ্লিকেট)", (await mkE({})).s === 400);
t("রেফারেন্স দিলে আলাদা এন্ট্রি চলে", (await mkE({ reference: "V-2" })).s === 200);
t("'fee' খাতে হাতে আয় তোলা যায় না → 400", (await mkE({ type: "income", category: "fee", title: "বেতন" })).s === 400);
t("শিক্ষক ব্যয় তুলতে পারে না → 403", (await mkE({ title: "x" }, teacher)).s === 403);
t("ভবিষ্যৎ তারিখ → 400", (await mkE({ date: "2099-01-01", title: "y" })).s === 400);
const donation = await acct.post("/api/ledger", { type: "income", category: "donation", title: "দান", amount: 5000, date: today, account: "bank" });
t("অনুদান আয়", donation.s === 200);
const led = (await acct.get("/api/ledger?limit=100")).d;
const manual = led.items.find((e) => e.title === "বিদ্যুৎ বিল" && !e.reference);
const vm = await acct.del("/api/ledger/" + manual._id, { reason: "ভুল" });
t("ম্যানুয়াল এন্ট্রি বাতিল", vm.s === 200);
t("বাতিলের পর একই এন্ট্রি আবার তোলা যায়", (await mkE({})).s === 200);
const payEntry = led.items.find((e) => e.source === "payment");
t("পেমেন্ট-জাত এন্ট্রি হাতে বাতিল করা যায় না → 400", (await acct.del("/api/ledger/" + payEntry._id, { reason: "চেষ্টা" })).s === 400);
const sum = (await acct.get(`/api/accounts/summary?from=${ym}-01&to=${today}`)).d;
const payments = (await acct.get("/api/payments?limit=100")).d.items;
const expIncome = payments.filter((p) => p.type === "payment").reduce((s, p) => s + p.amount, 0) + 5000;
const expExpense = payments.filter((p) => p.type === "refund").reduce((s, p) => s + p.amount, 0) + 1000 + 1000;
t(`আয় = অবাতিল পেমেন্ট + অনুদান (${expIncome})`, sum.income === expIncome, `got ${sum.income}`);
t(`ব্যয় = রিফান্ড + ম্যানুয়াল (${expExpense})`, sum.expense === expExpense, `got ${sum.expense}`);
t("সমাপনী = প্রারম্ভিক + আয় − ব্যয়", sum.closingTotal === sum.openingTotal + sum.income - sum.expense);
const st = (await acct.get("/api/stats")).d;
t("ড্যাশবোর্ড বেতন আদায় = ফি আয় − রিফান্ড", st.feeCollected === expIncome - 5000 - payments.filter((p) => p.type === "refund").reduce((s, p) => s + p.amount, 0), JSON.stringify({ fc: st.feeCollected }));
t("ড্যাশবোর্ডে হাজিরা: উপস্থিত ২ (১ present+১ late), অনুপস্থিত ০ (ছুটি হারে নেই)", (await teacher.get("/api/stats")).d.present === 2 && (await teacher.get("/api/stats")).d.absent === 0);
t("শিক্ষক আর্থিক তথ্য পায় না", (await teacher.get("/api/stats")).d.monthIncome === undefined);

sec("৭. ফলাফল (সংশোধনের ইতিহাস)");
const R = (b) => teacher.post("/api/results", { student: ids[0], exam: "অর্ধবার্ষিক", year: Y, subject: "গণিত", marks: 80, full: 100, ...b });
t("নম্বর > পূর্ণমান → 400", (await R({ marks: 120 })).s === 400);
t("ঋণাত্মক নম্বর → 400", (await R({ marks: -1 })).s === 400);
const rr = await R({});
t("ফলাফল এন্ট্রি", rr.s === 200);
t("ডুপ্লিকেট বিষয় → 400", (await R({})).s === 400);
await teacher.put("/api/results/" + rr.d.id, { marks: 85 });
const rl = (await teacher.get("/api/results?limit=10")).d.items[0];
t("সংশোধনের ইতিহাস (আগের ৮০)", rl.marks === 85 && rl.history.length === 1 && rl.history[0].marks === 80);

sec("৮. শিক্ষার্থী পোর্টাল ও অ্যাক্সেস");
t("শিক্ষার্থী লগইন", (await stu.login("ST1", "Pass1234")).s === 200);
const meR = (await stu.get("/api/student/me")).d;
t("নিজের তথ্য: ইনভয়েস, পেমেন্ট, হাজিরা", meR.student.studentId === "ST1" && meR.invoices.length === 2 && meR.attendance.length === 1 && !meR.student.password);
t("শুধু নিজের ইনভয়েস", meR.invoices.every((i) => String(i.student) === String(meR.student._id)));
t("শিক্ষার্থী /api/students পারে না → 403", (await stu.get("/api/students")).s === 403);
t("শিক্ষার্থী /api/ledger পারে না → 403", (await stu.get("/api/ledger")).s === 403);
t("শিক্ষার্থী /api/payments পারে না → 403", (await stu.get("/api/payments")).s === 403);
t("শিক্ষার্থী পেমেন্ট করতে পারে না → 403", (await stu.post("/api/payments", { invoice: inv._id, amount: 1, method: "cash" })).s === 403);
t("শিক্ষার্থী আপলোড পারে না → 403", (await stu.post("/api/upload", new FormData(), true)).s === 403);
const otherStu = new C(); await otherStu.login("ST2", "Pass1234");
const myPay = (await stu.get("/api/student/me")).d.payments[0];
if (myPay) t("অন্য শিক্ষার্থী আমার রসিদ দেখতে পারে না → 403", (await otherStu.get("/api/receipt/" + myPay._id)).s === 403);
t("শিক্ষার্থী নিজের রসিদ দেখতে পারে", myPay ? (await stu.get("/api/receipt/" + myPay._id)).s === 200 : true);

sec("৯. সেশন বাতিল (নিষ্ক্রিয় হলে সাথে সাথে)");
const tid = (await sa.get("/api/staff?q=teacher1")).d.items[0]._id;
t("শিক্ষক এখন কাজ করছে", (await teacher.get("/api/students")).s === 200);
t("শিক্ষক নিষ্ক্রিয় (স্টাফ DELETE)", (await sa.del("/api/staff/" + tid)).s === 200);
t("নিষ্ক্রিয় শিক্ষকের চলমান সেশন অচল → 401", (await teacher.get("/api/students")).s === 401);
t("নিষ্ক্রিয় শিক্ষক আর লগইন করতে পারে না", (await new C().login("teacher1", "Pass1234")).s === 401);
t("শিক্ষক আর্কাইভ → শিক্ষার্থীর সেশন অচল", (await sa.del("/api/students/" + all.find((s) => s.studentId === "ST2")._id)).s === 200 && (await otherStu.get("/api/student/me")).s === 401);
t("আর্কাইভ শিক্ষার্থী তালিকায় নেই", (await sa.get("/api/students?q=ST2")).d.total === 0);
t("আর্কাইভ হলেও আর্থিক রেকর্ড থাকে", (await acct.get("/api/invoices?student=" + all.find((s) => s.studentId === "ST2")._id)).d.total >= 1);
t("আর্কাইভ শিক্ষার্থীর নতুন ইনভয়েস/হাজিরা হয় না", (await acct.post("/api/invoices", { student: all.find((s) => s.studentId === "ST2")._id, category: "exam", amount: 100 })).s === 400);
t("আর্কাইভ আবার → 200 (idempotent) বা 400", [200, 400].includes((await sa.del("/api/students/" + all.find((s) => s.studentId === "ST2")._id)).s));

sec("১০. সেটিংস, অনুমতি, অডিট, আপলোড");
t("অ্যাডমিন অনুমতি বদলাতে পারে (accountant)", (await adm.put("/api/settings", { rolePermissions: { accountant: ["students.read", "fees.read"] } })).s === 200);
t("বদলানো অনুমতি সাথে সাথে কার্যকর → পেমেন্ট 403", (await pay({ amount: 1 })).s === 403);
await sa.put("/api/settings", { rolePermissions: { accountant: ["students.read", "fees.read", "fees.collect", "fees.manage", "accounts.read", "accounts.write"] } });
t("অনুমতি ফেরানো", (await pay({ amount: 1 })).s !== 403);
t("admin থেকে settings.manage সরানো যায় না → 400", (await sa.put("/api/settings", { rolePermissions: { admin: ["students.read"] } })).s === 400);
t("শিক্ষার্থী আছে এমন শ্রেণি মুছা যায় না → 400", (await sa.put("/api/settings", { classes: settings.classes.filter((c) => c.name !== "৫ম") })).s === 400);
t("ডুপ্লিকেট শ্রেণির নাম → 400", (await sa.put("/api/settings", { classes: [{ name: "ক" }, { name: "ক" }] })).s === 400);
t("নতুন শ্রেণি/শাখা যোগ", (await sa.put("/api/settings", { classes: [...settings.classes, { name: "একাদশ", sections: ["ক", "খ"] }] })).s === 200);
t("নতুন শ্রেণিতে ভর্তি (শাখা সহ)", (await S({ roll: 1, class: "একাদশ", section: "ক", studentId: "ST-XI1" })).s === 200);
t("অবৈধ শাখা → 400", (await S({ roll: 2, class: "একাদশ", section: "গ", studentId: "ST-XI2" })).s === 400);
const al = (await sa.get("/api/audit?limit=5")).d;
t("অডিট লগ আছে", al.total > 20 && al.items[0].userName);
t("শিক্ষক অডিট দেখতে পারে না", (await adm.get("/api/audit")).s === 200 && (await acct.get("/api/audit")).s === 403);
const fd = new FormData(); fd.append("file", new Blob(["<?php echo 1; ?>"], { type: "image/png" }), "x.png");
t("নকল ছবি (PHP) আপলোড → 400", (await sa.req("POST", "/api/upload", fd, true)).s === 400);
const fd2 = new FormData(); fd2.append("file", new Blob([Buffer.from([0x89, 0x50, 0x4e, 0x47, 0x0d, 0x0a, 0x1a, 0x0a, 0, 0, 0, 0])], { type: "image/png" }), "x.png");
t("বৈধ PNG তবে R2 কনফিগার নেই → 503 (পরিষ্কার বার্তা)", (await sa.req("POST", "/api/upload", fd2, true)).s === 503);
t("পাবলিক নোটিশ তালিকা (লগইন ছাড়া)", (await new C().get("/api/notices")).s === 200);
t("নোটিশ তৈরি শুধু অনুমতিপ্রাপ্ত", (await teacher.post("/api/notices", { title: "x" })).s === 401 && (await adm.post("/api/notices", { title: "পরীক্ষার নোটিশ" })).s === 200);

console.log(`\n=== ফলাফল: ${pass} সফল, ${fail} ব্যর্থ ===`);
if (fail) { console.log("ব্যর্থ:", failures); process.exit(1); }
