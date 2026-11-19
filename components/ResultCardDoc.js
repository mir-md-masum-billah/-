"use client";
import A4Doc from "./A4Doc";
import { useLang } from "./LangProvider";
import { summarize } from "@/lib/grades";
import { docName, studentTag } from "@/lib/docname";

const SCALE = [["৮০–১০০", "80–100", "A+", "5.00"], ["৭০–৭৯", "70–79", "A", "4.00"], ["৬০–৬৯", "60–69", "A-", "3.50"], ["৫০–৫৯", "50–59", "B", "3.00"], ["৪০–৪৯", "40–49", "C", "2.00"], ["৩৩–৩৯", "33–39", "D", "1.00"], ["০–৩২", "0–32", "F", "0.00"]];
const GREEN = "#0A4435", GOLD = "#C49B3F", GOLD_D = "#9A7623", RED = "#b91c1c";

// অনুপ্রেরণার কিছু ভালো কথা (বাংলা, English)
const QUOTES = [
  ["শিক্ষা হলো সেই আলো, যা জীবনের পথ আলোকিত করে।", "Education is the light that illuminates the path of life."],
  ["আজকের পরিশ্রমই আগামী দিনের সাফল্যের ভিত্তি।", "Today's effort is the foundation of tomorrow's success."],
  ["স্বপ্ন দেখো, পরিশ্রম করো — সাফল্য একদিন ধরা দেবেই।", "Dream, work hard — success will come to you one day."],
  ["প্রতিটি ছোট অগ্রগতিই একটি বড় বিজয়ের সূচনা।", "Every small step forward is the beginning of a great victory."],
  ["ব্যর্থতা শেষ নয়, নতুন করে শেখার সুযোগ।", "Failure is not the end — it is a chance to learn again."],
  ["নিয়মিত উপস্থিতি আর অধ্যবসায়ই সাফল্যের চাবিকাঠি।", "Regular attendance and perseverance are the keys to success."],
  ["নিজের উপর বিশ্বাস রাখো — তুমি পারবে।", "Believe in yourself — you can do it."],
  ["জ্ঞানই শক্তি; আলোকিত মানুষই আগামীর দেশ গড়ে।", "Knowledge is power; enlightened people build the nation of tomorrow."],
];
const hash = (s) => [...String(s || "")].reduce((h, c) => (h * 31 + c.charCodeAt(0)) >>> 0, 7);

// মার্কশিট (রেজাল্ট কার্ড) — ঠিক এক A4 পাতায়: শিক্ষার্থীর তথ্য, বিষয়ভিত্তিক নম্বর-গ্রেড-পয়েন্ট, মোট/জিপিএ/মেধাক্রম,
// ওই বছরের হাজিরা (উপস্থিত/অনুপস্থিত/ছুটি, শতকরা), মন্তব্য ও অনুপ্রেরণামূলক কথা, উত্তীর্ণ/অনুত্তীর্ণ সিল ও স্বাক্ষর
export default function ResultCardDoc({ data, back, multi = false }) {
  const { x, n, lang } = useLang();
  const L = (bn, en) => (lang === "en" ? en : bn);
  const { student: s, exam, year, rows, position, classSize, finalized, attendance: at } = data;
  const sm = summarize(rows);
  const f2 = (v) => n(Number(v).toFixed(2)), f1 = (v) => n(Math.round(v * 10) / 10);
  const ok = sm.passed, tone = ok ? GREEN : RED, dense = sm.subs.length > 9;
  const th = { background: `linear-gradient(180deg,#0F5A46,${GREEN})`, color: "#fff", padding: dense ? "5px 5px" : "7px 6px", fontSize: 10.5, fontWeight: 600, textAlign: "center", border: `1px solid ${GREEN}` };
  const td = { padding: dense ? "3px 5px" : "5px 6px", fontSize: dense ? 11 : 12, textAlign: "center", borderBottom: "1px solid #E7DFC6" };
  const info = (l, v, span) => <div style={{ gridColumn: span ? "span 2" : undefined, padding: "3px 0", borderBottom: "1px dotted #b8a56a" }}><p style={{ fontSize: 9, color: "#7c6a3a", margin: 0 }}>{l}</p><p style={{ fontSize: 12.5, fontWeight: 700, color: "#0f172a", margin: 0, minHeight: "1.25em" }}>{v || "—"}</p></div>;
  const stat = (label, val, color = GREEN, sub) => <div style={{ flex: 1, border: `1.4px solid ${GOLD}`, borderRadius: 10, padding: "6px 3px", textAlign: "center", background: "linear-gradient(180deg,#FFFDF5,#FBF0CC)", boxShadow: "inset 0 0 0 2px #fff" }}><p style={{ fontSize: 9.5, color: "#6b5a2c", margin: 0 }}>{label}</p><p style={{ fontSize: 19, fontWeight: 800, color, margin: "1px 0 0", lineHeight: 1.15 }}>{val}</p>{sub && <p style={{ fontSize: 9, color: "#94a3b8", margin: 0 }}>{sub}</p>}</div>;
  const remark = !ok ? L("আরও মনোযোগ ও অনুশীলন প্রয়োজন।", "Needs more attention and practice.") : sm.gpa >= 5 ? L("অসাধারণ ফলাফল! এই ধারা বজায় রাখো।", "Outstanding result! Keep it up.") : sm.gpa >= 4 ? L("চমৎকার ফলাফল — অভিনন্দন।", "Excellent result — congratulations.") : sm.gpa >= 3 ? L("ভালো ফলাফল; আরও উন্নতির সুযোগ আছে।", "Good result; there is room to improve.") : L("উত্তীর্ণ — আরও যত্ন নিলে ফল আরও ভালো হবে।", "Passed — more effort will improve the result.");
  const attRemark = !at || at.presentPct === null ? "" : at.presentPct >= 90 ? L("উপস্থিতি প্রশংসনীয়।", "Commendable attendance.") : at.presentPct >= 75 ? L("উপস্থিতি সন্তোষজনক।", "Satisfactory attendance.") : L("নিয়মিত উপস্থিতি জরুরি।", "Regular attendance is needed.");
  const q1 = QUOTES[!ok ? 4 : sm.gpa >= 5 ? 2 : sm.gpa >= 4 ? 3 : 1], q2 = QUOTES[(hash(s.studentId) + year) % QUOTES.length];
  const donut = at?.presentPct ?? 0;
  const chip = (label, val, color = "#0f172a") => <div style={{ textAlign: "center", flex: 1, borderLeft: "1px solid #E7DFC6", padding: "0 4px" }}><p style={{ fontSize: 9, color: "#7c6a3a", margin: 0 }}>{label}</p><p style={{ fontSize: 15, fontWeight: 800, color, margin: 0, lineHeight: 1.25 }}>{val}</p></div>;
  const title = L("একাডেমিক ট্রান্সক্রিপ্ট / মার্কশিট", "Academic Transcript / Marksheet");
  return (
    <A4Doc back={back} multi={multi} onePage luxury title={title} docTitle={docName([studentTag(s, { x, n, lang }), L("রেজাল্ট কার্ড", "Result Card"), exam, year])} code={s.studentId} footerNote={finalized === false ? L("প্রাথমিক ফল — চূড়ান্ত প্রকাশের আগে পরিবর্তন হতে পারে", "Provisional — may change before final publication") : L("কম্পিউটারে তৈরি নথি — স্বাক্ষর ছাড়া অসম্পূর্ণ", "Computer-generated — incomplete without signatures")}>
      <div style={{ textAlign: "center", marginTop: -2 }}>
        <div style={{ display: "inline-block", padding: "2px 34px", background: `linear-gradient(90deg,transparent,#F4E3A8 15%,#F4E3A8 85%,transparent)`, borderTop: `1px solid ${GOLD}`, borderBottom: `1px solid ${GOLD}` }}>
          <p style={{ fontSize: 17, fontWeight: 800, color: GREEN, margin: 0 }}>{exam} <span style={{ color: GOLD_D, fontWeight: 600, fontSize: 12.5 }}>· {L("শিক্ষাবর্ষ", "Academic year")} {n(year).replace(/[,،]/g, "")}</span></p>
        </div>
      </div>

      <div style={{ display: "grid", gridTemplateColumns: "1fr 92px", gap: 14, marginTop: 10, border: `1px solid ${GOLD}`, borderRadius: 12, padding: 10, background: "rgba(255,255,255,.72)" }}>
        <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr 1fr", gap: "0 18px", alignContent: "start" }}>
          {info(L("শিক্ষার্থীর নাম", "Student name"), s.name, true)}{info(L("আইডি", "ID"), s.studentId)}
          {info(L("শ্রেণি", "Class"), x(s.class))}{info(L("শাখা", "Section"), s.section)}{info(L("রোল", "Roll"), n(s.roll))}
          {info(L("পিতার নাম", "Father's name"), s.fatherName, true)}{info(L("সেশন", "Session"), s.session)}
          {info(L("মাতার নাম", "Mother's name"), s.motherName, true)}{info(L("মেধাক্রম", "Position"), position ? `${n(position)}${classSize ? ` / ${n(classSize)}` : ""}` : "")}
        </div>
        <div style={{ width: 92, height: 112, border: `2px solid ${GOLD}`, borderRadius: 6, overflow: "hidden", display: "grid", placeItems: "center", background: "#f1f5f9", alignSelf: "start", boxShadow: "0 0 0 3px #fff, 0 0 0 4px #E8D08A" }}>{s.photo ? <img src={s.photo} alt="" style={{ width: "100%", height: "100%", objectFit: "cover" }} /> : <span style={{ fontSize: 10, color: "#94a3b8" }}>{L("ছবি", "Photo")}</span>}</div>
      </div>

      <table style={{ width: "100%", borderCollapse: "collapse", marginTop: 10, background: "rgba(255,255,255,.78)" }}>
        <thead><tr><th style={{ ...th, width: 28 }}>#</th><th style={{ ...th, textAlign: "left" }}>{L("বিষয়", "Subject")}</th><th style={th}>{L("পূর্ণমান", "Full")}</th><th style={th}>{L("প্রাপ্ত নম্বর", "Obtained")}</th>{!dense && <th style={{ ...th, width: 84 }}>{L("শতকরা", "%")}</th>}<th style={th}>{L("গ্রেড", "Grade")}</th><th style={th}>{L("পয়েন্ট", "GP")}</th></tr></thead>
        <tbody>{sm.subs.map((r, i) => { const p = r.full ? Math.min(100, (r.marks / r.full) * 100) : 0, bad = r.g === "F"; return (
          <tr key={r.subject} style={{ breakInside: "avoid", background: i % 2 ? "rgba(251,247,232,.8)" : "transparent" }}>
            <td style={td}>{n(i + 1)}</td><td style={{ ...td, textAlign: "left", fontWeight: 600 }}>{x(r.subject)}</td><td style={td}>{n(r.full)}</td>
            <td style={{ ...td, fontWeight: 800, color: bad ? RED : "#0f172a" }}>{n(r.marks)}</td>
            {!dense && <td style={td}><div style={{ height: 5, borderRadius: 3, background: "#E7DFC6", overflow: "hidden" }}><div style={{ width: `${p}%`, height: "100%", background: bad ? RED : GREEN }} /></div><span style={{ fontSize: 9, color: "#64748b" }}>{f1(p)}%</span></td>}
            <td style={{ ...td, fontWeight: 800, color: bad ? RED : GREEN }}>{r.g}</td><td style={td}>{f2(r.gp)}</td>
          </tr>); })}
          <tr style={{ background: "linear-gradient(90deg,#FBF0CC,#F4E3A8,#FBF0CC)", fontWeight: 800 }}><td style={td} /><td style={{ ...td, textAlign: "left" }}>{L("সর্বমোট", "Total")}</td><td style={td}>{n(sm.full)}</td><td style={{ ...td, color: GREEN }}>{n(sm.total)}</td>{!dense && <td style={td}>{f1(sm.percent)}%</td>}<td style={{ ...td, color: tone }}>{sm.letter}</td><td style={td}>{f2(sm.gpa)}</td></tr>
        </tbody>
      </table>

      <div style={{ display: "flex", gap: 8, marginTop: 10 }}>
        {stat(L("মোট নম্বর", "Total marks"), n(sm.total), GREEN, `/ ${n(sm.full)}`)}
        {stat(L("শতকরা", "Percentage"), `${f1(sm.percent)}%`)}
        {stat(L("জিপিএ", "GPA"), f2(sm.gpa), tone, L("৫.০০ এর মধ্যে", "out of 5.00"))}
        {stat(L("লেটার গ্রেড", "Letter grade"), sm.letter, tone)}
        {position && stat(L("মেধাক্রম", "Position"), n(position), GREEN, classSize ? L(`${n(classSize)} জনের মধ্যে`, `of ${classSize}`) : undefined)}
      </div>

      <div style={{ display: "flex", alignItems: "center", gap: 14, marginTop: 10, padding: "8px 12px", borderRadius: 12, border: `1px solid ${GOLD}`, background: "rgba(255,255,255,.78)" }}>
        <div style={{ position: "relative", width: 62, height: 62, flexShrink: 0, borderRadius: "50%", background: at?.presentPct == null ? "#E7DFC6" : `conic-gradient(${GREEN} 0 ${donut}%, ${RED} ${donut}% 100%)` }}>
          <div style={{ position: "absolute", inset: 7, borderRadius: "50%", background: "#FFFDF5", display: "grid", placeItems: "center", textAlign: "center" }}><div><p style={{ fontSize: 13, fontWeight: 800, color: GREEN, margin: 0, lineHeight: 1 }}>{at?.presentPct == null ? "—" : `${f1(at.presentPct)}%`}</p><p style={{ fontSize: 7.5, color: "#7c6a3a", margin: 0 }}>{L("উপস্থিত", "Present")}</p></div></div>
        </div>
        <div style={{ flex: 1 }}>
          <p style={{ fontSize: 11, fontWeight: 700, color: GOLD_D, margin: "0 0 3px" }}>{L(`${n(year).replace(/[,،]/g, "")} সালের হাজিরা`, `Attendance — ${year}`)}{attRemark && <span style={{ fontWeight: 500, color: "#475569" }}> · {attRemark}</span>}</p>
          {at && at.recorded > 0 ? (
            <div style={{ display: "flex", alignItems: "stretch" }}>
              {chip(L("মোট কর্মদিবস", "School days"), n(at.recorded))}{chip(L("উপস্থিত দিন", "Days present"), n(at.present), GREEN)}{chip(L("অনুপস্থিত দিন", "Days absent"), n(at.absent), at.absent ? RED : "#0f172a")}{chip(L("ছুটির দিন", "Days on leave"), n(at.leave), "#b45309")}{chip(L("উপস্থিতি %", "Present %"), at.presentPct == null ? "—" : `${f1(at.presentPct)}%`, GREEN)}{chip(L("অনুপস্থিতি %", "Absent %"), at.absentPct == null ? "—" : `${f1(at.absentPct)}%`, at.absent ? RED : "#0f172a")}
            </div>
          ) : <p style={{ fontSize: 11, color: "#64748b", margin: 0 }}>{L("এই বছরের হাজিরার তথ্য নেই।", "No attendance data for this year.")}</p>}
        </div>
      </div>

      <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between", gap: 14, marginTop: 10, padding: "8px 14px", borderRadius: 12, border: `1px solid ${ok ? "#BBD7CC" : "#F3C1C1"}`, background: ok ? "rgba(240,247,244,.9)" : "rgba(254,242,242,.9)" }}>
        <div style={{ minWidth: 0 }}><p style={{ fontSize: 9.5, color: "#64748b", margin: 0 }}>{L("মন্তব্য", "Remarks")}</p><p style={{ fontSize: 12.5, fontWeight: 700, color: "#0f172a", margin: 0 }}>{remark}</p>
          <p style={{ fontSize: 11.5, fontStyle: "italic", color: GOLD_D, margin: "3px 0 0" }}>“{L(q1[0], q1[1])}”</p></div>
        <div style={{ border: `2.5px solid ${tone}`, color: tone, borderRadius: 8, padding: "3px 16px", fontSize: 16, fontWeight: 800, transform: "rotate(-4deg)", letterSpacing: 1, whiteSpace: "nowrap", flexShrink: 0 }}>{ok ? L("উত্তীর্ণ", "PASSED") : L("অনুত্তীর্ণ", "FAILED")}</div>
      </div>

      <table style={{ borderCollapse: "collapse", marginTop: 9, fontSize: 9.5, width: "100%", background: "rgba(255,255,255,.7)" }}>
        <thead><tr><th style={{ ...th, background: "#F4E3A8", color: GREEN, border: "1px solid #E8D08A", textAlign: "left", padding: "3px 5px" }}>{L("নম্বর", "Marks")}</th>{SCALE.map((r) => <th key={r[2]} style={{ ...th, background: "#F4E3A8", color: GREEN, border: "1px solid #E8D08A", padding: "3px 4px" }}>{L(r[0], r[1])}</th>)}</tr></thead>
        <tbody><tr><td style={{ padding: "2px 5px", border: "1px solid #E8D08A", textAlign: "left" }}>{L("গ্রেড", "Grade")}</td>{SCALE.map((r) => <td key={r[2]} style={{ padding: "2px 4px", border: "1px solid #E8D08A", fontWeight: 700, textAlign: "center" }}>{r[2]}</td>)}</tr><tr><td style={{ padding: "2px 5px", border: "1px solid #E8D08A", textAlign: "left" }}>{L("পয়েন্ট", "Point")}</td>{SCALE.map((r) => <td key={r[2]} style={{ padding: "2px 4px", border: "1px solid #E8D08A", textAlign: "center" }}>{L(r[3].replace(/\d/g, (d) => "০১২৩৪৫৬৭৮৯"[d]), r[3])}</td>)}</tr></tbody>
      </table>

      <p style={{ textAlign: "center", fontSize: 11, fontStyle: "italic", color: GOLD_D, margin: "9px 0 0" }}>✦ {L(q2[0], q2[1])} ✦</p>

      <div style={{ display: "flex", justifyContent: "space-between", marginTop: 26, fontSize: 10.5 }}>
        {[L("অভিভাবকের স্বাক্ষর", "Guardian"), L("ক্লাস টিচার", "Class teacher"), L("প্রধান শিক্ষক", "Head teacher")].map((t) => <span key={t} style={{ borderTop: "1px solid #64748b", padding: "3px 20px", color: "#334155" }}>{t}</span>)}
      </div>
    </A4Doc>
  );
}
