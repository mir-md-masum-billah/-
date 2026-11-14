// পেজ স্মোক টেস্ট: সব পেজ সার্ভারে রেন্ডার হয় কিনা ও রোল রিডাইরেক্ট (test-phase3 চালানোর পরে)
const B = process.env.BASE || "http://localhost:3100"; let bad = 0;
const chk = (n, c) => { console.log(c ? "  ✓" : "  ✗", n); if (!c) bad++; };
async function login(id, pw) { const r = await fetch(B + "/api/auth/login", { method: "POST", headers: { "Content-Type": "application/json", "x-forwarded-for": "7.7.7." + Math.floor(Math.random() * 200) }, body: JSON.stringify({ userId: id, password: pw }) }); return r.headers.get("set-cookie")?.split(";")[0] || ""; }
async function get(p, cookie = "") { const r = await fetch(B + p, { headers: { cookie }, redirect: "manual" }); return { s: r.status, loc: r.headers.get("location"), t: r.status === 200 ? await r.text() : "" }; }
const broken = (t) => /Application error: a (server|client)|\\"digest\\":\\"\d/.test(t);
const sa = await login("superadmin1", "SuperPass123");
const stu = (await (await fetch(B + "/api/students?limit=1", { headers: { cookie: sa } })).json()).items[0]._id;
const pages = ["/", "/login", "/notices", "/admission", "/admin", "/admin/students", `/admin/students/${stu}`, "/admin/students/import", "/admin/promotion", "/admin/applications", "/admin/academics", "/admin/attendance", "/admin/attendance/report", "/admin/staff-attendance", "/admin/leave", "/admin/results", "/admin/fees", "/admin/accounts", "/admin/notices", "/admin/staff", "/admin/settings", "/admin/audit"];
for (const p of pages) { const r = await get(p, sa); chk(`${p} → ${r.s}`, r.s === 200 && !broken(r.t)); }
chk("লগইন ছাড়া /admin → /login", (await get("/admin")).loc?.endsWith("/login"));
chk("লগইন ছাড়া /student → /login", (await get("/student")).loc?.endsWith("/login"));
const st = await login("LV-P", "Pass1234");
chk("শিক্ষার্থী /student → 200", (await get("/student", st)).s === 200);
chk("শিক্ষার্থী /admin → /student", (await get("/admin", st)).loc?.endsWith("/student"));
const hm = await login("hm1", "Pass1234"); const nav = await get("/admin", hm);
chk("হেডমাস্টারের মেনুতে প্রমোশন/ভর্তির আবেদন আছে, সেটিংস নেই", nav.t.includes("/admin/promotion") && nav.t.includes("/admin/applications") && !nav.t.includes("/admin/settings"));
const tb = await login("teaB", "Pass1234"); const tn = await get("/admin", tb);
chk("শিক্ষকের মেনুতে ফি/হিসাব/প্রমোশন নেই, ছুটি আছে", tn.s === 200 && !tn.t.includes("/admin/fees") && !tn.t.includes("/admin/accounts") && !tn.t.includes("/admin/promotion") && tn.t.includes("/admin/leave"));
console.log(bad ? `\n${bad} ব্যর্থ` : "\nসব পেজ ঠিক"); process.exit(bad ? 1 : 0);
