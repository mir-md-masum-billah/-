"use client";
import A4Doc from "./A4Doc";
import { useLang } from "./LangProvider";
import { summarize } from "@/lib/grades";

const SCALE = [["৮০–১০০", "A+", "5.00"], ["৭০–৭৯", "A", "4.00"], ["৬০–৬৯", "A-", "3.50"], ["৫০–৫৯", "B", "3.00"], ["৪০–৪৯", "C", "2.00"], ["৩৩–৩৯", "D", "1.00"], ["০–৩২", "F", "0.00"]];
const GREEN = "#0A4435", GOLD = "#C49B3F", RED = "#b91c1c";

// মার্কশিট (রেজাল্ট কার্ড): শিক্ষার্থীর তথ্য, বিষয়ভিত্তিক নম্বর-গ্রেড-পয়েন্ট, শতকরা বার, মোট/জিপিএ/মেধাক্রম, উত্তীর্ণ/অনুত্তীর্ণ সিল ও স্বাক্ষর
export default function ResultCardDoc({ data, back }) {
  const { x, n, lang } = useLang();
  const L = (bn, en) => (lang === "en" ? en : bn);
  const { student: s, exam, year, rows, position, classSize, finalized } = data;
  const sm = summarize(rows);
  const f2 = (v) => n(Number(v).toFixed(2)), f1 = (v) => n(Math.round(v * 10) / 10);
  const ok = sm.passed, tone = ok ? GREEN : RED;
  const th = { background: GREEN, color: "#fff", padding: "8px 6px", fontSize: 11, fontWeight: 600, textAlign: "center", border: `1px solid ${GREEN}` };
  const td = { padding: "7px 6px", fontSize: 12, textAlign: "center", borderBottom: "1px solid #E2E8F0" };
  const info = (l, v, span) => <div style={{ gridColumn: span ? "span 2" : undefined, padding: "5px 0", borderBottom: "1px dotted #94a3b8" }}><p style={{ fontSize: 9.5, color: "#64748b", margin: 0 }}>{l}</p><p style={{ fontSize: 13, fontWeight: 700, color: "#0f172a", margin: 0, minHeight: "1.3em" }}>{v || "—"}</p></div>;
  const stat = (label, val, color = GREEN, sub) => <div style={{ flex: 1, border: `1.5px solid ${GOLD}`, borderRadius: 10, padding: "9px 4px", textAlign: "center", background: "linear-gradient(180deg,#FFFDF5,#FFF7DB)" }}><p style={{ fontSize: 10, color: "#64748b", margin: 0 }}>{label}</p><p style={{ fontSize: 20, fontWeight: 800, color, margin: "2px 0 0", lineHeight: 1.2 }}>{val}</p>{sub && <p style={{ fontSize: 9.5, color: "#94a3b8", margin: 0 }}>{sub}</p>}</div>;
  const remark = !ok ? L("আরও মনোযোগ ও অনুশীলন প্রয়োজন।", "Needs more attention and practice.") : sm.gpa >= 5 ? L("অসাধারণ ফলাফল! এই ধারা বজায় রাখো।", "Outstanding result! Keep it up.") : sm.gpa >= 4 ? L("চমৎকার ফলাফল — অভিনন্দন।", "Excellent result — congratulations.") : sm.gpa >= 3 ? L("ভালো ফলাফল; আরও উন্নতির সুযোগ আছে।", "Good result; there is room to improve.") : L("উত্তীর্ণ — আরও যত্ন নিলে ফল আরও ভালো হবে।", "Passed — more effort will improve the result.");
  return (
    <A4Doc back={back} title={L("একাডেমিক ট্রান্সক্রিপ্ট / মার্কশিট", "Academic Transcript / Marksheet")} filename={`result-${s.studentId}-${exam}-${year}`} code={s.studentId} footerNote={finalized === false ? L("প্রাথমিক ফল — চূড়ান্ত প্রকাশের আগে পরিবর্তন হতে পারে", "Provisional — may change before final publication") : undefined}>
      <div style={{ textAlign: "center", marginTop: -4 }}>
        <p style={{ fontSize: 19, fontWeight: 800, color: GREEN, margin: 0 }}>{exam}</p>
        <p style={{ fontSize: 12, color: "#9A7623", fontWeight: 600, margin: 0 }}>{L("শিক্ষাবর্ষ", "Academic year")} {n(year)}</p>
      </div>

      <div style={{ display: "grid", gridTemplateColumns: "1fr 104px", gap: 16, marginTop: 14, border: "1px solid #E2E8F0", borderRadius: 10, padding: 12, background: "#FAFBFC" }}>
        <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: "2px 22px", alignContent: "start" }}>
          {info(L("শিক্ষার্থীর নাম", "Student name"), s.name, true)}
          {info(L("আইডি", "ID"), s.studentId)}{info(L("রোল", "Roll"), n(s.roll))}
          {info(L("শ্রেণি", "Class"), x(s.class))}{info(L("শাখা", "Section"), s.section)}
          {s.fatherName && info(L("পিতার নাম", "Father's name"), s.fatherName, true)}
          {s.motherName && info(L("মাতার নাম", "Mother's name"), s.motherName, true)}
        </div>
        <div style={{ width: 104, height: 126, border: `2px solid ${GOLD}`, borderRadius: 6, overflow: "hidden", display: "grid", placeItems: "center", background: "#f1f5f9", alignSelf: "start" }}>{s.photo ? <img src={s.photo} alt="" style={{ width: "100%", height: "100%", objectFit: "cover" }} /> : <span style={{ fontSize: 10, color: "#94a3b8" }}>{L("ছবি", "Photo")}</span>}</div>
      </div>

      <table style={{ width: "100%", borderCollapse: "collapse", marginTop: 14, borderRadius: 8, overflow: "hidden" }}>
        <thead><tr><th style={{ ...th, width: 30 }}>#</th><th style={{ ...th, textAlign: "left" }}>{L("বিষয়", "Subject")}</th><th style={th}>{L("পূর্ণমান", "Full")}</th><th style={th}>{L("প্রাপ্ত নম্বর", "Obtained")}</th><th style={{ ...th, width: 90 }}>{L("শতকরা", "%")}</th><th style={th}>{L("গ্রেড", "Grade")}</th><th style={th}>{L("পয়েন্ট", "GP")}</th></tr></thead>
        <tbody>{sm.subs.map((r, i) => { const p = r.full ? Math.min(100, (r.marks / r.full) * 100) : 0, bad = r.g === "F"; return (
          <tr key={r.subject} style={{ breakInside: "avoid", background: i % 2 ? "#F8FAFC" : "#fff" }}>
            <td style={td}>{n(i + 1)}</td><td style={{ ...td, textAlign: "left", fontWeight: 600 }}>{x(r.subject)}</td><td style={td}>{n(r.full)}</td>
            <td style={{ ...td, fontWeight: 800, color: bad ? RED : "#0f172a" }}>{n(r.marks)}</td>
            <td style={td}><div style={{ height: 6, borderRadius: 3, background: "#E2E8F0", overflow: "hidden" }}><div style={{ width: `${p}%`, height: "100%", background: bad ? RED : GREEN }} /></div><span style={{ fontSize: 9.5, color: "#64748b" }}>{f1(p)}%</span></td>
            <td style={{ ...td, fontWeight: 800, color: bad ? RED : GREEN }}>{r.g}</td><td style={td}>{f2(r.gp)}</td>
          </tr>); })}
          <tr style={{ background: "#FFF7DB", fontWeight: 800 }}><td style={td} /><td style={{ ...td, textAlign: "left" }}>{L("সর্বমোট", "Total")}</td><td style={td}>{n(sm.full)}</td><td style={{ ...td, color: GREEN }}>{n(sm.total)}</td><td style={td}>{f1(sm.percent)}%</td><td style={{ ...td, color: tone }}>{sm.letter}</td><td style={td}>{f2(sm.gpa)}</td></tr>
        </tbody>
      </table>

      <div style={{ display: "flex", gap: 9, marginTop: 14 }}>
        {stat(L("মোট নম্বর", "Total marks"), `${n(sm.total)}`, GREEN, `/ ${n(sm.full)}`)}
        {stat(L("শতকরা", "Percentage"), `${f1(sm.percent)}%`)}
        {stat(L("জিপিএ", "GPA"), f2(sm.gpa), tone, L("৫.০০ এর মধ্যে", "out of 5.00"))}
        {stat(L("লেটার গ্রেড", "Letter grade"), sm.letter, tone)}
        {position && stat(L("মেধাক্রম", "Position"), n(position), GREEN, classSize ? L(`${n(classSize)} জনের মধ্যে`, `of ${classSize}`) : undefined)}
      </div>

      <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between", gap: 14, marginTop: 14, padding: "10px 14px", borderRadius: 10, border: `1px solid ${ok ? "#BBD7CC" : "#F3C1C1"}`, background: ok ? "#F0F7F4" : "#FEF2F2" }}>
        <div><p style={{ fontSize: 10, color: "#64748b", margin: 0 }}>{L("মন্তব্য", "Remarks")}</p><p style={{ fontSize: 13, fontWeight: 600, color: "#0f172a", margin: 0 }}>{remark}</p></div>
        <div style={{ border: `2.5px solid ${tone}`, color: tone, borderRadius: 8, padding: "4px 16px", fontSize: 17, fontWeight: 800, transform: "rotate(-4deg)", letterSpacing: 1, whiteSpace: "nowrap" }}>{ok ? L("উত্তীর্ণ", "PASSED") : L("অনুত্তীর্ণ", "FAILED")}</div>
      </div>

      <table style={{ borderCollapse: "collapse", marginTop: 14, fontSize: 10, width: "100%" }}>
        <thead><tr><th style={{ ...th, background: "#E5E7EB", color: GREEN, border: "1px solid #CBD5E1", textAlign: "left" }}>{L("নম্বর", "Marks")}</th>{SCALE.map((r) => <th key={r[1]} style={{ ...th, background: "#E5E7EB", color: GREEN, border: "1px solid #CBD5E1" }}>{r[0]}</th>)}</tr></thead>
        <tbody><tr><td style={{ ...td, textAlign: "left", border: "1px solid #E2E8F0" }}>{L("গ্রেড", "Grade")}</td>{SCALE.map((r) => <td key={r[1]} style={{ ...td, border: "1px solid #E2E8F0", fontWeight: 700 }}>{r[1]}</td>)}</tr><tr><td style={{ ...td, textAlign: "left", border: "1px solid #E2E8F0" }}>{L("পয়েন্ট", "Point")}</td>{SCALE.map((r) => <td key={r[1]} style={{ ...td, border: "1px solid #E2E8F0" }}>{r[2]}</td>)}</tr></tbody>
      </table>

      <div style={{ display: "flex", justifyContent: "space-between", marginTop: 46, fontSize: 11, paddingBottom: 30 }}>
        {[L("অভিভাবকের স্বাক্ষর", "Guardian"), L("ক্লাস টিচার", "Class teacher"), L("প্রধান শিক্ষক", "Head teacher")].map((t) => <span key={t} style={{ borderTop: "1px solid #64748b", padding: "3px 20px", color: "#334155" }}>{t}</span>)}
      </div>
    </A4Doc>
  );
}
