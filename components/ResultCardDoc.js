"use client";
import A4Doc, { Field } from "./A4Doc";
import { useLang } from "./LangProvider";
import { summarize } from "@/lib/grades";

const SCALE = [["৮০–১০০", "A+", "5.00"], ["৭০–৭৯", "A", "4.00"], ["৬০–৬৯", "A-", "3.50"], ["৫০–৫৯", "B", "3.00"], ["৪০–৪৯", "C", "2.00"], ["৩৩–৩৯", "D", "1.00"], ["০–৩২", "F", "0.00"]];

// সুন্দর সাজানো রেজাল্ট কার্ড (শিক্ষক ও শিক্ষার্থী দুজনেই প্রিন্ট/PDF করতে পারেন)
export default function ResultCardDoc({ data, back }) {
  const { x, n, lang } = useLang();
  const L = (bn, en) => (lang === "en" ? en : bn);
  const { student: s, exam, year, rows } = data;
  const sm = summarize(rows);
  const B = "1px solid #334155";
  const th = { border: B, background: "#0A4435", color: "#fff", padding: "7px 5px", fontSize: 11, textAlign: "center" }, td = { border: B, padding: "7px 5px", fontSize: 12, textAlign: "center" };
  const f2 = (v) => n(Number(v).toFixed(2)), f1 = (v) => n(Math.round(v * 10) / 10);
  const box = (label, val, color = "#0A4435") => <div style={{ flex: 1, border: "1.5px solid #C49B3F", borderRadius: 8, padding: "8px 6px", textAlign: "center", background: "#FFFBEB" }}><p style={{ fontSize: 10, color: "#64748b" }}>{label}</p><p style={{ fontSize: 20, fontWeight: 800, color }}>{val}</p></div>;
  return (
    <A4Doc back={back} title={L("ফলাফল কার্ড", "Result Card")} filename={`result-${s.studentId}-${exam}-${year}`} code={s.studentId}>
      <p style={{ textAlign: "center", fontSize: 18, fontWeight: 700, color: "#0A4435" }}>{exam} — {n(year)}</p>
      <div style={{ display: "grid", gridTemplateColumns: "1fr 100px", gap: 16, marginTop: 12 }}>
        <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: "8px 20px", alignContent: "start" }}>
          <Field l={L("নাম", "Name")} className="col-span-2">{s.name}</Field>
          <Field l={L("আইডি", "ID")}>{s.studentId}</Field><Field l={L("রোল", "Roll")}>{n(s.roll)}</Field>
          <Field l={L("শ্রেণি", "Class")}>{x(s.class)}</Field><Field l={L("শাখা", "Section")}>{s.section}</Field>
          {s.fatherName && <Field l={L("পিতার নাম", "Father")} className="col-span-2">{s.fatherName}</Field>}
        </div>
        <div style={{ width: 100, height: 120, border: "1.5px solid #C49B3F", borderRadius: 4, overflow: "hidden", display: "grid", placeItems: "center", background: "#f8fafc" }}>{s.photo ? <img src={s.photo} alt="" style={{ width: "100%", height: "100%", objectFit: "cover" }} /> : null}</div>
      </div>
      <table style={{ width: "100%", borderCollapse: "collapse", marginTop: 16 }}>
        <thead><tr><th style={{ ...th, width: 30 }}>#</th><th style={{ ...th, textAlign: "left" }}>{L("বিষয়", "Subject")}</th><th style={th}>{L("পূর্ণমান", "Full")}</th><th style={th}>{L("প্রাপ্ত নম্বর", "Obtained")}</th><th style={th}>{L("গ্রেড", "Grade")}</th><th style={th}>{L("জিপিএ", "GP")}</th></tr></thead>
        <tbody>{sm.subs.map((r, i) => <tr key={r.subject} style={{ breakInside: "avoid", background: i % 2 ? "#F8FAFC" : "#fff" }}><td style={td}>{n(i + 1)}</td><td style={{ ...td, textAlign: "left", fontWeight: 600 }}>{x(r.subject)}</td><td style={td}>{n(r.full)}</td><td style={{ ...td, fontWeight: 700 }}>{n(r.marks)}</td><td style={{ ...td, fontWeight: 700, color: r.g === "F" ? "#b91c1c" : "#0A4435" }}>{r.g}</td><td style={td}>{f2(r.gp)}</td></tr>)}</tbody>
      </table>
      <div style={{ display: "flex", gap: 10, marginTop: 14 }}>
        {box(L("মোট নম্বর", "Total"), `${n(sm.total)} / ${n(sm.full)}`)}{box(L("শতকরা", "Percent"), `${f1(sm.percent)}%`)}{box(L("জিপিএ", "GPA"), f2(sm.gpa))}{box(L("লেটার গ্রেড", "Grade"), sm.letter, sm.passed ? "#0A4435" : "#b91c1c")}{box(L("ফলাফল", "Result"), sm.passed ? L("উত্তীর্ণ", "PASSED") : L("অনুত্তীর্ণ", "FAILED"), sm.passed ? "#0A4435" : "#b91c1c")}
      </div>
      <table style={{ borderCollapse: "collapse", marginTop: 14, fontSize: 10 }}><thead><tr><th style={{ ...th, background: "#E5E7EB", color: "#0A4435" }}>{L("নম্বর", "Marks")}</th>{SCALE.map((r) => <th key={r[1]} style={{ ...th, background: "#E5E7EB", color: "#0A4435" }}>{r[0]}</th>)}</tr></thead><tbody><tr><td style={td}>{L("গ্রেড", "Grade")}</td>{SCALE.map((r) => <td key={r[1]} style={td}>{r[1]}</td>)}</tr><tr><td style={td}>{L("পয়েন্ট", "Point")}</td>{SCALE.map((r) => <td key={r[1]} style={td}>{r[2]}</td>)}</tr></tbody></table>
      <div style={{ display: "flex", justifyContent: "space-between", marginTop: 60, fontSize: 11 }}>
        <span style={{ borderTop: "1px solid #64748b", padding: "3px 18px" }}>{L("অভিভাবকের স্বাক্ষর", "Guardian")}</span><span style={{ borderTop: "1px solid #64748b", padding: "3px 18px" }}>{L("ক্লাস টিচার", "Class teacher")}</span><span style={{ borderTop: "1px solid #64748b", padding: "3px 18px" }}>{L("প্রধান শিক্ষক", "Head teacher")}</span>
      </div>
    </A4Doc>
  );
}
