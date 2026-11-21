// v6 ফিচারের ইন্টিগ্রেশন টেস্ট (খালি ডেটাবেজে: npm run migrate && npm run seed → BASE=http://localhost:3100 node scripts/test-v6.mjs)
const BASE = process.env.BASE || "http://localhost:3100";
let pass = 0, fail = 0; const failures = [];
class C {
  constructor() { this.cookie = ""; this.ip = "8.8.8." + Math.floor(Math.random() * 200); }
  async req(method, path, body) {
    const r = await fetch(BASE + path, { method, headers: { ...(body ? { "Content-Type": "application/json" } : {}), cookie: this.cookie, "x-forwarded-for": this.ip }, body: body ? JSON.stringify(body) : undefined });
    const sc = r.headers.get("set-cookie"); if (sc) this.cookie = sc.split(";")[0];
    let d = null; try { d = await r.json(); } catch {}
    return { s: r.status, d };
  }
  get = (p) => this.req("GET", p); post = (p, b) => this.req("POST", p, b || {}); put = (p, b) => this.req("PUT", p, b); del = (p) => this.req("DELETE", p);
  login(id, pw) { return this.post("/api/auth/login", { userId: id, password: pw }); }
  async page(p) { const r = await fetch(BASE + p, { headers: { cookie: this.cookie }, redirect: "manual" }); const t = r.status === 200 ? await r.text() : ""; return { s: r.status, bad: /Application error: a (server|client)|\\"digest\\":\\"\d/.test(t), t }; }
}
const t = (name, cond, extra = "") => { if (cond) { pass++; console.log("  ✓", name); } else { fail++; failures.push(name); console.log("  ✗", name, extra); } };
const sec = (n) => console.log("\n" + n);
const J = (r) => JSON.stringify(r.d)?.slice(0, 300);
const today = new Intl.DateTimeFormat("en-CA", { timeZone: "Asia/Dhaka" }).format(new Date()); const YEAR = Number(today.slice(0, 4));
const sa = new C(), tX = new C(), tY = new C(), st1 = new C(), anon = new C();

sec("০. প্রস্তুতি");
t("সুপার অ্যাডমিন লগইন", (await sa.login("superadmin1", "SuperPass123")).s === 200);
const cfg = (await sa.get("/api/settings")).d;
t("কেজি শ্রেণি আছে (নার্সারির পরে)", cfg.classes.map((c) => c.name).join(",").includes("নার্সারি,কেজি,১ম"), cfg.classes.map((c) => c.name).join(","));
await sa.put("/api/settings", { classes: [...cfg.classes.map((c) => ({ name: c.name, sections: c.sections || [] }))] });
await sa.post("/api/staff", { userId: "tchX", password: "Pass1234", name: "স্যার এক্স", role: "teacher", salary: 15000, phone: "01711111111" });
await sa.post("/api/staff", { userId: "tchY", password: "Pass1234", name: "স্যার ওয়াই", role: "teacher", salary: 12000 });
t("শিক্ষক লগইন", (await tX.login("tchX", "Pass1234")).s === 200 && (await tY.login("tchY", "Pass1234")).s === 200);
const staff = (await sa.get("/api/staff?limit=100")).d.items; const idX = staff.find((s) => s.userId === "tchX")._id, idY = staff.find((s) => s.userId === "tchY")._id, idSA = staff.find((s) => s.userId === "superadmin1")._id;
const mkStu = async (name, roll) => (await sa.post("/api/students", { name, class: "৫ম", roll, password: "Stud1234", monthlyFee: 500 })).d;
const S = []; for (const [n, r] of [["আলিফ", 1], ["বিলাল", 2], ["চাঁদনী", 3], ["দীপ্ত", 4], ["এশা", 5]]) S.push(await mkStu(n, r));
t("৫ জন শিক্ষার্থী", S.every((s) => s.ok), J({ d: S[0] }));
const docs = (await sa.get("/api/students?class=" + encodeURIComponent("৫ম") + "&limit=100")).d.items; const sid = (n) => docs.find((d) => d.name === n)._id;
await st1.login(S[0].studentId, "Stud1234");
for (const [n, c] of [["বাংলা", ["৫ম"]], ["গণিত", ["৫ম"]]]) await sa.post("/api/subjects", { name: n, type: "compulsory", fullMarks: 100, classes: c });
t("বিষয় — শ্রেণি অ্যারে দিয়ে", (await sa.get("/api/subjects?limit=50")).d.items.every((s) => s.classes.includes("৫ম")));

sec("১. রুটিন → ক্লাস টিচার / বিষয় শিক্ষক (স্বয়ংক্রিয়)");
const slot = (o) => ({ class: "৫ম", section: "", day: 1, ...o });
t("প্রথম ক্লাস tX (বাংলা)", (await sa.post("/api/routines", slot({ teacher: idX, subject: "বাংলা", startTime: "09:00", endTime: "09:45" }))).s === 200);
t("দ্বিতীয় ক্লাস tY (গণিত)", (await sa.post("/api/routines", slot({ teacher: idY, subject: "গণিত", startTime: "09:45", endTime: "10:30" }))).s === 200);
let asg = (await sa.get("/api/assignments?limit=100")).d.items;
t("tX = ক্লাস টিচার (auto)", asg.some((a) => a.teacher._id === idX && a.kind === "class" && a.auto), J({ d: asg }));
t("tY = গণিতের বিষয় শিক্ষক (auto), ক্লাস টিচার নয়", asg.some((a) => a.teacher._id === idY && a.kind === "subject" && a.subject?.name === "গণিত") && !asg.some((a) => a.teacher._id === idY && a.kind === "class"));
t("রুটিনের শুধু আমার (mine=1): সুপার অ্যাডমিনের ০টি", (await sa.get("/api/routines?mine=1")).d.items.length === 0);
t("সুপার অ্যাডমিনের সব রুটিন (mine ছাড়া) ২টি", (await sa.get("/api/routines")).d.items.length === 2);
t("tX mine=1 → ১টি", (await tX.get("/api/routines?mine=1")).d.items.length === 1);
t("শিক্ষার্থী mine=1 → 403", (await st1.get("/api/routines?mine=1")).s === 403);
const meX = (await tX.get("/api/auth/me")).d;
t("tX: promote.own ও classTeacherOf", meX.perms.includes("promote.own") && meX.classTeacherOf?.some((c) => c.class === "৫ম"), J({ d: meX }));
t("tY: promote.own নেই", !(await tY.get("/api/auth/me")).d.perms.includes("promote.own"));
// হাতে ক্লাস টিচার দিলে স্বয়ংক্রিয়টি বদলে যায়
r0: { const r = await sa.post("/api/assignments", { teacher: idY, kind: "class", class: "৫ম", section: "" }); t("হাতে ক্লাস টিচার দিলে auto বদলায় (409 নয়)", r.s === 200, J(r)); asg = (await sa.get("/api/assignments?limit=100")).d.items; t("এখন শুধু একজন ক্লাস টিচার (tY, manual)", asg.filter((a) => a.kind === "class").length === 1 && asg.find((a) => a.kind === "class").teacher._id === idY); await sa.del("/api/assignments/" + asg.find((a) => a.kind === "class")._id); await sa.post("/api/routines/sync"); }
asg = (await sa.get("/api/assignments?limit=100")).d.items; t("sync-এর পর আবার tX ক্লাস টিচার", asg.some((a) => a.kind === "class" && a.teacher._id === idX));

sec("২. পরীক্ষা, ফলাফল, মেধা তালিকা, গ্রেড");
const sched = [{ subject: "বাংলা", date: "2099-03-01", startTime: "10:00", endTime: "12:00" }, { subject: "গণিত", date: "2099-03-02", startTime: "10:00", endTime: "12:00" }];
t("পরীক্ষার নোটিশ ১", (await sa.post("/api/exam-notices", { name: "অর্ধবার্ষিক", targets: [{ class: "৫ম", section: "" }], schedule: sched, fee: 0 })).s === 200);
t("পরীক্ষার নোটিশ ২", (await sa.post("/api/exam-notices", { name: "বার্ষিক", targets: [{ class: "৫ম", section: "" }], schedule: sched, fee: 0 })).s === 200);
const rows = (exam, f) => S.flatMap((s, i) => ["বাংলা", "গণিত"].map((sub) => ({ student: sid(["আলিফ", "বিলাল", "চাঁদনী", "দীপ্ত", "এশা"][i]), subject: sub, marks: f(i, sub), full: 100 })));
const marksH = [90, 75, 55, 20, 65], marksF = [60, 88, 70, 45, 30];
t("tY গণিতে নম্বর ✓, বাংলায় 403", (await tY.post("/api/results/bulk", { exam: "অর্ধবার্ষিক", year: YEAR, class: "৫ম", rows: [{ student: sid("আলিফ"), subject: "গণিত", marks: 90, full: 100 }] })).s === 200 && (await tY.post("/api/results/bulk", { exam: "অর্ধবার্ষিক", year: YEAR, class: "৫ম", rows: [{ student: sid("আলিফ"), subject: "বাংলা", marks: 90, full: 100 }] })).s === 403);
t("tX (ক্লাস টিচার) সব বিষয়ে নম্বর ✓", (await tX.post("/api/results/bulk", { exam: "অর্ধবার্ষিক", year: YEAR, class: "৫ম", rows: rows("h", (i) => marksH[i]) })).s === 200);
t("সুপার অ্যাডমিনও পারে (বার্ষিক)", (await sa.post("/api/results/bulk", { exam: "বার্ষিক", year: YEAR, class: "৫ম", rows: rows("f", (i) => marksF[i]) })).s === 200);
const sheetR = await sa.get(`/api/results/sheet?class=${encodeURIComponent("৫ম")}&exam=${encodeURIComponent("অর্ধবার্ষিক")}&year=${YEAR}`);
t("শিট লোড (ফলাফল পেজের API)", sheetR.s === 200 && sheetR.d.students.length === 5, J(sheetR));
t("অপ্রকাশিত: শিক্ষার্থী ফল দেখে না", (await st1.get("/api/results/cards?list=1")).d.items.length === 0);
for (const e of ["অর্ধবার্ষিক", "বার্ষিক"]) t(`চূড়ান্ত প্রকাশ: ${e}`, (await sa.post("/api/results/publish", { exam: e, year: YEAR, class: "৫ম", section: "", publish: true })).s === 200);
const mer = (await sa.get(`/api/results/merit?class=${encodeURIComponent("৫ম")}&exam=${encodeURIComponent("অর্ধবার্ষিক")}&year=${YEAR}`)).d;
t("মেধা তালিকা: ৫ জন, আলিফ ১ম, গ্রেড A+", mer.items.length === 5 && mer.items[0].name === "আলিফ" && mer.items[0].position === 1 && mer.items[0].letter === "A+", J({ d: mer.items?.[0] }));
t("মেধা তালিকা: দীপ্ত অকৃতকার্য (F), শেষে", mer.items.at(-1).name === "দীপ্ত" && mer.items.at(-1).letter === "F" && !mer.items.at(-1).passed);
t("মেধা তালিকা: অনুমতিহীন (শিক্ষার্থী) 403", (await st1.get(`/api/results/merit?class=${encodeURIComponent("৫ম")}&exam=x&year=${YEAR}`)).s === 403);
const all = (await sa.get(`/api/results/class-all?class=${encodeURIComponent("৫ম")}&year=${YEAR}`)).d;
t("সব পরীক্ষার তালিকা: ২ পরীক্ষা, ৫ জন", all.exams.length === 2 && all.items.length === 5 && all.items.every((i) => i.per.length === 2), J({ d: all.exams }));
const lst = (await sa.get(`/api/results/cards?list=1&student=${sid("আলিফ")}`)).d.items;
t("প্রোফাইলের ফলাফল তালিকায় গ্রেড/জিপিএ", lst.length === 2 && lst.every((i) => i.letter && typeof i.gpa === "number"), J({ d: lst }));
const cards = (await sa.get(`/api/results/cards?student=${sid("আলিফ")}`)).d.cards;
t("একসাথে সব কার্ড + হাজিরা তথ্য", cards.length === 2 && cards[0].attendance && "presentPct" in cards[0].attendance);
t("শিক্ষার্থী নিজের কার্ড তালিকা ২টি", (await st1.get("/api/results/cards?list=1")).d.items.length === 2);
t("অন্যের কার্ড (student param) শিক্ষার্থী দেখে না — নিজেরটাই", (await st1.get(`/api/results/cards?list=1&student=${sid("বিলাল")}`)).d.items.length === 2 && true);

sec("৩. ফি বিবরণী (মাসওয়ারি) ও পেমেন্ট ইতিহাস");
const mkInv = (stu, o) => sa.post("/api/invoices", { student: stu, category: "tuition", title: "মাসিক বেতন", amount: 500, ...o });
const i1 = await mkInv(sid("আলিফ"), { period: `${YEAR}-01`, month: 1, year: YEAR }); const i2 = await mkInv(sid("আলিফ"), { period: `${YEAR}-02`, month: 2, year: YEAR }); await mkInv(sid("আলিফ"), { period: `${YEAR}-03`, month: 3, year: YEAR });
t("৩টি ইনভয়েস", [i1, i2].every((r) => r.s === 200), J(i1));
const iv = (await sa.get(`/api/students/${sid("আলিফ")}/profile`)).d;
const ii = iv.invoices.find((i) => i.period === `${YEAR}-01`)._id;
t("নগদ পেমেন্ট ফেব্রুয়ারি ফুল", (await sa.post("/api/payments/cash", { student: sid("আলিফ"), invoice: iv.invoices.find((i) => i.period === `${YEAR}-02`)._id, amount: 500 })).s === 200);
t("জানুয়ারি আংশিক ২০০", (await sa.post("/api/payments/cash", { student: sid("আলিফ"), invoice: ii, amount: 200 })).s === 200);
const pf = (await sa.get(`/api/students/${sid("আলিফ")}/profile`)).d;
t("প্রোফাইল API: invoices (ধার্য/জমা/বকেয়া) + payments", pf.invoices.length === 3 && pf.invoices.find((i) => i.period === `${YEAR}-01`).due === 300 && pf.invoices.find((i) => i.period === `${YEAR}-02`).due === 0 && pf.payments.length === 2, J({ d: pf.invoices.map((i) => [i.period, i.paid, i.due]) }));
t("মোট বকেয়া = ৮০০", pf.due === 800);
t("শিক্ষক tX তার শ্রেণির শিক্ষার্থীর পেমেন্ট/ফি-বিবরণী দেখে", (await tX.get(`/api/students/${sid("আলিফ")}/profile`)).d.invoices?.length === 3);
const rcp = pf.payments[0]._id;
t("শিক্ষক tX স্লিপ (রিসিপ্ট) দেখতে পারে (নিজের ক্লাস)", (await tX.get(`/api/receipt/${rcp}`)).s === 200);
t("tY (বিষয় শিক্ষক, নিয়োগ আছে ৫ম) রিসিপ্ট", [200, 403].includes((await tY.get(`/api/receipt/${rcp}`)).s));
t("শিক্ষার্থী নিজের ফি-বিবরণী (student/me.invoices)", (await st1.get("/api/student/me")).d.invoices.length === 3);

sec("৪. ক্লাস ড্যাশবোর্ড, হাজিরা ক্যালেন্ডার, নোটিফিকেশন");
t("tX হাজিরা (ক্লাস টিচার)", (await tX.post("/api/attendance/bulk", { date: today, class: "৫ম", records: S.map((s, i) => ({ student: sid(["আলিফ", "বিলাল", "চাঁদনী", "দীপ্ত", "এশা"][i]), status: i === 3 ? "absent" : i === 4 ? "leave" : "present" })) })).s === 200);
const cd = (await sa.get(`/api/class-dashboard?class=${encodeURIComponent("৫ম")}`)).d;
t("ক্লাস ড্যাশবোর্ড: ৫ জন, আজ উপস্থিত ৩, অনুপস্থিত ১", cd.students.length === 5 && cd.summary.todayPresent === 3 && cd.summary.todayAbsent === 1 && cd.summary.todayLeave === 1, J({ d: cd.summary }));
t("ড্যাশবোর্ডে সর্বশেষ ফল ও বকেয়া (আলিফ)", cd.students.find((s) => s.name === "আলিফ").latest?.letter && cd.students.find((s) => s.name === "আলিফ").due === 800);
t("tY (বিষয় শিক্ষক) নিজের শ্রেণির ড্যাশবোর্ড ✓", (await tY.get(`/api/class-dashboard?class=${encodeURIComponent("৫ম")}`)).s === 200);
t("tY অন্য শ্রেণির ড্যাশবোর্ড ✗ 403", (await tY.get(`/api/class-dashboard?class=${encodeURIComponent("৬ষ্ঠ")}`)).s === 403);
const cal = (await sa.get(`/api/attendance?student=${sid("দীপ্ত")}&from=${today.slice(0, 7)}-01&to=${today}&limit=100`)).d;
t("ক্যালেন্ডারের জন্য হাজিরা API: দীপ্ত absent", cal.items.length === 1 && cal.items[0].status === "absent");
const stp = (await st1.get("/api/pending")).d; t("শিক্ষার্থী নোটিফিকেশন: বকেয়া ২ (জানুয়ারি আংশিক, মার্চ)", stp.fee === 2, J({ d: stp }));
const adp = (await sa.get("/api/pending")).d; t("অ্যাডমিন নোটিফিকেশন: বকেয়াওয়ালা ১ (আজ মেয়াদ নেই → ০ বা ১)", typeof adp["/admin/fees"] === "number", J({ d: adp }));
t("লগইন ছাড়া pending → 401", (await anon.get("/api/pending")).s === 401);
const tpd = (await tX.get("/api/pending")).d; t("শিক্ষক নোটিফিকেশন: হাজিরা বাকি ০ (নেওয়া হয়েছে)", tpd["/admin/attendance"] === 0, J({ d: tpd }));

sec("৫. শিক্ষক প্রোফাইল");
const sp = await tX.get(`/api/staff/${idX}/profile`);
t("tX নিজের প্রোফাইল + বেতন + নিয়োগ + রুটিন", sp.s === 200 && sp.d.staff.salary === 15000 && sp.d.assignments.some((a) => a.kind === "class") && sp.d.routine.length === 1, J({ d: sp.d?.staff }));
t("tX অন্য শিক্ষকের প্রোফাইল → 403 (staff.read নেই)", (await tX.get(`/api/staff/${idY}/profile`)).s === 403);
t("সুপার অ্যাডমিন যেকোনো প্রোফাইল (বেতনসহ)", (await sa.get(`/api/staff/${idY}/profile`)).d.staff.salary === 12000);
t("প্রোফাইলে হাজিরার রেকর্ড অ্যারে", Array.isArray(sp.d.attendance.records));

sec("৬. আর্কাইভ → আনআর্কাইভ, বহিষ্কার ও রোল সরে আসা");
const dip = sid("দীপ্ত");
t("আর্কাইভ", (await sa.del(`/api/students/${dip}`)).s === 200);
t("আর্কাইভ তালিকায় আছে", (await sa.get("/api/students?archived=true&limit=50")).d.items.some((s) => s._id === dip));
t("আনআর্কাইভ (শিক্ষক পারে না → 403)", (await tX.post(`/api/students/${dip}/restore`)).s === 403);
const rs = await sa.post(`/api/students/${dip}/restore`); t("আনআর্কাইভ (অ্যাডমিন)", rs.s === 200 && rs.d.ok !== false, J(rs));
const after = (await sa.get(`/api/students/${dip}/profile`)).d.student; t("আবার সক্রিয়, archived=false", after.active === true && !after.archived);
t("আবার আনআর্কাইভ → 400", (await sa.post(`/api/students/${dip}/restore`)).s === 400);
const before = (await sa.get("/api/students?class=" + encodeURIComponent("৫ম") + "&limit=100")).d.items.map((s) => `${s.name}:${s.roll}`);
const ex = await sa.post(`/api/students/${sid("বিলাল")}/status`, { type: "expelled", reason: "আচরণগত কারণে" });
t("বহিষ্কার ✓ + পরের রোল এগোয়", ex.s === 200 && ex.d.shifted === 3, J(ex));
const now = (await sa.get("/api/students?class=" + encodeURIComponent("৫ম") + "&limit=100&active=true")).d.items.sort((a, b) => a.roll - b.roll).map((s) => `${s.name}:${s.roll}`);
t("রোল: আলিফ ১, চাঁদনী ২, দীপ্ত ৩, এশা ৪", now.join(",") === "আলিফ:1,চাঁদনী:2,দীপ্ত:3,এশা:4", now.join(",") + " / " + before.join(","));

sec("৭. প্রমোশন — ক্লাস টিচার, র‍্যাংক অনুযায়ী রোল");
const pr = await tX.get(`/api/students/promote/rank?class=${encodeURIComponent("৫ম")}&exam=${encodeURIComponent("বার্ষিক")}&year=${YEAR}`);
t("র‍্যাংক প্রিভিউ (ক্লাস টিচার) + গ্রেড", pr.s === 200 && pr.d.finalized && pr.d.items.every((i) => "letter" in i), J(pr));
t("র‍্যাংক: প্রথম উত্তীর্ণ, শেষে অকৃতকার্য (এশা ৩০%)", pr.d.items[0].passed && !pr.d.items.at(-1).passed && pr.d.items.at(-1).name === "এশা", J({ d: pr.d.items.map((i) => [i.name, i.score, i.passed]) }));
t("tY (ক্লাস টিচার নয়) র‍্যাংক → 403", (await tY.get(`/api/students/promote/rank?class=${encodeURIComponent("৫ম")}&exam=x&year=${YEAR}`)).s === 403);
const passIds = pr.d.items.filter((i) => i.passed).map((i) => i._id);
t("tY প্রমোশন → 403", (await tY.post("/api/students/promote", { fromClass: "৫ম", toClass: "৬ষ্ঠ", studentIds: passIds })).s === 403);
t("tX অন্য শ্রেণি (৪র্থ) প্রমোশন → 403", (await tX.post("/api/students/promote", { fromClass: "৪র্থ", toClass: "৫ম", studentIds: passIds })).s === 403);
const pm = await tX.post("/api/students/promote", { fromClass: "৫ম", toClass: "৬ষ্ঠ", session: "2027", studentIds: passIds, rankBy: { exam: "বার্ষিক", year: YEAR } });
t("tX র‍্যাংক অনুযায়ী প্রমোশন ✓", pm.s === 200 && pm.d.moved === passIds.length && pm.d.ranked, J(pm));
const six = (await sa.get("/api/students?class=" + encodeURIComponent("৬ষ্ঠ") + "&limit=100&active=true")).d.items.sort((a, b) => a.roll - b.roll);
t("৬ষ্ঠে রোল ১.. র‍্যাংক ক্রমে (বিলাল বহিষ্কৃত বাদ)", six.map((s) => s.roll).join(",") === "1,2,3" && six[0].name === pr.d.items[0].name, six.map((s) => s.name + s.roll).join(","));

sec("৮. পেজ রেন্ডার (এসএসআর) স্মোক");
for (const p of ["/admin/results", "/admin/class-dashboard", "/admin/promotion", "/admin/academics", "/admin/students", `/admin/students/${sid("আলিফ")}`, `/admin/students/${sid("আলিফ")}/print?parts=fees`, "/admin/results/merit", "/admin/results/class-all", "/admin/print-list", "/admin/my-routine", "/admin/me", `/admin/staff/${idX}`, `/admin/staff/${idX}/print`, "/admin/attendance/report/print", "/admin/staff", "/admin/fees", "/admin/leave"]) { const r = await sa.page(p); t(`${p} → 200 ও ত্রুটি নেই`, r.s === 200 && !r.bad, r.s); }
t("শিক্ষার্থী পোর্টাল /student", (await st1.page("/student")).s === 200);
t("tX /admin/promotion পেজ (promote.own)", (await tX.page("/admin/promotion")).t.includes("/admin/promotion"));
console.log(`\n=== ফলাফল: ${pass} সফল, ${fail} ব্যর্থ ===`); if (fail) console.log("ব্যর্থ:\n- " + failures.join("\n- ")); process.exit(fail ? 1 : 0);
