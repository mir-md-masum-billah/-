// নতুন ফিচারের ইন্টিগ্রেশন টেস্ট (পেমেন্ট অনুমোদন, ক্যাশ, পরীক্ষা নোটিশ, অ্যাডমিট কার্ড, রুটিন, অডিট, নিরাপত্তা)
// খালি ডেটাবেজে: npm run migrate && ADMIN_ID=superadmin1 ADMIN_PASSWORD=SuperPass123 npm run seed → BASE=http://localhost:3100 node scripts/test-school-features.mjs
const BASE = process.env.BASE || "http://localhost:3100";
let pass = 0, fail = 0; const failures = [];
class C {
  constructor() { this.cookie = ""; this.ip = "7.7.7." + Math.floor(Math.random() * 200); }
  async req(method, path, body) {
    const r = await fetch(BASE + path, { method, headers: { ...(body ? { "Content-Type": "application/json" } : {}), cookie: this.cookie, "x-forwarded-for": this.ip }, body: body ? JSON.stringify(body) : undefined });
    const sc = r.headers.get("set-cookie"); if (sc) this.cookie = sc.split(";")[0];
    let d = null; try { d = await r.json(); } catch {}
    return { s: r.status, d };
  }
  get = (p) => this.req("GET", p); post = (p, b) => this.req("POST", p, b || {}); put = (p, b) => this.req("PUT", p, b); del = (p, b) => this.req("DELETE", p, b);
  login(id, pw) { return this.post("/api/auth/login", { userId: id, password: pw }); }
}
const t = (name, cond, extra = "") => { if (cond) { pass++; console.log("  ✓", name); } else { fail++; failures.push(name); console.log("  ✗", name, extra); } };
const sec = (n) => console.log("\n" + n);
const today = new Intl.DateTimeFormat("en-CA", { timeZone: "Asia/Dhaka" }).format(new Date());
const sa = new C(), acct = new C(), tch = new C(), s1 = new C(), s2 = new C(), s3 = new C(), anon = new C();
const J = (r) => JSON.stringify(r.d);
let t2Id;

sec("০. প্রস্তুতি");
t("সুপার অ্যাডমিন লগইন", (await sa.login("superadmin1", "SuperPass123")).s === 200);
const mk = (userId, role) => sa.post("/api/staff", { userId, password: "Pass1234", name: userId, role });
await mk("tch1", "teacher"); await mk("acct9", "accountant");
t("শিক্ষক/হিসাবরক্ষক লগইন", (await tch.login("tch1", "Pass1234")).s === 200 && (await acct.login("acct9", "Pass1234")).s === 200);
const staff = (await sa.get("/api/staff?limit=100")).d.items; const tchId = staff.find((x) => x.userId === "tch1")._id;
t("শ্রেণি ও শাখা সেট", (await sa.put("/api/settings", { classes: [{ name: "১ম", sections: ["ক", "খ"] }, { name: "২য়", sections: [] }] })).s === 200);
const mkStu = async (name, cls, section) => { const r = await sa.post("/api/students", { name, class: cls, section, password: "Stud1234", monthlyFee: 0 }); return r.d; };
const A = await mkStu("আনিকা", "১ম", "ক"), B = await mkStu("বাবু", "১ম", "ক"), Cc = await mkStu("চঞ্চল", "১ম", "খ");
t("তিন শিক্ষার্থী তৈরি", A.ok && B.ok && Cc.ok, J({ d: A }));
await s1.login(A.studentId, "Stud1234"); await s2.login(B.studentId, "Stud1234"); await s3.login(Cc.studentId, "Stud1234");
t("শিক্ষার্থী লগইন", (await s1.get("/api/student/me")).s === 200);

sec("১. স্কুলের তথ্য ও পেমেন্ট মাধ্যম");
t("ইংরেজি নাম ও স্লোগান সংরক্ষণ", (await sa.put("/api/settings", { schoolName: "হাজী চান মিয়া স্কুল", schoolNameEn: "Haji Chan Mia School X", tagline: "বাংলা স্লোগান", taglineEn: "English slogan" })).s === 200);
const st = (await sa.get("/api/settings")).d;
t("দুই ভাষার নাম/স্লোগান ফেরত", st.schoolNameEn === "Haji Chan Mia School X" && st.taglineEn === "English slogan" && st.tagline === "বাংলা স্লোগান");
t("অ্যাকাউন্ট নম্বর ছাড়া মাধ্যম → 400", (await sa.put("/api/settings", { paymentMethods: [{ kind: "bkash", label: "বিকাশ" }] })).s === 400);
t("অবৈধ ধরন → 400", (await sa.put("/api/settings", { paymentMethods: [{ kind: "paypal", label: "x", accountNumber: "1" }] })).s === 400);
t("শিক্ষক পেমেন্ট সেটিংস বদলাতে পারে না", (await tch.put("/api/settings", { paymentMethods: [] })).s === 403);
t("একাধিক মাধ্যম সংরক্ষণ", (await sa.put("/api/settings", { paymentMethods: [
  { kind: "bkash", label: "বিকাশ (পার্সোনাল)", accountNumber: "01711111111", accountType: "Personal", instructions: "Send Money করুন" },
  { kind: "nagad", label: "নগদ", accountNumber: "01822222222", accountType: "Personal" },
  { kind: "rocket", label: "রকেট", accountNumber: "01933333333", accountType: "Personal" },
  { kind: "bank", label: "ডাচ-বাংলা ব্যাংক", accountNumber: "1234567890", accountType: "Current", accountName: "Haji School" },
  { kind: "other", label: "বন্ধ মাধ্যম", accountNumber: "999", active: false }] })).s === 200);
const pm = (await s1.get("/api/payment-methods")).d.items;
t("শিক্ষার্থী শুধু সক্রিয় মাধ্যম দেখে (৪টি)", pm.length === 4 && !pm.some((m) => m.label === "বন্ধ মাধ্যম"), J({ d: pm.map((m) => m.label) }));
t("লগইন ছাড়া মাধ্যম → 401", (await anon.get("/api/payment-methods")).s === 401);
const bkash = pm.find((m) => m.kind === "bkash"), bank = pm.find((m) => m.kind === "bank");
t("মাধ্যমের আইডি স্থিতিশীল", /^[a-f0-9]{12}$/.test(bkash.id));

sec("২. অনলাইন পেমেন্ট — জমা ও অনুমোদন");
const mkInv = (stu, amount, extra = {}) => sa.post("/api/invoices", { student: stu._id || stu, category: "other", title: "ফি " + Math.random().toString(36).slice(2, 6), amount, ...extra });
const stuDoc = async (sid) => (await sa.get("/api/students?limit=100&q=" + sid)).d.items.find((x) => x.studentId === sid);
const dA = await stuDoc(A.studentId), dB = await stuDoc(B.studentId), dC = await stuDoc(Cc.studentId);
const invA = await mkInv(dA, 1000); t("ইনভয়েস তৈরি", invA.s === 200, J(invA));
const invB = await mkInv(dB, 500);
const body = (o = {}) => ({ invoice: invA.d.id, methodId: bkash.id, amount: 400, paidDate: today, senderNumber: "01700000001", receiverNumber: "01711111111", trxId: "TRX1A2B3C", ...o });
let r = await s1.post("/api/pay-requests", body());
t("শিক্ষার্থী পেমেন্ট তথ্য জমা → pending", r.s === 200, J(r)); const sub1 = r.d.id;
let me = (await s1.get("/api/student/me")).d;
t("জমা দিলেও Paid নয় (বকেয়া অপরিবর্তিত)", me.invoices.find((i) => i._id === invA.d.id).due === 1000 && me.payments.length === 0);
t("একই ট্রানজেকশন আইডি → 400", (await s1.post("/api/pay-requests", body())).s === 400);
t("আইডি ছোট হাতের হলেও ডুপ্লিকেট ধরা পড়ে", (await s1.post("/api/pay-requests", body({ trxId: "trx1a2b3c" }))).s === 400);
t("অন্য শিক্ষার্থীর ট্রানজেকশন আইডি ব্যবহার → 400", (await s2.post("/api/pay-requests", { ...body({ invoice: invB.d.id }), amount: 100 })).s === 400);
t("বকেয়ার বেশি জমা → 400", (await s1.post("/api/pay-requests", body({ trxId: "TRXOVER1", amount: 700 }))).s === 400);
t("অন্যের ইনভয়েসে জমা → 404", (await s2.post("/api/pay-requests", body({ trxId: "TRXOTHER1" }))).s === 404);
t("ভবিষ্যতের তারিখ → 400", (await s1.post("/api/pay-requests", body({ trxId: "TRXFUT01", paidDate: "2099-01-01" }))).s === 400);
t("অ্যাক্টিভ নয় এমন মাধ্যম → 400", (await s1.post("/api/pay-requests", body({ trxId: "TRXINACT", methodId: "ffffffffffff" }))).s === 400);
t("ফোন ছাড়া → 400", (await s1.post("/api/pay-requests", body({ trxId: "TRXNOPH1", senderNumber: "" }))).s === 400);
t("স্টাফ শিক্ষার্থীর নামে জমা দিতে পারে না → 403", (await acct.post("/api/pay-requests", body({ trxId: "TRXSTAFF" }))).s === 403);
t("অপেক্ষমাণ সহ মোট বকেয়ার বেশি → 400 (৪০০+৬০১)", (await s1.post("/api/pay-requests", body({ trxId: "TRXPEND2", amount: 601 }))).s === 400);
t("শিক্ষার্থী অন্যের তালিকা দেখে না", (await s2.get("/api/pay-requests")).d.items.length === 0 && (await s1.get("/api/pay-requests")).d.items.length === 1);
t("শিক্ষক (অনুমতি নেই) তালিকা → 403", (await tch.get("/api/pay-requests")).s === 403);
t("শিক্ষার্থী Approve করতে পারে না → 403", (await s1.post(`/api/pay-requests/${sub1}/decide`, { action: "approve" })).s === 403);
t("হিসাবরক্ষক তালিকা দেখে (pending ১)", (await acct.get("/api/pay-requests?status=pending")).d.pending === 1);
r = await acct.post(`/api/pay-requests/${sub1}/decide`, { action: "approve" });
t("Approve → পেমেন্ট তৈরি", r.s === 200 && r.d.receiptNo, J(r));
me = (await s1.get("/api/student/me")).d;
t("Approve-এর পর বকেয়া ৬০০, Paid আপডেট", me.invoices.find((i) => i._id === invA.d.id).due === 600 && me.payments.length === 1);
const pay1 = me.payments[0];
t("পেমেন্টে চ্যানেল online + ট্রানজেকশন আইডি", pay1.channel === "online" && pay1.trxId === "TRX1A2B3C" && pay1.methodLabel === "বিকাশ (পার্সোনাল)", J({ d: pay1 }));
t("একই অনুরোধ আবার Approve → 409 (দ্বিগুণ হিসাব নয়)", (await acct.post(`/api/pay-requests/${sub1}/decide`, { action: "approve" })).s === 409);
t("Approve-এর পরেও একই TRX আবার জমা → 400", (await s1.post("/api/pay-requests", body({ amount: 100 }))).s === 400);
const led = (await sa.get(`/api/ledger?q=${r.d.receiptNo}`)).d;
t("ক্যাশবুকে ঠিক একটি আয়-এন্ট্রি (বিকাশ অ্যাকাউন্ট)", led.items.length === 1 && led.items[0].account === "bkash" && led.items[0].amount === 400);
r = await s1.post("/api/pay-requests", body({ trxId: "TRXREJ001", amount: 100 })); const sub2 = r.d.id;
t("Reject কারণ ছাড়া → 400", (await acct.post(`/api/pay-requests/${sub2}/decide`, { action: "reject" })).s === 400);
t("Reject কারণসহ", (await acct.post(`/api/pay-requests/${sub2}/decide`, { action: "reject", note: "ট্রানজেকশন মেলেনি" })).s === 200);
me = (await s1.get("/api/student/me")).d;
t("Reject হলে বকেয়া বদলায়নি ও পেমেন্ট বাড়েনি", me.invoices.find((i) => i._id === invA.d.id).due === 600 && me.payments.length === 1);
t("Reject-এর পর আবার Approve → 409", (await acct.post(`/api/pay-requests/${sub2}/decide`, { action: "approve" })).s === 409);
t("Reject হওয়া TRX আবার জমা দেওয়া যায়", (await s1.post("/api/pay-requests", body({ trxId: "TRXREJ001", amount: 100 }))).s === 200);
const rc = await s1.get(`/api/receipt/${pay1._id}`);
t("শিক্ষার্থী নিজের ইনভয়েস/রসিদ দেখে", rc.s === 200 && rc.d.payment.receiptNo);
t("অন্যের ইনভয়েস দেখতে পারে না → 403", (await s2.get(`/api/receipt/${pay1._id}`)).s === 403);
t("পেমেন্ট তালিকা channel=online ফিল্টার", (await sa.get("/api/payments?channel=online")).d.items.every((p) => p.channel === "online"));
const au = (await sa.get("/api/audit?entity=pay_request&limit=50")).d.items.map((a) => a.action);
t("অডিটে submit/approve/reject আছে", ["submit", "approve", "reject"].every((a) => au.includes(a)), J({ d: au }));

sec("৩. ক্যাশ পেমেন্ট");
t("শিক্ষক (fees.collect নেই) → 403", (await tch.post("/api/payments/cash", { student: dA._id, category: "admission", amount: 100 })).s === 403);
r = await acct.post("/api/payments/cash", { student: dA._id, category: "admission", amount: 250, date: today });
t("ক্যাশ পেমেন্ট → ইনভয়েস + রসিদ", r.s === 200 && r.d.receiptNo && r.d.due === 0, J(r));
const cashPay = (await sa.get("/api/payments?channel=office&limit=5")).d.items.find((p) => p.receiptNo === r.d.receiptNo);
t("চ্যানেল office, মাধ্যম cash", cashPay?.channel === "office" && cashPay.method === "cash");
t("ক্যাশ: অবৈধ ধরন → 400", (await acct.post("/api/payments/cash", { student: dA._id, category: "zzz", amount: 10 })).s === 400);
t("ক্যাশ: মাসিক বেতনে মাস ছাড়া → 400", (await acct.post("/api/payments/cash", { student: dA._id, category: "tuition", amount: 10 })).s === 400);
r = await acct.post("/api/payments/cash", { student: dA._id, invoice: invA.d.id, amount: 600 });
t("ক্যাশে বিদ্যমান ইনভয়েসের বকেয়া পুরো পরিশোধ", r.s === 200 && r.d.due === 0, J(r));
t("বকেয়ার বেশি ক্যাশ → 400", (await acct.post("/api/payments/cash", { student: dA._id, invoice: invA.d.id, amount: 1 })).s === 400);
t("অন্যের ইনভয়েসে ক্যাশ → 400", (await acct.post("/api/payments/cash", { student: dA._id, invoice: invB.d.id, amount: 1 })).s === 400);

sec("৪. বিষয় ও বইয়ের ছবি");
const png = "data:image/png;base64,iVBORw0KGgoAAAANSUhEUgAAAAEAAAABCAYAAAAfFcSJAAAADUlEQVR4nGP4z8DwHwAFAAH/q842iQAAAABJRU5ErkJggg==";
r = await sa.post("/api/subjects", { name: "বাংলা", classes: ["১ম"], image: png }); const subBn = r.d.id; t("ছবিসহ বিষয়", r.s === 200, J(r));
r = await sa.post("/api/subjects", { name: "গণিত", classes: ["১ম"] }); t("ছবি ছাড়া বিষয়", r.s === 200);
t("খারাপ ছবি → 400", (await sa.post("/api/subjects", { name: "ছবি", classes: ["১ম"], image: "javascript:alert(1)" })).s === 400);
t("বইয়ের ছবি ফেরত আসে", (await sa.get("/api/subjects?limit=50")).d.items.find((x) => x.name === "বাংলা").image === png);
t("শিক্ষক বিষয় যোগ করতে পারে না → 403", (await tch.post("/api/subjects", { name: "x" })).s === 403);

sec("৫. পরীক্ষার নোটিশ, ফি ও অ্যাডমিট কার্ড");
const sched = [{ subject: "বাংলা", date: "2099-03-01", startTime: "10:00", endTime: "12:00" }, { subject: "গণিত", date: "2099-03-02", startTime: "10:00", endTime: "12:00" }];
t("শিক্ষক (exams.manage নেই) → 403", (await tch.post("/api/exam-notices", { name: "x", targets: [{ class: "১ম" }], schedule: sched })).s === 403);
t("তালিকার বাইরের বিষয় → 400", (await sa.post("/api/exam-notices", { name: "অর্ধবার্ষিক", targets: [{ class: "১ম", section: "ক" }], schedule: [{ ...sched[0], subject: "ফিজিক্স" }] })).s === 400);
t("শেষ সময় শুরুর আগে → 400", (await sa.post("/api/exam-notices", { name: "অর্ধবার্ষিক", targets: [{ class: "১ম" }], schedule: [{ ...sched[0], endTime: "09:00" }] })).s === 400);
t("অবৈধ শাখা → 400", (await sa.post("/api/exam-notices", { name: "অর্ধবার্ষিক", targets: [{ class: "১ম", section: "গ" }], schedule: sched })).s === 400);
r = await sa.post("/api/exam-notices", { name: "অর্ধবার্ষিক পরীক্ষা", targets: [{ class: "১ম", section: "ক" }], schedule: sched, fee: 300, instructions: "সময়মতো আসবে" });
t("নোটিশ প্রকাশ (১ম-ক, ফি ৩০০)", r.s === 200 && r.d.created[0].invoices === 2, J(r)); const ex1 = r.d.created[0].id;
let ex = (await s1.get("/api/student/exams")).d.items;
t("১ম-ক শিক্ষার্থী নোটিশ ও পরীক্ষা-ফি ইনভয়েস দেখে", ex.length === 1 && ex[0].invoice?.due === 300 && !ex[0].admit);
t("১ম-খ শিক্ষার্থী নোটিশ দেখে না", (await s3.get("/api/student/exams")).d.items.length === 0);
t("ফি অনুমোদনের আগে অ্যাডমিট কার্ড নেই", ex[0].admit === null);
r = await s1.post("/api/pay-requests", { invoice: ex[0].invoice._id, methodId: bank.id, amount: 300, paidDate: today, senderNumber: "AC-5555", receiverNumber: "1234567890", trxId: "BANKTRX01" });
t("পরীক্ষার ফি জমা", r.s === 200); const exSub = r.d.id;
ex = (await s1.get("/api/student/exams")).d.items;
t("জমা দিলেও অ্যাডমিট কার্ড নেই", ex[0].admit === null && ex[0].pending === true);
r = await acct.post(`/api/pay-requests/${exSub}/decide`, { action: "approve" });
ex = (await s1.get("/api/student/exams")).d.items;
t("Approve → অ্যাডমিট কার্ড স্বয়ংক্রিয়", r.s === 200 && ex[0].admit?.eligible === true && /^ADM-/.test(ex[0].admit.admitNo), J({ d: ex[0].admit }));
const cardId = ex[0].admit.id;
r = await s1.get(`/api/admit-cards/${cardId}`);
t("নিজের অ্যাডমিট কার্ড তথ্য (নাম, রোল, বিষয়, স্কুল)", r.s === 200 && r.d.student.name === "আনিকা" && r.d.exam.schedule.length === 2 && r.d.school.nameEn === "Haji Chan Mia School X", J(r).slice(0, 200));
t("অন্য শিক্ষার্থী অ্যাডমিট কার্ড দেখতে পারে না → 403", (await s2.get(`/api/admit-cards/${cardId}`)).s === 403);
t("লগইন ছাড়া → 401", (await anon.get(`/api/admit-cards/${cardId}`)).s === 401);
t("শিক্ষক (অনুমতি নেই) → 403", (await tch.get(`/api/admit-cards/${cardId}`)).s === 403);
const list = (await sa.get(`/api/exam-notices/${ex1}/admit-cards`)).d;
t("অ্যাডমিন: ২ শিক্ষার্থী, ১টি কার্ড, যোগ্য", list.students === 2 && list.items.length === 1 && list.items[0].eligible === true);
const payId = (await s1.get("/api/student/me")).d.payments.find((p) => p.trxId === "BANKTRX01")._id;
t("পেমেন্ট বাতিল (void)", (await sa.post(`/api/payments/${payId}/void`, { reason: "ভুল পেমেন্ট" })).s === 200);
t("পেমেন্ট বাতিলের পর অ্যাডমিট কার্ড বন্ধ → 403", (await s1.get(`/api/admit-cards/${cardId}`)).s === 403);
ex = (await s1.get("/api/student/exams")).d.items;
t("তালিকায়ও eligible=false", ex[0].admit.eligible === false && ex[0].invoice.due === 300);
r = await sa.post("/api/exam-notices", { name: "ক্লাস টেস্ট", targets: [{ class: "১ম", section: "ক" }, { class: "১ম", section: "খ" }], schedule: sched, fee: 0 });
t("একাধিক শ্রেণি/শাখায় আলাদা নোটিশ + ফি ০ হলে সরাসরি কার্ড", r.s === 200 && r.d.created.length === 2 && r.d.created[0].cards === 2 && r.d.created[1].cards === 1, J(r)); const exFree = r.d.created[0].id;
ex = (await s3.get("/api/student/exams")).d.items;
t("ফি ০ → ১ম-খ শিক্ষার্থী সরাসরি অ্যাডমিট কার্ড পায়", ex.length === 1 && ex[0].admit?.eligible === true);
t("পরীক্ষার ফিও ক্লাসে ইনভয়েস হয়নি (ফি ০)", ex[0].invoice === null);
const pub = (await anon.get("/api/public/exam-notices?class=" + encodeURIComponent("১ম") + "&section=" + encodeURIComponent("খ"))).d.items;
t("পাবলিক (লগইন ছাড়া): ১ম-খ এর শুধু নিজের নোটিশ", pub.length === 1 && pub[0].name === "ক্লাস টেস্ট" && !pub[0].createdByName);
t("পাবলিক: শ্রেণি ফিল্টার ছাড়া সব ৩টি", (await anon.get("/api/public/exam-notices")).d.items.length === 3);
const dD = await mkStu("দীপ", "১ম", "ক");
t("পরে ভর্তি হওয়া শিক্ষার্থী: sync-এ ইনভয়েস ও কার্ড", (await sa.post(`/api/exam-notices/${ex1}/sync`)).d.invoices === 1 && (await sa.post(`/api/exam-notices/${exFree}/sync`)).d.cards === 1);
t("sync আবার চালালে কিছু বাড়ে না (ডুপ্লিকেট নয়)", (await sa.post(`/api/exam-notices/${ex1}/sync`)).d.invoices === 0);
t("নোটিশ সম্পাদনা (রুটিন)", (await sa.put(`/api/exam-notices/${exFree}`, { name: "ক্লাস টেস্ট ২", schedule: sched.slice(0, 1), instructions: "নতুন" })).s === 200);
t("ফি-ওয়ালা নোটিশে সক্রিয় পেমেন্ট থাকলে মোছা বাধা", await (async () => {
  const x2 = (await s2.get("/api/student/exams")).d.items.find((e) => e.fee > 0);
  const q = await acct.post("/api/payments/cash", { student: dB._id, invoice: x2.invoice._id, amount: 300 });
  const del = await sa.del(`/api/exam-notices/${x2._id}`);
  return q.s === 200 && del.s === 400;
})());
t("অপেক্ষমাণ/পেমেন্টহীন নোটিশ মোছা → ইনভয়েস বাতিল", (await sa.del(`/api/exam-notices/${exFree}`)).s === 200 && (await sa.get(`/api/exam-notices/${exFree}`)).s === 404);

sec("৬. ক্লাস রুটিন");
const slot = (o = {}) => ({ teacher: tchId, class: "১ম", section: "ক", subject: "বাংলা", day: 1, startTime: "09:00", endTime: "09:45", ...o });
t("শিক্ষক রুটিন তৈরি করতে পারে না → 403", (await tch.post("/api/routines", slot())).s === 403);
r = await sa.post("/api/routines", slot()); t("রুটিন তৈরি", r.s === 200, J(r)); const rt1 = r.d.id;
t("একই শিক্ষকের সময় ওভারল্যাপ → 400", (await sa.post("/api/routines", slot({ class: "২য়", section: "", startTime: "09:30", endTime: "10:15" }))).s === 400);
t("একই শ্রেণি-শাখার সময় ওভারল্যাপ → 400", await (async () => { await mkStaff2(); return (await sa.post("/api/routines", slot({ teacher: t2Id, startTime: "09:30", endTime: "10:00" }))).s === 400; })());
t("শেষ সময় শুরুর আগে → 400", (await sa.post("/api/routines", slot({ startTime: "11:00", endTime: "10:00" }))).s === 400);
t("অবৈধ দিন → 400", (await sa.post("/api/routines", slot({ day: 9 }))).s === 400);
t("পরপর ক্লাস (09:45 শুরু) চলে", (await sa.post("/api/routines", slot({ subject: "গণিত", startTime: "09:45", endTime: "10:30" }))).s === 200);
t("অন্য শাখা ১ম-খ একই সময়ে অন্য শিক্ষক চলে", (await sa.post("/api/routines", slot({ teacher: t2Id, section: "খ" }))).s === 200);
t("সব-শাখা (ফাঁকা) ক্লাস ১ম-ক এর সাথে সংঘর্ষ → 400", (await sa.post("/api/routines", slot({ teacher: t2Id, section: "", startTime: "09:10", endTime: "09:20" }))).s === 400);
const mine = (await tch.get("/api/routines")).d.items;
t("শিক্ষক শুধু নিজের রুটিন দেখে", mine.length === 2 && mine.every((x) => x.teacher._id === tchId));
t("অ্যাডমিন ফিল্টারে শিক্ষক-ভিত্তিক", (await sa.get(`/api/routines?teacher=${tchId}`)).d.items.length === 2);
const sr = (await s1.get("/api/student/routine")).d;
t("শিক্ষার্থী শুধু নিজের শ্রেণি-শাখার রুটিন (১ম-ক: ২টি)", sr.items.length === 2 && sr.items.every((x) => x.teacher), J({ d: sr.items.length }));
t("১ম-খ শিক্ষার্থী নিজেরটা (১টি)", (await s3.get("/api/student/routine")).d.items.length === 1);
t("শিক্ষার্থী রুটিন বদলাতে পারে না → 403", (await s1.post("/api/routines", slot())).s === 403 && (await s1.del(`/api/routines/${rt1}`)).s === 403);
t("রুটিন সম্পাদনা", (await sa.put(`/api/routines/${rt1}`, { subject: "ইংরেজি" })).s === 200);
t("রুটিন মোছা", (await sa.del(`/api/routines/${rt1}`)).s === 200 && (await tch.get("/api/routines")).d.items.length === 1);
async function mkStaff2() { if (t2Id) return; await mk("tch2", "teacher"); t2Id = (await sa.get("/api/staff?limit=100")).d.items.find((x) => x.userId === "tch2")._id; }

sec("৭. শিক্ষার্থীর তথ্য সম্পাদনা (শুধু অনুমোদিত)");
t("শিক্ষার্থী নিজের তথ্য বদলাতে পারে না", [401, 403].includes((await s1.put(`/api/students/${dA._id}`, { name: "হ্যাক" })).s));
t("শিক্ষার্থী প্রোফাইল API-তেও না", [401, 403, 404, 405].includes((await s1.put(`/api/students/${dA._id}/profile`, { phone: "1" })).s));
t("শিক্ষক (students.write নেই) → 403", (await tch.put(`/api/students/${dA._id}`, { name: "x" })).s === 403);
t("অ্যাডমিন সব তথ্য বদলায়", (await sa.put(`/api/students/${dA._id}`, { name: "আনিকা আক্তার", fatherName: "রহিম", motherName: "করিমা", guardianPhone: "01700000009", address: "ঢাকা", roll: 9 })).s === 200);
t("শ্রেণি/শাখা বদল", (await sa.put(`/api/students/${dA._id}`, { section: "খ" })).s === 200);
await sa.put("/api/settings", { rolePermissions: { ...(await sa.get("/api/settings")).d.rolePermissions, teacher: [...(await sa.get("/api/settings")).d.rolePermissions.teacher, "students.write"] } });
r = await sa.post("/api/assignments", { teacher: tchId, kind: "class", class: "১ম", section: "খ" });
t("অনুমোদিত শিক্ষক নিজের শ্রেণির শিক্ষার্থী বদলাতে পারে", (await tch.put(`/api/students/${dA._id}`, { phone: "01555555555" })).s === 200);
t("অনুমোদিত শিক্ষক অন্য শ্রেণির (১ম-ক নয়, ২য়) শিক্ষার্থী বদলাতে পারে না", await (async () => { const o = await mkStu("ওমর", "২য়", ""); const d = await stuDoc(o.studentId); return (await tch.put(`/api/students/${d._id}`, { phone: "01" })).s === 403; })());

sec("৮. অডিট লগ ফিল্টার ও পরিবর্তনের বিবরণ");
r = (await sa.get("/api/audit?limit=200")).d;
t("ব্যবহারকারী তালিকা আসে", r.users.includes("superadmin1") || r.users.length > 0);
t("ক্যাটাগরি ফিল্টার (exam_notice)", (await sa.get("/api/audit?entity=exam_notice")).d.items.every((a) => a.entity === "exam_notice"));
t("একাধিক ক্যাটাগরি", (await sa.get("/api/audit?entity=routine,payment")).d.items.every((a) => ["routine", "payment"].includes(a.entity)));
t("কাজ ফিল্টার", (await sa.get("/api/audit?action=approve")).d.items.every((a) => a.action === "approve"));
t("ব্যবহারকারী ফিল্টার", (await sa.get("/api/audit?user=acct9")).d.items.length > 0 && (await sa.get("/api/audit?user=acct9")).d.items.every((a) => a.userName === "acct9"));
t("তারিখ ফিল্টার (আজ)", (await sa.get(`/api/audit?from=${today}&to=${today}`)).d.total > 0 && (await sa.get("/api/audit?from=2000-01-01&to=2000-01-02")).d.total === 0);
const upd = (await sa.get("/api/audit?entity=students&action=update&limit=5")).d.items[0];
t("পরিবর্তনের পুরোনো→নতুন মান (diff) সংরক্ষিত", upd.details.diff && Object.keys(upd.details.diff).length > 0, J({ d: upd.details.diff }));
t("শিক্ষক অডিট দেখতে পারে না", (await tch.get("/api/audit")).s === 403);

sec("৯. হিসাবে নতুন মাধ্যম (রকেট)");
const sm = (await sa.get("/api/accounts/summary")).d;
t("হিসাব সারাংশে rocket/other অ্যাকাউন্ট", "rocket" in sm.closing && "other" in sm.closing && "bkash" in sm.closing);
t("প্রারম্ভিক জের (রকেট) সংরক্ষণ", (await sa.put("/api/settings", { openingBalances: { cash: 0, bkash: 0, nagad: 0, rocket: 500, bank: 0, other: 0 } })).s === 200 && (await sa.get("/api/accounts/summary")).d.opening.rocket === 500);

console.log(`\n=== ফলাফল: ${pass} সফল, ${fail} ব্যর্থ ===`); if (fail) { console.log("ব্যর্থ:", failures.join(" | ")); process.exit(1); }
